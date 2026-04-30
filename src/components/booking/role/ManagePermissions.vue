<script setup>
const props = defineProps({
  isDialogVisible: { type: Boolean, required: true },
})

const emit = defineEmits(['update:isDialogVisible', 'saved'])

const permissions = ref([])
const searchQuery = ref('')
const newPermissionName = ref('')
const isLoading = ref(false)
const isAdding = ref(false)
const deletingId = ref(null)
const errorMessage = ref('')
const successMessage = ref('')

const filteredPermissions = computed(() => {
  if (!searchQuery.value.trim()) return permissions.value
  const q = searchQuery.value.toLowerCase()
  return permissions.value.filter(p => p.name.toLowerCase().includes(q))
})

const nameIsValid = computed(() => /^[a-z][a-z0-9_]*$/.test(newPermissionName.value.trim()))

const fetchPermissions = async () => {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const resp = await $api('/permissions', { method: 'GET' })
    console.log('Fetched permissions:', resp.permissions)
    permissions.value = resp.permissions || []
    console.log('Permissions set to:', permissions.value)
  } catch {
    errorMessage.value = 'Failed to load permissions.'
  } finally {
    isLoading.value = false
  }
}

const addPermission = async () => {
  const name = newPermissionName.value.trim()
  if (!name || !nameIsValid.value) return

  isAdding.value = true
  errorMessage.value = ''
  successMessage.value = ''
  try {
    const created = await $api('/permissions', {
      method: 'POST',
      body: { name },
      onResponseError: ({ response }) => {
        throw new Error(response._data?.message || response.statusText || 'Failed to create permission')
      },
    })
    permissions.value.push(created)
    newPermissionName.value = ''
    successMessage.value = `Permission "${name}" created.`
    emit('saved')
    setTimeout(() => { successMessage.value = '' }, 3000)
  } catch (err) {
    errorMessage.value = err.message || 'Failed to create permission.'
  } finally {
    isAdding.value = false
  }
}

const deletePermission = async permission => {
  deletingId.value = permission.id
  errorMessage.value = ''
  try {
    await $api(`/permissions/${permission.id}`, {
      method: 'DELETE',
      onResponseError: ({ response }) => {
        throw new Error(response._data?.message || response.statusText || 'Failed to delete permission')
      },
    })
    permissions.value = permissions.value.filter(p => p.id !== permission.id)
    emit('saved')
  } catch (err) {
    errorMessage.value = err.message || 'Failed to delete permission.'
  } finally {
    deletingId.value = null
  }
}

const close = () => {
  searchQuery.value = ''
  newPermissionName.value = ''
  errorMessage.value = ''
  successMessage.value = ''
  emit('update:isDialogVisible', false)
}

watch(() => props.isDialogVisible, visible => {
  if (visible) fetchPermissions()
})
</script>

<template>
  <VDialog :model-value="props.isDialogVisible" max-width="620" scrollable @update:model-value="val => !val && close()">
    <VCard>
      <!-- Header -->
      <VCardItem class="py-4 px-6">
        <VCardTitle class="d-flex align-center gap-3 pa-0">
          <VAvatar color="warning" variant="tonal" size="38" rounded="lg">
            <VIcon icon="ri-shield-keyhole-line" size="22" />
          </VAvatar>
          <div>
            <p class="text-h6 font-weight-bold mb-0">Manage Permissions</p>
            <p class="text-caption text-medium-emphasis mb-0">
              Add or remove system permissions
            </p>
          </div>
        </VCardTitle>
        <template #append>
          <DialogCloseBtn variant="text" size="small" @click="close" />
        </template>
      </VCardItem>

      <VDivider />

      <VCardText class="pa-6">
        <!-- Add new permission -->
        <div class="mb-5">
          <div class="text-subtitle-2 font-weight-semibold text-uppercase text-medium-emphasis mb-2">
            New Permission
          </div>
          <div class="d-flex gap-2 align-start">
            <VTextField v-model="newPermissionName" placeholder="e.g. create_payment" density="comfortable"
              hide-details="auto"
              :hint="newPermissionName && !nameIsValid ? 'Lowercase letters, numbers and underscores only. Must start with a letter.' : ''"
              :error="!!newPermissionName && !nameIsValid" class="flex-grow-1" @keydown.enter="addPermission">
              <template #prepend-inner>
                <span class="text-caption text-medium-emphasis font-mono me-1">{ }</span>
              </template>
            </VTextField>
            <VBtn color="primary" :loading="isAdding" :disabled="!nameIsValid" prepend-icon="ri-add-line"
              @click="addPermission">
              Add
            </VBtn>
          </div>
        </div>

        <VAlert v-if="errorMessage" type="error" variant="tonal" density="compact" closable class="mb-4"
          @click:close="errorMessage = ''">
          {{ errorMessage }}
        </VAlert>
        <VAlert v-if="successMessage" type="success" variant="tonal" density="compact" class="mb-4">
          {{ successMessage }}
        </VAlert>

        <!-- List header -->
        <div class="d-flex align-center justify-space-between mb-3">
          <div class="d-flex align-center gap-2">
            <span class="text-subtitle-2 font-weight-semibold text-uppercase text-medium-emphasis">
              Existing Permissions
            </span>
            <VChip size="x-small" color="primary" label>
              {{ permissions.length }}
            </VChip>
          </div>
          <VTextField v-model="searchQuery" placeholder="Filter…" prepend-inner-icon="ri-search-line" density="compact"
            hide-details style="max-inline-size: 180px;" />
        </div>

        <!-- Permissions list -->
        <VProgressLinear v-if="isLoading" indeterminate color="primary" class="mb-3" rounded />

        <div v-else-if="filteredPermissions.length === 0" class="text-center py-8 text-medium-emphasis text-body-2">
          <VIcon icon="ri-shield-keyhole-line" size="36" class="mb-2 opacity-30 d-block" />
          {{ searchQuery ? 'No permissions match your search.' : 'No permissions found.' }}
        </div>

        <VList v-else density="compact" lines="one" class="rounded-lg" border>
          <template v-for="(perm, index) in filteredPermissions" :key="perm.id">
            <VListItem :value="perm.id">
              <template #prepend>
                <VIcon icon="ri-key-line" size="16" color="warning" class="me-2" />
              </template>
              <VListItemTitle class="font-mono text-body-2">{{ perm.name }}</VListItemTitle>
              <template #append>
                <VBtn icon variant="text" size="x-small" color="error" :loading="deletingId === perm.id"
                  @click="deletePermission(perm)">
                  <VIcon icon="ri-delete-bin-7-line" size="16" />
                  <VTooltip activator="parent">Delete</VTooltip>
                </VBtn>
              </template>
            </VListItem>
            <VDivider v-if="index < filteredPermissions.length - 1" />
          </template>
        </VList>
      </VCardText>

      <VDivider />

      <VCardActions class="pa-4 justify-end">
        <VBtn variant="tonal" color="secondary" @click="close">
          Close
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

<style scoped>
.font-mono {
  font-family: monospace;
}
</style>
