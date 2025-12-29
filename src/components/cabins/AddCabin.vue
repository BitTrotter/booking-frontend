<script setup>
import { ref } from 'vue'

const emit = defineEmits(['update:isDialogVisible'])
const tab = ref('personal-info')
const name = ref('')
const description = ref('')
const price_per_night = ref(null)
const capacity = ref(null)
const beds = ref(null)
const bathrooms = ref(null)
const services = ref([])
const status = ref('available')
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
    'BBQ Grill'
]
const props = defineProps({
    isDialogVisible: {
        type: Boolean,
        required: true,
    },
})
const dialogVisibleUpdate = val => {
    emit('update:isDialogVisible', val)
}

const submitCabin = async () => {
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
    try {
        const resp = await $api('/cabins', {
        method: 'POST',
        body: payload,
        onResponseError: ({ response }) => {
            console.error('Error saving cabin:', response.statusText)
            throw new Error(response.statusText || 'Error saving cabin')
        }
        })
        console.log('Cabin saved successfully:', resp)
        resetForm()
        dialogVisibleUpdate(false)
    } catch (error) {
        console.error('Error submitting cabin:', error)
    }
}

const resetForm = () => {
  name.value = ''
  description.value = ''
  price_per_night.value = null
  capacity.value = null
  beds.value = null
  bathrooms.value = null
  services.value = []
  status.value = 'available'
}

</script>

<template>
    <VDialog :model-value="props.isDialogVisible" max-width="750" @update:model-value="dialogVisibleUpdate">
       <VCard flat class="pa-4">
  <VTabs v-model="tab">
    <VTab value="info-general">General Information</VTab>
    <VTab value="detalles">Details</VTab>
    <VTab value="extras">Extras</VTab>
  </VTabs>

  <VCardText>
    <VWindow v-model="tab" class="disable-tab-transition">
      <!-- TAB 1: General Information -->
      <VWindowItem value="info-general">
        <VForm class="mt-2">
          <VRow>
            <VCol cols="12" md="6">
              <VTextField
                v-model="name"
                label="Cabin Name"
                placeholder="Las Palmas Cabin"
              />
            </VCol>
            <VCol cols="12" md="6">
              <VSelect
                v-model="status"
                :items="['available', 'maintenance', 'unavailable']"
                label="Status"
                placeholder="Select status"
              />
            </VCol>
            <VCol cols="12">
              <VTextarea
                v-model="description"
                label="Description"
                placeholder="Brief description of the cabin..."
              />
            </VCol>
          </VRow>
        </VForm>
      </VWindowItem>

      <!-- TAB 2: Details -->
      <VWindowItem value="detalles">
        <VForm class="mt-2">
          <VRow>
            <VCol cols="12" md="6">
              <VTextField
                v-model="price_per_night"
                type="number"
                label="Price per Night"
                placeholder="1500"
              />
            </VCol>
            <VCol cols="12" md="6">
              <VTextField
                v-model="capacity"
                type="number"
                label="Guest Capacity"
                placeholder="4"
              />
            </VCol>
            <VCol cols="12" md="6">
              <VTextField
                v-model="beds"
                type="number"
                label="Number of Beds"
                placeholder="2"
              />
            </VCol>
            <VCol cols="12" md="6">
              <VTextField
                v-model="bathrooms"
                type="number"
                label="Number of Bathrooms"
                placeholder="1"
              />
            </VCol>
          </VRow>
        </VForm>
      </VWindowItem>

      <!-- TAB 3: Extras / Amenities -->
      <VWindowItem value="extras">
        <VForm class="mt-2">
          <VRow>
            <VCol cols="12" md="12">
              <VSelect
                v-model="services"
                :items="serviceList"
                multiple
                chips
                clearable
                label="Amenities"
                placeholder="Select amenities"
              />
            </VCol>
          </VRow>
        </VForm>
      </VWindowItem>
    </VWindow>
  </VCardText>

  <VDivider />

  <VCardText class="d-flex gap-4">
    <VBtn @click="submitCabin">Save</VBtn>
    <VBtn color="secondary" variant="tonal"  @click=" emit('update:isDialogtVisible', false)">Cancel</VBtn>
  </VCardText>
</VCard>
    </VDialog>

</template>
