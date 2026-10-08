<script setup>
import { weekDays } from '@/utils/weeklyPrices'

defineProps({ pricing: { type: Object, default: null }, currency: { type: String, default: 'USD' } })
const formatPrice = (value, currency) => new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(Number(value))
const dayLabel = day => weekDays.find(item => item.key === day)?.label || day
</script>

<template>
  <div v-if="pricing && (pricing.total_price != null || pricing.total != null)" class="mt-4">
    <div class="d-flex justify-space-between gap-2 mb-2">
      <strong>Total · {{ pricing.total_days ?? pricing.nights ?? pricing.nightly_prices?.length ?? '—' }} noches</strong>
      <strong>{{ formatPrice(pricing.total_price ?? pricing.total, currency) }}</strong>
    </div>
    <div v-if="pricing.price_per_night != null" class="text-body-2 mb-2">{{ formatPrice(pricing.price_per_night, currency) }} por noche</div>
    <div v-else-if="pricing.average_price_per_night != null" class="text-body-2 mb-2">Promedio por noche: {{ formatPrice(pricing.average_price_per_night, currency) }}</div>
    <VTable v-if="pricing.nightly_prices?.length" density="compact">
      <thead><tr><th>Noche</th><th>Día</th><th class="text-end">Tarifa</th></tr></thead>
      <tbody>
        <tr v-for="night in pricing.nightly_prices" :key="night.date">
          <td>{{ night.date }}</td><td>{{ dayLabel(night.day) }}</td><td class="text-end">{{ formatPrice(night.price, currency) }}</td>
        </tr>
      </tbody>
    </VTable>
    <p v-else-if="pricing.nightly_prices === null" class="text-caption text-medium-emphasis">Esta reserva no tiene un desglose histórico por noche.</p>
    <p class="text-caption text-medium-emphasis mt-2">El día de salida no se cobra.</p>
  </div>
</template>
