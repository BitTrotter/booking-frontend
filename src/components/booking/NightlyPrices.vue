<script setup>
import { weekDays } from '@/utils/weeklyPrices'

defineProps({
  pricing: { type: Object, default: null },
  currency: { type: String, default: 'USD' },
  compact: { type: Boolean, default: false },
})
const formatPrice = (value, currency) => new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(Number(value))
const dayLabel = day => weekDays.find(item => item.key === day)?.label || day
</script>

<template>
  <div v-if="pricing && (pricing.total_price != null || pricing.total != null)" class="mt-4">
    <div class="d-flex justify-space-between gap-2 mb-2">
      <strong>Total · {{ pricing.total_days ?? pricing.nights ?? pricing.nightly_prices?.length ?? '—' }} nights</strong>
      <strong>{{ formatPrice(pricing.total_price ?? pricing.total, currency) }}</strong>
    </div>
    <div v-if="pricing.price_per_night != null" class="text-body-2 mb-2">{{ formatPrice(pricing.price_per_night, currency) }} per night</div>
    <div v-else-if="pricing.average_price_per_night != null" class="text-body-2 mb-2">Average per night: {{ formatPrice(pricing.average_price_per_night, currency) }}</div>
    <component :is="compact ? 'details' : 'div'" v-if="pricing.nightly_prices?.length"
      :class="{ 'nightly-breakdown--compact': compact }">
      <summary v-if="compact" class="text-body-2 text-primary nightly-breakdown-summary">
        View breakdown for {{ pricing.nightly_prices.length }} nights
      </summary>
      <VTable density="compact" :fixed-header="compact">
        <thead><tr><th>Night</th><th>Day</th><th class="text-end">Rate</th></tr></thead>
        <tbody>
          <tr v-for="night in pricing.nightly_prices" :key="night.date">
            <td>{{ night.date }}</td><td>{{ dayLabel(night.day) }}</td><td class="text-end">{{ formatPrice(night.price, currency) }}</td>
          </tr>
        </tbody>
      </VTable>
    </component>
    <p v-else-if="pricing.nightly_prices === null" class="text-caption text-medium-emphasis">This reservation has no historical nightly breakdown.</p>
    <p class="text-caption text-medium-emphasis mt-2">The check-out day is not charged.</p>
  </div>
</template>

<style scoped>
.nightly-breakdown-summary {
  cursor: pointer;
  padding-block: 8px;
}

.nightly-breakdown--compact :deep(.v-table__wrapper) {
  max-block-size: 240px;
  overflow: auto;
}
</style>
