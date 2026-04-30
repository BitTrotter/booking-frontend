<script setup>
const props = defineProps({
  isDialogVisible: { type: Boolean, required: true },
  cabin: { type: Object, default: null },
})

const emit = defineEmits(['update:isDialogVisible'])

const close = () => emit('update:isDialogVisible', false)

const imagesBaseUrl = import.meta.env.VITE_IMAGES_BASE_URL

const formatCurrency = amount =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(amount || 0))

const statusColor = status => ({
  available: 'success',
  maintenance: 'warning',
  unavailable: 'error',
}[status] || 'secondary')

const statusIcon = status => ({
  available: 'ri-checkbox-circle-line',
  maintenance: 'ri-tools-line',
  unavailable: 'ri-close-circle-line',
}[status] || 'ri-question-line')

const mainImage = computed(() => props.cabin?.images?.find(img => img.is_main) || props.cabin?.images?.[0] || null)

const getImageUrl = image => {
  if (!image?.url) return ''
  if (image.url.startsWith('http')) return image.url
  return `${imagesBaseUrl}/${image.url}`
}
</script>

<template>
  <VDialog :model-value="props.isDialogVisible" max-width="680" scrollable @update:model-value="close">
    <VCard v-if="cabin">
      <!-- Header -->
      <VCardItem class="pb-2">
        <template #prepend>
          <VAvatar :color="statusColor(cabin.status)" variant="tonal" rounded size="42">
            <VIcon icon="ri-home-line" size="22" />
          </VAvatar>
        </template>
        <VCardTitle class="text-h6">{{ cabin.name }}</VCardTitle>
        <VCardSubtitle>
          <VChip :color="statusColor(cabin.status)" size="x-small" label class="mt-1">
            <VIcon :icon="statusIcon(cabin.status)" size="12" class="me-1" />
            {{ cabin.status }}
          </VChip>
        </VCardSubtitle>
        <template #append>
          <VBtn icon variant="text" @click="close">
            <VIcon icon="ri-close-line" />
          </VBtn>
        </template>
      </VCardItem>

      <VDivider />

      <!-- Main image -->
      <div v-if="mainImage" class="cabin-image-wrapper">
        <VImg :src="getImageUrl(mainImage)" height="220" cover class="cabin-hero-img" />
        <div v-if="cabin.images?.length > 1" class="image-counter">
          <VIcon icon="ri-image-line" size="14" class="me-1" />
          {{ cabin.images.length }} photos
        </div>
      </div>
      <div v-else class="cabin-no-image d-flex align-center justify-center bg-surface-variant" style="block-size:120px;">
        <VIcon icon="ri-image-line" size="40" class="opacity-30" />
      </div>

      <VCardText class="pt-4">
        <VRow>
          <!-- Left column -->
          <VCol cols="12" md="7">
            <!-- Description -->
            <div v-if="cabin.description" class="mb-4">
              <div class="text-caption text-medium-emphasis text-uppercase font-weight-medium mb-1">
                <VIcon icon="ri-file-text-line" size="13" class="me-1" />Description
              </div>
              <div class="text-body-2">{{ cabin.description }}</div>
            </div>

            <!-- Specs grid -->
            <div class="mb-4">
              <div class="text-caption text-medium-emphasis text-uppercase font-weight-medium mb-2">
                <VIcon icon="ri-settings-3-line" size="13" class="me-1" />Details
              </div>
              <VRow dense>
                <VCol cols="6">
                  <VCard variant="tonal" color="primary" class="text-center pa-3">
                    <VIcon icon="ri-money-dollar-circle-line" size="20" class="mb-1" />
                    <div class="text-caption text-medium-emphasis">Price / Night</div>
                    <div class="text-body-1 font-weight-bold">{{ formatCurrency(cabin.price_per_night) }}</div>
                  </VCard>
                </VCol>
                <VCol cols="6">
                  <VCard variant="tonal" color="info" class="text-center pa-3">
                    <VIcon icon="ri-group-line" size="20" class="mb-1" />
                    <div class="text-caption text-medium-emphasis">Capacity</div>
                    <div class="text-body-1 font-weight-bold">{{ cabin.capacity ?? '—' }} guests</div>
                  </VCard>
                </VCol>
                <VCol cols="6">
                  <VCard variant="tonal" color="secondary" class="text-center pa-3 mt-2">
                    <VIcon icon="ri-hotel-bed-line" size="20" class="mb-1" />
                    <div class="text-caption text-medium-emphasis">Beds</div>
                    <div class="text-body-1 font-weight-bold">{{ cabin.beds ?? '—' }}</div>
                  </VCard>
                </VCol>
                <VCol cols="6">
                  <VCard variant="tonal" color="warning" class="text-center pa-3 mt-2">
                    <VIcon icon="ri-water-flash-line" size="20" class="mb-1" />
                    <div class="text-caption text-medium-emphasis">Bathrooms</div>
                    <div class="text-body-1 font-weight-bold">{{ cabin.bathrooms ?? '—' }}</div>
                  </VCard>
                </VCol>
              </VRow>
            </div>
          </VCol>

          <VDivider vertical class="d-none d-md-flex" />

          <!-- Right column: services + images -->
          <VCol cols="12" md="4" class="ps-md-5">
            <!-- Services -->
            <div class="mb-4">
              <div class="text-caption text-medium-emphasis text-uppercase font-weight-medium mb-2">
                <VIcon icon="ri-star-line" size="13" class="me-1" />
                Services ({{ cabin.services?.length || 0 }})
              </div>
              <div v-if="cabin.services?.length" class="d-flex flex-wrap gap-2">
                <VChip
                  v-for="service in cabin.services"
                  :key="service"
                  size="small"
                  variant="tonal"
                  color="primary"
                  label
                >
                  {{ service }}
                </VChip>
              </div>
              <div v-else class="text-caption text-medium-emphasis">No services listed</div>
            </div>

            <!-- Image thumbnails -->
            <div v-if="cabin.images?.length > 1">
              <div class="text-caption text-medium-emphasis text-uppercase font-weight-medium mb-2">
                <VIcon icon="ri-gallery-line" size="13" class="me-1" />Photos
              </div>
              <div class="d-flex flex-wrap gap-2">
                <VImg
                  v-for="img in cabin.images.slice(0, 6)"
                  :key="img.id"
                  :src="getImageUrl(img)"
                  width="60"
                  height="60"
                  cover
                  class="rounded thumbnail"
                  :class="{ 'thumbnail-main': img.is_main }"
                />
              </div>
            </div>
          </VCol>
        </VRow>
      </VCardText>

      <VDivider />

      <VCardActions class="px-6 py-3">
        <div class="text-caption text-medium-emphasis">ID #{{ cabin.id }}</div>
        <VSpacer />
        <VBtn variant="tonal" @click="close">Close</VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

<style scoped>
.cabin-image-wrapper {
  position: relative;
}

.image-counter {
  position: absolute;
  inset-block-end: 8px;
  inset-inline-end: 12px;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 12px;
  display: flex;
  align-items: center;
}

.thumbnail {
  border-radius: 6px;
  border: 2px solid transparent;
}

.thumbnail-main {
  border-color: rgb(var(--v-theme-primary));
}
</style>
