<script setup>
import { PERMISOS } from '@/utils/constants'
import { VTextField } from 'vuetify/components'


const props = defineProps({
    isDialogVisible: {
        type: Boolean,
        required: true,
    },
})

const emit = defineEmits(['update:isDialogVisible'])


const dialogVisibleUpdate = val => {
    emit('update:isDialogVisible', val)
}
const list_permission = PERMISOS
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
                    <VTextField label="Role Name" />


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
                    <tr v-for="item in list_permission" :key="item.name">
                        <td>
                            {{ item.name }}
                        </td>
                        <td>

                            <ul>
                                <li v-for="(permiso, index2) in item.permisos" :key="index2">
                                   
                                    <VCheckbox 
                                   
                                    :label="permiso.name" 
                                    :value="permiso.permiso" />
                                </li>
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
