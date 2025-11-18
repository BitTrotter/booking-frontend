<template>
  <div>
    <VCard title="Roles">


      <VCardText class="d-flex flex-wrap gap-4">
        <div class="d-flex align-center">
          <!-- 👉 Search  -->
          <VTextField v-model="searchQuery" placeholder="Search Role" style="inline-size: 200px;" density="compact"
            class="me-3" @keyup="list" />
        </div>

        <VSpacer />

        <div class="d-flex gap-x-4 align-center">
          <!-- 👉 Export button -->
          <VBtn variant="outlined" color="secondary" prepend-icon="ri-upload-2-line">

          </VBtn>

          <VBtn color="primary" prepend-icon="ri-add-line" @click="isAddRoleDialogVisible = !isAddRoleDialogVisible">
            Add Rol
          </VBtn>
        </div>
      </VCardText>
      <VDataTable :headers="headers" :items="data" :items-per-page="5" class="text-no-wrap">
        <template #item.id="{ item }">
          <span class="text-h6">{{ item.id }}</span>

        </template>
        <template #item.permissions="{ item }">
          <!-- <VChip label v-for="(itm, index) in item.permissions" :key="index" class="mr-1">
            {{ itm }}
          </VChip> -->
          <VCombobox v-model="selectedItem" :items="item.permissions" placeholder="permissions" class="my-1" />
        </template>
        <template #item.actions="{ item }">
          <div class="d-flex gap-1">
            <IconBtn size="small" @click="editItem(item)">
              <VIcon icon="ri-pencil-line" />
            </IconBtn>
            <IconBtn size="small" @click="deleteItem(item)">
              <VIcon icon="ri-delete-bin-line" />
            </IconBtn>
          </div>
        </template>
      </VDataTable>
      <AddRolaDialog v-model:isDialogVisible="isAddRoleDialogVisible" />

    </VCard>
  </div>
</template>


<script setup>
// import data from '@/views/js/datatable'
import { onMounted } from 'vue';

const headers = [
  { title: 'ID', key: 'id' },
  { title: 'Role', key: 'name' },
  { title: 'EMAIL', key: 'email' },
  { title: 'DATE', key: 'created_at' },
  { title: 'Permissions', key: 'permissions' },
  { title: 'op', key: 'actions' },
]

const searchQuery = ref('')
const isAddRoleDialogVisible = ref(false)
console.log(PERMISOS);
const data = ref([])

const list = async () => {
  const resp = await $api('/role?search=' + (searchQuery.value ? searchQuery.value : ''), {
    method: 'GET',
    onResponseError: ({ response }) => {
      warnError.value = response.statusText
      throw new Error(response.statusText || 'Login failed')
    }
  })
  data.value = resp.roles;
  console.log(data);
}


const editItem = (item) => {
  console.log('Edit item', item);
}
const deleteItem = (item) => {
  console.log('Delete item', item);
}


onMounted(() => {
  list()
})
</script>