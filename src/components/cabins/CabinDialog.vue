<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { requiredValidator } from '@/@core/utils/validators'

const emit = defineEmits(['update:isDialogVisible', 'cabin-saved'])

const props = defineProps({
  isDialogVisible: {
    type: Boolean,
    required: true,
  },
  cabin: {
    type: Object,
    default: null,
  },
})

const isEditMode = computed(() => !!props.cabin?.id)

const refCabinForm = ref()
const refPriceRuleForm = ref()
const activeTab = ref(0)

const name = ref('')
const description_title = ref('')
const description = ref('')
const price_per_night = ref(null)
const capacity = ref(null)
const beds = ref(null)
const bathrooms = ref(null)
const check_in = ref('')
const check_out = ref('')
const lat = ref(null)
const lng = ref(null)
const mapContainer = ref(null)
let mapInstance = null
let mapMarker = null
const selectedFeatures = ref([])
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
const cabinImagesPayload = ref([])
const previewUrls = ref([])
const uploadingImages = ref(false)

const featureList = ref([])
const loadingFeatures = ref(false)
const submitting = ref(false)
const submittingRule = ref(false)

const showNewFeatureForm = ref(false)
const newFeatureName = ref('')
const creatingFeature = ref(false)

const statusItems = [
  { title: 'Available', value: 'available' },
  { title: 'Maintenance', value: 'maintenance' },
  { title: 'Unavailable', value: 'unavailable' },
]

const priceRuleTypes = [
  { title: 'Weekend', value: 'weekend' },
  { title: 'Date range', value: 'date_range' },
  { title: 'Minimum nights', value: 'min_nights' },
]

const dialogVisibleUpdate = val => {
  if (!val) {
    previewUrls.value.forEach(url => URL.revokeObjectURL(url))
    cabinImagesPayload.value = []
    previewUrls.value = []
  }
  emit('update:isDialogVisible', val)
}

const resetForm = () => {
  name.value = ''
  description_title.value = ''
  description.value = ''
  price_per_night.value = null
  capacity.value = null
  beds.value = null
  bathrooms.value = null
  check_in.value = ''
  check_out.value = ''
  lat.value = null
  lng.value = null
  selectedFeatures.value = []
  status.value = 'available'
  images.value = []
  showNewFeatureForm.value = false
  newFeatureName.value = ''
  activeTab.value = 0
  refCabinForm.value?.reset()
}

// ─── Images ──────────────────────────────────────────────────────────────────

const getImageUrl = image => {
  if (!image?.url) return ''
  if (image.url.startsWith('http')) return image.url
  return `${imagesBaseUrl || ''}${image.url}`
}

watch(cabinImagesPayload, files => {
  previewUrls.value.forEach(url => URL.revokeObjectURL(url))
  previewUrls.value = files ? files.map(f => URL.createObjectURL(f)) : []
}, { deep: true })

const removeFileFromPayload = index => {
  URL.revokeObjectURL(previewUrls.value[index])
  previewUrls.value.splice(index, 1)
  cabinImagesPayload.value = cabinImagesPayload.value.filter((_, i) => i !== index)
}

const setMainImage = async selectedImage => {
  if (!selectedImage?.id) return

  const previousImages = images.value.map(img => ({ ...img }))
  images.value = images.value.map(img => ({
    ...img,
    is_main: img.id === selectedImage.id,
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
  if (!imageToDelete?.id) return
  if (!confirm('Are you sure you want to delete this image?')) return

  deletingImageId.value = imageToDelete.id
  try {
    await $api(`/cabins/${props.cabin.id}/images/${imageToDelete.id}`, {
      method: 'DELETE',
      onResponseError: ({ response }) => {
        throw new Error(response.statusText || 'Error deleting image')
      },
    })
    images.value = images.value.filter(img => img.id !== imageToDelete.id)
  } catch (error) {
    console.error('Error deleting image:', error)
  } finally {
    deletingImageId.value = null
  }
}

const uploadImages = async () => {
  if (!cabinImagesPayload.value.length) return

  const formData = new FormData()
  cabinImagesPayload.value.forEach((file, index) => {
    formData.append(`images[${index}]`, file)
  })

  uploadingImages.value = true
  try {
    await $api(`/cabins/${props.cabin.id}/images`, {
      method: 'POST',
      body: formData,
      onResponseError: ({ response }) => {
        throw new Error(response.statusText || 'Error uploading images')
      },
    })
    previewUrls.value.forEach(url => URL.revokeObjectURL(url))
    cabinImagesPayload.value = []
    previewUrls.value = []
    await loadCabinDetails()
  } catch (error) {
    console.error('Error uploading images:', error)
  } finally {
    uploadingImages.value = false
  }
}

// ─── Price Rules ──────────────────────────────────────────────────────────────

const submitRulePrice = async () => {
  const validation = await refPriceRuleForm.value?.validate()
  if (!validation?.valid) return

  submittingRule.value = true

  const priceRulesPayload = {
    type: typeRule.value,
    price_per_night: typeRulePrice.value,
    start_date: starDate.value,
    end_date: endDate.value,
    min_nights: minNights.value,
    status: ruleStatus.value,
  }

  try {
    await $api(`/cabins/${props.cabin.id}/price-rules`, {
      method: 'POST',
      body: priceRulesPayload,
      onResponseError: ({ response }) => {
        throw new Error(response.statusText || 'Error saving price rule')
      },
    })
    refPriceRuleForm.value?.reset()
  } catch (error) {
    console.error('Error submitting price rule:', error)
  } finally {
    submittingRule.value = false
  }
}

// ─── Features ────────────────────────────────────────────────────────────────

const loadFeatures = async () => {
  loadingFeatures.value = true
  try {
    const resp = await $api('/features', { method: 'GET' })
    featureList.value = resp.data ?? resp
  } catch (error) {
    console.error('Error loading features:', error)
  } finally {
    loadingFeatures.value = false
  }
}

const createFeature = async () => {
  if (!newFeatureName.value.trim()) return
  creatingFeature.value = true
  try {
    const resp = await $api('/features', {
      method: 'POST',
      body: { name: newFeatureName.value.trim() },
    })
    const feature = resp.data ?? resp
    featureList.value.push(feature)
    selectedFeatures.value.push(feature.id)
    newFeatureName.value = ''
    showNewFeatureForm.value = false
  } catch (error) {
    console.error('Error creating feature:', error)
  } finally {
    creatingFeature.value = false
  }
}

// ─── Cabin ────────────────────────────────────────────────────────────────────

const loadCabinDetails = async () => {
  const dataCabin = await $api(`/cabins/${props.cabin.id}`, {
    method: 'GET',
    onResponseError: ({ response }) => {
      throw new Error(response.statusText || 'Error loading cabin')
    },
  })

  name.value = dataCabin.name
  description_title.value = dataCabin.description_title ?? ''
  description.value = dataCabin.description
  price_per_night.value = dataCabin.price_per_night
  capacity.value = dataCabin.capacity
  beds.value = dataCabin.beds
  bathrooms.value = dataCabin.bathrooms
  check_in.value = dataCabin.check_in ?? ''
  check_out.value = dataCabin.check_out ?? ''
  lat.value = dataCabin.lat ?? null
  lng.value = dataCabin.lng ?? null
  status.value = dataCabin.status
  images.value = dataCabin.images || []

  if (dataCabin.features?.length) {
    selectedFeatures.value = dataCabin.features.map(f => f.id)
  } else if (dataCabin.services?.length) {
    selectedFeatures.value = featureList.value
      .filter(f => dataCabin.services.includes(f.name))
      .map(f => f.id)
  } else {
    selectedFeatures.value = []
  }
}

const submitCabin = async () => {
  const validation = await refCabinForm.value?.validate()
  if (!validation?.valid) return

  submitting.value = true

  const payload = {
    name: name.value,
    description_title: description_title.value,
    description: description.value,
    price_per_night: price_per_night.value,
    capacity: capacity.value,
    beds: beds.value,
    bathrooms: bathrooms.value,
    check_in: check_in.value,
    check_out: check_out.value,
    lat: lat.value,
    lng: lng.value,
    status: status.value,
  }

  try {
    const resp = isEditMode.value
      ? await $api(`/cabins/${props.cabin.id}`, {
        method: 'PUT',
        body: payload,
        onResponseError: ({ response }) => { throw new Error(response.statusText || 'Error saving cabin') },
      })
      : await $api('/cabins', {
        method: 'POST',
        body: payload,
        onResponseError: ({ response }) => { throw new Error(response.statusText || 'Error creating cabin') },
      })

    const cabin = resp.data ?? resp

    if (selectedFeatures.value.length > 0) {
      await $api(`/cabins/${cabin.id}/features`, {
        method: 'POST',
        body: { features: selectedFeatures.value },
        onResponseError: ({ response }) => { throw new Error(response.statusText || 'Error syncing features') },
      })
    }

    emit('cabin-saved', cabin)
    dialogVisibleUpdate(false)
  } catch (error) {
    console.error('Error submitting cabin:', error)
  } finally {
    submitting.value = false
  }
}

const deleteItem = async () => {
  if (!confirm('Are you sure you want to delete this cabin?')) return

  try {
    await $api(`/cabins/${props.cabin.id}`, {
      method: 'DELETE',
      onResponseError: ({ response }) => {
        throw new Error(response.statusText || 'Error deleting cabin')
      },
    })
    dialogVisibleUpdate(false)
  } catch (error) {
    console.error('Error deleting cabin:', error)
  }
}

// ─── Map ──────────────────────────────────────────────────────────────────────

watch([lat, lng], ([newLat, newLng]) => {
  const L = window.L
  if (!mapInstance || !L || !newLat || !newLng) return
  const latlng = [parseFloat(newLat), parseFloat(newLng)]
  if (mapMarker) {
    mapMarker.setLatLng(latlng)
  } else {
    mapMarker = L.marker(latlng).addTo(mapInstance)
  }
  mapInstance.setView(latlng, mapInstance.getZoom())
})

const initMap = async () => {
  await nextTick()
  const L = window.L
  if (!L || !mapContainer.value || mapInstance) return

  const defaultLat = lat.value ?? 19.4326
  const defaultLng = lng.value ?? -99.1332

  mapInstance = L.map(mapContainer.value).setView([defaultLat, defaultLng], 12)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(mapInstance)

  if (lat.value && lng.value) {
    mapMarker = L.marker([lat.value, lng.value]).addTo(mapInstance)
  }

  mapInstance.on('click', e => {
    lat.value = parseFloat(e.latlng.lat.toFixed(6))
    lng.value = parseFloat(e.latlng.lng.toFixed(6))
    if (mapMarker) {
      mapMarker.setLatLng(e.latlng)
    } else {
      mapMarker = L.marker(e.latlng).addTo(mapInstance)
    }
  })
}

const destroyMap = () => {
  if (mapInstance) {
    mapInstance.remove()
    mapInstance = null
    mapMarker = null
  }
}
const goToPage = cabinId => {
  const url = `https://rockycabinsretreat.webflow.io/cabin?id=${cabinId}`
  window.open(url, '_blank')
}

onMounted(() => {
  watch(() => props.isDialogVisible, async val => {
    if (val) {
      activeTab.value = 0
      await loadFeatures()
      if (isEditMode.value) await loadCabinDetails()
    } else {
      destroyMap()
      resetForm()
    }
  })

  watch(activeTab, async newTab => {
    if (newTab === 3) {
      if (!mapInstance) {
        await initMap()
      } else {
        await nextTick()
        mapInstance?.invalidateSize()
      }
    }
  })
})

onUnmounted(() => destroyMap())
</script>

<template>
  <VDialog :model-value="props.isDialogVisible" max-width="860" scrollable @update:model-value="dialogVisibleUpdate">
    <VCard flat>

      <!-- Header -->
      <VCardText class="d-flex justify-space-between align-center px-6 py-4">
        <div>
          <div class="text-h5 font-weight-bold">{{ isEditMode ? 'Edit Cabin' : 'New Cabin' }}</div>
          <div class="text-body-2 text-medium-emphasis mt-1">
            {{ isEditMode ? 'Update information for this cabin' : 'Fill in the details to register a new cabin' }}
          </div>
        </div>
        <VBtn icon variant="text" size="small" @click="dialogVisibleUpdate(false)">
          <VIcon>ri-close-line</VIcon>
        </VBtn>
      </VCardText>

      <VDivider />

      <!-- Tabs -->
      <VTabs v-model="activeTab" color="primary" class="px-2">
        <VTab>
          <VIcon start icon="ri-information-line" />
          General
        </VTab>
        <VTab>
          <VIcon start icon="ri-hotel-bed-line" />
          Details
        </VTab>
        <VTab>
          <VIcon start icon="ri-star-line" />
          Amenities
        </VTab>
        <VTab>
          <VIcon start icon="ri-map-pin-line" />
          Location
        </VTab>
        <VTab :disabled="!isEditMode">
          <VIcon start icon="ri-image-line" />
          Images
          <VChip v-if="images.length" size="x-small" color="primary" class="ml-2">
            {{ images.length }}
          </VChip>
        </VTab>
        <VTab :disabled="!isEditMode">
          <VIcon start icon="ri-price-tag-3-line" />
          Price Rules
        </VTab>
      </VTabs>

      <VDivider />

      <VCardText class="px-6 py-5" style="min-height: 440px;">

        <!-- Tabs 0-3 share one form so Save validates everything at once -->
        <VForm ref="refCabinForm">
          <VWindow v-model="activeTab">

            <!-- ── Tab 0: General ───────────────────────────────────────────── -->
            <VWindowItem>
              <div class="d-flex align-center gap-2 mb-4">
                <VIcon size="18" color="primary">ri-information-line</VIcon>
                <span class="text-subtitle-1 font-weight-semibold">General Information</span>
              </div>

              <VRow>
                <VCol cols="12" md="6">
                  <VTextField v-model="name" label="Cabin Name" placeholder="Las Palmas Cabin"
                    prepend-inner-icon="ri-home-3-line" :rules="[requiredValidator]" />
                </VCol>
                <VCol cols="12" md="6">
                  <VSelect v-model="status" :items="statusItems" label="Status" prepend-inner-icon="ri-toggle-line"
                    :rules="[requiredValidator]" />
                </VCol>
                <VCol cols="12">
                  <VTextField v-model="description_title" label="Description Title"
                    placeholder="e.g. Cozy mountain retreat with stunning views" prepend-inner-icon="ri-text"
                    :rules="[requiredValidator]" />
                </VCol>
                <VCol cols="12">
                  <VTextarea v-model="description" label="Description" placeholder="Brief description of the cabin..."
                    rows="4" auto-grow :rules="[requiredValidator]" />
                </VCol>
              </VRow>
            </VWindowItem>

            <!-- ── Tab 1: Details ───────────────────────────────────────────── -->
            <VWindowItem>
              <div class="d-flex align-center gap-2 mb-4">
                <VIcon size="18" color="primary">ri-hotel-bed-line</VIcon>
                <span class="text-subtitle-1 font-weight-semibold">Cabin Details</span>
              </div>

              <VRow>
                <VCol cols="12" md="6">
                  <VTextField v-model="price_per_night" type="number" label="Price per Night" placeholder="1500"
                    prefix="$" min="0" prepend-inner-icon="ri-money-dollar-circle-line" :rules="[requiredValidator]" />
                </VCol>
                <VCol cols="12" md="6">
                  <VTextField v-model="capacity" type="number" label="Guest Capacity" placeholder="4" min="1"
                    prepend-inner-icon="ri-group-line" :rules="[requiredValidator]" />
                </VCol>
                <VCol cols="12" md="6">
                  <VTextField v-model="beds" type="number" label="Number of Beds" placeholder="2" min="1"
                    prepend-inner-icon="ri-hotel-bed-line" :rules="[requiredValidator]" />
                </VCol>
                <VCol cols="12" md="6">
                  <VTextField v-model="bathrooms" type="number" label="Number of Bathrooms" placeholder="1" min="1"
                    prepend-inner-icon="ri-drop-line" :rules="[requiredValidator]" />
                </VCol>
                <VCol cols="12" md="6">
                  <VTextField v-model="check_in" type="time" label="Check-in Time"
                    prepend-inner-icon="ri-login-box-line" :rules="[requiredValidator]" />
                </VCol>
                <VCol cols="12" md="6">
                  <VTextField v-model="check_out" type="time" label="Check-out Time"
                    prepend-inner-icon="ri-logout-box-line" :rules="[requiredValidator]" />
                </VCol>
              </VRow>
            </VWindowItem>

            <!-- ── Tab 2: Amenities ─────────────────────────────────────────── -->
            <VWindowItem>
              <div class="d-flex justify-space-between align-center mb-4">
                <div class="d-flex align-center gap-2">
                  <VIcon size="18" color="primary">ri-star-line</VIcon>
                  <span class="text-subtitle-1 font-weight-semibold">Amenities & Features</span>
                </div>
                <VBtn size="small" variant="tonal" prepend-icon="ri-add-line"
                  @click="showNewFeatureForm = !showNewFeatureForm">
                  New Feature
                </VBtn>
              </div>

              <VExpandTransition>
                <div v-if="showNewFeatureForm" class="mb-4">
                  <VCard variant="outlined" class="pa-4 rounded-lg">
                    <div class="text-body-2 font-weight-medium mb-3 text-medium-emphasis">
                      Create and auto-select a new feature
                    </div>
                    <div class="d-flex gap-3 align-start">
                      <VTextField v-model="newFeatureName" label="Feature name" placeholder="e.g. Fireplace"
                        density="compact" hide-details class="flex-grow-1" @keyup.enter="createFeature" />
                      <VBtn color="primary" variant="tonal" size="small" :loading="creatingFeature" class="mt-1"
                        @click="createFeature">
                        Create
                      </VBtn>
                      <VBtn variant="text" size="small" class="mt-1"
                        @click="showNewFeatureForm = false; newFeatureName = ''">
                        Cancel
                      </VBtn>
                    </div>
                  </VCard>
                </div>
              </VExpandTransition>

              <div v-if="loadingFeatures" class="d-flex justify-center py-8">
                <VProgressCircular indeterminate color="primary" size="32" />
              </div>

              <VRow v-else>
                <VCol cols="12">
                  <VSelect v-model="selectedFeatures" :items="featureList.map(f => ({ title: f.name, value: f.id }))"
                    multiple chips closable-chips clearable label="Select amenities" prepend-inner-icon="ri-apps-line"
                    no-data-text="No features available. Create one above." />
                </VCol>
              </VRow>
            </VWindowItem>

            <!-- ── Tab 3: Location ─────────────────────────────────────────── -->
            <VWindowItem>
              <div class="d-flex align-center gap-2 mb-4">
                <VIcon size="18" color="primary">ri-map-pin-line</VIcon>
                <span class="text-subtitle-1 font-weight-semibold">Cabin Location</span>
              </div>

              <VRow class="mb-2">
                <VCol cols="12" md="6">
                  <VTextField v-model="lat" type="number" label="Latitude" placeholder="19.432608" step="0.000001"
                    prepend-inner-icon="ri-map-pin-line" hint="Updated automatically when clicking the map"
                    persistent-hint />
                </VCol>
                <VCol cols="12" md="6">
                  <VTextField v-model="lng" type="number" label="Longitude" placeholder="-99.133209" step="0.000001"
                    prepend-inner-icon="ri-map-pin-2-line" hint="Updated automatically when clicking the map"
                    persistent-hint />
                </VCol>
                <VCol cols="12">
                  <div class="text-body-2 text-medium-emphasis mb-2">
                    Click anywhere on the map to set the cabin coordinates
                  </div>
                  <div ref="mapContainer" style="height: 360px; z-index: 0;"
                    class="rounded-lg overflow-hidden border" />
                </VCol>
              </VRow>
            </VWindowItem>

          </VWindow>
        </VForm>

        <!-- ── Tab 4: Images ──────────────────────────────────────────────── -->
        <div v-show="activeTab === 4">
          <div class="d-flex align-center gap-2 mb-4">
            <VIcon size="18" color="primary">ri-upload-cloud-2-line</VIcon>
            <span class="text-subtitle-1 font-weight-semibold">Upload New Images</span>
          </div>

          <VFileInput v-model="cabinImagesPayload" multiple accept="image/*" label="Select images to upload"
            density="comfortable" prepend-icon="ri-image-add-line" hide-details :show-size="1000" class="mb-4" />

          <div v-if="previewUrls.length" class="mb-2">
            <div class="text-body-2 text-medium-emphasis font-weight-medium mb-3">
              Selected — {{ previewUrls.length }} {{ previewUrls.length === 1 ? 'image' : 'images' }}
            </div>
            <VRow dense>
              <VCol v-for="(url, index) in previewUrls" :key="index" cols="6" sm="4" md="3">
                <VCard variant="outlined" class="overflow-hidden position-relative">
                  <VImg :src="url" height="110" cover class="bg-grey-lighten-3" />
                  <VBtn icon size="x-small" color="error" variant="flat" class="position-absolute top-0 right-0 ma-1"
                    @click="removeFileFromPayload(index)">
                    <VIcon size="14">ri-close-line</VIcon>
                  </VBtn>
                  <div class="px-2 py-1">
                    <div class="text-caption text-truncate text-medium-emphasis">
                      {{ cabinImagesPayload[index]?.name }}
                    </div>
                  </div>
                </VCard>
              </VCol>
            </VRow>
            <div class="mt-4">
              <VBtn color="primary" prepend-icon="ri-upload-cloud-2-line" :loading="uploadingImages"
                @click="uploadImages">
                Upload {{ previewUrls.length }} {{ previewUrls.length === 1 ? 'Image' : 'Images' }}
              </VBtn>
            </div>
          </div>

          <VDivider class="my-5" />

          <div class="d-flex align-center gap-2 mb-4">
            <VIcon size="18" color="primary">ri-gallery-line</VIcon>
            <span class="text-subtitle-1 font-weight-semibold">Existing Images</span>
            <VChip size="x-small" color="secondary">{{ images.length }}</VChip>
          </div>

          <VRow v-if="images.length">
            <VCol v-for="(image, index) in images" :key="image.id || index" cols="12" sm="6" lg="4">
              <VCard variant="outlined" class="overflow-hidden h-100">
                <VImg :src="getImageUrl(image)" height="200" cover class="bg-grey-lighten-3">
                  <div class="d-flex pa-3">
                    <VChip v-if="image.is_main" color="primary" size="small" label>Main image</VChip>
                  </div>
                </VImg>
                <VCardText class="pa-3">
                  <div class="d-flex justify-space-between align-center gap-3">
                    <VCheckbox :model-value="!!image.is_main" :label="image.is_main ? 'Main image' : 'Set as main'"
                      color="primary" density="compact" hide-details :disabled="updatingMainImageId === image.id"
                      @update:model-value="value => value && setMainImage(image)" />
                    <VBtn color="error" variant="tonal" size="small" :loading="deletingImageId === image.id"
                      @click="deleteExistingImage(image)">
                      Delete
                    </VBtn>
                  </div>
                </VCardText>
              </VCard>
            </VCol>
          </VRow>
          <VAlert v-else type="info" variant="tonal" class="mb-4" text="This cabin has no images yet." />
        </div>

        <!-- ── Tab 5: Price Rules ─────────────────────────────────────────── -->
        <div v-show="activeTab === 5">
          <VForm ref="refPriceRuleForm">
            <div class="d-flex align-center gap-2 mb-4">
              <VIcon size="18" color="primary">ri-price-tag-3-line</VIcon>
              <span class="text-subtitle-1 font-weight-semibold">Add Price Rule</span>
            </div>

            <VRow>
              <VCol cols="12" md="6">
                <VSelect v-model="typeRule" label="Rule type" :items="priceRuleTypes" :rules="[requiredValidator]" />
              </VCol>
              <VCol cols="12" md="6">
                <VTextField v-model="typeRulePrice" label="Rule price per night" type="number" prefix="$" min="0"
                  :rules="[requiredValidator]" />
              </VCol>
              <VCol cols="12" md="6">
                <VTextField v-model="starDate" label="Start date" type="date" :rules="[requiredValidator]" />
              </VCol>
              <VCol cols="12" md="6">
                <VTextField v-model="endDate" label="End date" type="date" :rules="[requiredValidator]" />
              </VCol>
              <VCol cols="12" md="6">
                <VTextField v-model="minNights" label="Minimum nights" type="number" min="1"
                  :rules="[requiredValidator]" />
              </VCol>
              <VCol cols="12" md="6">
                <VSelect v-model="ruleStatus" label="Rule status" :items="[
                  { title: 'Active', value: true },
                  { title: 'Inactive', value: false },
                ]" :rules="[requiredValidator]" />
              </VCol>
            </VRow>

            <div class="pt-2 pb-1">
              <VBtn variant="tonal" color="primary" prepend-icon="ri-price-tag-3-line" :loading="submittingRule"
                @click="submitRulePrice">
                Save Price Rule
              </VBtn>
            </div>
          </VForm>
        </div>

      </VCardText>

      <VDivider />

      <!-- Footer Actions -->
      <VCardText class="d-flex gap-3 pa-4">
        <template v-if="activeTab < 4">
          <VBtn color="primary" :loading="submitting" prepend-icon="ri-save-line" @click="submitCabin">
            {{ isEditMode ? 'Save Changes' : 'Create Cabin' }}
          </VBtn>
          <VBtn color="secondary" variant="tonal" @click="dialogVisibleUpdate(false)">
            Cancel
          </VBtn>
          <VBtn color="secondary" variant="tonal" @click="goToPage(props.cabin.id)" v-if="isEditMode">
            Go to Web Page
          </VBtn>
        </template>
        <template v-else>
          <VBtn color="secondary" variant="tonal" @click="dialogVisibleUpdate(false)">
            Close
          </VBtn>
        </template>
        <VSpacer />
        <VBtn v-if="isEditMode" color="error" variant="tonal" prepend-icon="ri-delete-bin-line" @click="deleteItem">
          Delete Cabin
        </VBtn>
      </VCardText>

    </VCard>
  </VDialog>
</template>
