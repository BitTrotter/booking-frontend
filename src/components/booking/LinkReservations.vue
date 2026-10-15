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
const labelFor = item => `${item.public_code || `#${item.id}`} · ${item.cabin?.name || `Cabin #${item.cabin_id}`} · ${item.full_name || ''}`
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
    errorMessage.value = reservationErrorMessage(error, 'Unable to load reservations.')
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
    errorMessage.value = reservationErrorMessage(error, 'Unable to save reservation links.')
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
    title="Link reservations"
    :max-width="750"
    subtitle="Each reservation keeps its reference number, price, deposit, and status."
    :submit-text="attempted ? 'Retry pending links' : 'Link selected reservations'"
    :loading="saving"
    :can-submit="editable && !loading && selectedIds.length > 0"
    cancel-text="Close"
    @update:model-value="value => { if (!saving) emit('update:isDialogVisible', value) }"
    @submit="save"
  >
    <VAlert
      type="info"
      variant="tonal"
      class="mb-4"
    >
      You can only select reservations that are ungrouped and not cancelled. Each link is saved independently.
      Editing or cancelling a reservation affects only that reservation.
    </VAlert>
    <VAutocomplete
      v-model="selectedIds"
      :items="items"
      item-title="title"
      item-value="id"
      multiple
      chips
      closable-chips
      label="Reservations to link"
      :loading="loading"
      :disabled="saving || attempted || !editable"
      no-data-text="No reservations available to link."
    />
    <VAlert
      v-if="savedIds.length"
      type="success"
      variant="tonal"
      class="mt-4"
    >
      Saved links: {{ savedIds.map(nameFor).join(', ') }}.
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
        Pending: {{ selectedIds.map(nameFor).join(', ') }}. You can retry them.
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
