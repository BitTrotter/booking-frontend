<template>
  <div class="users-page">
    <VCard class="border-0 shadow-none mb-4">
      <VCardText class="pb-0">
        <div class="d-flex flex-wrap justify-space-between align-center gap-4">
          <div>
            <div class="text-h4 font-weight-bold">Users</div>
            <div class="text-body-2 text-medium-emphasis">
              Manage users, assign roles, and control access permissions.
            </div>
          </div>

          <div class="d-flex gap-3 align-center flex-wrap">
            <VTextField v-model="searchQuery" placeholder="Search by name or email" prepend-inner-icon="ri-search-line"
              density="comfortable" style="inline-size: 280px;" hide-details @update:model-value="list" />

            <VBtn color="primary" prepend-icon="ri-add-line" @click="isAddRoleDialogVisible = true">
              Add User
            </VBtn>
          </div>
        </div>
      </VCardText>
    </VCard>

    <VCard>
      <VCardText class="pt-0">
        <VRow class="mb-4">
          <VCol cols="12" sm="4">
            <VCard variant="tonal" color="primary">
              <VCardText>
                <div class="text-caption text-medium-emphasis">Total users</div>
                <div class="text-h4 font-weight-bold mt-1">{{ data.length }}</div>
              </VCardText>
            </VCard>
          </VCol>
          <VCol cols="12" sm="4">
            <VCard variant="tonal" color="info">
              <VCardText>
                <div class="text-caption text-medium-emphasis">Admin users</div>
                <div class="text-h4 font-weight-bold mt-1">{{ adminCount }}</div>
              </VCardText>
            </VCard>
          </VCol>
          <VCol cols="12" sm="4">
            <VCard variant="tonal" color="success">
              <VCardText>
                <div class="text-caption text-medium-emphasis">Regular users</div>
                <div class="text-h4 font-weight-bold mt-1">{{ regularCount }}</div>
              </VCardText>
            </VCard>
          </VCol>
        </VRow>

        <VCard variant="outlined">
          <VDataTable :headers="headers" :items="filteredUsers" :items-per-page="6" :loading="loading"
            class="text-no-wrap">
            <template #item.name="{ item }">
              <div>
                <div class="font-weight-medium">{{ item.name }}</div>
                <div class="text-body-2 text-medium-emphasis">{{ item.email }}</div>
              </div>
            </template>

            <template #item.roles="{ item }">
              <div class="d-flex flex-wrap gap-2">
                <VChip v-for="(role, index) in item.roles || []" :key="`${item.id}-${role}-${index}`" size="small"
                  variant="tonal">
                  {{ role }}
                </VChip>
              </div>
            </template>

            <template #item.actions="{ item }">
              <div class="d-flex gap-2 justify-end">
                <VBtn variant="text" color="primary" size="small" prepend-icon="ri-pencil-line" @click="openEdit(item)">
                  Edit
                </VBtn>
              </div>
            </template>
          </VDataTable>
        </VCard>
      </VCardText>
    </VCard>

    <AddUsers v-model:isDialogVisible="isAddRoleDialogVisible" :roles="roles" />
    <EditUsers v-model:isDialogVisible="isEditDialogVisible" :user="selectedUser" :roles="roles" @user-updated="list" />

    <VSnackbar v-model="snackBar.visible" location="top" :color="snackBar.color">
      {{ snackBar.message }}
    </VSnackbar>
  </div>
</template>


<script setup>
import AddUsers from '@/components/booking/role/AddUsers.vue'
import EditUsers from '@/components/booking/role/EditUsers.vue'
import { computed, onMounted, ref, watch } from 'vue'

const headers = [
  { title: 'User', key: 'name' },
  { title: 'Roles', key: 'roles' },
  { title: 'Actions', key: 'actions', align: 'end', sortable: false },
]

const searchQuery = ref('')
const isAddRoleDialogVisible = ref(false)
const isEditDialogVisible = ref(false)
const loading = ref(false)
const data = ref([])
const roles = ref([])
const selectedUser = ref(null)
const snackBar = ref({
  visible: false,
  message: '',
  color: 'success',
})

const adminCount = computed(() => data.value.filter(user => user.roles?.includes('admin')).length)
const regularCount = computed(() => data.value.length - adminCount.value)

const filteredUsers = computed(() => {
  if (!searchQuery.value) return data.value
  const query = searchQuery.value.toLowerCase()
  return data.value.filter(user =>
    [user.name, user.email].some(field => String(field || '').toLowerCase().includes(query)),
  )
})

const list = async () => {
  loading.value = true
  try {
    const resp = await $api(`/users?search=${encodeURIComponent(searchQuery.value || '')}`, {
      method: 'GET',
      onResponseError: ({ response }) => {
        throw new Error(response.statusText || 'Failed to load users')
      },
    })
    data.value = resp.users || []
  } catch (error) {
    console.error(error)
    snackBar.value = { visible: true, message: 'Unable to load users', color: 'error' }
  } finally {
    loading.value = false
  }
}

const getRoles = async () => {
  try {
    const resp = await $api('/role', {
      method: 'GET',
      onResponseError: ({ response }) => {
        throw new Error(response.statusText || 'Failed to load roles')
      },
    })
    roles.value = (resp.roles || []).map(role => ({ name: role.name }))
  } catch (error) {
    console.error(error)
  }
}

const openEdit = user => {
  selectedUser.value = user
  isEditDialogVisible.value = true
}

onMounted(() => {
  list()
  getRoles()
})

watch(isAddRoleDialogVisible, visible => {
  if (!visible)
    list()
})

watch(isEditDialogVisible, visible => {
  if (!visible)
    list()
})
</script>
