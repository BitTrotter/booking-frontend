<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import AddReservation from '@/components/booking/AddReservation.vue'

const reservations = ref([])
const cabins = ref([])
const isLoading = ref(true)
const isAddReservationDialogVisible = ref(false)
const initialReservation = ref(null)

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
  reservations.value.reduce((sum, r) => sum + Number(r.guest_number ?? r.guests?.length ?? 0), 0),
)

const recentReservations = computed(() =>
  reservations.value.filter(r => r.status !== 'cancelled')
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 6),
)

const formatCurrency = amount =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(amount || 0))

const formatDate = v => v ? new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'

const getStatusColor = status => ({ confirmed: 'success', pending: 'warning', cancelled: 'error', completed: 'info' }[status] || 'secondary')
const getCabinStatusColor = status => ({ available: 'success', maintenance: 'warning', unavailable: 'error' }[status] || 'secondary')

const avail = reactive({
  cabinId: null,
  startDate: '',
  endDate: '',
  isLoading: false,
  result: null,
  error: '',
})

let availabilityRequestId = 0

const stayDateRange = computed({
  get: () => [avail.startDate, avail.endDate].filter(Boolean).join(' to '),
  set: value => {
    const [checkIn = '', checkOut = ''] = String(value || '').split(' to ')
    avail.startDate = checkIn
    avail.endDate = checkOut
  },
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

watch(() => [avail.cabinId, avail.startDate, avail.endDate], () => {
  availabilityRequestId++
  avail.result = null
  avail.error = ''
  avail.isLoading = false
}, { flush: 'sync' })

const selectedCabinForAvail = computed(() =>
  cabins.value.find(c => c.id === avail.cabinId) || null,
)

const canCheckAvailability = computed(() => Boolean(
  avail.cabinId && avail.startDate && avail.endDate
  && new Date(avail.endDate) > new Date(avail.startDate),
))

const checkAvailability = async () => {
  if (!canCheckAvailability.value) return

  const requestId = ++availabilityRequestId
  avail.isLoading = true
  avail.result = null
  avail.error = ''
  try {
    const query = new URLSearchParams({
      cabin_id: String(avail.cabinId),
      start_date: avail.startDate,
      end_date: avail.endDate,
    })
    const resp = await $api(`/public/reservations/availability?${query}`)
    if (requestId === availabilityRequestId)
      avail.result = resp?.data ?? resp
  } catch (e) {
    if (requestId === availabilityRequestId)
      avail.error = e.message || 'Failed to check availability.'
  } finally {
    if (requestId === availabilityRequestId)
      avail.isLoading = false
  }
}

const resetAvailability = () => {
  avail.cabinId = null
  avail.startDate = ''
  avail.endDate = ''
  avail.result = null
  avail.error = ''
}

const fetchAll = async () => {
  isLoading.value = true
  try {
    const [resData, cabData] = await Promise.all([
      $api('/reservations'),
      $api('/cabins'),
    ])

    reservations.value = Array.isArray(resData) ? resData : resData?.reservations || []
    cabins.value = Array.isArray(cabData) ? cabData : cabData?.cabins || []
  } catch {
    // silent — individual sections show empty states
  } finally {
    isLoading.value = false
  }
}

const openReservation = () => {
  if (!canCheckAvailability.value || !avail.result?.available) return

  initialReservation.value = {
    cabin_id: avail.cabinId,
    start_date: avail.startDate,
    end_date: avail.endDate,
  }
  isAddReservationDialogVisible.value = true
}

const onReservationCreated = () => {
  availabilityRequestId++
  avail.result = null
  avail.error = ''
  avail.isLoading = false
  fetchAll()
}

onMounted(fetchAll)
</script>

<template>
  <div>

    <div class="d-flex align-center justify-space-between flex-wrap gap-4 mb-6">
      <div>
        <h4 class="text-h4 font-weight-bold">Dashboard</h4>
        <p class="text-body-2 text-medium-emphasis mb-0">
          Manage reservations, review cabins, and check availability.
        </p>
      </div>
      <VBtn variant="tonal" color="primary" prepend-icon="ri-refresh-line" :loading="isLoading" @click="fetchAll">
        Refresh
      </VBtn>
    </div>

    <VRow class="mb-6">

      <VCol cols="12" md="4">
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
                <VIcon icon="ri-calendar-check-line" size="30" />
              </VAvatar>
            </div>
          </VCardText>
        </VCard>
      </VCol>

      <VCol cols="12" md="4">
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
                <VIcon icon="ri-home-line" size="30" />
              </VAvatar>
            </div>
          </VCardText>
        </VCard>
      </VCol>

      <VCol cols="12" md="4">
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
                  Across all reservations
                </p>
              </div>
              <VAvatar color="info" variant="tonal" size="54" rounded="lg">
                <VIcon icon="ri-user-line" size="30" />
              </VAvatar>
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <VRow class="mb-6">

      <VCol cols="12">
        <VCard height="100%">
          <VCardItem class="pb-2">
            <VCardTitle class="d-flex align-center gap-2 text-body-1 font-weight-semibold">
              <VIcon icon="ri-calendar-check-line" color="primary" size="20" />
              Check Cabin Availability
            </VCardTitle>
            <VCardSubtitle>Verify if a cabin is free for your desired dates</VCardSubtitle>
          </VCardItem>

          <VDivider />

          <VCardText>
            <VRow align="end" class="mt-1">
              <VCol cols="12" sm="6" lg="3">
                <VSelect v-model="avail.cabinId" :items="cabins" item-title="name" item-value="id" label="Select Cabin"
                  prepend-inner-icon="ri-home-4-line" variant="outlined" density="comfortable" clearable hide-details />
              </VCol>

              <VCol cols="12" sm="6" lg="5">
                <AppDateTimePicker v-model="stayDateRange" :config="stayDatePickerConfig" label="Check-in / check-out"
                  placeholder="Select your stay dates" prepend-inner-icon="ri-calendar-event-line" />
              </VCol>

              <VCol cols="12" lg="4" class="d-flex gap-2">
                <VBtn color="primary" :disabled="!canCheckAvailability" :loading="avail.isLoading" prepend-icon="ri-search-line" class="flex-grow-1"
                  @click="checkAvailability">
                  Check Availability
                </VBtn>
                <VBtn icon="ri-calendar-close-line" variant="tonal" color="primary"
                  :disabled="!avail.cabinId && !avail.startDate && !avail.endDate && !avail.result"
                  @click="resetAvailability" />
              </VCol>
            </VRow>

            <Transition name="avail-fade">
              <div v-if="avail.error" class="mt-4">
                <VAlert type="error" variant="tonal" density="compact" closable @click:close="avail.error = ''">
                  {{ avail.error }}
                </VAlert>
              </div>

              <div v-else-if="avail.result" class="mt-4">
                <VDivider class="mb-4" />
                <div class="d-flex flex-wrap align-center gap-3">
                  <VAlert :type="avail.result.available ? 'success' : 'error'" variant="tonal"
                    :icon="avail.result.available ? 'ri-calendar-check-line' : 'ri-calendar-close-line'"
                    class="flex-grow-1" style="min-width: 200px;">
                    <template #title>
                      {{ avail.result.available ? 'Available!' : 'Not Available' }}
                    </template>
                    <template v-if="avail.result.available">
                      <strong>{{ selectedCabinForAvail?.name }}</strong> is free from
                      <strong>{{ formatDate(avail.result.start_date) }}</strong> to
                      <strong>{{ formatDate(avail.result.end_date) }}</strong>.
                    </template>
                    <template v-else>
                      This cabin is already booked for the selected dates.
                    </template>
                  </VAlert>

                  <template v-if="avail.result.available">
                    <VCard variant="tonal" color="primary" min-width="100">
                      <VCardText class="text-center pa-3">
                        <p class="text-h5 font-weight-bold mb-0">{{ avail.result.total_days }}</p>
                        <p class="text-caption text-medium-emphasis mb-0">nights</p>
                      </VCardText>
                    </VCard>

                    <VCard variant="tonal" color="success" min-width="120">
                      <VCardText class="text-center pa-3">
                        <p class="text-h5 font-weight-bold mb-0">{{ formatCurrency(avail.result.total_price) }}</p>
                        <p class="text-caption text-medium-emphasis mb-0">total price</p>
                      </VCardText>
                    </VCard>

                    <VBtn color="primary" variant="elevated" prepend-icon="ri-calendar-event-line" @click="openReservation"
                      size="small">
                      Reserve
                    </VBtn>
                  </template>
                </div>
              </div>
            </Transition>
          </VCardText>
        </VCard>
      </VCol>

    </VRow>

    <VRow>

      <VCol cols="12" lg="8">
        <VCard>
          <VCardItem>
            <VCardTitle class="text-body-1 font-weight-semibold">Recent Reservations</VCardTitle>
            <template #append>
              <RouterLink to="/booking" class="text-primary text-decoration-none text-body-2 font-weight-medium">
                View all
                <VIcon icon="ri-arrow-right-line" size="14" />
              </RouterLink>
            </template>
          </VCardItem>
          <VDivider />

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
                <th class="text-caption text-uppercase">Check-out</th>
                <th class="text-caption text-uppercase">Total</th>
                <th class="text-caption text-uppercase">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="recentReservations.length === 0">
                <td colspan="7" class="text-center py-8 text-medium-emphasis">
                  <VIcon icon="ri-calendar-close-line" size="32" class="d-block mx-auto mb-2 opacity-40" />
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
                    <VIcon icon="ri-group-line" size="14" class="text-medium-emphasis" />
                    <span class="text-body-2">{{ r.guest_number ?? r.guests?.length ?? 0 }}</span>
                  </div>
                </td>
                <td class="text-body-2">{{ formatDate(r.start || r.start_date) }}</td>
                <td class="text-body-2">{{ formatDate(r.end || r.end_date) }}</td>
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

      <VCol cols="12" lg="4">
        <VCard height="100%">
          <VCardItem>
            <VCardTitle class="text-body-1 font-weight-semibold">Cabin Overview</VCardTitle>
            <template #append>
              <RouterLink to="/cabins" class="text-primary text-decoration-none text-body-2 font-weight-medium">
                View all
                <VIcon icon="ri-arrow-right-line" size="14" />
              </RouterLink>
            </template>
          </VCardItem>
          <VDivider />

          <VCardText class="pb-2">
            <div class="d-flex gap-3">
              <div class="flex-1 text-center pa-3 rounded-lg" style="background: rgba(var(--v-theme-success), 0.1);">
                <p class="text-h6 font-weight-bold text-success mb-0">
                  <VSkeletonLoader v-if="isLoading" type="text" class="mx-auto" width="30" />
                  <template v-else>{{ cabinsByStatus.available }}</template>
                </p>
                <p class="text-caption mb-0">Available</p>
              </div>
              <div class="flex-1 text-center pa-3 rounded-lg" style="background: rgba(var(--v-theme-warning), 0.1);">
                <p class="text-h6 font-weight-bold text-warning mb-0">
                  <VSkeletonLoader v-if="isLoading" type="text" class="mx-auto" width="30" />
                  <template v-else>{{ cabinsByStatus.maintenance }}</template>
                </p>
                <p class="text-caption mb-0">Maintenance</p>
              </div>
              <div class="flex-1 text-center pa-3 rounded-lg" style="background: rgba(var(--v-theme-error), 0.1);">
                <p class="text-h6 font-weight-bold text-error mb-0">
                  <VSkeletonLoader v-if="isLoading" type="text" class="mx-auto" width="30" />
                  <template v-else>{{ cabinsByStatus.unavailable }}</template>
                </p>
                <p class="text-caption mb-0">Unavailable</p>
              </div>
            </div>
          </VCardText>

          <VDivider />

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

            <VListItem v-for="cabin in cabins.slice(0, 7)" :key="cabin.id" class="px-4">
              <template #prepend>
                <VAvatar :color="getCabinStatusColor(cabin.status)" variant="tonal" size="36" rounded="lg" class="me-1">
                  <VIcon icon="ri-home-4-line" size="18" />
                </VAvatar>
              </template>

              <VListItemTitle class="text-body-2 font-weight-medium">
                {{ cabin.name }}
              </VListItemTitle>
              <VListItemSubtitle class="text-caption">
                Desde ${{ cabin.price_per_night }}/noche · {{ cabin.capacity }} guests
              </VListItemSubtitle>

              <template #append>
                <VChip :color="getCabinStatusColor(cabin.status)" size="x-small" label class="text-capitalize">
                  {{ cabin.status }}
                </VChip>
              </template>
            </VListItem>
          </VList>
        </VCard>
      </VCol>
    </VRow>
    <AddReservation v-model:isDialogVisible="isAddReservationDialogVisible" :initial-reservation="initialReservation"
      @reservation-created="onReservationCreated" />
  </div>
</template>

<style scoped>
.avail-fade-enter-active,
.avail-fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.avail-fade-enter-from,
.avail-fade-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
