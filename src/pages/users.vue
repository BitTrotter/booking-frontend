<template>
  <div>
    <VCard title="Users">


      <VCardText class="d-flex flex-wrap gap-4">


        <div class="d-flex gap-x-4 align-center">

          <VBtn color="primary" prepend-icon="ri-add-line" @click="isAddRoleDialogVisible = !isAddRoleDialogVisible">
            Add User
          </VBtn>
        </div>
      </VCardText>
      <VDataTable :headers="headers" :items="data" :items-per-page="5" class="text-no-wrap">
        <template #item.edit="{ item }">
          <VBtn variant="outlined" @click="openEdit(item)">
            Edit
          </VBtn>
        </template>
        <template #item.roles="{ item }">
          <div class="d-flex flex-wrap gap-2 align-items-left">
            <VChip v-for="role in item.roles" class="ma-1">
              {{ role }}
            </VChip>
          </div>
        </template>
      </VDataTable>
      <AddUsers v-model:isDialogVisible="isAddRoleDialogVisible" :roles="roles" />
      <EditUsers v-model:isDialogVisible="isEditDialogVisible" :user="selectedUser" :roles="roles"
        @user-updated="list" />

    </VCard>
  </div>
</template>


<script setup>
// import data from '@/views/js/datatable'
import AddUsers from '@/components/booking/role/AddUsers.vue';
import EditUsers from '@/components/booking/role/EditUsers.vue';
import { onMounted, watch } from 'vue';

const headers = [
  { title: 'Edit', key: 'edit' },
  { title: 'Name', key: 'name' },
  { title: 'Email', key: 'email' },
  { title: 'Role', key: 'roles' },
]

const searchQuery = ref('')
const isAddRoleDialogVisible = ref(false)
console.log(PERMISOS);
const data = ref([])
const roles = ref([])
let warningError = ref('')

const selectedUser = ref(null);
const isEditDialogVisible = ref(false);

const list = async () => {
  const resp = await $api('/users?search=' + (searchQuery.value ? searchQuery.value : ''), {
    method: 'GET',
    onResponseError: ({ response }) => {
      warningError.value = response.statusText
      throw new Error(response.statusText || 'Login failed')
    }
  })
  console.log(resp);
  data.value = resp.users;

}

const getRoles = async () => {
  const resp = await $api('/role', {
    method: 'GET',
    onResponseError: ({ response }) => {
      warningError.value = response.statusText
      throw new Error(response.statusText || 'Login failed')
    }
  })

  roles.value = (resp.roles || []).map(role => ({
    // id: role.id,
    name: role.name,
  }))
}


const editItem = (item) => {
  console.log('Edit item', item);
}
const deleteItem = (item) => {
  console.log('Delete item', item);
}

const openEdit = (user) => {
  selectedUser.value = user;
  isEditDialogVisible.value = true;
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
