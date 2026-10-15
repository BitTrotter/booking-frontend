<script setup>
import { ref } from 'vue'
import ReservationDetail from '@/components/booking/ReservationDetail.vue'
import { $api } from '@/utils/api'
import { reservationErrorMessage, reservationFromResponse } from '@/utils/reservationGroups'

defineProps({
  isDialogVisible: { type: Boolean, required: true },
  reservations: { type: Array, default: () => [] },
})

const emit = defineEmits(['update:isDialogVisible', 'reservationUpdated'])
const selected = ref(null)
const detailVisible = ref(false)
const errorMessage = ref('')
let requestId = 0

const openDetail = async item => {
  const currentRequest = ++requestId

  errorMessage.value = ''
  try {
    const response = await $api(`reservations/${item.id}`)
    if (currentRequest !== requestId) return
    selected.value = reservationFromResponse(response)
    detailVisible.value = true
  } catch (error) {
    if (currentRequest === requestId)
      errorMessage.value = reservationErrorMessage(error, 'Unable to load details.')
  }
}

const refresh = () => {
  emit('reservationUpdated')
  if (selected.value) openDetail(selected.value)
}
</script>

<template>
  <AppFormDialog
    :model-value="isDialogVisible"
    title="Reservations created"
    :max-width="750"
    no-internal-form
    subtitle="Each reservation keeps its own payment and status."
    @update:model-value="emit('update:isDialogVisible', $event)"
  >
    <VAlert
      type="success"
      variant="tonal"
      class="mb-4"
    >
      {{ reservations.length }} reservations saved.
    </VAlert>
    <VCard
      v-for="reservation in reservations"
      :key="reservation.id"
      variant="outlined"
      class="mb-3"
    >
      <VCardText class="d-flex flex-wrap align-center justify-space-between gap-3">
        <div>
          <div class="font-weight-semibold">
            {{ reservation.public_code || `#${reservation.id}` }} · {{ reservation.cabin?.name || `Cabin #${reservation.cabin_id}` }}
          </div>
          <div class="text-body-2">
            {{ reservation.full_name }} · {{ reservation.status }}
          </div>
        </div>
        <VBtn
          variant="tonal"
          size="small"
          @click="openDetail(reservation)"
        >
          View details
        </VBtn>
      </VCardText>
    </VCard>
    <VAlert
      v-if="errorMessage"
      type="error"
      variant="tonal"
    >
      {{ errorMessage }}
    </VAlert>
    <template #actions>
      <VSpacer />
      <VBtn
        variant="tonal"
        @click="emit('update:isDialogVisible', false)"
      >
        Close
      </VBtn>
    </template>
  </AppFormDialog>
  <ReservationDetail
    v-model:isDialogVisible="detailVisible"
    :reservation="selected"
    :payment="selected?.payment || null"
    @view-related="openDetail"
    @reservation-updated="refresh"
  />
</template>
