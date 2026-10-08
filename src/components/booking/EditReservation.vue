<script setup>
import { validBookingDates } from '@/utils/bookingDates'
import { $api } from '@/utils/api'
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

const cabinItems = ref([])
const selectedCabinId = ref(null)
const startDate = ref(null)
const endDate = ref(null)
const stayDateRange = ref('')
const guestNumber = ref(1)
const fullName = ref('')
const status = ref('pending')
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
const isCancelling = ref(false)
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

const normalizeDate = value => value ? String(value).slice(0, 10) : null

const stayDatePickerConfig = {
  mode: 'range',
  dateFormat: 'Y-m-d',
  showMonths: 2,
}

const resetForm = () => {
  selectedCabinId.value = null
  startDate.value = null
  endDate.value = null
  stayDateRange.value = ''
  guestNumber.value = 1
  fullName.value = ''
  status.value = 'pending'
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
  startDate.value = normalizeDate(reservation.start_date || reservation.start)
  endDate.value = normalizeDate(reservation.end_date || reservation.end)
  stayDateRange.value = [startDate.value, endDate.value].filter(Boolean).join(' to ')
  guestNumber.value = reservation.guest_number ?? (reservation.guests?.length || 1)
  fullName.value = reservation.full_name || reservation.guests?.[0]?.full_name || reservation.guests?.[0]?.name || ''
  status.value = reservation.status || 'pending'
  phone.value = reservation.phone || ''
  email.value = reservation.email || ''
  paymentMethod.value = reservation.payment_method || ''
  paymentReference.value = reservation.payment_reference || ''
  notes.value = reservation.notes || ''
  amountPaid.value = reservation.amount_paid ?? null
  errorMessage.value = ''
}

const isCancelled = computed(() => props.reservation?.status === 'cancelled')

const canSubmit = computed(() => Boolean(
  !isCancelled.value && props.reservation?.id && selectedCabinId.value && validBookingDates(startDate.value, endDate.value) && status.value
  && fullName.value.trim() && phone.value.trim() && email.value.trim()
  && Number.isInteger(Number(guestNumber.value)) && Number(guestNumber.value) > 0
))

const submitReservation = async () => {
  if (!validBookingDates(startDate.value, endDate.value)) {
    errorMessage.value = 'Selecciona fechas válidas; la salida debe ser posterior a la entrada.'
    return
  }
  errorMessage.value = ''

  if (isCancelled.value) {
    errorMessage.value = 'Cancelled reservations cannot be edited.'
    return
  }

  if (!canSubmit.value) {
    errorMessage.value = 'Please complete cabin, valid stay dates, status, guest name, contact details, and a valid guest number.'
    return
  }

  isSubmitting.value = true

  const payload = {
    cabin_id: selectedCabinId.value,
    start_date: startDate.value,
    end_date: endDate.value,
    status: status.value,
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

const cancelReservation = async () => {
  if (!props.reservation?.id || isCancelled.value || isSubmitting.value || isCancelling.value)
    return

  if (!confirm('Are you sure you want to cancel this reservation?'))
    return

  isCancelling.value = true
  errorMessage.value = ''

  try {
    await $api(`reservations/${props.reservation.id}`, {
      method: 'PUT',
      body: { status: 'cancelled' },
      onResponseError: ({ response }) => {
        throw new Error(response.statusText || 'Failed to cancel reservation')
      },
    })

    emit('reservation-updated')
    dialogVisibleUpdate(false)
  } catch (error) {
    errorMessage.value = error?.message || 'Failed to cancel reservation'
  } finally {
    isCancelling.value = false
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
watch(stayDateRange, value => {
  const [checkIn = '', checkOut = ''] = String(value || '').split(' to ')
  startDate.value = checkIn || null
  endDate.value = checkOut || null
})
</script>

<template>
  <AppFormDialog :model-value="props.isDialogVisible" title="Edit Reservation"
    subtitle="Update the stay, contact, payment details, and reservation status." :max-width="900" submit-text="Save changes" delete-text="Cancel reservation" :show-delete="!isCancelled"
    :delete-loading="isCancelling"
    :loading="isSubmitting" :can-submit="canSubmit && !isCancelling" @update:model-value="dialogVisibleUpdate"
    @submit="submitReservation" @delete="cancelReservation">
    <VAlert v-if="isCancelled" type="info" variant="tonal">
      Cancelled reservations cannot be edited.
    </VAlert>
    <div v-else class="reservation-form">
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
          <VCol cols="12" sm="6" md="4">
            <VSelect v-model="status" :items="statusItems" label="Status"
              prepend-inner-icon="ri-bookmark-3-line" />
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
