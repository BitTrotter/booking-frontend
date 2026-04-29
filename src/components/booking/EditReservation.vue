<script setup>
import { $api } from '@/utils/api'
import { requiredValidator } from '@/@core/utils/validators'
import { computed, onMounted, ref, watch } from 'vue'

const emit = defineEmits(['update:isDialogVisible', 'reservation-updated'])

const props = defineProps({
  isDialogVisible: {
    type: Boolean,
    required: true,
  },
  reservation: {
    type: Object,
    default: null,
  },
})

const refForm = ref()
const cabinItems = ref([])
const selectedCabinId = ref(null)
const startDate = ref(null)
const endDate = ref(null)
const guests = ref([{ full_name: '', guest_type: 'adult' }])
const status = ref('pending')
const isSubmitting = ref(false)
const isDeleting = ref(false)
const errorMessage = ref('')

const statusItems = ['pending', 'confirmed', 'cancelled', 'completed']

const dialogVisibleUpdate = val => {
  emit('update:isDialogVisible', val)
}

const getCabinsAsync = async () => {
  try {
    const cabins = await $api('cabins?search=')

    return cabins
  } catch (error) {
    console.error('There was a problem with the fetch operation:', error)
    return []
  }
}

const normalizeGuests = reservationGuests => {
  if (!Array.isArray(reservationGuests) || !reservationGuests.length)
    return [{ full_name: '', guest_type: 'adult' }]

  return reservationGuests.map(guest => ({
    full_name: guest.full_name || guest.name || '',
    guest_type: guest.guest_type || 'adult',
  }))
}

const resetForm = () => {
  selectedCabinId.value = null
  startDate.value = null
  endDate.value = null
  guests.value = [{ full_name: '', guest_type: 'adult' }]
  status.value = 'pending'
  errorMessage.value = ''
}

const hydrateForm = reservation => {
  if (!reservation) {
    resetForm()
    return
  }

  selectedCabinId.value = reservation.cabin_id || reservation.cabin?.id || null
  startDate.value = reservation.start_date || reservation.start || null
  endDate.value = reservation.end_date || reservation.end || null
  guests.value = normalizeGuests(reservation.guests)
  status.value = reservation.status || 'pending'
  errorMessage.value = ''
}

const addGuest = () => {
  guests.value.push({ full_name: '', guest_type: 'adult' })
}

const removeGuest = index => {
  guests.value.splice(index, 1)
}

const canSubmit = computed(() => {
  if (!selectedCabinId.value || !startDate.value || !endDate.value || !status.value)
    return false

  if (!guests.value.length)
    return false

  return guests.value.every(guest => guest.full_name?.trim() && ['adult', 'child'].includes(guest.guest_type))
})

const submitReservation = async () => {
  errorMessage.value = ''

  const validation = await refForm.value?.validate()
  if (!validation?.valid || !canSubmit.value) {
    errorMessage.value = 'Please complete cabin, dates, status, and valid guests.'
    return
  }

  isSubmitting.value = true

  const payload = {
    cabin_id: selectedCabinId.value,
    start_date: startDate.value,
    end_date: endDate.value,
    status: status.value,
    guests: guests.value.map(guest => ({
      full_name: guest.full_name.trim(),
      guest_type: guest.guest_type,
    })),
  }

  try {
    await $api(`reservations/${props.reservation.id}`, {
      method: 'PUT',
      body: payload,
      onResponseError: ({ response }) => {
        throw new Error(response.statusText || 'Failed to update reservation')
      },
    })

    emit('reservation-updated')
    dialogVisibleUpdate(false)
  } catch (error) {
    errorMessage.value = error?.message || 'Failed to update reservation'
  } finally {
    isSubmitting.value = false
  }
}

const deleteReservation = async () => {
  if (!props.reservation?.id)
    return

  if (!confirm('Are you sure you want to delete this reservation?'))
    return

  isDeleting.value = true
  errorMessage.value = ''

  try {
    await $api(`reservations/${props.reservation.id}`, {
      method: 'DELETE',
      onResponseError: ({ response }) => {
        throw new Error(response.statusText || 'Failed to delete reservation')
      },
    })

    emit('reservation-updated')
    dialogVisibleUpdate(false)
  } catch (error) {
    errorMessage.value = error?.message || 'Failed to delete reservation'
  } finally {
    isDeleting.value = false
  }
}

onMounted(async () => {
  cabinItems.value = await getCabinsAsync()
})

watch(() => props.isDialogVisible, visible => {
  if (!visible) {
    resetForm()
    return
  }

  hydrateForm(props.reservation)

  if (!cabinItems.value.length) {
    getCabinsAsync().then(items => {
      cabinItems.value = items
    })
  }
})

watch(() => props.reservation, reservation => {
  if (props.isDialogVisible)
    hydrateForm(reservation)
})
</script>

<template>
  <VDialog :model-value="props.isDialogVisible" max-width="860" @update:model-value="dialogVisibleUpdate">
    <VCard class="pa-4 pa-sm-8">
      <DialogCloseBtn variant="text" size="default" @click="emit('update:isDialogVisible', false)" />

      <VCardTitle class="px-0 pb-2">
        Edit Reservation
      </VCardTitle>
      <VCardSubtitle class="px-0 pb-6">
        Update the cabin, stay dates, reservation status, and guest list.
      </VCardSubtitle>

      <VForm ref="refForm">
        <VRow>
          <VCol cols="12" md="5">
            <VSelect
              v-model="selectedCabinId"
              :items="cabinItems"
              item-title="name"
              item-value="id"
              label="Cabin"
              placeholder="Select cabin"
              :rules="[requiredValidator]"
              required
            />
          </VCol>
          <VCol cols="12" md="3">
            <AppDateTimePicker v-model="startDate" label="Start date" placeholder="YYYY-MM-DD" :rules="[requiredValidator]" />
          </VCol>
          <VCol cols="12" md="3">
            <AppDateTimePicker v-model="endDate" label="End date" placeholder="YYYY-MM-DD" :rules="[requiredValidator]" />
          </VCol>
          <VCol cols="12" md="1">
            <VSelect
              v-model="status"
              :items="statusItems"
              label="Status"
              :rules="[requiredValidator]"
              required
            />
          </VCol>
        </VRow>

        <VCard variant="tonal" class="mt-2">
          <VCardText class="pa-4">
            <div class="d-flex align-center justify-space-between mb-4">
              <span class="text-subtitle-1 font-weight-medium">Guests</span>
              <VBtn size="small" variant="outlined" prepend-icon="ri-user-add-line" @click="addGuest">
                Add guest
              </VBtn>
            </div>

            <VRow v-for="(guest, index) in guests" :key="index" class="align-center">
              <VCol cols="12" md="7">
                <VTextField
                  v-model="guest.full_name"
                  label="Full name"
                  placeholder="Guest full name"
                  :rules="[requiredValidator]"
                  required
                />
              </VCol>
              <VCol cols="9" md="4">
                <VSelect
                  v-model="guest.guest_type"
                  :items="['adult', 'child']"
                  label="Type"
                  :rules="[requiredValidator]"
                  required
                />
              </VCol>
              <VCol cols="3" md="1" class="text-end">
                <IconBtn :disabled="guests.length === 1" @click="removeGuest(index)">
                  <VIcon icon="ri-delete-bin-7-line" />
                </IconBtn>
              </VCol>
            </VRow>
          </VCardText>
        </VCard>
      </VForm>

      <VAlert v-if="errorMessage" type="error" variant="tonal" class="mt-4">
        {{ errorMessage }}
      </VAlert>

      <div class="d-flex justify-space-between align-center gap-3 mt-6 flex-wrap">
        <VBtn color="error" variant="tonal" :loading="isDeleting" @click="deleteReservation">
          Delete reservation
        </VBtn>

        <div class="d-flex justify-end gap-3 flex-wrap">
          <VBtn variant="outlined" color="secondary" @click="dialogVisibleUpdate(false)">
            Cancel
          </VBtn>
          <VBtn color="primary" :loading="isSubmitting" :disabled="!canSubmit" @click="submitReservation">
            Save changes
          </VBtn>
        </div>
      </div>
    </VCard>
  </VDialog>
</template>
