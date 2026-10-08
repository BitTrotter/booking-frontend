<script setup>
import NightlyPrices from '@/components/booking/NightlyPrices.vue'
import { computed } from 'vue'
const props = defineProps({
  isDialogVisible: { type: Boolean, required: true },
  reservation: { type: Object, default: null },
  payment: { type: Object, default: null },
})

const emit = defineEmits(['update:isDialogVisible'])

const close = () => emit('update:isDialogVisible', false)

const formatDate = date => {
  if (!date) return '—'
  return new Date(/^\d{4}-\d{2}-\d{2}$/.test(date) ? `${date}T00:00:00` : date).toLocaleDateString('es-MX', {
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
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: (currency || 'MXN').toUpperCase() }).format(Number(amount || 0))

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

const paymentMethodLabels = {
  stripe: 'Stripe',
  cash: 'Cash',
  bank_transfer: 'Bank transfer',
  terminal: 'Terminal',
  courtesy: 'Courtesy',
}

const detailSections = computed(() => {
  const reservation = props.reservation
  if (!reservation) return []

  const method = reservation.payment_method
  return [
    {
      title: 'Stay details', icon: 'ri-calendar-event-line', color: 'primary',
      subtitle: 'Cabin, stay dates, and guest count.',
      fields: [
        { label: 'Cabin', value: reservation.cabin?.name, md: 6 },
        { label: 'Check-in / check-out', value: formatDate(reservation.start_date || reservation.start) + ' — ' + formatDate(reservation.end_date || reservation.end), md: 6 },
        { label: 'Number of guests', value: reservation.guest_number ?? reservation.guests?.length ?? 0 },
        { label: 'Status', value: reservation.status || 'unknown', kind: 'status' },
        { label: 'Nights', value: nightCount.value },
      ],
    },
    {
      title: 'Contact information', icon: 'ri-user-line', color: 'info',
      subtitle: 'Contact details for the primary guest.',
      fields: [
        { label: 'Full name', value: reservation.full_name || reservation.guests?.[0]?.full_name || reservation.guests?.[0]?.name, md: 12 },
        { label: 'Phone', value: reservation.phone, md: 6 },
        { label: 'Email', value: reservation.email, md: 6 },
      ],
    },
    {
      title: 'Payment', icon: 'ri-bank-card-line', color: 'success',
      subtitle: 'Payment method, amount received, and reservation notes.',
      fields: [
        { label: 'Payment method', value: paymentMethodLabels[method] || method },
        { label: 'Amount paid', value: reservation.amount_paid != null ? formatCurrency(reservation.amount_paid) : props.payment?.status === 'paid' ? formatCurrency(props.payment.amount, props.payment.currency) : '—' },
        { label: 'Payment reference', value: reservation.payment_reference },
        { label: 'Notes', value: reservation.notes, md: 12 },
        { label: 'Total price', value: formatCurrency(reservation.total_price), md: 6 },
      ],
    },
  ]
})
</script>

<template>
  <AppFormDialog :model-value="props.isDialogVisible" :title="reservation ? 'Reservation #' + reservation.id : 'Reservation details'"
    subtitle="Review the stay, contact, and payment details." :max-width="900" no-internal-form
    @update:model-value="emit('update:isDialogVisible', $event)">
    <div v-if="reservation" class="reservation-form">
      <template v-for="(section, index) in detailSections" :key="section.title">
        <VDivider v-if="index" />
        <section class="reservation-section">
          <div class="section-heading">
            <VAvatar :color="section.color" variant="tonal" size="34"><VIcon :icon="section.icon" size="18" /></VAvatar>
            <div>
              <div class="text-subtitle-1 font-weight-semibold">{{ section.title }}</div>
              <div class="text-body-2 text-medium-emphasis">{{ section.subtitle }}</div>
            </div>
          </div>
          <VRow>
            <VCol v-for="field in section.fields" :key="field.label" cols="12" :sm="field.md === 12 ? 12 : 6" :md="field.md || 4">
              <dl class="detail-field">
                <dt class="text-caption text-medium-emphasis mb-1">{{ field.label }}</dt>
                <dd>
                  <VChip v-if="field.kind === 'status'" :color="reservationStatusColor(field.value)" size="small" variant="tonal">
                    {{ field.value }}
                  </VChip>
                  <span v-else class="text-body-1">{{ field.value === '' || field.value == null ? '—' : field.value }}</span>
                </dd>
              </dl>
            </VCol>
          </VRow>
          <NightlyPrices v-if="section.title === 'Stay details'" :pricing="{ ...reservation, nights: nightCount }" :currency="reservation.currency || 'MXN'" />
          <VCard v-if="section.title === 'Payment' && payment" variant="tonal" class="mt-2">
            <VCardText>
              <div class="d-flex flex-wrap align-center gap-3 mb-3">
                <span class="text-subtitle-2">Payment record</span>
                <VChip :color="paymentStatusColor(payment.status)" :prepend-icon="paymentStatusIcon(payment.status)" size="small" variant="tonal">
                  {{ payment.status || 'unknown' }}
                </VChip>
              </div>
              <VRow>
                <VCol cols="12" sm="6" md="4">
                  <dl class="detail-field">
                    <dt class="text-caption text-medium-emphasis mb-1">Amount</dt>
                    <dd>{{ formatCurrency(payment.amount, payment.currency) }}</dd>
                  </dl>
                </VCol>
                <VCol v-if="payment.paid_at" cols="12" sm="6" md="4">
                  <dl class="detail-field">
                    <dt class="text-caption text-medium-emphasis mb-1">Paid at</dt>
                    <dd>{{ formatDateTime(payment.paid_at) }}</dd>
                  </dl>
                </VCol>
                <VCol v-if="payment.stripe_payment_intent_id" cols="12" md="4">
                  <dl class="detail-field">
                    <dt class="text-caption text-medium-emphasis mb-1">Stripe PI</dt>
                    <dd>{{ payment.stripe_payment_intent_id }}</dd>
                  </dl>
                </VCol>
              </VRow>
            </VCardText>
          </VCard>
        </section>
      </template>
    </div>
    <template #actions>
      <div v-if="reservation" class="text-caption text-medium-emphasis">
        Created {{ formatDateTime(reservation.created_at) }}
      </div>
      <VSpacer />
      <VBtn variant="tonal" color="secondary" @click="close">Close</VBtn>
    </template>
  </AppFormDialog>
</template>

<style scoped>
.reservation-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.reservation-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-heading {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 2px;
}
.detail-field {
  margin: 0;
  padding: 12px 16px;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 6px;
  block-size: 100%;
}

.detail-field dd {
  margin: 0;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}
</style>
