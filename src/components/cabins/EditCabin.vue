<script setup>
import { ref } from 'vue'

const emit = defineEmits(['update:isDialogEditVisible'])
const tab = ref('personal-info')
const name = ref('')
const description = ref('')
const price_per_night = ref(null)
const capacity = ref(null)
const beds = ref(null)
const bathrooms = ref(null)
const services = ref([])
const status = ref('available')
const typeRule = ref(null)
const typeRulePrice = ref(null)
const starDate = ref(null)
const endDate = ref(null)
const minNights = ref(null)
const ruleStatus = ref(true)

const serviceList = [
    'WiFi',
    'Air Conditioning',
    'Heating',
    'Kitchen',
    'Free Parking',
    'Swimming Pool',
    'Pet Friendly',
    'TV',
    'Hot Tub',
    'BBQ Grill'
]


const props = defineProps({
    isDialogEditVisible: {
        type: Boolean,
        required: true,
    },
    cabin: {
        type: Object,
        required: false,
    },

})
const dialogVisibleUpdate = val => {
    emit('update:isDialogEditVisible', val)

}

const submitRulePrice = async () => {
    // Lógica para guardar la regla de precio
  const priceRulesPayload = 
        // Example price rule
        {
            type: typeRule.value,
            price_per_night: typeRulePrice.value,
            start_date: starDate.value,
            end_date: endDate.value,
            min_nights: minNights.value,
            status: ruleStatus.value,
        }
    

      try {
        const resp = await $api(`/cabins/${props.cabin.id}/price-rules`, {
            method: 'POST',
            body: priceRulesPayload,
            onResponseError: ({ response }) => {
                console.error('Error saving cabin:', response.statusText)
                throw new Error(response.statusText || 'Error saving cabin')
            }
        })
        console.log('Cabin saved successfully:', resp)
        dialogVisibleUpdate(false)
    } catch (error) {
        console.error('Error submitting cabin:', error)
    }

}

const submitCabin = async () => {
    const payload = {
        name: name.value,
        description: description.value,
        price_per_night: price_per_night.value,
        capacity: capacity.value,
        beds: beds.value,
        bathrooms: bathrooms.value,
        services: services.value,
        status: status.value,
    }
  
    console.log('Submitting cabin:', payload)
    try {
        const resp = await $api(`/cabins/${props.cabin.id}`, {
            method: 'PUT',
            body: payload,
            onResponseError: ({ response }) => {
                console.error('Error saving cabin:', response.statusText)
                throw new Error(response.statusText || 'Error saving cabin')
            }
        })
        console.log('Cabin saved successfully:', resp)
        dialogVisibleUpdate(false)
    } catch (error) {
        console.error('Error submitting cabin:', error)
    }
}

const loadCabinDetails = async () => {
    const dataCabint = await $api(`/cabins/${props.cabin.id}`, {
        method: 'GET',
        onResponseError: ({ response }) => {
            console.error('Error saving cabin:', response.statusText)
            throw new Error(response.statusText || 'Error saving cabin')
        }

    })
    name.value = dataCabint.name
    description.value = dataCabint.description
    price_per_night.value = dataCabint.price_per_night
    capacity.value = dataCabint.capacity
    beds.value = dataCabint.beds
    bathrooms.value = dataCabint.bathrooms
    services.value = dataCabint.services
    status.value = dataCabint.status




    console.log('Cabin details:', dataCabint)
}

onMounted(() => {
    console.log('EditCabin mounted')

    watch(() => props.isDialogEditVisible, (val) => {
        if (val) {
            loadCabinDetails()
        }
    })

})

</script>

<template>
    <VDialog :model-value="props.isDialogEditVisible" max-width="750" @update:model-value="dialogVisibleUpdate">
        <VCard flat class="pa-4">
            <VTabs v-model="tab">
                <VTab value="info-general">General Information</VTab>
                <VTab value="price">price</VTab>
                <VTab value="detalles">Details</VTab>
                <VTab value="extras">Extras</VTab>
                <VTab value="images">Images</VTab>
            </VTabs>

            <VCardText>
                <VWindow v-model="tab" class="disable-tab-transition">
                    <!-- TAB 1: General Information -->
                    <VWindowItem value="info-general">
                        <VForm class="mt-2">
                            <VRow>
                                <VCol cols="12" md="6">
                                    <VTextField v-model="name" label="Cabin Name" placeholder="Las Palmas Cabin" />
                                </VCol>
                                <VCol cols="12" md="6">
                                    <VSelect v-model="status" :items="['available', 'maintenance', 'unavailable']"
                                        label="Status" placeholder="Select status" />
                                </VCol>
                                <VCol cols="12">

                                    <VTextField v-model="description" class="border rounded" label="Description"
                                        placeholder="Brief description of the cabin..." />
                                </VCol>
                            </VRow>
                        </VForm>
                    </VWindowItem>
                    <VWindowItem value="price">

                        <VRow>
                            <!-- Precio base -->
                            <VCol cols="12" md="6">
                                <VTextField label="Base price per night" v-model="price_per_night" type="number" prefix="$" min="0" />
                            </VCol>

                            <!-- Tipo de regla -->
                            <VCol cols="12" md="6">
                                <VSelect label="Price rule type" v-model="typeRule" :items="[
                                    { title: 'Weekend', value: 'weekend' },
                                    { title: 'Date range', value: 'date_range' },
                                    { title: 'Minimum nights', value: 'min_nights' }
                                ]" />
                            </VCol>

                            <!-- Precio de la regla -->
                            <VCol cols="12" md="6">
                                <VTextField label="Rule price per night" v-model="typeRulePrice" type="number" prefix="$" min="0" />
                            </VCol>

                            <!-- Días (fin de semana) -->
                            <VCol cols="12" md="6">
                                <VSelect label="Applicable days" multiple :items="[
                                    'Monday',
                                    'Tuesday',
                                    'Wednesday',
                                    'Thursday',
                                    'Friday',
                                    'Saturday',
                                    'Sunday'
                                ]" />
                            </VCol>

                            <!-- Rango de fechas -->
                            <VCol cols="12" md="6">
                                <VTextField label="Start date" v-model="starDate" type="date" />
                            </VCol>

                            <VCol cols="12" md="6">
                                <VTextField label="End date" v-model="endDate" type="date" />
                            </VCol>

                            <!-- Mínimo de noches -->
                            <VCol cols="12" md="6">
                                <VTextField label="Minimum nights" v-model="minNights" type="number" min="1" />
                            </VCol>

                            <!-- Estado -->
                            <VCol cols="12" md="6">
                                <VSelect label="Rule status" v-model="ruleStatus" :items="[
                                    { title: 'Active', value: true },
                                    { title: 'Inactive', value: false }
                                ]" />
                            </VCol>
                        </VRow>
                                        <VBtn @click="submitRulePrice">Save</VBtn>

                    </VWindowItem>

                    <!-- TAB 2: Details -->
                    <VWindowItem value="detalles">
                        <VForm class="mt-2">
                            <VRow>
                               
                                <VCol cols="12" md="6">
                                    <VTextField v-model="capacity" type="number" label="Guest Capacity"
                                        placeholder="4" />
                                </VCol>
                                <VCol cols="12" md="6">
                                    <VTextField v-model="beds" type="number" label="Number of Beds" placeholder="2" />
                                </VCol>
                                <VCol cols="12" md="6">
                                    <VTextField v-model="bathrooms" type="number" label="Number of Bathrooms"
                                        placeholder="1" />
                                </VCol>
                            </VRow>
                        </VForm>
                    </VWindowItem>

                    <!-- TAB 3: Extras / Amenities -->
                    <VWindowItem value="extras">
                        <VForm class="mt-2">
                            <VRow>
                                <VCol cols="12" md="12">
                                    <VSelect v-model="services" :items="serviceList" multiple chips clearable
                                        label="Amenities" placeholder="Select amenities" />
                                </VCol>
                            </VRow>
                        </VForm>
                    </VWindowItem>
                    <VWindowItem value="images">
                        <VFileInput multiple label="File input" density="compact" />1
                    </VWindowItem>
                </VWindow>
            </VCardText>

            <VDivider />

            <VCardText class="d-flex gap-4">
                <VBtn @click="submitCabin">Save</VBtn>
                <VBtn color="secondary" variant="tonal" @click=" emit('update:isDialogEditVisible', false)">Cancel
                </VBtn>
            </VCardText>
        </VCard>
    </VDialog>
</template>
