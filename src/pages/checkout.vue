<script setup>
import { $api } from '@/utils/api'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

definePage({
  meta: {
    layout: 'blank',
    public: true,
  },
})

const route = useRoute()
const router = useRouter()

const cabin = ref(null)
const reservation = ref(null)
const guestEmail = ref('')
const guestPhone = ref('')
const guestRows = ref([])
const loadingCabin = ref(false)
const loadingReservation = ref(false)
const reservationSubmitting = ref(false)
const loadingIntent = ref(false)
const paymentLoading = ref(false)
const errorMessage = ref('')
const reservationError = ref('')
const reservationSuccess = ref('')
const paymentError = ref('')
const paymentSuccess = ref('')
const paymentIntent = ref(null)

let stripeInstance = null
let paymentElements = null
let paymentElement = null

const stripePublishableKey = computed(() => import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '')

const queryValue = key => {
  const value = route.query?.[key] ?? route.params?.[key]
  if (value === undefined || value === null || value === '')
    return ''

  return String(value).trim()
}

const queryNumber = (...keys) => {
  for (const key of keys) {
    const normalized = queryValue(key)
    if (!normalized)
      continue

    const parsed = Number(normalized)
    if (Number.isFinite(parsed) && parsed > 0)
      return parsed
  }

  return null
}

const cabinId = computed(() => queryNumber('cabin_id', 'cabinId', 'id'))
const startDate = computed(() => queryValue('start_date'))
const endDate = computed(() => queryValue('end_date'))
const adults = computed(() => Math.max(1, queryNumber('adults') || 1))
const children = computed(() => Math.max(0, queryNumber('children') || 0))
const checkoutToken = computed(() => queryValue('token') || queryValue('checkout_token'))
const reservationIdQuery = computed(() => queryNumber('reservation_id', 'reservationId'))
const hasBookingDraft = computed(() => Boolean(cabinId.value && startDate.value && endDate.value))
const hasExistingReservation = computed(() => Boolean(checkoutToken.value || reservationIdQuery.value))

const totalNights = computed(() => {
  if (!startDate.value || !endDate.value)
    return 0

  const start = new Date(startDate.value)
  const end = new Date(endDate.value)
  const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24))

  return diff > 0 ? diff : 0
})

const formatCurrency = amount => new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
}).format(Number(amount || 0))

const unwrapResponse = response => response?.data ?? response ?? null

const loadStripeJs = () => new Promise((resolve, reject) => {
  if (window.Stripe) {
    resolve()
    return
  }

  const script = document.createElement('script')
  script.src = 'https://js.stripe.com/v3/'
  script.onload = () => resolve()
  script.onerror = () => reject(new Error('Could not load Stripe.js'))
  document.head.appendChild(script)
})

const destroyPaymentElement = () => {
  if (paymentElement) {
    paymentElement.unmount()
    paymentElement = null
  }

  paymentElements = null
}

const mountPaymentElement = async clientSecret => {
  if (!stripePublishableKey.value)
    throw new Error('Stripe publishable key is missing.')

  destroyPaymentElement()

  await loadStripeJs()
  stripeInstance = window.Stripe(stripePublishableKey.value)
  paymentElements = stripeInstance.elements({ clientSecret })

  await nextTick()

  paymentElement = paymentElements.create('payment')
  paymentElement.mount('#checkout-payment-element')
}

const loadCabinDetails = async () => {
  if (!cabinId.value) {
    cabin.value = null
    return
  }

  loadingCabin.value = true

  try {
    const response = await $api(`/public/cabins/${cabinId.value}`)
    cabin.value = unwrapResponse(response)
  } catch (error) {
    cabin.value = null
    errorMessage.value = error?.message || 'Could not load cabin details.'
  } finally {
    loadingCabin.value = false
  }
}

const syncGuestRows = () => {
  if (guestRows.value.length || hasExistingReservation.value)
    return

  const adultRows = Array.from({ length: adults.value }, () => ({ full_name: '', guest_type: 'adult' }))
  const childRows = Array.from({ length: children.value }, () => ({ full_name: '', guest_type: 'child' }))
  guestRows.value = [...adultRows, ...childRows]
}

const guestFormValid = computed(() => {
  if (!guestEmail.value.trim() || !guestPhone.value.trim())
    return false

  if (!guestRows.value.length)
    return false

  return guestRows.value.every(guest => guest.full_name?.trim())
})

const reservationReference = computed(() => reservation.value?.id || reservationIdQuery.value)
const displayTotal = computed(() => reservation.value?.total_price || cabin.value?.total_price || 0)

const loadReservationFromToken = async token => {
  loadingReservation.value = true
  errorMessage.value = ''

  try {
    const response = await $api(`/public/checkout/reservations/${encodeURIComponent(token)}`)
    const data = unwrapResponse(response)

    if (!data?.id)
      throw new Error('Reservation was not returned by the server.')

    reservation.value = data

    await router.replace({
      path: '/checkout',
      query: { reservation_id: String(data.id) },
    })

    return data.id
  } finally {
    loadingReservation.value = false
  }
}

const createPaymentIntent = async reservationId => {
  if (!reservationId)
    throw new Error('Missing reservation reference.')

  loadingIntent.value = true
  paymentError.value = ''
  paymentSuccess.value = ''

  try {
    const response = await $api('/public/payments/intent', {
      method: 'POST',
      body: { reservation_id: reservationId },
    })

    const intent = unwrapResponse(response)
    if (!intent?.client_secret)
      throw new Error('Payment intent was not returned by the server.')

    paymentIntent.value = intent
    await mountPaymentElement(intent.client_secret)
  } finally {
    loadingIntent.value = false
  }
}

const initializeCheckout = async () => {
  errorMessage.value = ''

  try {
    if (checkoutToken.value) {
      const reservationId = await loadReservationFromToken(checkoutToken.value)
      await createPaymentIntent(reservationId)
      return
    }

    if (reservationIdQuery.value) {
      await createPaymentIntent(reservationIdQuery.value)
      return
    }

    syncGuestRows()
  } catch (error) {
    errorMessage.value = error?.message || 'Could not initialize checkout.'
  }
}

const createGuestPayload = () => guestRows.value.map(guest => ({
  full_name: guest.full_name.trim(),
  guest_type: guest.guest_type,
}))

const submitReservation = async () => {
  reservationError.value = ''
  reservationSuccess.value = ''

  if (!cabinId.value || !startDate.value || !endDate.value) {
    reservationError.value = 'Missing booking dates or cabin.'
    return
  }

  if (!guestFormValid.value) {
    reservationError.value = 'Please complete your email, phone, and all guest names.'
    return
  }

  reservationSubmitting.value = true

  try {
    const createdResponse = await $api('/public/reservations', {
      method: 'POST',
      body: {
        cabin_id: cabinId.value,
        start_date: startDate.value,
        end_date: endDate.value,
        email: guestEmail.value.trim(),
        phone: guestPhone.value.trim(),
        guests: createGuestPayload(),
      },
    })

    const created = unwrapResponse(createdResponse)
    const createdReservationId = created?.id || created?.reservation_id

    if (!createdReservationId)
      throw new Error('Reservation created but no ID was returned.')

    const tokenResponse = await $api('/public/checkout/token', {
      method: 'POST',
      body: { reservation_id: createdReservationId },
    })

    const tokenData = unwrapResponse(tokenResponse)
    const checkoutTokenValue = tokenData?.checkout_token || tokenData?.token

    if (!checkoutTokenValue)
      throw new Error('Checkout token was not returned by the server.')

    reservationSuccess.value = 'Reservation created. Preparing payment...'
    const loadedReservationId = await loadReservationFromToken(checkoutTokenValue)
    await createPaymentIntent(loadedReservationId)
  } catch (error) {
    reservationError.value = error?.message || 'Could not create reservation.'
  } finally {
    reservationSubmitting.value = false
  }
}

const handlePay = async () => {
  if (!stripeInstance || !paymentElements || !paymentIntent.value?.client_secret) {
    paymentError.value = 'Payment form is not ready yet.'
    return
  }

  paymentLoading.value = true
  paymentError.value = ''
  paymentSuccess.value = ''

  try {
    const { error, paymentIntent: confirmedIntent } = await stripeInstance.confirmPayment({
      elements: paymentElements,
      confirmParams: {
        return_url: window.location.href,
      },
      redirect: 'if_required',
    })

    if (error)
      throw new Error(error.message)

    if (confirmedIntent?.status === 'succeeded')
      paymentSuccess.value = 'Payment confirmed successfully.'
    else
      paymentSuccess.value = `Payment status: ${confirmedIntent?.status || 'processing'}`
  } catch (error) {
    paymentError.value = error?.message || 'Payment could not be completed.'
  } finally {
    paymentLoading.value = false
  }
}

onMounted(() => {
  loadCabinDetails()
  initializeCheckout()
})

onBeforeUnmount(() => {
  destroyPaymentElement()
})

watch([cabinId, adults, children], () => {
  if (hasExistingReservation.value)
    return

  guestRows.value = []
  syncGuestRows()
})
</script>

<template>
  <div class="checkout-page">
    <div class="checkout-shell">
      <VCard class="checkout-card" elevation="0">
        <VCardText class="pa-4 pa-md-6">
          <div class="checkout-hero">
            <div>
              <div class="checkout-kicker">Secure checkout</div>
              <div class="checkout-title">
                {{ hasExistingReservation ? 'Review and pay' : 'Complete your reservation' }}
              </div>
              <div class="checkout-subtitle">
                {{ hasExistingReservation
                  ? 'We load the reservation and prepare the payment.'
                  : 'Fill in the guest details here, then we create the reservation and payment intent.' }}
              </div>
            </div>
            <VChip color="primary" variant="tonal" label>
              {{ reservationReference ? `Reservation #${reservationReference}` : 'Pending' }}
            </VChip>
          </div>

          <VAlert v-if="errorMessage" type="error" variant="tonal" density="compact" class="mb-4">
            {{ errorMessage }}
          </VAlert>

          <div v-if="loadingCabin" class="loading-state">
            Loading cabin details...
          </div>

          <div v-else class="checkout-body">
            <VCard v-if="cabin" class="summary-card" variant="tonal">
              <VCardText>
                <div class="summary-grid">
                  <div class="summary-item">
                    <span>Cabin</span>
                    <strong>#{{ cabin.id }}</strong>
                  </div>
                  <div class="summary-item">
                    <span>Dates</span>
                    <strong>{{ startDate || '—' }} -> {{ endDate || '—' }}</strong>
                  </div>
                  <div class="summary-item">
                    <span>Nights</span>
                    <strong>{{ totalNights }}</strong>
                  </div>
                  <div class="summary-item">
                    <span>Adults</span>
                    <strong>{{ adults }}</strong>
                  </div>
                  <div class="summary-item">
                    <span>Children</span>
                    <strong>{{ children }}</strong>
                  </div>
                  <div class="summary-item">
                    <span>Price / night</span>
                    <strong>{{ formatCurrency(cabin.price_per_night || 0) }}</strong>
                  </div>
                </div>
              </VCardText>
            </VCard>

            <VAlert v-if="reservationError" type="error" variant="tonal" density="compact" class="mb-4">
              {{ reservationError }}
            </VAlert>
            <VAlert v-if="reservationSuccess" type="success" variant="tonal" density="compact" class="mb-4">
              {{ reservationSuccess }}
            </VAlert>
            <VAlert v-if="paymentError" type="error" variant="tonal" density="compact" class="mb-4">
              {{ paymentError }}
            </VAlert>
            <VAlert v-if="paymentSuccess" type="success" variant="tonal" density="compact" class="mb-4">
              {{ paymentSuccess }}
            </VAlert>

            <VAlert v-if="!hasExistingReservation && !hasBookingDraft" type="warning" variant="tonal" density="compact">
              Open this page from the booking widget to complete a new reservation, or provide a checkout token.
            </VAlert>

            <VCard v-if="hasBookingDraft && !hasExistingReservation" class="form-card" variant="outlined">
              <VCardText>
                <div class="form-card__title">Guest details</div>
                <div class="form-grid">
                  <VTextField v-model="guestEmail" label="Email" placeholder="guest@email.com" />
                  <VTextField v-model="guestPhone" label="Phone" placeholder="+1 234 567 8900" />
                </div>

                <div class="guest-section">
                  <div class="guest-section__header">
                    <div class="guest-section__title">Guests</div>
                  </div>

                  <div v-for="(guest, index) in guestRows" :key="`${guest.guest_type}-${index}`" class="guest-row">
                    <VTextField v-model="guest.full_name" label="Full name" density="comfortable" hide-details="auto" />
                    <VSelect
                      v-model="guest.guest_type"
                      :items="[{ title: 'Adult', value: 'adult' }, { title: 'Child', value: 'child' }]"
                      item-title="title"
                      item-value="value"
                      label="Type"
                      density="comfortable"
                      hide-details="auto"
                    />
                  </div>
                </div>

                <VBtn
                  color="primary"
                  class="w-100 mt-4"
                  :loading="reservationSubmitting"
                  :disabled="reservationSubmitting"
                  @click="submitReservation"
                >
                  Continue to payment
                </VBtn>
              </VCardText>
            </VCard>

            <div v-if="paymentIntent || hasExistingReservation" class="payment-card">
              <div class="payment-card__header">
                <div>
                  <div class="payment-card__title">Payment method</div>
                  <div class="payment-card__subtitle">Powered by Stripe Elements</div>
                </div>
                <VChip v-if="paymentIntent" color="success" variant="tonal" label>
                  Intent ready
                </VChip>
              </div>

              <div v-if="reservation || hasExistingReservation" class="payment-meta">
                <div>
                  <span>Total</span>
                  <strong>{{ formatCurrency(displayTotal) }}</strong>
                </div>
                <div>
                  <span>Status</span>
                  <strong>{{ reservation?.status || 'pending' }}</strong>
                </div>
              </div>

              <div id="checkout-payment-element" class="payment-element" />

              <div class="payment-actions">
                <VBtn
                  color="primary"
                  class="w-100"
                  :loading="loadingIntent || paymentLoading"
                  :disabled="loadingIntent || paymentLoading || !paymentIntent"
                  @click="handlePay"
                >
                  Pay now
                </VBtn>
              </div>
            </div>
          </div>
        </VCardText>
      </VCard>
    </div>
  </div>
</template>

<style scoped lang="scss">
.checkout-page {
  min-height: 100vh;
  padding: 24px;
  background:
    radial-gradient(circle at top left, rgba(184, 135, 70, 0.16), transparent 34%),
    linear-gradient(180deg, #f4e9da 0%, #f7f0e6 100%);
  color: #2e2a27;
}

.checkout-shell {
  max-width: 960px;
  margin: 0 auto;
}

.checkout-card {
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(12px);
}

.checkout-hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

.checkout-kicker {
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #a06d2e;
}

.checkout-title {
  margin-top: 6px;
  font-size: 1.7rem;
  font-weight: 900;
  line-height: 1.1;
}

.checkout-subtitle {
  max-width: 64ch;
  margin-top: 8px;
  color: #7f6b57;
}

.loading-state {
  padding: 16px 0;
  color: #7f6b57;
}

.checkout-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.summary-card {
  border-radius: 18px;
  background: rgba(250, 247, 243, 0.9);
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.summary-item span {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #8a7050;
}

.summary-item strong {
  font-size: 0.96rem;
  color: #2e2a27;
  overflow-wrap: anywhere;
}

.form-card {
  border-radius: 18px;
}

.form-card__title {
  margin-bottom: 14px;
  font-size: 1rem;
  font-weight: 800;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.guest-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 16px;
}

.guest-section__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.guest-section__title {
  font-size: 0.95rem;
  font-weight: 700;
}

.guest-row {
  display: grid;
  grid-template-columns: 1.4fr 0.8fr;
  gap: 10px;
  align-items: center;
}

.payment-card {
  padding: 18px;
  border: 1px solid #e8dfd6;
  border-radius: 18px;
  background: linear-gradient(180deg, #fff 0%, #fcf7f2 100%);
}

.payment-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.payment-card__title {
  font-size: 1rem;
  font-weight: 800;
}

.payment-card__subtitle {
  margin-top: 4px;
  font-size: 0.88rem;
  color: #7f6b57;
}

.payment-meta {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 14px;
  padding: 12px 14px;
  border-radius: 14px;
  background: #faf7f3;
}

.payment-meta span {
  display: block;
  margin-bottom: 4px;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #8a7050;
}

.payment-meta strong {
  font-size: 0.96rem;
}

.payment-element {
  min-height: 72px;
  padding: 14px;
  border: 1px solid #e2d3c2;
  border-radius: 14px;
  background: #fff;
}

.payment-actions {
  margin-top: 14px;
}

@media (max-width: 720px) {
  .checkout-page {
    padding: 14px;
  }

  .checkout-hero {
    flex-direction: column;
  }

  .summary-grid,
  .form-grid,
  .payment-meta {
    grid-template-columns: 1fr;
  }

  .guest-row {
    grid-template-columns: 1fr;
  }
}
</style>
