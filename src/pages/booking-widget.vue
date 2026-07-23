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
const selectedCabinId = computed(() => {
    const rawId = route.params.id ?? route.query.id ?? route.query.cabinId
    const parsedId = Number(rawId)

    return Number.isFinite(parsedId) && parsedId > 0 ? parsedId : null
})
const startDate = ref('')
const endDate = ref('')
const adults = ref(1)
const children = ref(0)
const loading = ref(false)
const cabinLoading = ref(false)
const availability = ref(null)
const errorMessage = ref('')

const totalNights = computed(() => {
    if (!startDate.value || !endDate.value)
        return 0

    const start = new Date(startDate.value)
    const end = new Date(endDate.value)
    const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24))
    return diff > 0 ? diff : 0
})

const canCheck = computed(() => selectedCabinId.value && startDate.value && endDate.value && totalNights.value > 0)

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

const handleCheckAvailability = async () => {
    if (!canCheck.value)
        return

    loading.value = true
    availability.value = null
    errorMessage.value = ''

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

const handleReserve = () => {
    window.alert('Reservation functionality is not implemented yet.')
}

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
                        No <strong>cabin_id</strong> was found in the URL. Add
                        <code>?cabin_id=6</code> at the end.
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

                    <!-- Barra de resultado: precio + estado + reservar, en una sola línea -->
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
</style>