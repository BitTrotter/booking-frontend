<script setup>
import { ref, onMounted, watch } from 'vue'
import { requiredValidator } from '@/@core/utils/validators'

const emit = defineEmits(['update:isDialogEditVisible'])
const refCabinForm = ref()
const refPriceRuleForm = ref()
const name = ref('')
const description = ref('')
const price_per_night = ref(null)
const capacity = ref(null)
const beds = ref(null)
const bathrooms = ref(null)
const services = ref([])
const status = ref('available')
const typeRule = ref(null)
const typeRulePrice = ref(null)
const starDate = ref(null)
const endDate = ref(null)
const minNights = ref(null)
const ruleStatus = ref(true)

const serviceList = [
  'WiFi',
  'Air Conditioning',
  'Heating',
  'Kitchen',
  'Free Parking',
  'Swimming Pool',
  'Pet Friendly',
  'TV',
  'Hot Tub',
  'BBQ Grill',
]

const props = defineProps({
  isDialogEditVisible: {
    type: Boolean,
    required: true,
  },
  cabin: {
    type: Object,
    required: false,
  },
})

const dialogVisibleUpdate = val => {
  emit('update:isDialogEditVisible', val)
}

const submitRulePrice = async () => {
  const validation = await refPriceRuleForm.value?.validate()

  if (!validation?.valid)
    return

  const priceRulesPayload = {
    type: typeRule.value,
    price_per_night: typeRulePrice.value,
    start_date: starDate.value,
    end_date: endDate.value,
    min_nights: minNights.value,
    status: ruleStatus.value,
  }

  try {
    const resp = await $api(`/cabins/${props.cabin.id}/price-rules`, {
      method: 'POST',
      body: priceRulesPayload,
      onResponseError: ({ response }) => {
        console.error('Error saving cabin:', response.statusText)
        throw new Error(response.statusText || 'Error saving cabin')
      },
    })

    console.log('Cabin saved successfully:', resp)
    dialogVisibleUpdate(false)
  } catch (error) {
    console.error('Error submitting cabin:', error)
  }
}

const submitCabin = async () => {
  const validation = await refCabinForm.value?.validate()

  if (!validation?.valid)
    return

  const payload = {
    name: name.value,
    description: description.value,
    price_per_night: price_per_night.value,
    capacity: capacity.value,
    beds: beds.value,
    bathrooms: bathrooms.value,
    services: services.value,
    status: status.value,
  }

  console.log('Submitting cabin:', payload)

  try {
    const resp = await $api(`/cabins/${props.cabin.id}`, {
      method: 'PUT',
      body: payload,
      onResponseError: ({ response }) => {
        console.error('Error saving cabin:', response.statusText)
        throw new Error(response.statusText || 'Error saving cabin')
      },
    })

    console.log('Cabin saved successfully:', resp)
    dialogVisibleUpdate(false)
  } catch (error) {
    console.error('Error submitting cabin:', error)
  }
}

const loadCabinDetails = async () => {
  const dataCabint = await $api(`/cabins/${props.cabin.id}`, {
    method: 'GET',
    onResponseError: ({ response }) => {
      console.error('Error saving cabin:', response.statusText)
      throw new Error(response.statusText || 'Error saving cabin')
    },
  })

  name.value = dataCabint.name
  description.value = dataCabint.description
  price_per_night.value = dataCabint.price_per_night
  capacity.value = dataCabint.capacity
  beds.value = dataCabint.beds
  bathrooms.value = dataCabint.bathrooms
  services.value = dataCabint.services
  status.value = dataCabint.status

  console.log('Cabin details:', dataCabint)
}
const deleteItem = async (cabin) => {
  if (!confirm('Are you sure you want to delete this cabin?'))
    return

  try {
    await $api(`/cabins/${cabin.id}`, {
      method: 'DELETE',
      onResponseError: ({ response }) => {
        console.error('Error deleting cabin:', response.statusText)
        throw new Error(response.statusText || 'Error deleting cabin')
      },
    })

    console.log('Cabin deleted successfully')
    dialogVisibleUpdate(false)
  } catch (error) {
    console.error('Error deleting cabin:', error)
  }
}

onMounted(() => {
  console.log('EditCabin mounted')

  watch(() => props.isDialogEditVisible, val => {
    if (val)
      loadCabinDetails()
  })
})
</script>

<template>
  <VDialog :model-value="props.isDialogEditVisible" max-width="750" @update:model-value="dialogVisibleUpdate">
    <VCard flat class="pa-4">
      <VCardText>
        <VForm ref="refCabinForm" class="mt-2">
          <VRow>
            <VCol cols="12">
              <div class="text-h6 mb-4">General Information</div>
            </VCol>
          </VRow>

          <VRow>
            <VCol cols="12" md="6">
              <VTextField v-model="name" label="Cabin Name" placeholder="Las Palmas Cabin" :rules="[requiredValidator]"
                required />
            </VCol>
            <VCol cols="12" md="6">
              <VSelect v-model="status" :items="['available', 'maintenance', 'unavailable']" label="Status"
                placeholder="Select status" :rules="[requiredValidator]" required />
            </VCol>
            <VCol cols="12">
              <VTextarea v-model="description" class="border rounded" label="Description"
                placeholder="Brief description of the cabin..." :rules="[requiredValidator]" required />
            </VCol>
          </VRow>

          <VRow class="mt-2">
            <VCol cols="12">
              <div class="text-h6 mb-4">Details</div>
            </VCol>
          </VRow>

          <VRow>
            <VCol cols="12" md="6">
              <VTextField v-model="price_per_night" type="number" label="Base price per night" prefix="$" min="0"
                :rules="[requiredValidator]" required />
            </VCol>
            <VCol cols="12" md="6">
              <VTextField v-model="capacity" type="number" label="Guest Capacity" placeholder="4"
                :rules="[requiredValidator]" required />
            </VCol>
            <VCol cols="12" md="6">
              <VTextField v-model="beds" type="number" label="Number of Beds" placeholder="2"
                :rules="[requiredValidator]" required />
            </VCol>
            <VCol cols="12" md="6">
              <VTextField v-model="bathrooms" type="number" label="Number of Bathrooms" placeholder="1"
                :rules="[requiredValidator]" required />
            </VCol>
          </VRow>

          <VRow class="mt-2">
            <VCol cols="12">
              <div class="text-h6 mb-4">Extras</div>
            </VCol>
          </VRow>

          <VRow>
            <VCol cols="12">
              <VSelect v-model="services" :items="serviceList" multiple chips clearable label="Amenities"
                placeholder="Select amenities" :rules="[requiredValidator]" required />
            </VCol>
          </VRow>
        </VForm>

        <VDivider class="my-6" />

        <VForm ref="refPriceRuleForm">
          <VRow>
            <VCol cols="12">
              <div class="text-h6 mb-4">Price Rules</div>
            </VCol>
          </VRow>

          <VRow>
            <VCol cols="12" md="6">
              <VSelect v-model="typeRule" label="Price rule type" :items="[
                { title: 'Weekend', value: 'weekend' },
                { title: 'Date range', value: 'date_range' },
                { title: 'Minimum nights', value: 'min_nights' }
              ]" :rules="[requiredValidator]" required />
            </VCol>
            <VCol cols="12" md="6">
              <VTextField v-model="typeRulePrice" label="Rule price per night" type="number" prefix="$" min="0"
                :rules="[requiredValidator]" required />
            </VCol>
            <VCol cols="12" md="6">
              <VTextField v-model="starDate" label="Start date" type="date" :rules="[requiredValidator]" required />
            </VCol>
            <VCol cols="12" md="6">
              <VTextField v-model="endDate" label="End date" type="date" :rules="[requiredValidator]" required />
            </VCol>
            <VCol cols="12" md="6">
              <VTextField v-model="minNights" label="Minimum nights" type="number" min="1" :rules="[requiredValidator]"
                required />
            </VCol>
            <VCol cols="12" md="6">
              <VSelect v-model="ruleStatus" label="Rule status" :items="[
                { title: 'Active', value: true },
                { title: 'Inactive', value: false }
              ]" :rules="[requiredValidator]" required />
            </VCol>
          </VRow>

          <VCardText class="px-0 pt-2">
            <VBtn @click="submitRulePrice">Save price rule</VBtn>
          </VCardText>
        </VForm>

        <VDivider class="my-6" />

        <VRow>
          <VCol cols="12">
            <div class="text-h6 mb-4">Images</div>
          </VCol>
          <VCol cols="12">
            <VFileInput multiple label="File input" density="compact" />
          </VCol>
        </VRow>
      </VCardText>

      <VDivider />

      <VCardText class="d-flex gap-4">
        <VBtn @click="submitCabin">Save</VBtn>
        <VBtn color="secondary" variant="tonal" @click="emit('update:isDialogEditVisible', false)">
          Cancel
        </VBtn>
        <VBtn color="error" variant="tonal" @click="deleteItem(props.cabin)">
          Delete
        </VBtn>
      </VCardText>
    </VCard>
  </VDialog>
</template>
