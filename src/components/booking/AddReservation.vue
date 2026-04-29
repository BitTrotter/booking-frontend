<script setup>
import { $api } from '@/utils/api'
import { onMounted, ref, watch } from 'vue'

const emit = defineEmits(['update:isDialogVisible', 'reservation-created'])

const cabinItems = ref([])
const selectedCabinId = ref(null)
const startDate = ref(null)
const endDate = ref(null)
const guests = ref([
  { full_name: '', guest_type: 'adult' },
])
const isSubmitting = ref(false)
const errorMessage = ref('')

const props = defineProps({
  isDialogVisible: {
    type: Boolean,
    required: true,
  },
  initialReservation: {
    type: Object,
    default: null,
  },
})

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
  errorMessage.value = ''
}

const addGuest = () => {
  guests.value.push({ full_name: '', guest_type: 'adult' })
}

const removeGuest = index => {
  guests.value.splice(index, 1)
}

const canSubmit = () => {
  if (!selectedCabinId.value || !startDate.value || !endDate.value)
    return false

  if (!guests.value.length)
    return false

  return guests.value.every(guest => guest.full_name?.trim() && ['adult', 'child'].includes(guest.guest_type))
}

const submitReservation = async () => {
  errorMessage.value = ''

  if (!canSubmit()) {
    errorMessage.value = 'Please complete cabin, dates, and valid guests.'
    return
  }

  isSubmitting.value = true

  const payload = {
    cabin_id: selectedCabinId.value,
    start_date: startDate.value,
    end_date: endDate.value,
    guests: guests.value.map(guest => ({
      full_name: guest.full_name.trim(),
      guest_type: guest.guest_type,
    })),
  }

  try {
    await $api('reservations', {
      method: 'POST',
      body: payload,
      onResponseError: ({ response }) => {
        throw new Error(response.statusText || 'Failed to create reservation')
      },
    })

    emit('reservation-created')
    dialogVisibleUpdate(false)
    resetForm()
  } catch (error) {
    errorMessage.value = error?.message || 'Failed to create reservation'
  } finally {
    isSubmitting.value = false
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

  if (props.initialReservation)
    hydrateForm(props.initialReservation)

  if (!cabinItems.value.length) {
    getCabinsAsync().then(items => {
      cabinItems.value = items
    })
  }
})

watch(() => props.initialReservation, initialReservation => {
  if (props.isDialogVisible && initialReservation)
    hydrateForm(initialReservation)
})
</script>

<template>
  <VDialog :model-value="props.isDialogVisible" max-width="800" @update:model-value="dialogVisibleUpdate">
    <VCard class="pa-4 pa-sm-8">
      <DialogCloseBtn variant="text" size="default" @click="emit('update:isDialogVisible', false)" />

      <VCardTitle class="px-0 pb-2">
        Add Reservation
      </VCardTitle>
      <VCardSubtitle class="px-0 pb-6">
        Select cabin, dates and guests to create a new reservation.
      </VCardSubtitle>

      <VRow>
        <VCol cols="12" md="6">
          <VSelect v-model="selectedCabinId" :items="cabinItems" item-title="name" item-value="id" label="Cabin"
            placeholder="Select cabin" />
        </VCol>
        <VCol cols="12" md="3">
          <AppDateTimePicker v-model="startDate" label="Start date" placeholder="YYYY-MM-DD" />
        </VCol>
        <VCol cols="12" md="3">
          <AppDateTimePicker v-model="endDate" label="End date" placeholder="YYYY-MM-DD" />
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
              <VTextField v-model="guest.full_name" label="Full name" placeholder="Guest full name" />
            </VCol>
            <VCol cols="9" md="4">
              <VSelect v-model="guest.guest_type" :items="['adult', 'child']" label="Type" />
            </VCol>
            <VCol cols="3" md="1" class="text-end">
              <IconBtn :disabled="guests.length === 1" @click="removeGuest(index)">
                <VIcon icon="ri-delete-bin-7-line" />
              </IconBtn>
            </VCol>
          </VRow>
        </VCardText>
      </VCard>

      <VAlert v-if="errorMessage" type="error" variant="tonal" class="mt-4">
        {{ errorMessage }}
      </VAlert>

      <div class="d-flex justify-end gap-3 mt-6">
        <VBtn variant="outlined" color="secondary" @click="dialogVisibleUpdate(false)">
          Cancel
        </VBtn>
        <VBtn color="primary" :loading="isSubmitting" :disabled="!canSubmit()" @click="submitReservation">
          Create reservation
        </VBtn>
      </div>
    </VCard>
  </VDialog>
</template>
