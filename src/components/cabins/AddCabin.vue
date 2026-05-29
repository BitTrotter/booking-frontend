<script setup>
import { ref, watch } from 'vue'
import { requiredValidator } from '@/@core/utils/validators'

const props = defineProps({
  isDialogVisible: {
    type: Boolean,
    required: true,
  },
})

const emit = defineEmits(['update:isDialogVisible', 'cabin-created'])

const name = ref('')
const description = ref('')
const price_per_night = ref(null)
const capacity = ref(null)
const beds = ref(null)
const bathrooms = ref(null)
const selectedFeatures = ref([])
const status = ref('available')

const featureList = ref([])
const loadingFeatures = ref(false)
const submitting = ref(false)

const showNewFeatureForm = ref(false)
const newFeatureName = ref('')
const creatingFeature = ref(false)

const statusItems = [
  { title: 'Available', value: 'available' },
  { title: 'Maintenance', value: 'maintenance' },
  { title: 'Unavailable', value: 'unavailable' },
]

const dialogVisibleUpdate = val => {
  emit('update:isDialogVisible', val)
}

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

const submitCabin = async () => {
  submitting.value = true

  const payload = {
    name: name.value,
    description: description.value,
    price_per_night: price_per_night.value,
    capacity: capacity.value,
    beds: beds.value,
    bathrooms: bathrooms.value,
    status: status.value,
  }

  try {
    const resp = await $api('/cabins', {
      method: 'POST',
      body: payload,
      onResponseError: ({ response }) => {
        throw new Error(response.statusText || 'Error saving cabin')
      },
    })

    const cabin = resp.data ?? resp

    if (selectedFeatures.value.length > 0) {
      await $api(`/cabins/${cabin.id}/features`, {
        method: 'POST',
        body: { features: selectedFeatures.value },
        onResponseError: ({ response }) => {
          throw new Error(response.statusText || 'Error assigning features')
        },
      })
    }

    emit('cabin-created', cabin)
    resetForm()
    dialogVisibleUpdate(false)
  } catch (error) {
    console.error('Error submitting cabin:', error)
  } finally {
    submitting.value = false
  }
}

const resetForm = () => {
  name.value = ''
  description.value = ''
  price_per_night.value = null
  capacity.value = null
  beds.value = null
  bathrooms.value = null
  selectedFeatures.value = []
  status.value = 'available'
  showNewFeatureForm.value = false
  newFeatureName.value = ''
}

watch(() => props.isDialogVisible, val => {
  if (val) loadFeatures()
  else resetForm()
})
</script>

<template>
  <AppFormDialog
    :model-value="props.isDialogVisible"
    title="New Cabin"
    subtitle="Fill in the details to register a new cabin"
    :max-width="700"
    submit-text="Save Cabin"
    submit-icon="ri-save-line"
    validate-on-submit
    flat
    :loading="submitting"
    @update:model-value="dialogVisibleUpdate"
    @submit="submitCabin"
  >
    <!-- General Information -->
    <div class="d-flex align-center gap-2 mb-4">
      <VIcon
        size="18"
        color="primary"
      >
        ri-information-line
      </VIcon>
      <span class="text-subtitle-1 font-weight-semibold">General Information</span>
    </div>

    <VRow>
      <VCol
        cols="12"
        md="6"
      >
        <VTextField
          v-model="name"
          label="Cabin Name"
          placeholder="Las Palmas Cabin"
          prepend-inner-icon="ri-home-3-line"
          :rules="[requiredValidator]"
        />
      </VCol>
      <VCol
        cols="12"
        md="6"
      >
        <VSelect
          v-model="status"
          :items="statusItems"
          label="Status"
          prepend-inner-icon="ri-toggle-line"
          :rules="[requiredValidator]"
        />
      </VCol>
      <VCol cols="12">
        <VTextarea
          v-model="description"
          label="Description"
          placeholder="Brief description of the cabin..."
          rows="3"
          auto-grow
          :rules="[requiredValidator]"
        />
      </VCol>
    </VRow>

    <VDivider class="my-5" />

    <!-- Details -->
    <div class="d-flex align-center gap-2 mb-4">
      <VIcon
        size="18"
        color="primary"
      >
        ri-hotel-bed-line
      </VIcon>
      <span class="text-subtitle-1 font-weight-semibold">Details</span>
    </div>

    <VRow>
      <VCol
        cols="12"
        md="6"
      >
        <VTextField
          v-model="price_per_night"
          type="number"
          label="Price per Night"
          placeholder="1500"
          prefix="$"
          min="0"
          prepend-inner-icon="ri-money-dollar-circle-line"
          :rules="[requiredValidator]"
        />
      </VCol>
      <VCol
        cols="12"
        md="6"
      >
        <VTextField
          v-model="capacity"
          type="number"
          label="Guest Capacity"
          placeholder="4"
          min="1"
          prepend-inner-icon="ri-group-line"
          :rules="[requiredValidator]"
        />
      </VCol>
      <VCol
        cols="12"
        md="6"
      >
        <VTextField
          v-model="beds"
          type="number"
          label="Number of Beds"
          placeholder="2"
          min="1"
          prepend-inner-icon="ri-hotel-bed-line"
          :rules="[requiredValidator]"
        />
      </VCol>
      <VCol
        cols="12"
        md="6"
      >
        <VTextField
          v-model="bathrooms"
          type="number"
          label="Number of Bathrooms"
          placeholder="1"
          min="1"
          prepend-inner-icon="ri-drop-line"
          :rules="[requiredValidator]"
        />
      </VCol>
    </VRow>

    <VDivider class="my-5" />

    <!-- Amenities & Features -->
    <div class="d-flex justify-space-between align-center mb-4">
      <div class="d-flex align-center gap-2">
        <VIcon
          size="18"
          color="primary"
        >
          ri-star-line
        </VIcon>
        <span class="text-subtitle-1 font-weight-semibold">Amenities & Features</span>
      </div>
      <VBtn
        size="small"
        variant="tonal"
        prepend-icon="ri-add-line"
        @click="showNewFeatureForm = !showNewFeatureForm"
      >
        New Feature
      </VBtn>
    </div>

    <VExpandTransition>
      <div
        v-if="showNewFeatureForm"
        class="mb-4"
      >
        <VCard
          variant="outlined"
          class="pa-4 rounded-lg"
        >
          <div class="text-body-2 font-weight-medium mb-3 text-medium-emphasis">
            Create and auto-select a new feature
          </div>
          <div class="d-flex gap-3 align-start">
            <VTextField
              v-model="newFeatureName"
              label="Feature name"
              placeholder="e.g. Fireplace"
              density="compact"
              hide-details
              class="flex-grow-1"
              @keyup.enter="createFeature"
            />
            <VBtn
              color="primary"
              variant="tonal"
              size="small"
              :loading="creatingFeature"
              class="mt-1"
              @click="createFeature"
            >
              Create
            </VBtn>
            <VBtn
              variant="text"
              size="small"
              class="mt-1"
              @click="showNewFeatureForm = false; newFeatureName = ''"
            >
              Cancel
            </VBtn>
          </div>
        </VCard>
      </div>
    </VExpandTransition>

    <div
      v-if="loadingFeatures"
      class="d-flex justify-center py-5"
    >
      <VProgressCircular
        indeterminate
        color="primary"
        size="32"
      />
    </div>

    <VRow v-else>
      <VCol cols="12">
        <VSelect
          v-model="selectedFeatures"
          :items="featureList.map(f => ({ title: f.name, value: f.id }))"
          multiple
          chips
          closable-chips
          clearable
          label="Select amenities"
          prepend-inner-icon="ri-apps-line"
          no-data-text="No features available. Create one above."
          :rules="[requiredValidator]"
        />
      </VCol>
    </VRow>
  </AppFormDialog>
</template>
