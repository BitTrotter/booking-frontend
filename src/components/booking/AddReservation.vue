<script setup>
import { $api } from '@/utils/api'
import { PERMISOS } from '@/utils/constants'
import data from '@/views/js/datatable'
import { VBtn, VTextField } from 'vuetify/components'
import { onMounted, ref } from 'vue'
const emit = defineEmits(['update:isDialogVisible'])

let items = ref([])
let selectedItem = ref(null)
let dateRange = ref(null)
let startDate = ref(null)
let endDate = ref(null)

const props = defineProps({
    isDialogVisible: {
        type: Boolean,
        required: true,
    },
})
const dialogVisibleUpdate = val => {
    emit('update:isDialogVisible', val)
}

const getCabinsAsync = async () => {
    console.log('Fetching cabins...')
    try {

        const cabins = await $api('cabins?search=')

        return cabins
    } catch (error) {
        console.error('There was a problem with the fetch operation:', error)
        return []
    }
}

const submitReservation = async () => {
    console.log(dateRange)
    const data = {
        cabin_id: selectedItem.value.id,
        start_date: startDate.value,
        end_date: endDate.value,
    }

    const resp = await $api('reservations', {
        method: 'POST',
        body: data,
        onResponseError: ({ response }) => {
            warnError.value = response.statusText
            throw new Error(response.statusText || 'Login failed')
        }
    })
    console.log('Reservation submitted:', resp)
    dialogVisibleUpdate(false)

}

onMounted(async () => {
    items.value = await getCabinsAsync()
})

</script>

<template>
    <VDialog :model-value="props.isDialogVisible" max-width="750" @update:model-value="dialogVisibleUpdate">
        <VCard class="refer-and-earn-dialog pa-3 pa-sm-11">
            <!-- 👉 dialog close btn -->
            <DialogCloseBtn variant="text" size="default" @click="emit('update:isDialogVisible', false)" />

            <VCombobox v-model="selectedItem" :items="items" item-title="name" item-value="id"
                placeholder="Select Cabin" class="mb-4" />
            <AppDateTimePicker class="mb-4" v-model="startDate" label="Start date" placeholder="Start date"/>
            <AppDateTimePicker class="mb-4" v-model="endDate" label="End date" placeholder="End date"/>

            <VBtn color="primary" class="mt-4" @click="submitReservation">Submit Reservation</VBtn>

        </VCard>
    </VDialog>
</template>

<style lang="scss">
.refer-link-input {
    .v-field--appended {
        padding-inline-end: 0;
    }

    .v-field__append-inner {
        padding-block-start: 0.125rem;
    }
}
</style>
