<script setup>
import { $api } from '@/utils/api'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

definePage({
    meta: {
        layout: 'blank',
        public: true,
    },
})

const route = useRoute()
const cabinDetails = ref(null)
let stripeInstance = null
let paymentElements = null
let paymentElement = null

const getCabinIdFromRoute = () => {
    const candidates = [
        route.params?.id,
        route.params?.cabinId,
        route.params?.cabin_id,
        route.query?.id,
        route.query?.cabinId,
        route.query?.cabin_id,
    ]

    const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null

    if (searchParams) {
        candidates.push(
            searchParams.get('id'),
            searchParams.get('cabinId'),
            searchParams.get('cabin_id'),
        )
    }

    const pathMatch = route.path?.match(/\/(?:cabins?|cabin)\/(\d+)(?:\/|$)/i)
    if (pathMatch?.[1])
        candidates.push(pathMatch[1])

    for (const value of candidates) {
        if (value === undefined || value === null || value === '')
            continue

        if (Array.isArray(value)) {
            const firstValue = value[0]
            if (firstValue !== undefined && firstValue !== null && firstValue !== '')
                return Number(firstValue) > 0 ? Number(firstValue) : null
            continue
        }

        const normalizedValue = String(value).trim()
        const parsedValue = Number(normalizedValue)

        if (Number.isFinite(parsedValue) && parsedValue > 0)
            return parsedValue
    }

    return null
}

const selectedCabinId = computed(() => getCabinIdFromRoute())
const startDate = ref('')
const endDate = ref('')
const adults = ref(1)
const children = ref(0)
const loading = ref(false)
const cabinLoading = ref(false)
const availability = ref(null)
const errorMessage = ref('')
const reservationModalOpen = ref(false)
const reservationSubmitting = ref(false)
const reservationEmail = ref('')
const reservationPhone = ref('')
const reservationGuests = ref([])
const reservationError = ref('')
const reservationSuccess = ref('')
const paymentLoading = ref(false)
const paymentError = ref('')
const paymentSuccess = ref('')
const paymentIntentData = ref(null)
const stripePublishableKey = computed(() => import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '')

const totalNights = computed(() => {
    if (!startDate.value || !endDate.value)
        return 0

    const start = new Date(startDate.value)
    const end = new Date(endDate.value)
    const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24))
    return diff > 0 ? diff : 0
})

const canCheck = computed(() => selectedCabinId.value && startDate.value && endDate.value && totalNights.value > 0)
const reservationTotal = computed(() => Number(availability.value?.total_price || 0))
const reservationCanSubmit = computed(() => {
    if (!reservationEmail.value.trim() || !reservationPhone.value.trim())
        return false

    if (!reservationGuests.value.length)
        return false

    return reservationGuests.value.every(guest => guest.full_name?.trim())
})

const startPickerConfig = {
    dateFormat: 'Y-m-d',
    altInput: true,
    altFormat: 'F j, Y',
    minDate: 'today',
}

const endPickerConfig = computed(() => ({
    dateFormat: 'Y-m-d',
    altInput: true,
    altFormat: 'F j, Y',
    minDate: startDate.value || 'today',
}))

const fetchCabinDetails = async () => {
    if (!selectedCabinId.value) {
        cabinDetails.value = null
        return
    }

    cabinLoading.value = true

    try {
        const resp = await $api(`/public/cabins/${selectedCabinId.value}`)
        cabinDetails.value = resp?.data || resp || null
    } catch (error) {
        cabinDetails.value = null
        console.error('Failed to load cabin details:', error)
    } finally {
        cabinLoading.value = false
    }
}

const selectedCabin = computed(() => cabinDetails.value || null)

const formatCurrency = amount => {
    const value = Number(amount || 0)
    return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
    }).format(value)
}

const resetReservationFlow = () => {
    reservationError.value = ''
    reservationSuccess.value = ''
    paymentError.value = ''
    paymentSuccess.value = ''
    reservationEmail.value = ''
    reservationPhone.value = ''
    reservationGuests.value = []
    paymentIntentData.value = null
    reservationSubmitting.value = false
    paymentLoading.value = false

    if (paymentElement) {
        paymentElement.unmount()
        paymentElement = null
    }

    paymentElements = null
}

const openReservationModal = () => {
    resetReservationFlow()

    const adultRows = Array.from({ length: adults.value }, () => ({ full_name: '', guest_type: 'adult' }))
    const childRows = Array.from({ length: children.value }, () => ({ full_name: '', guest_type: 'child' }))
    reservationGuests.value = [...adultRows, ...childRows]
    reservationModalOpen.value = true
}

const closeReservationModal = () => {
    reservationModalOpen.value = false
    resetReservationFlow()
}

const addGuest = () => {
    reservationGuests.value.push({ full_name: '', guest_type: 'adult' })
}

const removeGuest = index => {
    reservationGuests.value.splice(index, 1)
}

const extractReservationId = payload => {
    if (!payload)
        return null

    if (typeof payload === 'object') {
        return payload?.id || payload?.reservation_id || payload?.data?.id || payload?.data?.reservation_id || null
    }

    return null
}

const handleCheckAvailability = async () => {
    if (!canCheck.value)
        return

    loading.value = true
    availability.value = null
    errorMessage.value = ''
    closeReservationModal()

    try {
        const resp = await $api(
            `/public/reservations/availability?cabin_id=${selectedCabinId.value}&start_date=${startDate.value}&end_date=${endDate.value}&adults=${adults.value}&children=${children.value}`,
        )
        availability.value = resp
    } catch (error) {
        errorMessage.value = error?.message || 'Could not check availability.'
    } finally {
        loading.value = false
    }
}

const availabilityStatus = computed(() => {
    if (!availability.value)
        return null
    return availability.value.available ? 'Available' : 'Unavailable'
})

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

const mountPaymentElement = async intent => {
    if (!stripePublishableKey.value) {
        throw new Error('Stripe publishable key is missing.')
    }

    if (paymentElement) {
        paymentElement.unmount()
        paymentElement = null
    }

    await loadStripeJs()
    stripeInstance = window.Stripe(stripePublishableKey.value)
    paymentElements = stripeInstance.elements({ clientSecret: intent?.client_secret })
    paymentElement = paymentElements.create('payment')

    const mountTarget = document.getElementById('booking-widget-payment-element')
    if (mountTarget)
        paymentElement.mount('#booking-widget-payment-element')
}

const handlePay = async () => {
    if (!stripeInstance || !paymentElements || !paymentIntentData.value?.client_secret) {
        paymentError.value = 'Payment is not ready yet.'
        return
    }

    paymentLoading.value = true
    paymentError.value = ''
    paymentSuccess.value = ''

    try {
        const { error, paymentIntent } = await stripeInstance.confirmPayment({
            elements: paymentElements,
            confirmParams: {
                return_url: window.location.href,
            },
            redirect: 'if_required',
        })

        if (error) {
            throw new Error(error.message)
        }

        if (paymentIntent?.status === 'succeeded') {
            paymentSuccess.value = 'Payment confirmed successfully.'
        } else {
            paymentSuccess.value = `Payment status: ${paymentIntent?.status || 'processing'}`
        }
    } catch (error) {
        paymentError.value = error?.message || 'Payment could not be completed.'
    } finally {
        paymentLoading.value = false
    }
}

const submitReservation = async () => {
    reservationError.value = ''
    reservationSuccess.value = ''

    if (!reservationCanSubmit.value) {
        reservationError.value = 'Please complete your email, phone, and all guest names.'
        return
    }

    reservationSubmitting.value = true

    const payload = {
        cabin_id: selectedCabinId.value,
        start_date: startDate.value,
        end_date: endDate.value,
        email: reservationEmail.value.trim(),
        phone: reservationPhone.value.trim(),
        guests: reservationGuests.value.map(guest => ({
            full_name: guest.full_name.trim(),
            guest_type: guest.guest_type,
        })),
    }

    try {
        const created = await $api('/public/reservations', {
            method: 'POST',
            body: payload,
        })

        const reservationId = extractReservationId(created)
        if (!reservationId) {
            throw new Error('Reservation created but no ID was returned.')
        }

        reservationSuccess.value = 'Reservation created. Please complete the payment below.'

        paymentLoading.value = true
        paymentError.value = ''
        paymentSuccess.value = ''

        const intent = await $api('/public/payments/intent', {
            method: 'POST',
            body: { reservation_id: reservationId },
        })

        paymentIntentData.value = intent
        await mountPaymentElement(intent)
    } catch (error) {
        reservationError.value = error?.message || 'Could not create reservation.'
    } finally {
        reservationSubmitting.value = false
        paymentLoading.value = false
    }
}

const handleReserve = () => {
    if (!availability.value?.available)
        return

    openReservationModal()
}

watch(reservationModalOpen, isOpen => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
})

onMounted(() => {
    fetchCabinDetails()
})

watch(selectedCabinId, () => {
    fetchCabinDetails()
})
</script>

<template>
    <div class="booking-widget-page">
        <div class="booking-widget-shell">
            <VCard class="booking-card" elevation="0">
                <VCardText class="pa-3">

                    <VAlert v-if="!selectedCabinId" border="start" color="warning" variant="tonal" density="compact"
                        class="mb-3">
                        No <strong>id</strong> was found in the URL. Add
                        <code>?id=6</code> at the end.
                    </VAlert>

                    <div class="booking-row">
                        <div class="field field-date">
                            <AppDateTimePicker v-model="startDate" label="Check-in" placeholder="YYYY-MM-DD"
                                density="compact" hide-details="auto" :config="startPickerConfig" />
                        </div>
                        <div class="field field-date">
                            <AppDateTimePicker v-model="endDate" label="Check-out" placeholder="YYYY-MM-DD"
                                density="compact" hide-details="auto" :config="endPickerConfig" />
                        </div>
                        <div class="field field-price">
                            <div v-if="cabinLoading" class="price-pill price-pill-loading">
                                Loading...
                            </div>
                            <div v-else-if="selectedCabin" class="price-pill">
                                <span class="price-pill-label">Price / night</span>
                                <span class="price-pill-value">{{ formatCurrency(selectedCabin.price_per_night)
                                }}</span>
                            </div>
                        </div>
                        <div class="field field-small">
                            <VTextField v-model.number="adults" type="number" min="1" label="Adults" density="compact"
                                hide-details="auto" />
                        </div>
                        <div class="field field-small">
                            <VTextField v-model.number="children" type="number" min="0" label="Children"
                                density="compact" hide-details="auto" />
                        </div>
                        <div class="field field-action">
                            <VBtn style="border-radius: 8px;" class="w-100 " color="primary" variant="elevated"
                                :loading="loading" :disabled="!canCheck || loading" @click="handleCheckAvailability">
                                Check
                            </VBtn>
                        </div>
                    </div>

                    <div v-if="availability" class="result-bar" :class="{ 'is-available': availability.available }">
                        <div class="result-price">
                            <span class="result-price-label">Total price</span>
                            <span class="result-price-value">
                                {{ availability?.total_price ? formatCurrency(availability.total_price) : '—' }}
                            </span>
                        </div>
                        <span class="result-status" :class="availability.available ? 'ok' : 'no'">
                            {{ availabilityStatus }}
                        </span>
                        <VBtn size="small" color="success" variant="elevated" :disabled="!availability.available"
                            @click="handleReserve">
                            Reserve
                        </VBtn>
                    </div>

                    <VAlert v-if="errorMessage" border="start" color="error" variant="tonal" density="compact"
                        class="mt-3">
                        {{ errorMessage }}
                    </VAlert>

                </VCardText>
            </VCard>
        </div>

        <div v-if="reservationModalOpen" class="reservation-overlay" @click.self="closeReservationModal">
            <div class="reservation-modal">
                <div class="reservation-modal__header">
                    <div>
                        <div class="reservation-modal__title">Reservation details</div>
                        <div class="reservation-modal__subtitle">Complete your contact info and guests</div>
                    </div>
                    <VBtn icon variant="text" @click="closeReservationModal">
                        <VIcon icon="ri-close-line" />
                    </VBtn>
                </div>

                <div class="reservation-modal__body">
                    <div class="reservation-summary">
                        <div class="summary-item">
                            <span>Check-in</span>
                            <strong>{{ startDate }}</strong>
                        </div>
                        <div class="summary-item">
                            <span>Check-out</span>
                            <strong>{{ endDate }}</strong>
                        </div>
                        <div class="summary-item">
                            <span>Total</span>
                            <strong>{{ formatCurrency(reservationTotal) }}</strong>
                        </div>
                    </div>

                    <VAlert v-if="reservationError" type="error" variant="tonal" density="compact" class="mb-3">
                        {{ reservationError }}
                    </VAlert>
                    <VAlert v-if="reservationSuccess" type="success" variant="tonal" density="compact" class="mb-3">
                        {{ reservationSuccess }}
                    </VAlert>
                    <VAlert v-if="paymentError" type="error" variant="tonal" density="compact" class="mb-3">
                        {{ paymentError }}
                    </VAlert>
                    <VAlert v-if="paymentSuccess" type="success" variant="tonal" density="compact" class="mb-3">
                        {{ paymentSuccess }}
                    </VAlert>

                    <div class="reservation-grid">
                        <VTextField v-model="reservationEmail" label="Email" placeholder="guest@email.com" />
                        <VTextField v-model="reservationPhone" label="Phone" placeholder="+1 234 567 8900" />
                    </div>

                    <div class="reservation-guests">
                        <div class="reservation-guests__header">
                            <div class="reservation-guests__title">Guests</div>
                            <VBtn size="small" variant="outlined" color="primary" @click="addGuest">
                                Add guest
                            </VBtn>
                        </div>

                        <div v-for="(guest, index) in reservationGuests" :key="`${guest.guest_type}-${index}`"
                            class="guest-row">
                            <VTextField v-model="guest.full_name" label="Full name" density="comfortable"
                                hide-details="auto" />
                            <VSelect v-model="guest.guest_type"
                                :items="[{ title: 'Adult', value: 'adult' }, { title: 'Child', value: 'child' }]"
                                item-title="title" item-value="value" label="Type" density="comfortable"
                                hide-details="auto" />
                            <VBtn icon variant="text" color="error" @click="removeGuest(index)">
                                <VIcon icon="ri-delete-bin-line" />
                            </VBtn>
                        </div>
                    </div>

                    <div v-if="!paymentIntentData" class="reservation-actions">
                        <VBtn color="primary" class="w-100" :loading="reservationSubmitting"
                            :disabled="reservationSubmitting" @click="submitReservation">
                            Confirm reservation
                        </VBtn>
                    </div>

                    <div v-else class="payment-card">
                        <div class="payment-card__title">Secure payment</div>
                        <div id="booking-widget-payment-element" class="payment-element"></div>
                        <VBtn color="secondary" class="w-100" :loading="paymentLoading" :disabled="paymentLoading"
                            @click="handlePay">
                            Pay now
                        </VBtn>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
.booking-widget-page {
    --widget-bg: #F4E9DA;
    --widget-accent: #B88746;
    --widget-text: #2E2A27;

    width: 100%;
    min-height: auto;
    padding: 0;
    margin: 0;
    background-color: var(--widget-bg);
    color: var(--widget-text);
    box-sizing: border-box;
}

.booking-widget-shell {
    width: 100%;
    max-width: 100%;
    margin: 0;
    padding: 0;
}

.booking-row {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    gap: 0.75rem;
}

.field {
    flex: 1 1 160px;
    min-width: 130px;
}

.field-small {
    flex: 0 1 90px;
    min-width: 80px;
}

.field-action {
    flex: 0 0 auto;
    min-width: 140px;
    align-self: center;

}

.field-price {
    flex: 0 1 140px;
    min-width: 130px;
}

.price-pill {
    display: flex;
    flex-direction: column;
    justify-content: center;
    min-height: 56px;
    padding: 0.6rem 0.7rem;
    border: 1px solid rgba(184, 135, 70, 0.24);
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.55);
}

.price-pill-loading {
    color: rgba(46, 42, 39, 0.7);
    font-size: 0.9rem;
}

.price-pill-label {
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.02em;
    text-transform: uppercase;
    opacity: 0.72;
}

.price-pill-value {
    font-size: 1rem;
    font-weight: 700;
    color: var(--widget-text);
}

.result-bar {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.75rem 1rem;
    margin-top: 0.75rem;
    padding: 0.5rem 0.75rem;
    background: rgba(184, 135, 70, 0.12);
    border-left: 3px solid var(--widget-accent);
}

.result-bar.is-available {
    background: rgba(63, 138, 79, 0.12);
    border-left-color: #3f8a4f;
}

.result-price {
    display: flex;
    align-items: baseline;
    gap: 0.4rem;
}

.result-price-label {
    font-size: 0.75rem;
    color: rgba(46, 42, 39, 0.7);
}

.result-price-value {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--widget-text);
}

.result-status {
    font-size: 0.8rem;
    font-weight: 600;
    padding: 0.15rem 0.6rem;
}

.result-status.ok {
    color: #2f6e3c;
    background: rgba(63, 138, 79, 0.18);
}

.result-status.no {
    color: #a13b2b;
    background: rgba(161, 59, 43, 0.18);
}

/* Sin sombra ni bordes redondeados en ningún elemento del widget */
:deep(.v-card),
:deep(.v-btn),
:deep(.v-field),
:deep(.v-field__outline),
:deep(.v-text-field .v-field),
:deep(.v-alert),
:deep(.v-chip) {

    box-shadow: none !important;
}

:deep(.v-card) {
    background-color: var(--widget-bg) !important;
    color: var(--widget-text) !important;
}

:deep(.v-btn) {
    background-color: var(--widget-accent) !important;
    color: var(--widget-bg) !important;
    border-color: var(--widget-accent) !important;
}

:deep(.v-btn:hover) {
    background-color: #9f6d35 !important;
    border-color: #9f6d35 !important;
}

:deep(.v-alert),
:deep(.v-field__input),
:deep(.v-label),
:deep(.v-chip) {
    color: var(--widget-text) !important;
}

:deep(.text-medium-emphasis) {
    color: rgba(46, 42, 39, 0.75) !important;
}

.reservation-overlay {
    position: fixed;
    inset: 0;
    z-index: 2000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    background: rgba(0, 0, 0, 0.45);
}

.reservation-modal {
    width: min(640px, 100%);
    max-height: 92vh;
    overflow: auto;
    border-radius: 16px;
    background: #fff;
    box-shadow: 0 16px 42px rgba(0, 0, 0, 0.2);
}

.reservation-modal__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 18px 22px;
    border-bottom: 1px solid #e8dfd6;
    background: linear-gradient(135deg, #faf2e7, #f7ebdc);
}

.reservation-modal__title {
    font-size: 1rem;
    font-weight: 800;
    color: var(--widget-text);
}

.reservation-modal__subtitle {
    margin-top: 4px;
    font-size: 0.85rem;
    color: #7f6b57;
}

.reservation-modal__body {
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding: 20px 22px 24px;
}

.reservation-summary {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    padding: 12px 14px;
    border-radius: 12px;
    background: #faf7f3;
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
    font-size: 0.95rem;
    color: var(--widget-text);
}

.reservation-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
}

.reservation-guests {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.reservation-guests__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
}

.reservation-guests__title {
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--widget-text);
}

.guest-row {
    display: grid;
    grid-template-columns: 1.4fr 0.8fr auto;
    gap: 8px;
    align-items: center;
}

.reservation-actions {
    margin-top: 4px;
}

.payment-card {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 12px;
    border: 1px solid #e8dfd6;
    border-radius: 12px;
    background: #fcf7f2;
}

.payment-card__title {
    font-size: 0.95rem;
    font-weight: 800;
    color: var(--widget-text);
}

.payment-element {
    min-height: 56px;
    padding: 10px;
    border-radius: 10px;
    border: 1px solid #e2d3c2;
    background: #fff;
}

@media (max-width: 720px) {

    .reservation-grid,
    .reservation-summary {
        grid-template-columns: 1fr;
    }

    .guest-row {
        grid-template-columns: 1fr;
    }
}
</style>