<script setup>
import VueApexCharts from 'vue3-apexcharts'
import { useTheme } from 'vuetify'

const vuetifyTheme = useTheme()

const reservations = ref([])
const cabins = ref([])
const users = ref([])
const isLoading = ref(true)

// ── Computed stats ──────────────────────────────────────────────────────────

const totalRevenue = computed(() =>
  reservations.value.reduce((sum, r) => sum + Number(r.total_price || 0), 0),
)

const reservationsByStatus = computed(() => ({
  confirmed: reservations.value.filter(r => r.status === 'confirmed').length,
  pending: reservations.value.filter(r => r.status === 'pending').length,
  cancelled: reservations.value.filter(r => r.status === 'cancelled').length,
  completed: reservations.value.filter(r => r.status === 'completed').length,
}))

const cabinsByStatus = computed(() => ({
  available: cabins.value.filter(c => c.status === 'available').length,
  maintenance: cabins.value.filter(c => c.status === 'maintenance').length,
  unavailable: cabins.value.filter(c => c.status === 'unavailable').length,
}))

const totalGuests = computed(() =>
  reservations.value.reduce((sum, r) => sum + (r.guests?.length || 0), 0),
)

const recentReservations = computed(() =>
  [...reservations.value]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 6),
)

// ── Monthly bar chart data (last 6 months) ──────────────────────────────────

const monthlyData = computed(() => {
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date()

    d.setDate(1)
    d.setMonth(d.getMonth() - (5 - i))

    return { label: d.toLocaleString('default', { month: 'short' }), count: 0 }
  })

  reservations.value.forEach(r => {
    const date = new Date(r.created_at)
    const now = new Date()
    const diffMonths = (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth())

    if (diffMonths >= 0 && diffMonths < 6)
      months[5 - diffMonths].count++
  })

  return months
})

// ── ApexCharts configs ──────────────────────────────────────────────────────

const isDark = computed(() => vuetifyTheme.current.value.dark)
const textColor = computed(() => isDark.value ? '#E7E3FC99' : '#3A355199')
const gridColor = computed(() => isDark.value ? 'rgba(231,227,252,0.08)' : 'rgba(58,53,81,0.08)')

const barChartOptions = computed(() => ({
  chart: { type: 'bar', toolbar: { show: false }, parentHeightOffset: 0 },
  colors: ['#7367F0'],
  plotOptions: { bar: { borderRadius: 6, columnWidth: '45%', distributed: false } },
  dataLabels: { enabled: false },
  grid: { borderColor: gridColor.value, strokeDashArray: 4, yaxis: { lines: { show: true } } },
  xaxis: {
    categories: monthlyData.value.map(m => m.label),
    axisBorder: { show: false },
    axisTicks: { show: false },
    labels: { style: { colors: textColor.value, fontSize: '13px' } },
  },
  yaxis: {
    labels: {
      style: { colors: textColor.value, fontSize: '13px' },
      formatter: val => Math.round(val),
    },
  },
  tooltip: { theme: isDark.value ? 'dark' : 'light' },
}))

const barChartSeries = computed(() => [{ name: 'Reservations', data: monthlyData.value.map(m => m.count) }])

const donutOptions = computed(() => ({
  chart: { type: 'donut', parentHeightOffset: 0 },
  labels: ['Confirmed', 'Pending', 'Cancelled', 'Completed'],
  colors: ['#56CA00', '#FFB400', '#FF4C51', '#16B1FF'],
  legend: {
    position: 'bottom',
    fontSize: '13px',
    labels: { colors: textColor.value },
    markers: { offsetX: -2 },
  },
  plotOptions: {
    pie: {
      donut: {
        size: '72%',
        labels: {
          show: true,
          total: {
            show: true,
            label: 'Total',
            color: textColor.value,
            fontSize: '14px',
            formatter: () => String(reservations.value.length),
          },
          value: { color: isDark.value ? '#E7E3FC' : '#3A3551', fontSize: '22px', fontWeight: 600 },
        },
      },
    },
  },
  dataLabels: { enabled: false },
  stroke: { width: 0 },
  tooltip: { theme: isDark.value ? 'dark' : 'light' },
}))

const donutSeries = computed(() => [
  reservationsByStatus.value.confirmed,
  reservationsByStatus.value.pending,
  reservationsByStatus.value.cancelled,
  reservationsByStatus.value.completed,
])

// ── Helpers ─────────────────────────────────────────────────────────────────

const formatCurrency = amount =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(amount || 0))

const formatDate = v => v ? new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'

const getStatusColor = status => ({ confirmed: 'success', pending: 'warning', cancelled: 'error', completed: 'info' }[status] || 'secondary')
const getCabinStatusColor = status => ({ available: 'success', maintenance: 'warning', unavailable: 'error' }[status] || 'secondary')

// ── Fetch ────────────────────────────────────────────────────────────────────

const fetchAll = async () => {
  isLoading.value = true
  try {
    const [resData, cabData, usrData] = await Promise.all([
      $api('/reservations'),
      $api('/cabins'),
      $api('/users'),
    ])

    reservations.value = Array.isArray(resData) ? resData : resData?.reservations || []
    cabins.value = Array.isArray(cabData) ? cabData : cabData?.cabins || []
    users.value = Array.isArray(usrData) ? usrData : usrData?.users || []
  } catch {
    // silent — individual sections show empty states
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchAll)
</script>

<template>
  <div>
    <!-- ── Page header ─────────────────────────────────────── -->
    <div class="d-flex align-center justify-space-between flex-wrap gap-4 mb-6">
      <div>
        <h4 class="text-h4 font-weight-bold">Dashboard</h4>
        <p class="text-body-2 text-medium-emphasis mb-0">
          Overview of reservations, cabins, revenue, and activity.
        </p>
      </div>
      <VBtn
        variant="tonal"
        color="primary"
        prepend-icon="tabler-refresh"
        :loading="isLoading"
        @click="fetchAll"
      >
        Refresh
      </VBtn>
    </div>

    <!-- ── Metric cards ───────────────────────────────────── -->
    <VRow class="mb-6">
      <VCol cols="12" sm="6" lg="3">
        <VCard>
          <VCardText>
            <div class="d-flex align-center justify-space-between">
              <div>
                <p class="text-caption text-medium-emphasis mb-1 text-uppercase font-weight-medium">
                  Total Revenue
                </p>
                <h5 class="text-h5 font-weight-bold mb-1">
                  <VSkeletonLoader v-if="isLoading" type="text" width="100" />
                  <template v-else>{{ formatCurrency(totalRevenue) }}</template>
                </h5>
                <p class="text-caption text-medium-emphasis mb-0">
                  From {{ reservations.length }} reservations
                </p>
              </div>
              <VAvatar color="success" variant="tonal" size="54" rounded="lg">
                <VIcon icon="tabler-currency-dollar" size="30" />
              </VAvatar>
            </div>
          </VCardText>
        </VCard>
      </VCol>

      <VCol cols="12" sm="6" lg="3">
        <VCard>
          <VCardText>
            <div class="d-flex align-center justify-space-between">
              <div>
                <p class="text-caption text-medium-emphasis mb-1 text-uppercase font-weight-medium">
                  Reservations
                </p>
                <h5 class="text-h5 font-weight-bold mb-1">
                  <VSkeletonLoader v-if="isLoading" type="text" width="60" />
                  <template v-else>{{ reservations.length }}</template>
                </h5>
                <p class="text-caption mb-0">
                  <span class="text-warning font-weight-medium">{{ reservationsByStatus.pending }} pending</span>
                  &nbsp;·&nbsp;
                  <span class="text-success">{{ reservationsByStatus.confirmed }} confirmed</span>
                </p>
              </div>
              <VAvatar color="primary" variant="tonal" size="54" rounded="lg">
                <VIcon icon="tabler-calendar-check" size="30" />
              </VAvatar>
            </div>
          </VCardText>
        </VCard>
      </VCol>

      <VCol cols="12" sm="6" lg="3">
        <VCard>
          <VCardText>
            <div class="d-flex align-center justify-space-between">
              <div>
                <p class="text-caption text-medium-emphasis mb-1 text-uppercase font-weight-medium">
                  Cabins
                </p>
                <h5 class="text-h5 font-weight-bold mb-1">
                  <VSkeletonLoader v-if="isLoading" type="text" width="60" />
                  <template v-else>{{ cabins.length }}</template>
                </h5>
                <p class="text-caption mb-0">
                  <span class="text-success font-weight-medium">{{ cabinsByStatus.available }} available</span>
                  &nbsp;·&nbsp;
                  <span class="text-warning">{{ cabinsByStatus.maintenance }} in maintenance</span>
                </p>
              </div>
              <VAvatar color="warning" variant="tonal" size="54" rounded="lg">
                <VIcon icon="tabler-home" size="30" />
              </VAvatar>
            </div>
          </VCardText>
        </VCard>
      </VCol>

      <VCol cols="12" sm="6" lg="3">
        <VCard>
          <VCardText>
            <div class="d-flex align-center justify-space-between">
              <div>
                <p class="text-caption text-medium-emphasis mb-1 text-uppercase font-weight-medium">
                  Guests
                </p>
                <h5 class="text-h5 font-weight-bold mb-1">
                  <VSkeletonLoader v-if="isLoading" type="text" width="60" />
                  <template v-else>{{ totalGuests }}</template>
                </h5>
                <p class="text-caption text-medium-emphasis mb-0">
                  {{ users.length }} staff members
                </p>
              </div>
              <VAvatar color="info" variant="tonal" size="54" rounded="lg">
                <VIcon icon="tabler-users" size="30" />
              </VAvatar>
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- ── Charts ────────────────────────────────────────── -->
    <VRow class="mb-6">
      <!-- Monthly bar chart -->
      <VCol cols="12" md="8">
        <VCard height="100%">
          <VCardItem class="pb-0">
            <VCardTitle class="text-body-1 font-weight-semibold">Monthly Reservations</VCardTitle>
            <VCardSubtitle>Last 6 months</VCardSubtitle>
          </VCardItem>
          <VCardText class="pt-2">
            <VueApexCharts
              type="bar"
              height="260"
              :options="barChartOptions"
              :series="barChartSeries"
            />
          </VCardText>
        </VCard>
      </VCol>

      <!-- Status donut -->
      <VCol cols="12" md="4">
        <VCard height="100%">
          <VCardItem class="pb-0">
            <VCardTitle class="text-body-1 font-weight-semibold">Reservation Status</VCardTitle>
            <VCardSubtitle>Current breakdown</VCardSubtitle>
          </VCardItem>
          <VCardText class="pt-2">
            <template v-if="!isLoading && reservations.length">
              <VueApexCharts
                type="donut"
                height="260"
                :options="donutOptions"
                :series="donutSeries"
              />
            </template>
            <div
              v-else-if="!isLoading"
              class="d-flex flex-column align-center justify-center text-medium-emphasis"
              style="height: 260px;"
            >
              <VIcon icon="tabler-calendar-off" size="40" class="mb-2 opacity-40" />
              <span class="text-body-2">No reservation data</span>
            </div>
            <div v-else class="d-flex align-center justify-center" style="height: 260px;">
              <VProgressCircular indeterminate color="primary" />
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- ── Bottom row ─────────────────────────────────────── -->
    <VRow>
      <!-- Recent Reservations -->
      <VCol cols="12" lg="8">
        <VCard>
          <VCardItem>
            <VCardTitle class="text-body-1 font-weight-semibold">Recent Reservations</VCardTitle>
            <template #append>
              <RouterLink
                to="/booking"
                class="text-primary text-decoration-none text-body-2 font-weight-medium"
              >
                View all
                <VIcon icon="tabler-arrow-right" size="14" />
              </RouterLink>
            </template>
          </VCardItem>
          <VDivider />

          <!-- Loading skeleton -->
          <template v-if="isLoading">
            <div class="pa-4 d-flex flex-column gap-3">
              <VSkeletonLoader v-for="i in 5" :key="i" type="list-item-two-line" />
            </div>
          </template>

          <VTable v-else density="comfortable" class="text-no-wrap">
            <thead>
              <tr>
                <th class="text-caption text-uppercase">#</th>
                <th class="text-caption text-uppercase">Cabin</th>
                <th class="text-caption text-uppercase">Guests</th>
                <th class="text-caption text-uppercase">Check-in</th>
                <th class="text-caption text-uppercase">Total</th>
                <th class="text-caption text-uppercase">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="recentReservations.length === 0">
                <td colspan="6" class="text-center py-8 text-medium-emphasis">
                  <VIcon icon="tabler-calendar-off" size="32" class="d-block mx-auto mb-2 opacity-40" />
                  No reservations found
                </td>
              </tr>
              <tr v-for="r in recentReservations" :key="r.id">
                <td>
                  <span class="font-weight-semibold text-primary">#{{ r.id }}</span>
                </td>
                <td>
                  <div class="font-weight-medium text-body-2">{{ r.cabin?.name || '—' }}</div>
                  <div class="text-caption text-medium-emphasis">
                    {{ formatDate(r.created_at) }}
                  </div>
                </td>
                <td>
                  <div class="d-flex align-center gap-1">
                    <VIcon icon="tabler-users" size="14" class="text-medium-emphasis" />
                    <span class="text-body-2">{{ r.guests?.length || 0 }}</span>
                  </div>
                </td>
                <td class="text-body-2">{{ formatDate(r.start || r.start_date) }}</td>
                <td class="text-body-2 font-weight-medium">{{ formatCurrency(r.total_price) }}</td>
                <td>
                  <VChip :color="getStatusColor(r.status)" size="x-small" label class="text-capitalize">
                    {{ r.status || 'unknown' }}
                  </VChip>
                </td>
              </tr>
            </tbody>
          </VTable>
        </VCard>
      </VCol>

      <!-- Cabin Overview -->
      <VCol cols="12" lg="4">
        <VCard height="100%">
          <VCardItem>
            <VCardTitle class="text-body-1 font-weight-semibold">Cabin Overview</VCardTitle>
            <template #append>
              <RouterLink
                to="/cabins"
                class="text-primary text-decoration-none text-body-2 font-weight-medium"
              >
                View all
                <VIcon icon="tabler-arrow-right" size="14" />
              </RouterLink>
            </template>
          </VCardItem>
          <VDivider />

          <!-- Status summary pills -->
          <VCardText class="pb-2">
            <div class="d-flex gap-3">
              <div
                class="flex-1 text-center pa-3 rounded-lg"
                style="background: rgba(var(--v-theme-success), 0.1);"
              >
                <p class="text-h6 font-weight-bold text-success mb-0">
                  <VSkeletonLoader v-if="isLoading" type="text" class="mx-auto" width="30" />
                  <template v-else>{{ cabinsByStatus.available }}</template>
                </p>
                <p class="text-caption mb-0">Available</p>
              </div>
              <div
                class="flex-1 text-center pa-3 rounded-lg"
                style="background: rgba(var(--v-theme-warning), 0.1);"
              >
                <p class="text-h6 font-weight-bold text-warning mb-0">
                  <VSkeletonLoader v-if="isLoading" type="text" class="mx-auto" width="30" />
                  <template v-else>{{ cabinsByStatus.maintenance }}</template>
                </p>
                <p class="text-caption mb-0">Maintenance</p>
              </div>
              <div
                class="flex-1 text-center pa-3 rounded-lg"
                style="background: rgba(var(--v-theme-error), 0.1);"
              >
                <p class="text-h6 font-weight-bold text-error mb-0">
                  <VSkeletonLoader v-if="isLoading" type="text" class="mx-auto" width="30" />
                  <template v-else>{{ cabinsByStatus.unavailable }}</template>
                </p>
                <p class="text-caption mb-0">Unavailable</p>
              </div>
            </div>
          </VCardText>

          <VDivider />

          <!-- Cabin list -->
          <template v-if="isLoading">
            <div class="pa-3 d-flex flex-column gap-2">
              <VSkeletonLoader v-for="i in 5" :key="i" type="list-item-avatar" />
            </div>
          </template>

          <VList v-else density="compact" class="pa-0">
            <template v-if="cabins.length === 0">
              <VListItem>
                <VListItemTitle class="text-center text-medium-emphasis text-body-2 py-4">
                  No cabins found
                </VListItemTitle>
              </VListItem>
            </template>

            <VListItem
              v-for="cabin in cabins.slice(0, 7)"
              :key="cabin.id"
              class="px-4"
            >
              <template #prepend>
                <VAvatar
                  :color="getCabinStatusColor(cabin.status)"
                  variant="tonal"
                  size="36"
                  rounded="lg"
                  class="me-1"
                >
                  <VIcon icon="tabler-home" size="18" />
                </VAvatar>
              </template>

              <VListItemTitle class="text-body-2 font-weight-medium">
                {{ cabin.name }}
              </VListItemTitle>
              <VListItemSubtitle class="text-caption">
                ${{ cabin.price_per_night }}/night · {{ cabin.capacity }} guests
              </VListItemSubtitle>

              <template #append>
                <VChip
                  :color="getCabinStatusColor(cabin.status)"
                  size="x-small"
                  label
                  class="text-capitalize"
                >
                  {{ cabin.status }}
                </VChip>
              </template>
            </VListItem>
          </VList>
        </VCard>
      </VCol>
    </VRow>
  </div>
</template>
