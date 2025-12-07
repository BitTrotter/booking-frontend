<template>
    <div>
        <VCard title="Cabins">


            <VCardText class="d-flex flex-wrap gap-4">
                <div class="d-flex align-center">
                    <!-- 👉 Search  -->
                    <VTextField v-model="searchQuery" placeholder="Search Role" style="inline-size: 200px;"
                        density="compact" class="me-3" @keyup="list" />
                </div>

                <VSpacer />

                <div class="d-flex gap-x-4 align-center">
                    <!-- 👉 Export button -->
                    <VBtn variant="outlined" color="secondary" prepend-icon="ri-upload-2-line">

                    </VBtn>

                    <VBtn color="primary" prepend-icon="ri-add-line"
                        @click="isAddRoleDialogVisible = !isAddRoleDialogVisible">
                        Cerate Reservation
                    </VBtn>
                </div>
            </VCardText>
            <VDataTable :headers="headers" :items="data" :items-per-page="5" class="text-no-wrap">
         
                <template #item.start_date="{ item }" >
                    {{ new Date(item.start_date).toLocaleDateString() }}

                </template>
                <template #item.end_date="{ item }">
                    {{ new Date(item.end_date).toLocaleDateString() }}
                </template>
            </VDataTable>


            <AddReservation v-model:isDialogVisible="isAddRoleDialogVisible" />
            <EditCabin v-model:isDialogEditVisible="isEditRoleDialogVisible" :cabin="selectedCabin" />
            <VSnackbar location="top" v-model="snackBar">
                I'm a top snackbar.
            </VSnackbar>
        </VCard>
    </div>
</template>


<script setup>
// import data from '@/views/js/datatable'
import AddCabin from '@/components/cabins/AddCabin.vue';
import { onMounted } from 'vue';
const headers = [
    { title: 'ID', key: 'id' },
    { title: 'Start Date', key: 'start_date' },
    { title: 'End Date', key: 'end_date' },
    { title: 'Total Price', key: 'total_price' },
    { title: 'Status', key: 'status' },
]

const searchQuery = ref('')
const isAddRoleDialogVisible = ref(false)
const isEditRoleDialogVisible = ref(false)
const snackBar = ref(true)
console.log(PERMISOS);
const data = ref([])
let selectedCabin = ref(null)
const list = async () => {
    const resp = await $api('/reservations?search=' + (searchQuery.value ? searchQuery.value : ''), {
        method: 'GET',
        onResponseError: ({ response }) => {
            warnError.value = response.statusText
            throw new Error(response.statusText || 'Login failed')
        }
    })

    data.value = resp;
    console.log(data.value);
}


const editItem = (item) => {
    console.log('Edit item', item);
}
const deleteItem = (item) => {
    console.log('Delete item', item);
}

const openEdit = (item) => {
    selectedCabin.value = item
    isEditRoleDialogVisible.value = true
}
onMounted(() => {
    list()
})
</script>