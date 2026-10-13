<script setup>
/* eslint-disable camelcase -- API field names follow the existing backend contract. */
import { createdReservations, reservationFieldErrors, reservationCabinPayload, reservationErrorMessage } from '@/utils/reservationGroups'
import { validBookingDates } from '@/utils/bookingDates'
import { emailValidator } from '@/@core/utils/validators'
import NightlyPrices from '@/components/booking/NightlyPrices.vue'
import CreatedReservations from '@/components/booking/CreatedReservations.vue'
import { $api } from '@/utils/api'
import { computed, ref, watch } from 'vue'


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

const emit = defineEmits(['update:isDialogVisible', 'reservationCreated'])
const cabinItems = ref([])
const selectedCabinIds = ref([])
const cabinRows = ref([])
const created = ref([])
const resultsVisible = ref(false)
const fieldErrors = ref({})
const groupAmountPaid = ref(null)
const startDate = ref(null)
const endDate = ref(null)
const stayDateRange = ref('')
const fullName = ref('')
const phone = ref('')
const email = ref('')
const sendEmail = ref(false)
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
const isSubmitting = ref(false)
const errorMessage = ref('')
const availability = ref({})
const availabilityLoading = ref(false)
let availabilityRequestId = 0

const dialogVisibleUpdate = val => {
  if (!isSubmitting.value) emit('update:isDialogVisible', val)
}

const getCabinsAsync = async () => {
  try {
    return await $api('cabins?search=')
  } catch (error) {
    console.error('There was a problem with the fetch operation:', error)

    return []
  }
}

const resetForm = () => {
  availabilityRequestId++
  availability.value = {}
  availabilityLoading.value = false
  selectedCabinIds.value = []
  cabinRows.value = []
  fieldErrors.value = {}
  groupAmountPaid.value = null
  startDate.value = null
  endDate.value = null
  stayDateRange.value = ''
  fullName.value = ''
  phone.value = ''
  email.value = ''
  sendEmail.value = false
  paymentMethod.value = ''
  paymentReference.value = ''
  notes.value = ''
  errorMessage.value = ''
}

const hydrateForm = reservation => {
  if (!reservation) {
    resetForm()

    return
  }

  const cabinId = reservation.cabin_id || reservation.cabin?.id

  selectedCabinIds.value = cabinId ? [cabinId] : []
  cabinRows.value = cabinId ? [{ cabinId, guestNumber: Number(reservation.guest_number) || 1, amountPaid: null }] : []
  startDate.value = String(reservation.start_date || reservation.start || '').slice(0, 10) || null
  endDate.value = String(reservation.end_date || reservation.end || '').slice(0, 10) || null
  stayDateRange.value = [startDate.value, endDate.value].filter(Boolean).join(' to ')
  fullName.value = reservation.full_name || ''
  phone.value = reservation.phone || ''
  email.value = reservation.email || ''
  errorMessage.value = ''
}

const checkAvailability = async () => {
  const requestId = ++availabilityRequestId

  availability.value = {}

  if (!selectedCabinIds.value.length || !validBookingDates(startDate.value, endDate.value)) {
    availabilityLoading.value = false

    return
  }

  availabilityLoading.value = true

  const results = await Promise.all(selectedCabinIds.value.map(async cabinId => {
    const query = new URLSearchParams({
      cabin_id: String(cabinId),
      start_date: startDate.value,
      end_date: endDate.value,
    })

    try {
      const response = await $api(`/public/reservations/availability?${query}`)

      return [cabinId, response?.data ?? response]
    } catch {
      return [cabinId, { error: true }]
    }
  }))

  if (requestId === availabilityRequestId) {
    availability.value = Object.fromEntries(results)
    availabilityLoading.value = false
  }
}

const cabinFor = id => cabinItems.value.find(cabin => cabin.id === id)

const availabilityLabel = id => {
  if (availabilityLoading.value) return 'Checking availability...'
  const result = availability.value[id]
  if (result?.error) return 'Could not check availability'

  return result ? (result.available ? 'Dates available' : 'Dates unavailable') : ''
}

const availabilityColor = id => {
  const result = availability.value[id]
  if (availabilityLoading.value) return 'info'
  if (result?.error) return 'warning'

  return result?.available ? 'success' : 'error'
}

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

const validateEmail = value => {
  const address = String(value || '').trim()
  if (sendEmail.value && !address)
    return 'Enter an email address to send the confirmation.'

  return emailValidator(address)
}

const errorsFor = (index, field) => {
  const messages = fieldErrors.value[cabinRows.value.length > 1 ? `cabins.${index}.${field}` : field] || []

  return Array.isArray(messages) ? messages : [messages]
}

const priceSummary = computed(() => {
  const totals = cabinRows.value.map(row => availability.value[row.cabinId])
  if (availabilityLoading.value || totals.some(item => !item || item.error || (item.total_price ?? item.total) == null)) return null
  const currencies = new Set(totals.map(item => item.currency || 'USD'))
  if (currencies.size !== 1) return null

  return new Intl.NumberFormat('en-US', { style: 'currency', currency: [...currencies][0] })
    .format(totals.reduce((sum, item) => sum + Number(item.total_price ?? item.total), 0))
})

const canSubmit = computed(() => Boolean(
  cabinRows.value.length && validBookingDates(startDate.value, endDate.value)
  && fullName.value.trim() && phone.value.trim() && validateEmail(email.value) === true
  && !availabilityLoading.value
  && (cabinRows.value.length === 1 || (Number.isFinite(Number(groupAmountPaid.value || 0)) && Number(groupAmountPaid.value || 0) >= 0))
  && cabinRows.value.every(row => Number.isInteger(Number(row.guestNumber)) && Number(row.guestNumber) > 0
    && (!cabinFor(row.cabinId)?.capacity || Number(row.guestNumber) <= Number(cabinFor(row.cabinId).capacity))
    && (cabinRows.value.length > 1 || (Number.isFinite(Number(row.amountPaid || 0)) && Number(row.amountPaid || 0) >= 0))
    && availability.value[row.cabinId]?.available !== false),
))

const submitReservation = async () => {
  if (isSubmitting.value) return
  errorMessage.value = ''
  fieldErrors.value = {}

  if (!canSubmit.value) {
    errorMessage.value = validateEmail(email.value) !== true
      ? validateEmail(email.value)
      : 'Check cabins, dates, capacity, payments, and contact details.'

    return
  }

  isSubmitting.value = true

  const payload = {
    ...reservationCabinPayload(cabinRows.value, groupAmountPaid.value),
    start_date: startDate.value,
    end_date: endDate.value,
    full_name: fullName.value.trim(),
    phone: phone.value.trim(),
    email: email.value.trim() || null,
    send_email: sendEmail.value,
    payment_method: paymentMethod.value || null,
    payment_reference: paymentReference.value.trim() || null,
    notes: notes.value.trim() || null,
  }

  try {
    const response = await $api('reservations', {
      method: 'POST',
      body: payload,
    })

    created.value = createdReservations(response)
    resultsVisible.value = true
    emit('reservationCreated', response)
    emit('update:isDialogVisible', false)
    resetForm()
  } catch (error) {
    fieldErrors.value = reservationFieldErrors(error)
    errorMessage.value = reservationErrorMessage(error, 'Failed to create reservation')
    if ((error?.status || error?.response?.status) === 409)
      await checkAvailability()
  } finally {
    isSubmitting.value = false
  }
}

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
}, { immediate: true })

watch(() => props.initialReservation, initialReservation => {
  if (props.isDialogVisible && initialReservation)
    hydrateForm(initialReservation)
})

watch(selectedCabinIds, ids => {
  cabinRows.value = ids.map(cabinId => cabinRows.value.find(row => row.cabinId === cabinId)
    || { cabinId, guestNumber: 1, amountPaid: null })
})
watch([selectedCabinIds, startDate, endDate], checkAvailability)

watch(stayDateRange, value => {
  const [checkIn = '', checkOut = ''] = String(value || '').split(' to ')

  startDate.value = checkIn || null
  endDate.value = checkOut || null
})
</script>

<template>
  <AppFormDialog
    :model-value="props.isDialogVisible"
    title="Add Reservation"
    subtitle="Enter the stay, contact, and payment details."
    :max-width="900"
    :submit-text="cabinRows.length > 1 ? 'Create linked reservations' : 'Create reservation'"
    :loading="isSubmitting"
    :can-submit="canSubmit"
    @update:model-value="dialogVisibleUpdate"
    @submit="submitReservation"
  >
    <div class="reservation-form">
      <section class="reservation-section">
        <div class="section-heading">
          <VAvatar
            color="primary"
            variant="tonal"
            size="34"
          >
            <VIcon
              icon="ri-calendar-event-line"
              size="18"
            />
          </VAvatar>
          <div>
            <div class="text-subtitle-1 font-weight-semibold">
              Stay details
            </div>
            <div class="text-body-2 text-medium-emphasis">
              Choose one or more cabins. Each keeps its own price, payment, and status.
            </div>
          </div>
        </div>
        <VRow>
          <VCol
            cols="12"
            md="6"
          >
            <VSelect
              v-model="selectedCabinIds"
              multiple
              chips
              closable-chips
              :items="cabinItems"
              item-title="name"
              item-value="id"
              label="Cabins"
              placeholder="Select cabins"
              prepend-inner-icon="ri-home-4-line"
            />
          </VCol>
          <VCol
            cols="12"
            md="6"
          >
            <AppDateTimePicker
              v-model="stayDateRange"
              :config="stayDatePickerConfig"
              label="Check-in / check-out"
              placeholder="Select your stay dates"
              prepend-inner-icon="ri-calendar-event-line"
            />
          </VCol>
          <VCol
            v-for="(row, index) in cabinRows"
            :key="row.cabinId"
            cols="12"
          >
            <VCard variant="outlined">
              <VCardText>
                <div class="text-subtitle-1 mb-3">
                  {{ cabinFor(row.cabinId)?.name || `Cabin #${row.cabinId}` }}
                </div>
                <VRow>
                  <VCol
                    cols="12"
                    sm="6"
                  >
                    <VTextField
                      v-model="row.guestNumber"
                      label="Number of guests"
                      type="number"
                      min="1"
                      step="1"
                      :error-messages="errorsFor(index, 'guest_number')"
                      :max="cabinFor(row.cabinId)?.capacity"
                      :hint="cabinFor(row.cabinId)?.capacity ? `Capacity: ${cabinFor(row.cabinId).capacity}` : ''"
                      persistent-hint
                    />
                  </VCol>
                  <VCol
                    v-if="cabinRows.length === 1"
                    cols="12"
                    sm="6"
                  >
                    <VTextField
                      v-model="row.amountPaid"
                      :error-messages="errorsFor(index, 'amount_paid')"
                      label="Amount paid for this cabin"
                      type="number"
                      min="0"
                      step="0.01"
                    />
                  </VCol>
                </VRow>
                <NightlyPrices
                  :pricing="availability[row.cabinId]"
                  :currency="availability[row.cabinId]?.currency || 'USD'"
                  compact
                />
                <div
                  v-if="errorsFor(index, 'cabin_id').length"
                  class="text-error mt-2"
                >
                  {{ errorsFor(index, 'cabin_id').join(' ') }}
                </div>
                <VChip
                  v-if="availabilityLabel(row.cabinId)"
                  :color="availabilityColor(row.cabinId)"
                  size="small"
                  variant="tonal"
                  class="mt-2"
                >
                  {{ availabilityLabel(row.cabinId) }}
                </VChip>
              </VCardText>
            </VCard>
          </VCol>
        </VRow>
        <VAlert
          v-if="cabinRows.length > 1"
          type="info"
          variant="tonal"
        >
          <div v-if="priceSummary">
            Suma informativa de subtotales: <strong>{{ priceSummary }}</strong>.
          </div>
          <div v-else>
            La suma estará disponible cuando se consulten los precios de todas las cabañas.
          </div>
          El abono de la creación múltiple se captura una sola vez para el grupo.
        </VAlert>
        <VTextField
          v-if="cabinRows.length > 1"
          v-model="groupAmountPaid"
          :error-messages="fieldErrors.group_amount_paid || []"
          label="Abono del grupo"
          type="number"
          min="0"
          step="0.01"
        />
      </section>

      <VDivider />

      <section class="reservation-section">
        <div class="section-heading">
          <VAvatar
            color="info"
            variant="tonal"
            size="34"
          >
            <VIcon
              icon="ri-user-line"
              size="18"
            />
          </VAvatar>
          <div>
            <div class="text-subtitle-1 font-weight-semibold">
              Contact information
            </div>
            <div class="text-body-2 text-medium-emphasis">
              How can you reach the primary guest?
            </div>
          </div>
        </div>
        <VRow>
          <VCol cols="12">
            <VTextField
              v-model="fullName"
              label="Full name"
              placeholder="Primary guest full name"
              prepend-inner-icon="ri-user-line"
            />
          </VCol>
          <VCol
            cols="12"
            md="6"
          >
            <VTextField
              v-model="phone"
              label="Phone"
              placeholder="Guest phone number"
              prepend-inner-icon="ri-phone-line"
            />
          </VCol>
          <VCol
            cols="12"
            md="6"
          >
            <VTextField
              v-model="email"
              :label="sendEmail ? 'Email' : 'Email (optional)'"
              placeholder="Guest email address"
              type="email"
              :rules="[validateEmail]"
              prepend-inner-icon="ri-mail-line"
            />
          </VCol>
          <VCol
            cols="12"
            class="pt-0"
          >
            <VCheckbox
              v-model="sendEmail"
              label="Send confirmation email to the guest"
              hint="An email address is required. One confirmation is sent per reservation."
              persistent-hint
            />
          </VCol>
        </VRow>
      </section>

      <VDivider />

      <section class="reservation-section">
        <div class="section-heading">
          <VAvatar
            color="success"
            variant="tonal"
            size="34"
          >
            <VIcon
              icon="ri-bank-card-line"
              size="18"
            />
          </VAvatar>
          <div>
            <div class="text-subtitle-1 font-weight-semibold">
              Payment
            </div>
            <div class="text-body-2 text-medium-emphasis">
              Record the payment method and amount received.
            </div>
          </div>
        </div>
        <VRow>
          <VCol
            cols="12"
            sm="6"
            md="4"
          >
            <VSelect
              v-model="paymentMethod"
              :items="paymentMethodItems"
              label="Payment method"
              placeholder="Select a method"
              prepend-inner-icon="ri-wallet-3-line"
              clearable
            />
          </VCol>
          <VCol
            cols="12"
            md="4"
          >
            <VTextField
              v-model="paymentReference"
              label="Payment reference"
              placeholder="Optional reference"
              prepend-inner-icon="ri-hashtag"
            />
          </VCol>
          <VCol cols="12">
            <VTextarea
              v-model="notes"
              label="Notes"
              placeholder="Add any details that may help manage this reservation"
              rows="2"
              auto-grow
            />
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
  <CreatedReservations
    v-model:isDialogVisible="resultsVisible"
    :reservations="created"
    @reservation-updated="emit('reservationCreated')"
  />
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
