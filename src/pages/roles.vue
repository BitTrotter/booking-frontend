<template>
    <div>
        <VCard title="Roles">

       
         <VCardText class="d-flex flex-wrap gap-4">
        <div class="d-flex align-center">
          <!-- 👉 Search  -->
          <VTextField
            v-model="searchQuery"
            placeholder="Search Role"
            style="inline-size: 200px;"
            density="compact"
            class="me-3"
          />
        </div>

        <VSpacer />

        <div class="d-flex gap-x-4 align-center">
          <!-- 👉 Export button -->
          <VBtn
            variant="outlined"
            color="secondary"
            prepend-icon="ri-upload-2-line"
          >
            
          </VBtn>

          <VBtn
            color="primary"
            prepend-icon="ri-add-line"
            @click="isAddRoleDialogVisible = !isAddRoleDialogVisible"

          >
            Add Rol
          </VBtn>
        </div>
      </VCardText>
        <VDataTable :headers="headers" :items="data" :items-per-page="5" class="text-no-wrap">
            <template #item.id="{ item }">
                <span class="text-h6">{{ item.id }}</span>
            </template>
        </VDataTable>
          <AddRolaDialog  v-model:isDialogVisible="isAddRoleDialogVisible" />

         </VCard>
    </div>
</template>


<script setup>
import data from '@/views/js/datatable'

const headers = [
    { title: 'ID', key: 'id' },
    { title: 'NAME', key: 'fullName' },
    { title: 'EMAIL', key: 'email' },
    { title: 'DATE', key: 'startDate' },
    { title: 'EXPERIENCE', key: 'experience' },
    { title: 'AGE', key: 'age' },
]

const searchQuery = ref('')
const isAddRoleDialogVisible = ref(false)
console.log(PERMISOS);

</script>