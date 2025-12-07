<script setup>
import { PERMISOS } from '@/utils/constants'
import data from '@/views/js/datatable'
import { VBtn, VTextField } from 'vuetify/components'


const props = defineProps({
    isDialogVisible: {
        type: Boolean,
        required: true,
    },
})

const roles = ref([])
const warning = ref(false)
const emit = defineEmits(['update:isDialogVisible'])
let warnError = ref("")
const succses = ref(false)
let firstName = ref('')
let email = ref('')
let mobile = ref('')
let password = ref('')
let checkbox = ref(false)
const dialogVisibleUpdate = val => {
    emit('update:isDialogVisible', val)
}

const saveUser = async () => {
    if (firstName.value.length === 0 || email.value.length === 0 || mobile.value.length === 0 || password.value.length === 0) {
        warning.value = true
        return
    }
    warning.value = false
    const data = {
        email: email.value,
        name: firstName.value,
        mobile: mobile.value,
        password: password.value,
        checkbox: checkbox.value,
    }

    try {

        const resp = await $api('/users', {
            method: 'POST',
            body: data,
            onResponseError: ({ response }) => {
                console.log(response);
                warnError.value = 'Error' + response.statusText
                throw new Error(response.statusText || 'Login failed')
            }
        })
        if (await !resp.message === 201) {
            warnError.value = 'Error. ' + resp.message
            return
        }
        succses.value = true
        firstName.value = ''
        email.value = ''
        mobile.value = ''
        password.value = ''
        checkbox.value = false
        warnError.value = null
        emit('update:isDialogVisible', false)
    } catch (error) {
        warnError.value = 'Error. ' + error.message
    }

}
</script>

<template>
    <VDialog :model-value="props.isDialogVisible" max-width="750" @update:model-value="dialogVisibleUpdate">
        <VCard class="refer-and-earn-dialog pa-3 pa-sm-11">
            <!-- 👉 dialog close btn -->
            <DialogCloseBtn variant="text" size="default" @click="emit('update:isDialogVisible', false)" />

            <VCombobox v-model="selectedItem" :items="items" placeholder="Select Cabin" class="mb-4" />
            <AppDateTimePicker v-model="dateRange" label="Range" placeholder="Select date"
                :config="{ mode: 'range' }" />

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
