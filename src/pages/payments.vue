<script setup>
import { computed, onMounted, ref } from 'vue'

definePage({
  meta: {
    action: 'read',
    subject: 'all',
  },
})

const headers = [
  { title: '#', key: 'id', width: 60 },
  { title: 'Stripe PI ID', key: 'stripe_payment_intent_id' },
  { title: 'Reservation', key: 'reservation_id', width: 120 },
  { title: 'Amount', key: 'amount', align: 'end' },
  { title: 'Currency', key: 'currency', width: 100 },
  { title: 'Status', key: 'status', width: 120 },
  { title: 'Paid At', key: 'paid_at' },
  { title: 'Actions', key: 'actions', align: 'end', sortable: false, width: 80 },
]

const data = ref([])
const loading = ref(false)
const searchQuery = ref('')
const statusFilter = ref('all')
const selectedPayment = ref(null)
const isDetailDialogVisible = ref(false)

const statusOptions = [
  { label: 'All', value: 'all' },
  { label: 'Paid', value: 'paid' },
  { label: 'Pending', value: 'pending' },
  { label: 'Failed', value: 'failed' },
  { label: 'Refunded', value: 'refunded' },
]

// ── Stats ──
const totalCollected = computed(() =>
  data.value
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + Number(p.amount || 0), 0),
)
const paidCount = computed(() => data.value.filter(p => p.status === 'paid').length)
const pendingCount = computed(() => data.value.filter(p => p.status === 'pending').length)
const refundedCount = computed(() => data.value.filter(p => p.status === 'refunded').length)

// ── Filtered rows ──
const filteredData = computed(() => {
  let rows = data.value
  if (statusFilter.value !== 'all')
    rows = rows.filter(p => p.status === statusFilter.value)
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase()
    rows = rows.filter(p =>
      String(p.reservation_id).includes(q) ||
      (p.stripe_payment_intent_id || '').toLowerCase().includes(q),
    )
  }
  return rows
})

// ── Helpers ──
const formatCurrency = (amount, currency = 'MXN') =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: currency.toUpperCase() }).format(Number(amount || 0))

const formatDate = date => {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('es-MX', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

const statusColor = status => ({
  paid: 'success',
  pending: 'warning',
  failed: 'error',
  refunded: 'info',
  cancelled: 'secondary',
}[status] || 'secondary')

const statusIcon = status => ({
  paid: 'ri-checkbox-circle-line',
  pending: 'ri-time-line',
  failed: 'ri-close-circle-line',
  refunded: 'ri-refund-2-line',
}[status] || 'ri-question-line')

// ── API ──
const list = async () => {
  loading.value = true
  try {
    const resp = await $api('/payments', { method: 'GET' })
    data.value = Array.isArray(resp) ? resp : resp?.data || []
  } catch (e) {
    console.error('Failed to load payments:', e)
  } finally {
    loading.value = false
  }
}

const openDetail = item => {
  selectedPayment.value = item
  isDetailDialogVisible.value = true
}

onMounted(list)
</script>

<template>
  <div>
    <VCard class="border-0 shadow-none">
      <!-- ── Header ── -->
      <VCardText class="pb-2">
        <div class="d-flex flex-wrap justify-space-between align-center gap-4">
          <div>
            <div class="text-h4 font-weight-bold">Payments</div>
            <div class="text-body-2 text-medium-emphasis">
              Track all Stripe transactions linked to reservations.
            </div>
          </div>
          <div class="d-flex gap-3 align-center flex-wrap">
            <VTextField
              v-model="searchQuery"
              placeholder="Search by PI ID or reservation…"
              prepend-inner-icon="ri-search-line"
              density="comfortable"
              style="inline-size: 300px;"
              hide-details
            />
            <VBtn variant="tonal" prepend-icon="ri-refresh-line" @click="list">
              Refresh
            </VBtn>
          </div>
        </div>
      </VCardText>

      <VCardText class="pt-0">
        <!-- ── Summary cards ── -->
        <VRow class="mb-4">
          <VCol cols="12" sm="6" md="3">
            <VCard variant="tonal" color="success">
              <VCardText>
                <div class="d-flex align-center justify-space-between">
                  <div>
                    <div class="text-caption text-medium-emphasis">Total Collected</div>
                    <div class="text-h5 font-weight-bold mt-1">{{ formatCurrency(totalCollected) }}</div>
                  </div>
                  <VAvatar color="success" variant="tonal" size="44" rounded>
                    <VIcon icon="ri-money-dollar-circle-line" size="24" />
                  </VAvatar>
                </div>
              </VCardText>
            </VCard>
          </VCol>
          <VCol cols="12" sm="6" md="3">
            <VCard variant="tonal" color="primary">
              <VCardText>
                <div class="d-flex align-center justify-space-between">
                  <div>
                    <div class="text-caption text-medium-emphasis">Total Payments</div>
                    <div class="text-h5 font-weight-bold mt-1">{{ data.length }}</div>
                  </div>
                  <VAvatar color="primary" variant="tonal" size="44" rounded>
                    <VIcon icon="ri-bank-card-line" size="24" />
                  </VAvatar>
                </div>
              </VCardText>
            </VCard>
          </VCol>
          <VCol cols="12" sm="6" md="3">
            <VCard variant="tonal" color="warning">
              <VCardText>
                <div class="d-flex align-center justify-space-between">
                  <div>
                    <div class="text-caption text-medium-emphasis">Pending</div>
                    <div class="text-h5 font-weight-bold mt-1">{{ pendingCount }}</div>
                  </div>
                  <VAvatar color="warning" variant="tonal" size="44" rounded>
                    <VIcon icon="ri-time-line" size="24" />
                  </VAvatar>
                </div>
              </VCardText>
            </VCard>
          </VCol>
          <VCol cols="12" sm="6" md="3">
            <VCard variant="tonal" color="info">
              <VCardText>
                <div class="d-flex align-center justify-space-between">
                  <div>
                    <div class="text-caption text-medium-emphasis">Refunded</div>
                    <div class="text-h5 font-weight-bold mt-1">{{ refundedCount }}</div>
                  </div>
                  <VAvatar color="info" variant="tonal" size="44" rounded>
                    <VIcon icon="ri-refund-2-line" size="24" />
                  </VAvatar>
                </div>
              </VCardText>
            </VCard>
          </VCol>
        </VRow>

        <!-- ── Status filter chips ── -->
        <div class="d-flex gap-2 mb-4 flex-wrap">
          <VChip
            v-for="opt in statusOptions"
            :key="opt.value"
            :color="statusFilter === opt.value ? (opt.value === 'all' ? 'primary' : statusColor(opt.value)) : undefined"
            :variant="statusFilter === opt.value ? 'elevated' : 'tonal'"
            size="small"
            label
            class="cursor-pointer"
            @click="statusFilter = opt.value"
          >
            {{ opt.label }}
            <span v-if="opt.value !== 'all'" class="ms-1 opacity-70">
              ({{ data.filter(p => p.status === opt.value).length }})
            </span>
          </VChip>
        </div>

        <!-- ── Data table ── -->
        <VCard variant="outlined">
          <VDataTable
            :headers="headers"
            :items="filteredData"
            :items-per-page="10"
            :loading="loading"
            class="text-no-wrap"
          >
            <template #item.id="{ item }">
              <span class="font-weight-medium text-medium-emphasis">#{{ item.id }}</span>
            </template>

            <template #item.stripe_payment_intent_id="{ item }">
              <div class="d-flex align-center gap-2">
                <VIcon icon="ri-stripe-line" size="16" color="primary" />
                <span class="text-caption font-mono">{{ item.stripe_payment_intent_id }}</span>
              </div>
            </template>

            <template #item.reservation_id="{ item }">
              <VChip size="small" variant="tonal" color="secondary" label>
                #{{ item.reservation_id }}
              </VChip>
            </template>

            <template #item.amount="{ item }">
              <span class="font-weight-semibold">
                {{ formatCurrency(item.amount, item.currency) }}
              </span>
            </template>

            <template #item.currency="{ item }">
              <span class="text-uppercase text-caption font-weight-medium">{{ item.currency }}</span>
            </template>

            <template #item.status="{ item }">
              <VChip
                :color="statusColor(item.status)"
                size="small"
                label
              >
                <VIcon :icon="statusIcon(item.status)" size="14" class="me-1" />
                {{ item.status }}
              </VChip>
            </template>

            <template #item.paid_at="{ item }">
              <span class="text-body-2">{{ formatDate(item.paid_at) }}</span>
            </template>

            <template #item.actions="{ item }">
              <VBtn
                icon
                variant="text"
                size="small"
                color="primary"
                @click="openDetail(item)"
              >
                <VIcon icon="ri-eye-line" size="18" />
                <VTooltip activator="parent">View details</VTooltip>
              </VBtn>
            </template>

            <template #no-data>
              <div class="text-center py-8 text-medium-emphasis">
                <VIcon icon="ri-bank-card-line" size="48" class="mb-3 opacity-30" />
                <div>No payments found</div>
              </div>
            </template>
          </VDataTable>
        </VCard>
      </VCardText>
    </VCard>

    <!-- ── Detail Dialog ── -->
    <VDialog v-model="isDetailDialogVisible" max-width="560">
      <VCard v-if="selectedPayment">
        <VCardItem class="pb-0">
          <template #prepend>
            <VAvatar :color="statusColor(selectedPayment.status)" variant="tonal" rounded>
              <VIcon :icon="statusIcon(selectedPayment.status)" />
            </VAvatar>
          </template>
          <VCardTitle>Payment #{{ selectedPayment.id }}</VCardTitle>
          <VCardSubtitle>
            <VChip :color="statusColor(selectedPayment.status)" size="x-small" label>
              {{ selectedPayment.status }}
            </VChip>
          </VCardSubtitle>
          <template #append>
            <VBtn icon variant="text" @click="isDetailDialogVisible = false">
              <VIcon icon="ri-close-line" />
            </VBtn>
          </template>
        </VCardItem>

        <VDivider class="my-3" />

        <VCardText>
          <VList lines="two" density="compact">
            <VListItem>
              <template #prepend><VIcon icon="ri-stripe-line" color="primary" /></template>
              <VListItemTitle class="text-caption text-medium-emphasis">Stripe Payment Intent ID</VListItemTitle>
              <VListItemSubtitle class="font-mono text-body-2 mt-1">
                {{ selectedPayment.stripe_payment_intent_id }}
              </VListItemSubtitle>
            </VListItem>

            <VListItem>
              <template #prepend><VIcon icon="ri-bookmark-3-line" color="secondary" /></template>
              <VListItemTitle class="text-caption text-medium-emphasis">Reservation</VListItemTitle>
              <VListItemSubtitle class="text-body-2 mt-1">
                #{{ selectedPayment.reservation_id }}
                <span v-if="selectedPayment.reservation?.status" class="ms-2">
                  <VChip size="x-small" :color="selectedPayment.reservation.status === 'confirmed' ? 'success' : 'warning'" label>
                    {{ selectedPayment.reservation.status }}
                  </VChip>
                </span>
              </VListItemSubtitle>
            </VListItem>

            <VListItem>
              <template #prepend><VIcon icon="ri-money-dollar-circle-line" color="success" /></template>
              <VListItemTitle class="text-caption text-medium-emphasis">Amount</VListItemTitle>
              <VListItemSubtitle class="text-h6 font-weight-bold mt-1">
                {{ formatCurrency(selectedPayment.amount, selectedPayment.currency) }}
                <span class="text-caption text-medium-emphasis ms-1">{{ selectedPayment.currency?.toUpperCase() }}</span>
              </VListItemSubtitle>
            </VListItem>

            <VListItem>
              <template #prepend><VIcon icon="ri-calendar-check-line" color="info" /></template>
              <VListItemTitle class="text-caption text-medium-emphasis">Paid At</VListItemTitle>
              <VListItemSubtitle class="text-body-2 mt-1">{{ formatDate(selectedPayment.paid_at) }}</VListItemSubtitle>
            </VListItem>
          </VList>
        </VCardText>

        <VCardActions class="px-6 pb-4">
          <VSpacer />
          <VBtn variant="tonal" @click="isDetailDialogVisible = false">Close</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>
