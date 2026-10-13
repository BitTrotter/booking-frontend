<script setup>
import { computed, ref, watch } from 'vue'
import { $api } from '@/utils/api'
import { hasPermission } from '@/utils/permissions'
import { eligibleLinkReservation, linkReservationGroup, normalizeReservationGroupId, reservationErrorMessage, reservationFromResponse } from '@/utils/reservationGroups'

const props = defineProps({
  isDialogVisible: { type: Boolean, required: true },
  reservation: { type: Object, required: true },
})

const emit = defineEmits(['update:isDialogVisible', 'reservationUpdated'])
const items = ref([])
const labels = ref({})
const selectedIds = ref([])
const groupId = ref(null)
const loading = ref(false)
const saving = ref(false)
const errorMessage = ref('')
const savedIds = ref([])
const failures = ref([])
const attempted = ref(false)
const editable = computed(() => hasPermission('edit_reservation') && props.reservation?.status !== 'cancelled')
const labelFor = item => `${item.public_code || `#${item.id}`} · ${item.cabin?.name || `Cabaña #${item.cabin_id}`} · ${item.full_name || ''}`
const nameFor = id => labels.value[id] || (id === props.reservation.id ? props.reservation.public_code : null) || `#${id}`

const load = async () => {
  loading.value = true
  try {
    const response = await $api('reservations')
    const result = reservationFromResponse(response)
    const reservations = Array.isArray(result) ? result : result?.reservations || []

    labels.value = { ...labels.value, ...Object.fromEntries(reservations.map(item => [item.id, labelFor(item)])) }
    items.value = reservations.filter(item => eligibleLinkReservation(item, props.reservation.id))
      .map(item => ({ ...item, title: labelFor(item) }))
  } catch (error) {
    errorMessage.value = reservationErrorMessage(error, 'No se pudieron consultar las reservaciones.')
  } finally {
    loading.value = false
  }
}

const save = async () => {
  if (saving.value || loading.value || !editable.value || !selectedIds.value.length) return
  saving.value = true
  errorMessage.value = ''
  try {
    groupId.value ||= normalizeReservationGroupId(props.reservation.reservation_group_id) || crypto.randomUUID().toLowerCase()

    const result = await linkReservationGroup($api, props.reservation.id, selectedIds.value, groupId.value)

    savedIds.value = [...new Set([...savedIds.value, ...result.saved])]
    failures.value = result.failed
    selectedIds.value = result.pending
    attempted.value = true

    // Refresh the parent even after partial failure; do not discard pending IDs.
    emit('reservationUpdated', props.reservation.id)
    await load()
  } catch (error) {
    errorMessage.value = reservationErrorMessage(error, 'No se pudieron guardar los vínculos.')
  } finally {
    saving.value = false
  }
}

watch(() => props.isDialogVisible, visible => {
  if (!visible) return
  selectedIds.value = []
  savedIds.value = []
  failures.value = []
  attempted.value = false
  groupId.value = normalizeReservationGroupId(props.reservation.reservation_group_id)
  errorMessage.value = ''
  load()
})
</script>

<template>
  <AppFormDialog
    :model-value="isDialogVisible"
    title="Vincular reservaciones"
    :max-width="750"
    subtitle="Cada reservación conserva su folio, precio, abono y estado."
    :submit-text="attempted ? 'Reintentar pendientes' : 'Vincular seleccionadas'"
    :loading="saving"
    :can-submit="editable && !loading && selectedIds.length > 0"
    cancel-text="Cerrar"
    @update:model-value="value => { if (!saving) emit('update:isDialogVisible', value) }"
    @submit="save"
  >
    <VAlert
      type="info"
      variant="tonal"
      class="mb-4"
    >
      Sólo puedes seleccionar reservaciones sin grupo y no canceladas. Los vínculos se guardan de forma independiente.
      Editar o cancelar una reservación afecta únicamente a esa reservación.
    </VAlert>
    <VAutocomplete
      v-model="selectedIds"
      :items="items"
      item-title="title"
      item-value="id"
      multiple
      chips
      closable-chips
      label="Reservaciones para vincular"
      :loading="loading"
      :disabled="saving || attempted || !editable"
      no-data-text="No hay reservaciones disponibles para vincular."
    />
    <VAlert
      v-if="savedIds.length"
      type="success"
      variant="tonal"
      class="mt-4"
    >
      Vínculos guardados: {{ savedIds.map(nameFor).join(', ') }}.
    </VAlert>
    <VAlert
      v-if="failures.length"
      type="warning"
      variant="tonal"
      class="mt-4"
    >
      <div
        v-for="failure in failures"
        :key="failure.id"
      >
        {{ nameFor(failure.id) }}: {{ failure.message }}
      </div>
      <div
        v-if="selectedIds.length"
        class="mt-2"
      >
        Pendientes: {{ selectedIds.map(nameFor).join(', ') }}. Puedes reintentarlos.
      </div>
    </VAlert>
    <VAlert
      v-if="errorMessage"
      type="error"
      variant="tonal"
      class="mt-4"
    >
      {{ errorMessage }}
    </VAlert>
  </AppFormDialog>
</template>
