<template>
  <div class="booking-page">
    <VCard class="border-0 shadow-none">
      <VCardText class="pb-2">
        <div class="d-flex flex-wrap justify-space-between align-center gap-4">
          <div>
            <div class="text-h4 font-weight-bold">Reservations</div>
            <div class="text-body-2 text-medium-emphasis">
              Review upcoming stays, reservation status, and guest count in one place.
            </div>
          </div>

          <div class="d-flex gap-3 align-center flex-wrap">
            <VBtn color="primary" prepend-icon="ri-add-line" @click="isAddReservationDialogVisible = true">
              Create Reservation
            </VBtn>
            <VBtn color="primary" prepend-icon="ri-refresh-line" @click="list">
              refresh
            </VBtn>
          </div>
        </div>
      </VCardText>

      <VCardText class="pt-0">
        <VRow class="mb-2">
          <VCol cols="12" md="4">
            <VCard variant="tonal" color="primary">
              <VCardText>
                <div class="text-caption text-medium-emphasis">Total reservations</div>
                <div class="text-h4 font-weight-bold mt-1">{{ data.length }}</div>
              </VCardText>
            </VCard>
          </VCol>
          <VCol cols="12" md="4">
            <VCard variant="tonal" color="success">
              <VCardText>
                <div class="text-caption text-medium-emphasis">Confirmed</div>
                <div class="text-h4 font-weight-bold mt-1">{{ confirmedReservations }}</div>
              </VCardText>
            </VCard>
          </VCol>
          <VCol cols="12" md="4">
            <VCard variant="tonal" color="warning">
              <VCardText>
                <div class="text-caption text-medium-emphasis">Pending</div>
                <div class="text-h4 font-weight-bold mt-1">{{ pendingReservations }}</div>
              </VCardText>
            </VCard>
          </VCol>
        </VRow>

        <VCard variant="outlined">
          <VCardText class="d-flex flex-wrap align-center justify-space-between gap-3 pb-2">
            <div>
              <div class="text-subtitle-1 font-weight-medium">Reservation list</div>
              <div class="text-caption text-medium-emphasis">Filter by arrival date, status, or creation time.</div>
            </div>
            <VBtnToggle v-model="listView" class="reservation-filter-toggle d-none d-md-flex" color="primary"
              density="comfortable" mandatory>
              <VBtn value="all" prepend-icon="ri-list-check">All</VBtn>
              <VBtn value="recent" prepend-icon="ri-time-line">Recently created</VBtn>
              <VBtn value="upcoming" prepend-icon="ri-calendar-event-line">Upcoming</VBtn>
              <VBtn value="active" prepend-icon="ri-checkbox-circle-line">Active</VBtn>
              <VBtn value="cancelled" prepend-icon="ri-close-circle-line">Cancelled</VBtn>
            </VBtnToggle>
            <VSelect v-model="listView" class="d-flex d-md-none reservation-filter-select" :items="listViewItems"
              label="Show reservations" density="comfortable" hide-details />
          </VCardText>
          <VCardText class="pt-2">
            <VTextField v-model="searchQuery" label="Search reservations"
              placeholder="Booking code, guest name, or cabin" prepend-inner-icon="ri-search-line"
              density="comfortable" clearable hide-details />
          </VCardText>
          <VDataTable :headers="headers" :items="visibleReservations" :items-per-page="8" class="text-no-wrap" :loading="loading"
            no-data-text="No reservations match the selected filters.">
            <template #item.public_code="{ item }">
              <div class="font-weight-bold text-primary">{{ item.public_code || '—' }}</div>
            </template>

            <template #item.cabin="{ item }">
              <div class="font-weight-medium">{{ item.cabin?.name || 'No cabin assigned' }}</div>
            </template>

            <template #item.full_name="{ item }">
              <div>
                <div class="font-weight-medium">{{ getGuestName(item) }}</div>
                <div class="text-body-2 text-medium-emphasis">
                  {{ item.guest_number ?? item.guests?.length ?? 0 }} guest<span v-if="(item.guest_number ?? item.guests?.length ?? 0) !== 1">s</span>
                </div>
              </div>
            </template>

            <template #item.stay_dates="{ item }">
              {{ formatStayDates(item) }}
            </template>

            <template #item.total_price="{ item }">
              {{ formatCurrency(item.total_price) }}
            </template>

            <template #item.status="{ item }">
              <VChip :color="getStatusColor(item.status)" size="small" label class="text-capitalize">
                {{ item.status || 'unknown' }}
              </VChip>
            </template>

            <template #item.payment_status="{ item }">
              <VChip v-if="paymentsMap[item.id]" :color="getPaymentStatusColor(paymentsMap[item.id].status)"
                size="small" label class="text-capitalize">
                <VIcon :icon="getPaymentStatusIcon(paymentsMap[item.id].status)" size="14" class="me-1" />
                {{ paymentsMap[item.id].status }}
              </VChip>
              <span v-else class="text-caption text-medium-emphasis">—</span>
            </template>

            <template #item.actions="{ item }">
              <div class="d-flex justify-end gap-1">
                <VBtn icon variant="text" size="small" color="secondary" @click="openDetail(item)">
                  <VIcon icon="ri-eye-line" size="18" />
                  <VTooltip activator="parent">View details</VTooltip>
                </VBtn>
                <VBtn icon variant="text" size="small" color="primary" :disabled="item.status === 'cancelled'" @click="openEdit(item)">
                  <VIcon icon="ri-pencil-line" size="18" />
                  <VTooltip activator="parent">Edit</VTooltip>
                </VBtn>
              </div>
            </template>
          </VDataTable>
        </VCard>
      </VCardText>

      <AddReservation v-model:isDialogVisible="isAddReservationDialogVisible" />
      <EditReservation v-model:isDialogVisible="isEditReservationDialogVisible" :reservation="selectedReservation"
        @reservation-updated="list" />
      <ReservationDetail v-model:isDialogVisible="isDetailDialogVisible" :reservation="selectedReservation"
        :payment="selectedReservation ? paymentsMap[selectedReservation.id] : null" />
    </VCard>
  </div>
</template>

<script setup>
import AddReservation from '@/components/booking/AddReservation.vue'
import EditReservation from '@/components/booking/EditReservation.vue'
import ReservationDetail from '@/components/booking/ReservationDetail.vue'
import { computed, onMounted, ref, watch } from 'vue'

const headers = [
  { title: 'Booking', key: 'public_code' },
  { title: 'Cabin', key: 'cabin', value: 'cabin.name' },
  { title: 'Guest', key: 'full_name', value: item => getGuestName(item) },
  { title: 'Stay dates', key: 'stay_dates', value: item => reservationStart(item) },
  { title: 'Total', key: 'total_price' },
  { title: 'Status', key: 'status' },
  { title: 'Payment', key: 'payment_status' },
  { title: 'Actions', key: 'actions', align: 'end', sortable: false },
]

const searchQuery = ref('')
const listView = ref('all')
const listViewItems = [
  { title: 'All except cancelled', value: 'all' },
  { title: 'Recently created', value: 'recent' },
  { title: 'Upcoming arrivals', value: 'upcoming' },
  { title: 'Active reservations', value: 'active' },
  { title: 'Cancelled reservations', value: 'cancelled' },
]
const isAddReservationDialogVisible = ref(false)
const isEditReservationDialogVisible = ref(false)
const isDetailDialogVisible = ref(false)
const data = ref([])
const paymentsMap = ref({})
const selectedReservation = ref(null)
const loading = ref(false)
const confirmedReservations = computed(() => data.value.filter(item => item.status === 'confirmed').length)
const pendingReservations = computed(() => data.value.filter(item => item.status === 'pending').length)
const activeStatuses = ['pending', 'confirmed']
const reservationStart = item => new Date(item.start_date || item.start).getTime()
const normalizeSearch = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
const searchedReservations = computed(() => {
  const query = normalizeSearch(searchQuery.value)
  if (!query) return data.value

  return data.value.filter(item => [
    item.public_code,
    getGuestName(item),
    item.cabin?.name,
  ].some(value => normalizeSearch(value).includes(query)))
})
const visibleReservations = computed(() => {
  if (listView.value === 'cancelled')
    return searchedReservations.value.filter(item => item.status === 'cancelled')

  const reservations = searchedReservations.value.filter(item => item.status !== 'cancelled')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayTime = today.getTime()
  const active = reservations.filter(item => activeStatuses.includes(item.status))

  if (listView.value === 'recent')
    return [...reservations].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))

  if (listView.value === 'upcoming')
    return active.filter(item => reservationStart(item) >= todayTime).sort((a, b) => reservationStart(a) - reservationStart(b))

  if (listView.value === 'active')
    return [...active].sort((a, b) => reservationStart(a) - reservationStart(b))

  return reservations
})

const getPaymentStatusColor = status => ({
  paid: 'success',
  pending: 'warning',
  failed: 'error',
  refunded: 'info',
}[status] || 'secondary')

const getPaymentStatusIcon = status => ({
  paid: 'ri-checkbox-circle-line',
  pending: 'ri-time-line',
  failed: 'ri-close-circle-line',
  refunded: 'ri-refund-2-line',
}[status] || 'ri-bank-card-line')


const getGuestName = item => item.full_name || item.guests?.[0]?.full_name || item.guests?.[0]?.name || '—'

const formatStayDates = item => {
  // Treat stay dates as calendar days, avoiding timezone shifts for YYYY-MM-DD.
  const parseDate = value => value ? new Date(`${String(value).slice(0, 10)}T00:00:00`) : null
  const start = parseDate(item.start_date || item.start)
  const end = parseDate(item.end_date || item.end)
  const validStart = start && !Number.isNaN(start.getTime())
  const validEnd = end && !Number.isNaN(end.getTime())
  const format = (date, includeYear = true) => date.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', ...(includeYear ? { year: 'numeric' } : {}),
  })

  if (!validStart || !validEnd)
    return `${validStart ? format(start) : '—'} – ${validEnd ? format(end) : '—'}`

  return `${format(start, start.getFullYear() !== end.getFullYear())} – ${format(end)}`
}
const formatCurrency = amount => {
  const parsedAmount = Number(amount || 0)

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: Number.isInteger(parsedAmount) ? 0 : 2,
  }).format(parsedAmount)
}

const getStatusColor = status => {
  const colorMap = {
    confirmed: 'success',
    pending: 'warning',
    cancelled: 'error',
    completed: 'info',
  }

  return colorMap[status] || 'secondary'
}

const list = async () => {
  loading.value = true

  const [resp, payments] = await Promise.all([
    $api('/reservations', {
      method: 'GET',
      onResponseError: ({ response }) => { throw new Error(response.statusText || 'Failed to load reservations') },
    }),
    $api('/payments', { method: 'GET' }).catch(() => []),
  ])

  data.value = Array.isArray(resp) ? resp : resp?.reservations || []

  const list = Array.isArray(payments) ? payments : payments?.data || []
  paymentsMap.value = Object.fromEntries(list.map(p => [p.reservation_id, p]))

  loading.value = false
}

const openEdit = item => {
  if (item.status === 'cancelled')
    return

  selectedReservation.value = item
  isEditReservationDialogVisible.value = true
}

const openDetail = item => {
  selectedReservation.value = item
  isDetailDialogVisible.value = true
}

onMounted(() => {
  list()
})

watch(isAddReservationDialogVisible, visible => {
  if (!visible)
    list()
})

watch(isEditReservationDialogVisible, visible => {
  if (!visible)
    list()
})


</script>

<style scoped>
.reservation-filter-toggle.v-btn-group {
  flex: 0 1 auto;
  flex-wrap: wrap;
  gap: 4px;
  block-size: auto;
  height: auto;
  max-inline-size: 100%;
}

.reservation-filter-toggle.v-btn-group :deep(.v-btn) {
  flex: 0 0 auto;
  /* The theme sizes toggle buttons as squares for icon-only controls. */
  inline-size: auto !important;
  padding-inline: 16px;
}

.reservation-filter-select {
  flex: 1 1 100%;
  min-inline-size: 220px;
  max-inline-size: 100%;
}

@media (min-width: 960px) {
  .reservation-filter-select {
    display: none !important;
  }
}
</style>
