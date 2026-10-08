<script setup>
import { validBookingDates } from '@/utils/bookingDates'
import NightlyPrices from '@/components/booking/NightlyPrices.vue'
import { $api } from '@/utils/api'
import { computed, onMounted, ref, watch } from 'vue'

const emit = defineEmits(['update:isDialogVisible', 'reservation-created'])

const cabinItems = ref([])
const selectedCabinId = ref(null)
const startDate = ref(null)
const endDate = ref(null)
const stayDateRange = ref('')
const guestNumber = ref(1)
const fullName = ref('')
const phone = ref('')
const email = ref('')
const paymentMethod = ref('')
const paymentMethodItems = [
  { title: 'Stripe', value: 'stripe' },
  { title: 'Cash', value: 'cash' },
  { title: 'Bank transfer', value: 'bank_transfer' },
  { title: 'Terminal', value: 'terminal' },
  { title: 'Courtesy', value: 'courtesy' },
]
const paymentReference = ref('')
const notes = ref('')
const amountPaid = ref(null)
const isSubmitting = ref(false)
const errorMessage = ref('')
const availability = ref(null)
const availabilityLoading = ref(false)
let availabilityRequestId = 0

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

const resetForm = () => {
  availabilityRequestId++
  availability.value = null
  availabilityLoading.value = false
  selectedCabinId.value = null
  startDate.value = null
  endDate.value = null
  stayDateRange.value = ''
  guestNumber.value = 1
  fullName.value = ''
  phone.value = ''
  email.value = ''
  paymentMethod.value = ''
  paymentReference.value = ''
  notes.value = ''
  amountPaid.value = null
  errorMessage.value = ''
}

const hydrateForm = reservation => {
  if (!reservation) {
    resetForm()
    return
  }

  selectedCabinId.value = reservation.cabin_id || reservation.cabin?.id || null
  startDate.value = String(reservation.start_date || reservation.start || '').slice(0, 10) || null
  endDate.value = String(reservation.end_date || reservation.end || '').slice(0, 10) || null
  stayDateRange.value = [startDate.value, endDate.value].filter(Boolean).join(' to ')
  guestNumber.value = Number(reservation.guest_number) || 1
  fullName.value = reservation.full_name || ''
  phone.value = reservation.phone || ''
  email.value = reservation.email || ''
  errorMessage.value = ''
}

const checkAvailability = async () => {
  const requestId = ++availabilityRequestId
  availability.value = null

  const hasDates = selectedCabinId.value && validBookingDates(startDate.value, endDate.value)
  if (!hasDates) {
    availabilityLoading.value = false
    return
  }

  availabilityLoading.value = true
  try {
    const query = new URLSearchParams({
      cabin_id: String(selectedCabinId.value),
      start_date: String(startDate.value),
      end_date: String(endDate.value),
    })
    const response = await $api(`/public/reservations/availability?${query}`)
    if (requestId === availabilityRequestId)
      availability.value = response?.data ?? response
  } catch (error) {
    if (requestId === availabilityRequestId)
      availability.value = { error: true }
  } finally {
    if (requestId === availabilityRequestId)
      availabilityLoading.value = false
  }
}

const availabilityLabel = computed(() => {
  if (availabilityLoading.value)
    return 'Checking availability…'
  if (availability.value?.error)
    return 'Could not check availability'
  if (availability.value)
    return availability.value.available ? 'Dates available' : 'Dates unavailable'

  return ''
})

const availabilityColor = computed(() => {
  if (availabilityLoading.value)
    return 'info'
  if (availability.value?.error)
    return 'warning'

  return availability.value?.available ? 'success' : 'error'
})

const stayDatePickerConfig = {
  mode: 'range',
  dateFormat: 'Y-m-d',
  showMonths: 2,
  minDate: 'today',
  onChange(selectedDates, _, picker) {
    if (selectedDates.length === 1)
      picker.set('minDate', selectedDates[0])
    else if (selectedDates.length === 2)
      picker.set('minDate', 'today')
  },
}

const canSubmit = computed(() => {
  return Boolean(selectedCabinId.value && startDate.value && endDate.value && fullName.value.trim() && phone.value.trim() && email.value.trim() && Number.isInteger(Number(guestNumber.value)) && Number(guestNumber.value) > 0)
})

const submitReservation = async () => {
  errorMessage.value = ''

  if (!canSubmit.value) {
    errorMessage.value = 'Please complete cabin, dates, guest name, contact details, and a valid guest number.'
    return
  }

  isSubmitting.value = true

  const payload = {
    cabin_id: selectedCabinId.value,
    start_date: startDate.value,
    end_date: endDate.value,
    guest_number: Number(guestNumber.value),
    full_name: fullName.value.trim(),
    phone: phone.value.trim(),
    email: email.value.trim(),
    payment_method: paymentMethod.value || null,
    payment_reference: paymentReference.value.trim() || null,
    notes: notes.value.trim() || null,
    amount_paid: amountPaid.value === '' || amountPaid.value === null ? 0 : Number(amountPaid.value),
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

watch([selectedCabinId, startDate, endDate], checkAvailability)

watch(stayDateRange, value => {
  const [checkIn = '', checkOut = ''] = String(value || '').split(' to ')
  startDate.value = checkIn || null
  endDate.value = checkOut || null
})
</script>

<template>
  <AppFormDialog :model-value="props.isDialogVisible" title="Add Reservation"
    subtitle="Enter the stay, contact, and payment details." :max-width="900" submit-text="Create reservation"
    :loading="isSubmitting" :can-submit="canSubmit" @update:model-value="dialogVisibleUpdate"
    @submit="submitReservation">
    <div class="reservation-form">
      <section class="reservation-section">
        <div class="section-heading">
          <VAvatar color="primary" variant="tonal" size="34"><VIcon icon="ri-calendar-event-line" size="18" /></VAvatar>
          <div>
            <div class="text-subtitle-1 font-weight-semibold">Stay details</div>
            <div class="text-body-2 text-medium-emphasis">Choose a cabin, dates, and guest count.</div>
          </div>
        </div>
        <VRow>
          <VCol cols="12" md="6">
            <VSelect v-model="selectedCabinId" :items="cabinItems" item-title="name" item-value="id"
              label="Cabin" placeholder="Select a cabin" prepend-inner-icon="ri-home-4-line" />
          </VCol>
          <VCol cols="12" md="6">
            <AppDateTimePicker v-model="stayDateRange" :config="stayDatePickerConfig" label="Check-in / check-out"
              placeholder="Select your stay dates" prepend-inner-icon="ri-calendar-event-line" />
          </VCol>
          <VCol cols="12" sm="6" md="4">
            <VTextField v-model="guestNumber" label="Number of guests" type="number" min="1" step="1"
              prepend-inner-icon="ri-group-line" />
          </VCol>
          <VCol v-if="availabilityLabel" cols="12" class="pt-0">
            <NightlyPrices :pricing="availability" />
            <VChip :color="availabilityColor" size="small" variant="tonal" :prepend-icon="availabilityLoading ? 'ri-loader-4-line' : undefined">
              {{ availabilityLabel }}
            </VChip>
          </VCol>
        </VRow>
      </section>

      <VDivider />

      <section class="reservation-section">
        <div class="section-heading">
          <VAvatar color="info" variant="tonal" size="34"><VIcon icon="ri-user-line" size="18" /></VAvatar>
          <div>
            <div class="text-subtitle-1 font-weight-semibold">Contact information</div>
            <div class="text-body-2 text-medium-emphasis">How can you reach the primary guest?</div>
          </div>
        </div>
        <VRow>
          <VCol cols="12">
            <VTextField v-model="fullName" label="Full name" placeholder="Primary guest full name"
              prepend-inner-icon="ri-user-line" />
          </VCol>
          <VCol cols="12" md="6">
            <VTextField v-model="phone" label="Phone" placeholder="Guest phone number"
              prepend-inner-icon="ri-phone-line" />
          </VCol>
          <VCol cols="12" md="6">
            <VTextField v-model="email" label="Email" placeholder="Guest email address" type="email"
              prepend-inner-icon="ri-mail-line" />
          </VCol>
        </VRow>
      </section>

      <VDivider />

      <section class="reservation-section">
        <div class="section-heading">
          <VAvatar color="success" variant="tonal" size="34"><VIcon icon="ri-bank-card-line" size="18" /></VAvatar>
          <div>
            <div class="text-subtitle-1 font-weight-semibold">Payment</div>
            <div class="text-body-2 text-medium-emphasis">Record the payment method and amount received.</div>
          </div>
        </div>
        <VRow>
          <VCol cols="12" sm="6" md="4">
            <VSelect v-model="paymentMethod" :items="paymentMethodItems" label="Payment method"
              placeholder="Select a method" prepend-inner-icon="ri-wallet-3-line" clearable />
          </VCol>
          <VCol cols="12" sm="6" md="4">
            <VTextField v-model="amountPaid" label="Amount paid" type="number" min="0" step="0.01"
              prepend-inner-icon="ri-money-dollar-circle-line" />
          </VCol>
          <VCol cols="12" md="4">
            <VTextField v-model="paymentReference" label="Payment reference" placeholder="Optional reference"
              prepend-inner-icon="ri-hashtag" />
          </VCol>
          <VCol cols="12">
            <VTextarea v-model="notes" label="Notes" placeholder="Add any details that may help manage this reservation"
              rows="2" auto-grow />
          </VCol>
        </VRow>
      </section>
    </div>

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

<style scoped>
.reservation-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.reservation-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-heading {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 2px;
}
</style>
