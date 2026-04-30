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
            <VTextField v-model="searchQuery" placeholder="Search reservation" prepend-inner-icon="ri-search-line"
              density="comfortable" style="inline-size: 280px;" hide-details @update:model-value="list" />

            <VBtn color="primary" prepend-icon="ri-add-line" @click="isAddReservationDialogVisible = true">
              Create Reservation
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
          <VDataTable :headers="headers" :items="data" :items-per-page="8" class="text-no-wrap" :loading="loading">
            <template #item.id="{ item }">
              <div class="font-weight-medium">#{{ item.id }}</div>
            </template>

            <template #item.cabin="{ item }">
              <div>
                <div class="font-weight-medium">{{ item.cabin?.name || 'No cabin assigned' }}</div>
                <div class="text-body-2 text-medium-emphasis">
                  {{ item.guests?.length || 0 }} guest<span v-if="(item.guests?.length || 0) !== 1">s</span>
                </div>
              </div>
            </template>

            <template #item.start="{ item }">
              {{ formatDate(item.start || item.start_date) }}
            </template>

            <template #item.end="{ item }">
              {{ formatDate(item.end || item.end_date) }}
            </template>

            <template #item.total_price="{ item }">
              {{ formatCurrency(item.total_price) }}
            </template>

            <template #item.status="{ item }">
              <VChip :color="getStatusColor(item.status)" size="small" label>
                {{ item.status || 'unknown' }}
              </VChip>
            </template>

            <template #item.created_at="{ item }">
              {{ formatDate(item.created_at) }}
            </template>

            <template #item.payment_status="{ item }">
              <VChip
                v-if="paymentsMap[item.id]"
                :color="getPaymentStatusColor(paymentsMap[item.id].status)"
                size="small"
                label
              >
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
                <VBtn icon variant="text" size="small" color="primary" @click="openEdit(item)">
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
      <ReservationDetail
        v-model:isDialogVisible="isDetailDialogVisible"
        :reservation="selectedReservation"
        :payment="selectedReservation ? paymentsMap[selectedReservation.id] : null"
      />
    </VCard>
  </div>
</template>

<script setup>
import AddReservation from '@/components/booking/AddReservation.vue'
import EditReservation from '@/components/booking/EditReservation.vue'
import ReservationDetail from '@/components/booking/ReservationDetail.vue'
import { computed, onMounted, ref, watch } from 'vue'

const headers = [
  { title: 'Reservation', key: 'id' },
  { title: 'Reservation Date', key: 'created_at' },
  { title: 'Cabin', key: 'cabin' },
  { title: 'Start Date', key: 'start' },
  { title: 'End Date', key: 'end' },
  { title: 'Total Price', key: 'total_price' },
  { title: 'Status', key: 'status' },
  { title: 'Payment', key: 'payment_status' },
  { title: 'Actions', key: 'actions', align: 'end', sortable: false },
]

const searchQuery = ref('')
const isAddReservationDialogVisible = ref(false)
const isEditReservationDialogVisible = ref(false)
const isDetailDialogVisible = ref(false)
const data = ref([])
const paymentsMap = ref({})
const selectedReservation = ref(null)
const loading = ref(false)
const confirmedReservations = computed(() => data.value.filter(item => item.status === 'confirmed').length)
const pendingReservations = computed(() => data.value.filter(item => item.status === 'pending').length)

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


const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}
const formatCurrency = amount => {
  const parsedAmount = Number(amount || 0)

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
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
    $api(`/reservations?search=${encodeURIComponent(searchQuery.value || '')}`, {
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
