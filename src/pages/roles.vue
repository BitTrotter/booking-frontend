<template>
  <div class="roles-page">
    <VCard class="border-0 shadow-none mb-4">
      <VCardText class="pb-0">
        <div class="d-flex flex-wrap justify-space-between align-center gap-4">
          <div>
            <div class="text-h4 font-weight-bold">Roles</div>
            <div class="text-body-2 text-medium-emphasis pb-4">
              Create and manage roles with specific permissions for your system.
            </div>
          </div>

          <div class="d-flex gap-3 align-center flex-wrap">
            <VTextField v-model="searchQuery" placeholder="Search by role name" prepend-inner-icon="ri-search-line"
              density="comfortable" style="inline-size: 280px;" hide-details @update:model-value="list" />

            <VBtn variant="tonal" color="warning" prepend-icon="ri-shield-keyhole-line" @click="isManagePermissionsVisible = true">
              Permissions
            </VBtn>
            <VBtn color="primary" prepend-icon="ri-add-line" @click="isAddRoleDialogVisible = true">
              Add Role
            </VBtn>
          </div>
        </div>
      </VCardText>
    </VCard>

    <VCard>
      <VCardText class="pt-0">
        <VRow class="mb-4">
          <VCol cols="12">
            <VCard variant="tonal" color="primary" class="mt-4">
              <VCardText>
                <div class="text-caption text-medium-emphasis">Total roles</div>
                <div class="text-h4 font-weight-bold mt-1">{{ data.length }}</div>
              </VCardText>
            </VCard>
          </VCol>
        </VRow>

        <VCard variant="outlined">
          <VDataTable :headers="headers" :items="filteredRoles" :items-per-page="6" :loading="loading"
            class="text-no-wrap">
            <template #item.name="{ item }">
              <div class="font-weight-medium">{{ item.name }}</div>
            </template>

            <template #item.permissions="{ item }">
              <div class="d-flex flex-wrap gap-2 py-4">
                <VChip v-for="(perm, index) in item.permissions || []" :key="`${item.id}-${perm}-${index}`" size="small"
                  variant="tonal">
                  {{ perm }}
                </VChip>
              </div>
            </template>

            <template #item.created_at="{ item }">
              {{ formatDate(item.created_at) }}
            </template>

            <template #item.actions="{ item }">
              <div class="d-flex gap-2 justify-end">
                <VBtn variant="text" color="primary" size="small" prepend-icon="ri-pencil-line" @click="editItem(item)">
                  Edit
                </VBtn>
                <VBtn variant="text" color="error" size="small" prepend-icon="ri-delete-bin-line"
                  @click="deleteItem(item)">
                  Delete
                </VBtn>
              </div>
            </template>
          </VDataTable>
        </VCard>
      </VCardText>
    </VCard>

    <AddRolaDialog v-model:isDialogVisible="isAddRoleDialogVisible" @saved="list" />
    <EditRoleDialog v-model:isDialogVisible="isEditRoleDialogVisible" :role="selectedRole" @saved="list" />
    <ManagePermissions v-model:isDialogVisible="isManagePermissionsVisible" />

    <VSnackbar v-model="snackBar.visible" location="top" :color="snackBar.color">
      {{ snackBar.message }}
    </VSnackbar>
  </div>
</template>


<script setup>
import ManagePermissions from '@/components/booking/role/ManagePermissions.vue'
import { computed, onMounted, ref } from 'vue'

const headers = [
  { title: 'Role', key: 'name' },
  { title: 'Permissions', key: 'permissions' },
  { title: 'Created', key: 'created_at' },
  { title: 'Actions', key: 'actions', align: 'end', sortable: false },
]

const searchQuery = ref('')
const isAddRoleDialogVisible = ref(false)
const isEditRoleDialogVisible = ref(false)
const isManagePermissionsVisible = ref(false)
const selectedRole = ref(null)
const loading = ref(false)
const data = ref([])
const snackBar = ref({
  visible: false,
  message: '',
  color: 'success',
})

const filteredRoles = computed(() => {
  if (!searchQuery.value) return data.value
  const query = searchQuery.value.toLowerCase()
  return data.value.filter(role => String(role.name || '').toLowerCase().includes(query))
})

const formatDate = dateValue => {
  if (!dateValue) return 'No date'
  return new Date(dateValue).toLocaleDateString()
}

const list = async () => {
  loading.value = true
  try {
    const resp = await $api(`/role?search=${encodeURIComponent(searchQuery.value || '')}`, {
      method: 'GET',
      onResponseError: ({ response }) => {
        throw new Error(response.statusText || 'Failed to load roles')
      },
    })
    data.value = resp.roles || []
  } catch (error) {
    console.error(error)
    snackBar.value = { visible: true, message: 'Unable to load roles', color: 'error' }
  } finally {
    loading.value = false
  }
}

const editItem = item => {
  selectedRole.value = item
  isEditRoleDialogVisible.value = true
}

const deleteItem = async item => {
  if (!confirm(`Are you sure you want to delete "${item.name}"?`)) return

  try {
    await $api(`/role/${item.id}`, {
      method: 'DELETE',
      onResponseError: ({ response }) => {
        throw new Error(response.statusText || 'Failed to delete role')
      },
    })
    data.value = data.value.filter(role => role.id !== item.id)
    snackBar.value = { visible: true, message: 'Role deleted', color: 'success' }
  } catch (error) {
    console.error(error)
    snackBar.value = { visible: true, message: 'Failed to delete role', color: 'error' }
  }
}

onMounted(() => {
  list()
})

</script>
