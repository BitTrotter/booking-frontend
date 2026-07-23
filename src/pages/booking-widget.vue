<script setup>
import { $api } from '@/utils/api'
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

definePage({
    meta: {
        layout: 'blank',
        public: true,
    },
})

const route = useRoute()
const cabinItems = ref([])
const selectedCabinId = computed(() => Number(route.query.cabin_id || route.query.cabinId) || null)
const startDate = ref('')
const endDate = ref('')
const adults = ref(1)
const children = ref(0)
const loading = ref(false)
const availability = ref(null)
const errorMessage = ref('')

const embedExampleHref = computed(() => {
    const query = selectedCabinId.value ? `?cabin_id=${selectedCabinId.value}` : '?cabin_id=6'
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    return origin ? `${origin}/booking-widget${query}` : `/booking-widget${query}`
})

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

const fetchCabins = async () => {
    try {
        const resp = await $api('/public/cabins')
        cabinItems.value = Array.isArray(resp) ? resp : resp?.cabins || []
    } catch (error) {
        cabinItems.value = []
        console.error('Failed to load cabins:', error)
    }
}

const selectedCabin = computed(() => cabinItems.value.find(cabin => cabin.id === selectedCabinId.value) || null)

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
        errorMessage.value = error?.message || 'No se pudo consultar la disponibilidad.'
    } finally {
        loading.value = false
    }
}

const availabilityStatus = computed(() => {
    if (!availability.value)
        return null
    return availability.value.available ? 'Disponible' : 'No disponible'
})

onMounted(() => {
    fetchCabins()
})
</script>

<template>
    <div class="booking-widget-page">
        <div class="booking-widget-shell">
            <VRow class="booking-widget-grid" align="stretch">
                <VCol>
                    <VCard class="h-100" elevation="2">
                        <VCardText class="pt-0">
                            <VRow class="gy-4">

                                <VCol cols="12" v-if="!selectedCabinId">
                                    <VAlert border="start" color="warning" variant="tonal">
                                        No se encontró <strong>cabin_id</strong> en la URL. Añade
                                        <code>?cabin_id=6</code> al final.
                                    </VAlert>
                                </VCol>

                                <VCol cols="12" md="6">
                                    <AppDateTimePicker v-model="startDate" label="Check-in" placeholder="YYYY-MM-DD"
                                        :config="startPickerConfig" />
                                </VCol>
                                <VCol cols="12" md="6">
                                    <AppDateTimePicker v-model="endDate" label="Check-out" placeholder="YYYY-MM-DD"
                                        :config="endPickerConfig" />
                                </VCol>

                                <VCol cols="12" md="6">
                                    <VTextField v-model.number="adults" type="number" min="1" label="Adultos"
                                        hint="Mínimo 1 adulto" persistent-hint />
                                </VCol>
                                <VCol cols="12" md="6">
                                    <VTextField v-model.number="children" type="number" min="0" label="Niños"
                                        hint="0 si no hay" persistent-hint />
                                </VCol>

                                <VCol cols="12" class="d-flex flex-column gap-3">
                                    <VBtn color="primary" variant="elevated" :loading="loading"
                                        :disabled="!canCheck || loading" @click="handleCheckAvailability">
                                        Consultar disponibilidad
                                    </VBtn>
                                    <div class="text-body-2 text-medium-emphasis">
                                        El precio total se calcula por noche usando la API de disponibilidad.
                                    </div>
                                </VCol>

                                <VCol cols="12">
                                    <VCard class="availability-summary pa-4" variant="tonal">
                                        <div class="d-flex flex-wrap gap-4 align-center justify-space-between">
                                            <div>
                                                <div class="text-caption text-medium-emphasis">Resumen de reserva</div>
                                                <div class="text-h6 font-weight-bold">
                                                    {{ selectedCabin?.name || (selectedCabinId ? `Cabaña
                                                    #${selectedCabinId}` : 'Cabaña no seleccionada') }}
                                                </div>
                                            </div>
                                            <div class="d-flex gap-2 flex-wrap align-center">
                                                <VChip v-if="availabilityStatus"
                                                    :color="availability.value.available ? 'success' : 'error'"
                                                    size="small" label>
                                                    {{ availabilityStatus }}
                                                </VChip>
                                                <VChip color="secondary" size="small" label>
                                                    {{ adults }} adulto<span v-if="children > 0"> + {{ children }}
                                                        niño<span v-if="children !== 1">s</span></span>
                                                </VChip>
                                            </div>
                                        </div>

                                        <div class="d-flex flex-wrap gap-4 mt-4">
                                            <div class="summary-card">
                                                <div class="text-caption text-medium-emphasis">Check-in</div>
                                                <div class="text-body-1 font-weight-semibold">{{ startDate || '—' }}
                                                </div>
                                            </div>
                                            <div class="summary-card">
                                                <div class="text-caption text-medium-emphasis">Check-out</div>
                                                <div class="text-body-1 font-weight-semibold">{{ endDate || '—' }}</div>
                                            </div>
                                            <div class="summary-card">
                                                <div class="text-caption text-medium-emphasis">Noches</div>
                                                <div class="text-body-1 font-weight-semibold">{{ totalNights || '—' }}
                                                </div>
                                            </div>
                                            <div class="summary-card">
                                                <div class="text-caption text-medium-emphasis">Precio estimado</div>
                                                <div class="text-body-1 font-weight-semibold">
                                                    {{ availability?.total_price ?
                                                        formatCurrency(availability.total_price) : '—' }}
                                                </div>
                                            </div>
                                        </div>
                                    </VCard>
                                </VCol>

                                <VCol cols="12" v-if="availability && availability.available" class="text-success">
                                    <VAlert border="start" color="success" variant="tonal">
                                        ¡La cabaña está disponible! Total: {{ formatCurrency(availability.total_price)
                                        }} por {{ availability.total_days }} noche<span
                                            v-if="availability.total_days !== 1">s</span>.
                                    </VAlert>
                                </VCol>
                                <VCol cols="12" v-else-if="availability && availability.available === false"
                                    class="text-error">
                                    <VAlert border="start" color="error" variant="tonal">
                                        Esta cabaña no está disponible en las fechas seleccionadas. Prueba con otras
                                        fechas o cabañas.
                                    </VAlert>
                                </VCol>
                                <VCol cols="12" v-if="errorMessage">
                                    <VAlert border="start" color="error" variant="tonal">
                                        {{ errorMessage }}
                                    </VAlert>
                                </VCol>
                            </VRow>
                        </VCardText>
                    </VCard>
                </VCol>
            </VRow>
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

.booking-widget-grid {
    width: 100%;
    gap: 1.5rem;
}

:deep(.v-card),
:deep(.availability-summary) {
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

.summary-card {
    min-width: 9rem;
}

.panel-value {
    margin-bottom: 1.25rem;
    padding: 1rem;
    border-radius: 0.75rem;
    background: rgba(var(--v-theme-primary), 0.08);
}

.panel-card {
    padding: 1rem;
    border-radius: 1rem;
}

.panel-card-title {
    font-weight: 600;
    margin-bottom: 0.75rem;
}

.iframe-code {
    margin: 0;
    padding: 1rem;
    border-radius: 0.75rem;
    background: rgba(var(--v-theme-surface), 0.95);
    overflow-x: auto;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
}

.panel-list {
    margin: 0.5rem 0 0;
    padding-left: 1.1rem;
}

.panel-list li {
    margin-bottom: 0.5rem;
}
</style>
