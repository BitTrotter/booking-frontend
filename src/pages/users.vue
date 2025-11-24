<template>
  <div>
    <VCard title="Users">


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
         <template #item.edit="{ item }">
                    <VBtn variant="outlined" @click="openEdit(item)">
                        Edit
                    </VBtn>
                </template>
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
      <AddUsers v-model:isDialogVisible="isAddRoleDialogVisible" />

    </VCard>
  </div>
</template>


<script setup>
// import data from '@/views/js/datatable'
import AddUsers from '@/components/booking/role/AddUsers.vue';
import { onMounted } from 'vue';

const headers = [
  { title: 'Edit', key: 'edit' },
  { title: 'Role', key: 'name' },
  { title: 'EMAIL', key: 'email' },
  { title: 'DATE', key: 'created_at' },
  { title: 'Roles', key: 'Roles' },
]

const searchQuery = ref('')
const isAddRoleDialogVisible = ref(false)
console.log(PERMISOS);
const data = ref([])
let warningError = ref('')

const list = async () => {
  const resp = await $api('/users?search=' + (searchQuery.value ? searchQuery.value : ''), {
    method: 'GET',
    onResponseError: ({ response }) => {
      warningError.value = response.statusText
      throw new Error(response.statusText || 'Login failed')
    }
  })
  data.value = resp.users;
  console.log("data");
  console.log(data.value);
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