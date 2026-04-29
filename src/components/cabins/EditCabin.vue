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
const images = ref([])
const imagesBaseUrl = import.meta.env.VITE_IMAGES_BASE_URL
const updatingMainImageId = ref(null)
const deletingImageId = ref(null)
let cabinImagesPayload = ref([])
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
  if (!val)
    cabinImagesPayload.value = []

  emit('update:isDialogEditVisible', val)
}

const getImageUrl = image => {
  if (!image?.url)
    return ''

  if (image.url.startsWith('http'))
    return image.url

  return `${imagesBaseUrl || ''}${image.url}`
}

const setMainImage = async selectedImage => {
  if (!selectedImage?.id)
    return

  const previousImages = images.value.map(image => ({ ...image }))

  images.value = images.value.map(image => ({
    ...image,
    is_main: image.id === selectedImage.id,
  }))

  updatingMainImageId.value = selectedImage.id

  try {
    await $api(`/cabins/${props.cabin.id}/images/${selectedImage.id}/main`, {
      method: 'PATCH',
      onResponseError: ({ response }) => {
        throw new Error(response.statusText || 'Error updating main image')
      },
    })
  } catch (error) {
    images.value = previousImages
    console.error('Error updating main image:', error)
  } finally {
    updatingMainImageId.value = null
  }
}

const deleteExistingImage = async imageToDelete => {
  if (!imageToDelete?.id)
    return

  if (!confirm('Are you sure you want to delete this image?'))
    return

  deletingImageId.value = imageToDelete.id

  try {
    await $api(`/cabins/${props.cabin.id}/images/${imageToDelete.id}`, {
      method: 'DELETE',
      onResponseError: ({ response }) => {
        throw new Error(response.statusText || 'Error deleting image')
      },
    })

    images.value = images.value.filter(image => image.id !== imageToDelete.id)
  } catch (error) {
    console.error('Error deleting image:', error)
  } finally {
    deletingImageId.value = null
  }
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
const submitCabinImages = async () => {
  const formData = new FormData()
  cabinImagesPayload.value.forEach((file, index) => {
    formData.append(`images[${index}]`, file)
  })

  try {
    const resp = await $api(`/cabins/${props.cabin.id}/images`, {
      method: 'POST',
      body: formData,
      onResponseError: ({ response }) => {
        console.error('Error uploading images:', response.statusText)
        throw new Error(response.statusText || 'Error uploading images')
      },
    })

    console.log('Images uploaded successfully:', resp)
  } catch (error) {
    console.error('Error uploading images:', error)
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

  if (cabinImagesPayload.value.length > 0) {
    submitCabinImages()
  }

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
  images.value = dataCabint.images || []



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
    else
      cabinImagesPayload.value = []
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
            <div class="text-subtitle-1 font-weight-medium mb-4">Existing Images</div>

            <VRow v-if="images.length">
              <VCol v-for="(image, index) in images" :key="image.id || index" cols="12" sm="6" lg="4">
                <VCard variant="outlined" class="h-100 overflow-hidden">
                  <VImg :src="getImageUrl(image)" height="240" cover class="bg-grey-lighten-3">
                    <div class="d-flex justify-space-between align-start pa-3">
                      <VChip v-if="image.is_main" color="primary" size="small" label>
                        Main image
                      </VChip>
                    </div>
                  </VImg>

                  <VCardText class="pa-4">
                    <div class="d-flex justify-space-between align-center gap-4 flex-wrap">
                      <VCheckbox :model-value="!!image.is_main"
                        :label="image.is_main ? 'Main image' : 'Set as main image'" color="primary" hide-details
                        :disabled="updatingMainImageId === image.id"
                        @update:model-value="value => value && setMainImage(image)" />

                      <VBtn color="error" variant="tonal" :loading="deletingImageId === image.id"
                        @click="deleteExistingImage(image)">
                        Delete
                      </VBtn>
                    </div>
                  </VCardText>
                </VCard>
              </VCol>
            </VRow>

            <VAlert v-else type="info" variant="tonal" text="This cabin does not have images yet." />
          </VCol>

          <VCol cols="12">
            <VFileInput v-model="cabinImagesPayload" multiple label="Upload new images" density="comfortable"
              prepend-icon="ri-image-add-line" />
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
