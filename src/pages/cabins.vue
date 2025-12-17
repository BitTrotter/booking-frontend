<template>
    <div>
        <VCard title="Cabins">
            <VCol md="6" lg="8" cols="12">
                <VCard>

                </VCard>
            </VCol>

            <VCardText class="d-flex flex-wrap gap-4">
                <div class="d-flex align-center">
                
                </div>

                <VSpacer />

                <div class="d-flex gap-x-4 align-center">
                    <!-- 👉 Export button -->
                    <VBtn icon="ri-search-line" variant="text" color="success" @click="list" />

                    <VBtn color="primary" prepend-icon="ri-add-line"
                        @click="isAddRoleDialogVisible = !isAddRoleDialogVisible">
                        Add Cabin
                    </VBtn>
                </div>
            </VCardText>
            <VDataTable :headers="headers" :items="data" :items-per-page="5" class="text-no-wrap">
                <template #item.Edit="{ item }">
                    <VBtn variant="outlined" @click="openEdit(item)">
                        Edit
                    </VBtn>
                </template>
                <template #item.id="{ item }">
                    <span class="text-h6">{{ item.id }}</span>

                </template>
                <template #item.services="{ item }">
                    <VChip label v-for="(itm, index) in item.services" :key="index" class="mr-1">
                        {{ itm }}
                    </VChip>
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


            <AddCabin v-model:isDialogVisible="isAddRoleDialogVisible" />
            <EditCabin v-model:isDialogEditVisible="isEditRoleDialogVisible" :cabin="selectedCabin" />
            <VSnackbar location="top" v-model="snackBar">
                I'm a top snackbar.
            </VSnackbar>
        </VCard>
    </div>
</template>


<script setup>
import pages2 from '@images/pages/2.png'
// import data from '@/views/js/datatable'
import AddCabin from '@/components/cabins/AddCabin.vue';
import { onMounted } from 'vue';
const headers = [
    { title: 'Edit', key: 'Edit' },
    { title: 'NAME', key: 'name' },
    { title: 'DESCRIPTION', key: 'description' },
    { title: 'PRICE PER NIGHT', key: 'price_per_night' },
    { title: 'CAPACITY', key: 'capacity' },
    { title: 'BEDS', key: 'beds' },
    { title: 'BATHROOMS', key: 'bathrooms' },
    { title: 'SERVICES', key: 'services' },
    { title: 'STATUS', key: 'status' },
    { title: 'Delete', key: 'delete' },

]

const searchQuery = ref('')
const isAddRoleDialogVisible = ref(false)
const isEditRoleDialogVisible = ref(false)
const snackBar = ref(true)
const data = ref([])
let selectedCabin = ref([])
const list = async () => {
    const resp = await $api('/cabins?search=' + (searchQuery.value ? searchQuery.value : ''), {
        method: 'GET',
        onResponseError: ({ response }) => {
            warnError.value = response.statusText
            throw new Error(response.statusText || 'Login failed')
        }
    })
    data.value = resp;
}

watch(isEditRoleDialogVisible, (val) => {
    if (!val) {
        list()
    }
})

const editItem = (item) => {
    // console.log('Edit item', item);
}
const deleteItem = (item) => {
    // console.log('Delete item', item);
}

const openEdit = (item) => {
    // console.log('Open edit for item', item);
    selectedCabin.value = item
    isEditRoleDialogVisible.value = true
}
onMounted(() => {
    list()
})
</script>