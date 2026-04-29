<template>
    <div class="cabins-page">
        <VCard class="border-0 shadow-none">
            <VCardText class="pb-2">
                <div class="d-flex flex-wrap justify-space-between align-center gap-4">
                    <div>
                        <div class="text-h4 font-weight-bold">Cabins</div>
                        <div class="text-body-2 text-medium-emphasis">
                            Manage your cabins, search by name or description, and keep availability updated.
                        </div>
                    </div>

                    <div class="d-flex gap-3 align-center flex-wrap">
                        <VTextField v-model="searchQuery" placeholder="Search cabin name or description"
                            prepend-inner-icon="ri-search-line" density="comfortable" style="inline-size: 280px;"
                            hide-details @update:model-value="list" />

                        <VSelect v-model="statusFilter" :items="statusOptions" label="Filter status"
                            density="comfortable" style="inline-size: 180px;" hide-details />

                        <VBtn color="primary" prepend-icon="ri-add-line" @click="isAddCabinDialogVisible = true">
                            Add cabin
                        </VBtn>

                        <VBtn icon="ri-refresh-line" variant="text" color="primary" @click="list" />
                    </div>
                </div>
            </VCardText>

            <VCardText class="pt-0">
                <VRow class="mb-4">
                    <VCol cols="12" sm="4">
                        <VCard variant="tonal" color="primary">
                            <VCardText>
                                <div class="text-caption text-medium-emphasis">Total cabins</div>
                                <div class="text-h4 font-weight-bold mt-1">{{ data.length }}</div>
                            </VCardText>
                        </VCard>
                    </VCol>
                    <VCol cols="12" sm="4">
                        <VCard variant="tonal" color="success">
                            <VCardText>
                                <div class="text-caption text-medium-emphasis">Available</div>
                                <div class="text-h4 font-weight-bold mt-1">{{ statusCounts.available }}</div>
                            </VCardText>
                        </VCard>
                    </VCol>
                    <VCol cols="12" sm="4">
                        <VCard variant="tonal" color="warning">
                            <VCardText>
                                <div class="text-caption text-medium-emphasis">Maintenance / unavailable</div>
                                <div class="text-h4 font-weight-bold mt-1">{{ statusCounts.maintenance +
                                    statusCounts.unavailable }}</div>
                            </VCardText>
                        </VCard>
                    </VCol>
                </VRow>

                <VCard variant="outlined">
                    <VDataTable :headers="headers" :items="filteredCabins" :items-per-page="6" :loading="loading"
                        class="text-no-wrap">
                        <template #item.name="{ item }">
                            <div>
                                <div class="font-weight-medium">{{ item.name }}</div>
                                <div class="text-body-2 text-medium-emphasis">{{ item.description }}</div>
                            </div>
                        </template>

                        <template #item.price_per_night="{ item }">
                            {{ formatCurrency(item.price_per_night) }}
                        </template>

                        <template #item.status="{ item }">
                            <VChip :color="getStatusColor(item.status)" size="small" label>
                                {{ item.status || 'unknown' }}
                            </VChip>
                        </template>

                        <template #item.services="{ item }">
                            <div class="d-flex flex-wrap gap-2 py-2">
                                <VChip v-for="(service, index) in item.services || []"
                                    :key="`${item.id}-${service}-${index}`" size="small" variant="tonal">
                                    {{ service }}
                                </VChip>
                            </div>
                        </template>

                        <template #item.actions="{ item }">
                            <div class="d-flex gap-2 justify-end">
                                <VBtn variant="text" color="primary" size="small" prepend-icon="ri-pencil-line"
                                    @click="openEdit(item)">
                                    Edit
                                </VBtn>

                            </div>
                        </template>
                    </VDataTable>
                </VCard>
            </VCardText>

            <AddCabin v-model:isDialogVisible="isAddCabinDialogVisible" />
            <EditCabin v-model:isDialogEditVisible="isEditCabinDialogVisible" :cabin="selectedCabin" />

            <VSnackbar v-model="snackBar.visible" location="top" :color="snackBar.color">
                {{ snackBar.message }}
            </VSnackbar>
        </VCard>
    </div>
</template>

<script setup>
import AddCabin from '@/components/cabins/AddCabin.vue'
import EditCabin from '@/components/cabins/EditCabin.vue'
import { computed, onMounted, ref, watch } from 'vue'

const headers = [
    { title: 'Cabin', key: 'name' },
    { title: 'Price / Night', key: 'price_per_night' },
    { title: 'Capacity', key: 'capacity' },
    { title: 'Beds', key: 'beds' },
    { title: 'Bathrooms', key: 'bathrooms' },
    { title: 'Services', key: 'services' },
    { title: 'Status', key: 'status' },
    { title: 'Actions', key: 'actions', align: 'end', sortable: false },
]

const searchQuery = ref('')
const statusFilter = ref('all')
const statusOptions = [
    { title: 'All statuses', value: 'all' },
    { title: 'available', value: 'available' },
    { title: 'maintenance', value: 'maintenance' },
    { title: 'unavailable', value: 'unavailable' },
]

const isAddCabinDialogVisible = ref(false)
const isEditCabinDialogVisible = ref(false)
const selectedCabin = ref(null)
const snackBar = ref({
    visible: false,
    message: '',
    color: 'success',
})
const loading = ref(false)
const data = ref([])

const statusCounts = computed(() => ({
    available: data.value.filter(cabin => cabin.status === 'available').length,
    maintenance: data.value.filter(cabin => cabin.status === 'maintenance').length,
    unavailable: data.value.filter(cabin => cabin.status === 'unavailable').length,
}))

const filteredCabins = computed(() => {
    return data.value.filter(cabin => {
        const matchesStatus = statusFilter.value === 'all' || cabin.status === statusFilter.value
        const query = searchQuery.value?.trim().toLowerCase()
        const matchesSearch = !query || [cabin.name, cabin.description].some(value =>
            String(value || '').toLowerCase().includes(query),
        )

        return matchesStatus && matchesSearch
    })
})

const getStatusColor = status => {
    const map = {
        available: 'success',
        maintenance: 'warning',
        unavailable: 'error',
    }

    return map[status] || 'secondary'
}

const formatCurrency = amount => {
    const value = Number(amount || 0)

    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
    }).format(value)
}

const list = async () => {
    loading.value = true

    try {
        const resp = await $api(`/cabins?search=${encodeURIComponent(searchQuery.value || '')}`, {
            method: 'GET',
            onResponseError: ({ response }) => {
                throw new Error(response.statusText || 'Failed to load cabins')
            },
        })

        data.value = resp || []
    } catch (error) {
        console.error(error)
        snackBar.value = { visible: true, message: 'Unable to load cabins', color: 'error' }
    } finally {
        loading.value = false
    }
}

const openEdit = item => {
    selectedCabin.value = item
    isEditCabinDialogVisible.value = true
}

const deleteItem = async item => {
    if (!confirm(`Do you want to delete "${item.name}"?`))
        return

    try {
        await $api(`/cabins/${item.id}`, {
            method: 'DELETE',
            onResponseError: ({ response }) => {
                throw new Error(response.statusText || 'Failed to delete cabin')
            },
        })

        data.value = data.value.filter(cabin => cabin.id !== item.id)
        snackBar.value = { visible: true, message: 'Cabin deleted', color: 'success' }
    } catch (error) {
        console.error(error)
        snackBar.value = { visible: true, message: 'Failed to delete cabin', color: 'error' }
    }
}

onMounted(() => {
    list()
})

watch(isAddCabinDialogVisible, visible => {
    if (!visible)
        list()
})

watch(isEditCabinDialogVisible, visible => {
    if (!visible)
        list()
})
</script>
