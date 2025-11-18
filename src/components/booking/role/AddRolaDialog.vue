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

const role = ref('')
const permissions = ref([])
const warningEmptyRole = ref(false)
const role_name = ref('')
const emit = defineEmits(['update:isDialogVisible'])
const warnError = ref(null)
const succses = ref(false)
const addPermissions = (permiso) => {
    !permissions.value.includes(permiso) ? permissions.value.push(permiso) : permissions.value = permissions.value.filter(item => item !== permiso)


    console.log(permissions.value);

}

const dialogVisibleUpdate = val => {
    emit('update:isDialogVisible', val)
}
const list_permission = PERMISOS

const saveRole = async () => {
    if (permissions.value.length === 0) {
        warningEmptyRole.value = true
        return
    }
    warningEmptyRole.value = false
    const data = {
        name: role_name.value,
        permissions: permissions.value
    }

    try {
      
        const resp = await $api('/role', {
            method: 'POST',
            body: data ,
            onResponseError: ({ response }) => {
                warnError.value = response.statusText
                throw new Error(response.statusText || 'Login failed')
            }
        })
           if(!resp.message === 201){
            warnError.value = 'Error saving role. ' + resp.message
            return
            }
        succses.value = true
        role_name.value = ''
        permissions.value = []
        warnError.value = null
        emit('update:isDialogVisible', false)
    } catch (error) {
        warnError.value = 'Error saving role. ' + error.message
    }
   
}
</script>

<template>
    <VDialog :model-value="props.isDialogVisible" max-width="750" @update:model-value="dialogVisibleUpdate">
        <VCard class="refer-and-earn-dialog pa-3 pa-sm-11">
            <!-- 👉 dialog close btn -->
            <DialogCloseBtn variant="text" size="default" @click="emit('update:isDialogVisible', false)" />

            <VCardText class="pa-5">
                <div class="mb-6">
                    <h4 class="text-h4 text-center mb-2">
                        Add New Role
                    </h4>
                    <!-- <p class="text-sm-body-1 text-center">
            Supported payment methods
          </p> -->
                    <VTextField label="Role Name" v-model="role_name" />
                    <VAlert color="warning" class="mt-2" v-if="warningEmptyRole" dismissible
                        @dismissed="warningEmptyRole = false">
                        No role selected.
                    </VAlert>
                    <VAlert color="warning" class="mt-2" v-if="warnError" dismissible
                        @dismissed="warningEmptyRole = false">
                        {{ warnError }}
                    </VAlert>

                    <VBtn variant="text" color="secondary" class="mt-2" @click="saveRole()">
                        Save Role
                    </VBtn>


                </div>

            </VCardText>
            <VTable>
                <thead>
                    <tr>
                        <th class="text-uppercase">
                            Modules
                        </th>
                        <th class="text-uppercase">
                            Permission
                        </th>

                    </tr>
                </thead>

                <tbody class="pt-10">
                    <tr v-for="item in list_permission" :key="item.name" >
                      

                            <td>
                                {{ item.name }}
                            </td>
                            <td>
                                
                                <ul>
                                    <div class="d-sm-flex">
                                    <li v-for="(permiso, index2) in item.permisos" :key="index2" style="list-style: none;">
                                        
                                        <VCheckbox :label="permiso.name" :value="permiso.permiso"
                                        @click="addPermissions(permiso.permiso)" />
                                    </li>
                                    <li>
                                        
                                    </li>
                                </div>
                                </ul>
                            </td>
                      

                    </tr>
                </tbody>
            </VTable>
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
