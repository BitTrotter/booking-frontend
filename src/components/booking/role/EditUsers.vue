<script setup>
import { PERMISOS } from '@/utils/constants'
import data from '@/views/js/datatable'
import { VBtn, VTextField } from 'vuetify/components'
import { onMounted, watch } from 'vue'

const props = defineProps({
    isDialogVisible: {
        type: Boolean,
        required: true,
    },
    user: {
        type: Object,
        required: true,
    },
})

const roles = ref([])
const warning = ref(false)
const emit = defineEmits(['update:isDialogVisible', 'user-updated'])
let warnError = ref("")
const succses = ref(false)
let firstName = ref('')
let email = ref('')
let mobile = ref('')
let password = ref('')
let checkbox = ref(false)
let permissions = ref([])
let currentTab = ref(0)
let tabItemContent = ref('Content for Tab 1')


const dialogVisibleUpdate = val => {
    emit('update:isDialogVisible', val)
}

watch(() => props.user, (newUser) => {
    if (newUser) {
        firstName.value = newUser.name || ''
        email.value = newUser.email || ''
        mobile.value = newUser.mobile || ''
        password.value = '' // Don't pre-fill password
        checkbox.value = newUser.checkbox || false
        permissions.value = newUser.permissions || []
        roles.value = newUser.roles || []
    }
}, { immediate: true })

const saveUser = async () => {
    if (firstName.value.length === 0 || email.value.length === 0 || mobile.value.length === 0) {
        warning.value = true
        return
    }
    warning.value = false
    const data = {
        email: email.value,
        name: firstName.value,
        mobile: mobile.value,
        password: password.value || undefined, // Only send if changed
        checkbox: checkbox.value,
    }

    try {
        const resp = await $api(`/users/${props.user.id}`, {
            method: 'PUT',
            body: data,
            onResponseError: ({ response }) => {
                console.log(response);
                warnError.value = 'Error ' + response.statusText
                throw new Error(response.statusText || 'Update failed')
            }
        })
        if (resp.message !== 200) { // Assuming 200 for success
            warnError.value = 'Error. ' + resp.message
            return
        }
        succses.value = true
        warnError.value = null
        emit('update:isDialogVisible', false)
        emit('user-updated')
        // Optionally emit to refresh list
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

            <VCardText class="pa-5">
                <VForm @submit.prevent="saveUser">
                    <VRow>
                        <!-- 👉 First Name -->
                        <VCol cols="12">
                            <VRow no-gutters>
                                <VCol cols="12" md="3">
                                    <label for="firstNameHorizontalIcons">First Name</label>
                                </VCol>

                                <VCol cols="12" md="9">
                                    <VTextField id="firstNameHorizontalIcons" v-model="firstName"
                                        prepend-inner-icon="ri-user-line" placeholder="John" persistent-placeholder />
                                </VCol>
                            </VRow>
                        </VCol>

                        <!-- 👉 Email -->
                        <VCol cols="12">
                            <VRow no-gutters>
                                <VCol cols="12" md="3">
                                    <label for="emailHorizontalIcons">Email</label>
                                </VCol>

                                <VCol cols="12" md="9">
                                    <VTextField id="emailHorizontalIcons" v-model="email"
                                        prepend-inner-icon="ri-mail-line" placeholder="johndoe@email.com"
                                        persistent-placeholder />
                                </VCol>
                            </VRow>
                        </VCol>

                        <!-- 👉 Mobile -->
                        <VCol cols="12">
                            <VRow no-gutters>
                                <VCol cols="12" md="3">
                                    <label for="mobileHorizontalIcons">Mobile</label>
                                </VCol>

                                <VCol cols="12" md="9">
                                    <VTextField id="mobileHorizontalIcons" v-model="mobile"
                                        prepend-inner-icon="ri-phone-line" placeholder="+1 123 456 7890"
                                        persistent-placeholder />
                                </VCol>
                            </VRow>
                        </VCol>

                        <!-- 👉 Password -->
                        <VCol cols="12">
                            <VRow no-gutters>
                                <VCol cols="12" md="3">
                                    <label for="passwordHorizontalIcons">Password (leave blank to keep current)</label>
                                </VCol>

                                <VCol cols="12" md="9">
                                    <VTextField id="passwordHorizontalIcons" v-model="password"
                                        prepend-inner-icon="ri-lock-line" placeholder="Password" type="password"
                                        persistent-placeholder />
                                </VCol>
                            </VRow>
                        </VCol>
                        <VTabs v-model="currentTab" class="v-tabs-pill">
                            <VTab>Roles</VTab>
                            <VTab>Permissions</VTab>
                        </VTabs>

                        <VWindow v-model="currentTab" class="mt-5">
                            <VWindowItem value="0">
                                <div class="d-flex flex-wrap gap-2">
                                    <VChip v-for="role in roles" closable class="ma-1"
                                        @click:close="isDefaultChipVisible = !isDefaultChipVisible">
                                        {{ role }}
                                    </VChip>
                                </div>
                            </VWindowItem>

                            <VWindowItem value="1">
                                <div class="d-flex flex-wrap gap-2">
                                    <VChip v-for="permission in permissions" closable class="ma-1"
                                        @click:close="isDefaultChipVisible = !isDefaultChipVisible">
                                        {{ permission }}
                                    </VChip>
                                </div>
                            </VWindowItem>
                        </VWindow>

                        <!-- 👉 Checkbox -->
                        <VCol cols="12">
                            <VRow no-gutters>
                                <VCol cols="12" md="3">
                                    <label>Active</label>
                                </VCol>

                                <VCol cols="12" md="9">
                                    <VCheckbox v-model="checkbox" label="Is Active" />
                                </VCol>
                            </VRow>

                        </VCol>

                        <!-- 👉 Submit and Cancel -->
                        <VCol cols="12" class="d-flex gap-4">
                            <VBtn type="submit" color="primary" @click="saveUser">
                                Update User
                            </VBtn>

                            <VBtn variant="tonal" color="secondary" @click="emit('update:isDialogVisible', false)">
                                Cancel
                            </VBtn>
                        </VCol>
                    </VRow>
                </VForm>
            </VCardText>
        </VCard>
    </VDialog>
</template>