<script setup>
import { computed } from 'vue'
import { validWeeklyPrices, weekDays, weeklyPriceValidator } from '@/utils/weeklyPrices'

const props = defineProps({ modelValue: { type: Object, required: true }, readonly: Boolean })
const emit = defineEmits(['update:modelValue'])
const formatPrice = value => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value))
const minimum = computed(() => validWeeklyPrices(props.modelValue) ? Math.min(...weekDays.map(({ key }) => Number(props.modelValue[key]))) : null)
const updatePrice = (key, value) => emit('update:modelValue', { ...props.modelValue, [key]: value })
</script>

<template>
  <VCard variant="outlined" class="pa-4">
    <div class="d-flex align-center justify-space-between flex-wrap gap-2 mb-2">
      <div class="d-flex align-center gap-2">
        <VIcon color="primary" icon="ri-calendar-line" />
        <span class="text-subtitle-1 font-weight-semibold">Tarifas semanales por noche</span>
      </div>
      <VChip v-if="minimum !== null" color="primary" variant="tonal" size="small">Desde {{ formatPrice(minimum) }}</VChip>
    </div>
    <p class="text-body-2 text-medium-emphasis mb-4">Se repiten cada semana. Se cobra cada noche desde la entrada; el día de salida no se cobra.</p>
    <VRow dense>
      <VCol v-for="day in weekDays" :key="day.key" cols="12" sm="6" md="4">
        <div v-if="readonly" class="d-flex justify-space-between gap-2 py-2">
          <span>{{ day.label }}</span><strong>{{ modelValue[day.key] === '' ? '—' : formatPrice(modelValue[day.key]) }}</strong>
        </div>
        <VTextField v-else :model-value="modelValue[day.key]" :label="day.label" type="number" prefix="$"
          min="0" max="999999.99" step="0.01" :rules="[weeklyPriceValidator]"
          @update:model-value="updatePrice(day.key, $event)" />
      </VCol>
    </VRow>
  </VCard>
</template>
