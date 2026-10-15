<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { $api } from '@/utils/api'
import { hasPermission } from '@/utils/permissions'
import { isBookingDate } from '@/utils/bookingDates'
import { weeklyPriceValidator } from '@/utils/weeklyPrices'

const props = defineProps({
  cabinId: { type: [Number, String], required: true },
  active: { type: Boolean, default: true },
  readonly: Boolean,
})

const canView = computed(() => hasPermission('show_cabin_details'))
const canEdit = computed(() => !props.readonly && hasPermission('edit_cabin'))
const prices = ref([])
const date = ref('')
const amount = ref('')
const loading = ref(false)
const busy = ref(false)
const error = ref('')
const success = ref('')
const loadFailed = ref(false)
const attempted = ref(false)
const pendingDelete = ref(null)
let generation = 0

const dateError = computed(() => isBookingDate(date.value) ? '' : 'Select a valid date.')

const amountError = computed(() => {
  const result = weeklyPriceValidator(amount.value)

  return result === true ? '' : result
})

const sortedPrices = computed(() => [...prices.value].sort((a, b) => a.date.localeCompare(b.date)))
const existingDate = computed(() => prices.value.some(price => price.date === date.value))
const formatPrice = value => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value))

const errorMessage = (failure, fallback) => {
  const data = failure?.data

  return Object.values(data?.errors || {}).flat().join(' ') || data?.message || fallback
}

const load = async () => {
  if (!props.active || !props.cabinId || !canView.value || busy.value || loading.value) return

  const current = generation

  loading.value = true
  loadFailed.value = false
  error.value = ''
  try {
    const response = await $api(`/cabins/${props.cabinId}/special-prices`, { headers: { Accept: 'application/json' } })
    if (current === generation) prices.value = response
  } catch (failure) {
    if (current !== generation) return
    loadFailed.value = true
    error.value = errorMessage(failure, 'Unable to load special rates.')
  } finally {
    if (current === generation) loading.value = false
  }
}

watch(() => [props.cabinId, props.active], () => {
  generation++
  prices.value = []
  date.value = ''
  amount.value = ''
  error.value = ''
  success.value = ''
  attempted.value = false
  pendingDelete.value = null
  loading.value = false
  busy.value = false
  loadFailed.value = false
  load()
}, { immediate: true, flush: 'sync' })
onBeforeUnmount(() => { generation++ })

const edit = price => {
  if (!canEdit.value || busy.value) return
  date.value = price.date
  amount.value = String(price.price_per_night)
  attempted.value = false
  pendingDelete.value = null
  success.value = ''
}

const save = async () => {
  if (!props.active || !props.cabinId || !canEdit.value || busy.value || loading.value) return
  attempted.value = true
  if (dateError.value || amountError.value) return

  const current = generation
  const savedDate = date.value

  busy.value = true
  error.value = ''
  success.value = ''
  pendingDelete.value = null
  try {
    const response = await $api(`/cabins/${props.cabinId}/special-prices/${savedDate}`, {
      method: 'PUT',
      headers: { Accept: 'application/json' },
      body: { 'price_per_night': Number(amount.value) },
    })

    if (current !== generation) return
    prices.value = [...prices.value.filter(price => price.date !== savedDate), response]
    success.value = `Special rate saved for ${savedDate}.`
    date.value = ''
    amount.value = ''
    attempted.value = false
  } catch (failure) {
    if (current === generation) error.value = errorMessage(failure, 'Unable to save the special rate.')
  } finally {
    if (current === generation) busy.value = false
  }
}

const remove = async () => {
  if (!props.active || !canEdit.value || busy.value || loading.value || !pendingDelete.value) return

  const current = generation
  const removedDate = pendingDelete.value

  busy.value = true
  error.value = ''
  success.value = ''
  try {
    await $api(`/cabins/${props.cabinId}/special-prices/${removedDate}`, {
      method: 'DELETE', headers: { Accept: 'application/json' },
    })
    if (current !== generation) return
    prices.value = prices.value.filter(price => price.date !== removedDate)
    pendingDelete.value = null
    success.value = `Special rate deleted. New quotes for the night of ${removedDate} will use the weekly rate.`
  } catch (failure) {
    if (current === generation) error.value = errorMessage(failure, 'Unable to delete the special rate.')
  } finally {
    if (current === generation) busy.value = false
  }
}
</script>

<template>
  <VCard
    v-if="canView || canEdit"
    variant="outlined"
    class="pa-4"
  >
    <div class="d-flex align-center justify-space-between gap-2 mb-2">
      <div class="text-subtitle-1 font-weight-semibold">
        Special rates by date
      </div>
      <VBtn
        v-if="canView"
        icon="ri-refresh-line"
        variant="text"
        size="small"
        aria-label="Reload special rates"
        :loading="loading"
        :disabled="busy"
        @click="load"
      />
    </div>
    <p class="text-body-2 text-medium-emphasis mb-4">
      Each price replaces the weekly rate for the night starting on that date and ending the next day.
    </p>
    <VAlert
      v-if="error"
      type="error"
      variant="tonal"
      class="mb-3"
    >
      {{ error }}
    </VAlert>
    <VAlert
      v-if="success"
      type="success"
      variant="tonal"
      class="mb-3"
      role="status"
    >
      {{ success }}
    </VAlert>

    <div
      v-if="canEdit"
      class="mb-4"
    >
      <p class="text-caption text-medium-emphasis mb-3">
        Click Save rate to save your changes. If the date already has a special rate, its amount will be replaced.
      </p>
      <VRow dense>
        <VCol
          cols="12"
          sm="6"
        >
          <VTextField
            v-model="date"
            type="date"
            label="Night date"
            :disabled="busy || loading"
            :error-messages="attempted ? dateError : ''"
          />
        </VCol>
        <VCol
          cols="12"
          sm="6"
        >
          <VTextField
            v-model="amount"
            type="number"
            label="Price per night"
            prefix="$"
            min="0"
            max="999999.99"
            step="0.01"
            :disabled="busy || loading"
            :error-messages="attempted ? amountError : ''"
          />
        </VCol>
      </VRow>
      <VBtn
        type="button"
        :loading="busy && !pendingDelete"
        :disabled="busy || loading"
        @click="save"
      >
        {{ existingDate ? 'Update rate' : 'Save rate' }}
      </VBtn>
    </div>

    <VProgressLinear
      v-if="loading"
      indeterminate
      color="primary"
      aria-label="Loading special rates"
    />
    <template v-else-if="canView && !loadFailed">
      <VTable
        v-if="sortedPrices.length"
        density="compact"
      >
        <thead>
          <tr>
            <th>Night date</th><th>Price</th><th v-if="canEdit">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="price in sortedPrices"
            :key="price.date"
          >
            <td>{{ price.date }}</td>
            <td>{{ formatPrice(price.price_per_night) }}</td>
            <td v-if="canEdit">
              <VBtn
                variant="text"
                size="small"
                :disabled="busy"
                :aria-label="`Edit rate for ${price.date}`"
                @click="edit(price)"
              >
                Edit
              </VBtn>
              <VBtn
                variant="text"
                size="small"
                color="error"
                :disabled="busy"
                :aria-label="`Delete rate for ${price.date}`"
                @click="pendingDelete = price.date"
              >
                Delete
              </VBtn>
            </td>
          </tr>
        </tbody>
      </VTable>
      <p
        v-else
        class="text-body-2 text-medium-emphasis mb-0"
      >
        No special rates. Weekly rates apply.
      </p>
    </template>

    <VAlert
      v-if="canEdit && pendingDelete"
      type="warning"
      variant="tonal"
      class="mt-3"
    >
      Delete the rate for {{ pendingDelete }}? New quotes for that night will use the weekly rate again.
      <div class="d-flex gap-2 mt-3">
        <VBtn
          color="error"
          size="small"
          :loading="busy"
          :disabled="busy"
          @click="remove"
        >
          Delete rate
        </VBtn>
        <VBtn
          variant="text"
          size="small"
          :disabled="busy"
          @click="pendingDelete = null"
        >
          Cancel
        </VBtn>
      </div>
    </VAlert>
  </VCard>
</template>
