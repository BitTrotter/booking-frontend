<script setup>
const props = defineProps({
  isDialogVisible: { type: Boolean, required: true },
  reservation: { type: Object, default: null },
  payment: { type: Object, default: null },
})

const emit = defineEmits(['update:isDialogVisible'])

const close = () => emit('update:isDialogVisible', false)

const formatDate = date => {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('es-MX', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

const formatDateTime = date => {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('es-MX', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

const formatCurrency = (amount, currency = 'MXN') =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: currency.toUpperCase() }).format(Number(amount || 0))

const reservationStatusColor = status => ({
  confirmed: 'success',
  pending: 'warning',
  cancelled: 'error',
  completed: 'info',
}[status] || 'secondary')

const paymentStatusColor = status => ({
  paid: 'success',
  pending: 'warning',
  failed: 'error',
  refunded: 'info',
}[status] || 'secondary')

const paymentStatusIcon = status => ({
  paid: 'ri-checkbox-circle-line',
  pending: 'ri-time-line',
  failed: 'ri-close-circle-line',
  refunded: 'ri-refund-2-line',
}[status] || 'ri-bank-card-line')

const nightCount = computed(() => {
  if (!props.reservation?.start_date && !props.reservation?.start) return null
  const start = new Date(props.reservation.start_date || props.reservation.start)
  const end = new Date(props.reservation.end_date || props.reservation.end)
  const diff = Math.round((end - start) / (1000 * 60 * 60 * 24))
  return diff > 0 ? diff : null
})
</script>

<template>
  <VDialog :model-value="props.isDialogVisible" max-width="640" @update:model-value="close">
    <VCard v-if="reservation">
      <!-- Header -->
      <VCardItem class="pb-2">
        <template #prepend>
          <VAvatar :color="reservationStatusColor(reservation.status)" variant="tonal" rounded>
            <VIcon icon="ri-bookmark-3-line" />
          </VAvatar>
        </template>
        <VCardTitle>Reservation #{{ reservation.id }}</VCardTitle>
        <VCardSubtitle>
          <VChip :color="reservationStatusColor(reservation.status)" size="x-small" label class="mt-1">
            {{ reservation.status || 'unknown' }}
          </VChip>
        </VCardSubtitle>
        <template #append>
          <VBtn icon variant="text" @click="close">
            <VIcon icon="ri-close-line" />
          </VBtn>
        </template>
      </VCardItem>

      <VDivider />

      <VCardText class="pt-4">
        <VRow>
          <!-- Left: reservation info -->
          <VCol cols="12" md="7">

            <!-- Cabin -->
            <div class="detail-section mb-4">
              <div class="text-caption text-medium-emphasis text-uppercase font-weight-medium mb-2">
                <VIcon icon="ri-home-line" size="13" class="me-1" />Cabin
              </div>
              <div class="text-body-1 font-weight-semibold">
                {{ reservation.cabin?.name || '—' }}
              </div>
            </div>

            <!-- Dates -->
            <div class="detail-section mb-4">
              <div class="text-caption text-medium-emphasis text-uppercase font-weight-medium mb-2">
                <VIcon icon="ri-calendar-line" size="13" class="me-1" />Stay
              </div>
              <div class="d-flex align-center gap-3">
                <div>
                  <div class="text-caption text-medium-emphasis">Check-in</div>
                  <div class="text-body-2 font-weight-medium">
                    {{ formatDate(reservation.start_date || reservation.start) }}
                  </div>
                </div>
                <VIcon icon="ri-arrow-right-line" size="16" color="medium-emphasis" />
                <div>
                  <div class="text-caption text-medium-emphasis">Check-out</div>
                  <div class="text-body-2 font-weight-medium">
                    {{ formatDate(reservation.end_date || reservation.end) }}
                  </div>
                </div>
                <VChip v-if="nightCount" size="x-small" variant="tonal" color="primary" label class="ms-auto">
                  {{ nightCount }} night{{ nightCount !== 1 ? 's' : '' }}
                </VChip>
              </div>
            </div>

            <!-- Contact -->
            <div class="detail-section mb-4">
              <div class="text-caption text-medium-emphasis text-uppercase font-weight-medium mb-2">
                <VIcon icon="ri-contacts-line" size="13" class="me-1" />Contact
              </div>
              <div class="d-flex flex-column gap-1">
                <div class="d-flex align-center gap-2">
                  <VIcon icon="ri-phone-line" size="16" color="medium-emphasis" />
                  <span class="text-body-2">{{ reservation.phone || '—' }}</span>
                </div>
                <div class="d-flex align-center gap-2">
                  <VIcon icon="ri-mail-line" size="16" color="medium-emphasis" />
                  <span class="text-body-2">{{ reservation.email || '—' }}</span>
                </div>
              </div>
            </div>

            <!-- Total -->
            <div class="detail-section">
              <div class="text-caption text-medium-emphasis text-uppercase font-weight-medium mb-1">
                <VIcon icon="ri-money-dollar-circle-line" size="13" class="me-1" />Total Price
              </div>
              <div class="text-h6 font-weight-bold">{{ formatCurrency(reservation.total_price) }}</div>
            </div>
          </VCol>

          <VDivider vertical class="d-none d-md-flex" />

          <!-- Right: guests + payment -->
          <VCol cols="12" md="4" class="ps-md-5">

            <!-- Guests -->
            <div class="detail-section mb-4">
              <div class="text-caption text-medium-emphasis text-uppercase font-weight-medium mb-2">
                <VIcon icon="ri-group-line" size="13" class="me-1" />
                Guests ({{ reservation.guests?.length || 0 }})
              </div>
              <div
                v-for="(guest, i) in reservation.guests"
                :key="i"
                class="d-flex align-center gap-2 mb-1"
              >
                <VAvatar size="24" :color="guest.guest_type === 'child' ? 'warning' : 'primary'" variant="tonal">
                  <VIcon :icon="guest.guest_type === 'child' ? 'ri-bear-smile-line' : 'ri-user-line'" size="13" />
                </VAvatar>
                <div>
                  <div class="text-body-2">{{ guest.full_name }}</div>
                  <div class="text-caption text-medium-emphasis">{{ guest.guest_type }}</div>
                </div>
              </div>
              <div v-if="!reservation.guests?.length" class="text-caption text-medium-emphasis">No guests</div>
            </div>

            <!-- Payment -->
            <div class="detail-section">
              <div class="text-caption text-medium-emphasis text-uppercase font-weight-medium mb-2">
                <VIcon icon="ri-bank-card-line" size="13" class="me-1" />Payment
              </div>

              <div v-if="payment">
                <VChip :color="paymentStatusColor(payment.status)" size="small" label class="mb-3">
                  <VIcon :icon="paymentStatusIcon(payment.status)" size="14" class="me-1" />
                  {{ payment.status }}
                </VChip>
                <div class="d-flex flex-column gap-1">
                  <div>
                    <div class="text-caption text-medium-emphasis">Amount</div>
                    <div class="text-body-2 font-weight-semibold">
                      {{ formatCurrency(payment.amount, payment.currency) }}
                    </div>
                  </div>
                  <div v-if="payment.paid_at">
                    <div class="text-caption text-medium-emphasis">Paid at</div>
                    <div class="text-body-2">{{ formatDateTime(payment.paid_at) }}</div>
                  </div>
                  <div>
                    <div class="text-caption text-medium-emphasis">Stripe PI</div>
                    <div class="text-caption font-mono text-truncate" style="max-inline-size: 160px;">
                      {{ payment.stripe_payment_intent_id }}
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="text-caption text-medium-emphasis">No payment yet</div>
            </div>
          </VCol>
        </VRow>
      </VCardText>

      <VDivider />

      <VCardActions class="px-6 py-3">
        <div class="text-caption text-medium-emphasis">
          Created {{ formatDateTime(reservation.created_at) }}
        </div>
        <VSpacer />
        <VBtn variant="tonal" @click="close">Close</VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

<style scoped>
.detail-section {
  padding-block-end: 4px;
}
.font-mono {
  font-family: monospace;
}
</style>
