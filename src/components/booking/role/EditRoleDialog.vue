<script setup>
import { PERMISOS } from '@/utils/constants'

const props = defineProps({
    isDialogVisible: {
        type: Boolean,
        required: true,
    },
    role: {
        type: Object,
        default: null,
    },
})

const emit = defineEmits(['update:isDialogVisible', 'saved'])

const role_name = ref('')
const permissions = ref([])
const isLoading = ref(false)
const warnError = ref('')
const nameError = ref('')

const list_permission = PERMISOS
const totalPermissions = computed(() => PERMISOS.reduce((acc, m) => acc + m.permisos.length, 0))

// Populate form whenever the dialog opens with a role
watch(() => props.isDialogVisible, visible => {
    if (visible && props.role) {
        role_name.value = props.role.name ?? ''
        permissions.value = Array.isArray(props.role.permissions)
            ? [...props.role.permissions]
            : []
        warnError.value = ''
        nameError.value = ''
    }
})

const togglePermission = permiso => {
    const idx = permissions.value.indexOf(permiso)
    if (idx === -1) permissions.value.push(permiso)
    else permissions.value.splice(idx, 1)
}

const isModuleAllSelected = module =>
    module.permisos.every(p => permissions.value.includes(p.permiso))

const isModulePartialSelected = module =>
    module.permisos.some(p => permissions.value.includes(p.permiso)) && !isModuleAllSelected(module)

const toggleModule = module => {
    if (isModuleAllSelected(module)) {
        permissions.value = permissions.value.filter(p => !module.permisos.map(x => x.permiso).includes(p))
    } else {
        module.permisos.forEach(p => {
            if (!permissions.value.includes(p.permiso)) permissions.value.push(p.permiso)
        })
    }
}

const selectAll = () => {
    permissions.value = PERMISOS.flatMap(m => m.permisos.map(p => p.permiso))
}

const clearAll = () => {
    permissions.value = []
}

const validate = () => {
    nameError.value = ''
    warnError.value = ''
    if (!role_name.value.trim()) {
        nameError.value = 'Role name is required.'
        return false
    }
    if (role_name.value.trim().length < 3) {
        nameError.value = 'Role name must be at least 3 characters.'
        return false
    }
    if (permissions.value.length === 0) {
        warnError.value = 'Please select at least one permission.'
        return false
    }
    return true
}

const close = () => {
    emit('update:isDialogVisible', false)
}

const saveRole = async () => {
    if (!validate()) return

    isLoading.value = true
    try {
        await $api(`/role/${props.role.id}`, {
            method: 'PUT',
            body: { name: role_name.value.trim(), permissions: permissions.value },
            onResponseError: ({ response }) => {
                throw new Error(response._data?.message || response.statusText || 'Failed to update role')
            },
        })
        emit('saved')
        close()
    } catch (error) {
        warnError.value = error.message || 'Error updating role.'
    } finally {
        isLoading.value = false
    }
}
</script>

<template>
    <VDialog
        :model-value="props.isDialogVisible"
        max-width="800"
        scrollable
        @update:model-value="val => !val && close()"
    >
        <VCard>
            <!-- Header -->
            <VCardItem class="py-4 px-6">
                <VCardTitle class="d-flex align-center gap-3 pa-0">
                    <VAvatar color="warning" variant="tonal" size="38" rounded="lg">
                        <VIcon icon="tabler-shield-cog" size="22" />
                    </VAvatar>
                    <div>
                        <p class="text-h6 font-weight-bold mb-0">Edit Role</p>
                        <p class="text-caption text-medium-emphasis mb-0">
                            Update name and permissions for
                            <span class="font-weight-medium text-high-emphasis">{{ props.role?.name }}</span>
                        </p>
                    </div>
                </VCardTitle>
                <template #append>
                    <DialogCloseBtn variant="text" size="small" @click="close" />
                </template>
            </VCardItem>

            <VDivider />

            <VCardText class="pa-6">
                <!-- Role Name Field -->
                <VTextField
                    v-model="role_name"
                    label="Role Name"
                    placeholder="e.g. Manager, Receptionist..."
                    prepend-inner-icon="tabler-id-badge"
                    :error-messages="nameError"
                    variant="outlined"
                    density="comfortable"
                    clearable
                    class="mb-6"
                    @update:model-value="nameError = ''"
                />

                <!-- Permissions Section Header -->
                <div class="d-flex align-center justify-space-between mb-3">
                    <div class="d-flex align-center gap-2">
                        <span class="text-subtitle-2 font-weight-semibold text-uppercase text-medium-emphasis">
                            Permissions
                        </span>
                        <VChip
                            :color="permissions.length > 0 ? 'warning' : 'default'"
                            size="x-small"
                            label
                        >
                            {{ permissions.length }} / {{ totalPermissions }}
                        </VChip>
                    </div>
                    <div class="d-flex gap-2">
                        <VBtn variant="tonal" size="x-small" color="warning" @click="selectAll">
                            Select All
                        </VBtn>
                        <VBtn variant="tonal" size="x-small" color="secondary" @click="clearAll">
                            Clear
                        </VBtn>
                    </div>
                </div>

                <!-- Error Alert -->
                <VAlert
                    v-if="warnError"
                    type="error"
                    variant="tonal"
                    closable
                    density="compact"
                    class="mb-4"
                    @click:close="warnError = ''"
                >
                    {{ warnError }}
                </VAlert>

                <!-- Permissions Table -->
                <VTable density="comfortable" class="permissions-table rounded-lg">
                    <thead>
                        <tr>
                            <th style="min-width: 200px">Module</th>
                            <th>Permissions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="module in list_permission" :key="module.name">
                            <td>
                                <div class="d-flex align-center gap-1">
                                    <VCheckbox
                                        :model-value="isModuleAllSelected(module)"
                                        :indeterminate="isModulePartialSelected(module)"
                                        hide-details
                                        density="compact"
                                        color="warning"
                                        @click.prevent="toggleModule(module)"
                                    />
                                    <span class="text-body-2 font-weight-medium">{{ module.name }}</span>
                                </div>
                            </td>
                            <td>
                                <div class="d-flex flex-wrap gap-2 py-2">
                                    <VChip
                                        v-for="permiso in module.permisos"
                                        :key="permiso.permiso"
                                        :color="permissions.includes(permiso.permiso) ? 'warning' : 'default'"
                                        :variant="permissions.includes(permiso.permiso) ? 'tonal' : 'outlined'"
                                        size="small"
                                        label
                                        class="permission-chip"
                                        @click="togglePermission(permiso.permiso)"
                                    >
                                        <VIcon
                                            v-if="permissions.includes(permiso.permiso)"
                                            start
                                            icon="tabler-check"
                                            size="12"
                                        />
                                        {{ permiso.name }}
                                    </VChip>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </VTable>
            </VCardText>

            <VDivider />

            <!-- Footer Actions -->
            <VCardActions class="pa-4 gap-3 justify-end">
                <VBtn variant="tonal" color="secondary" @click="close">
                    Cancel
                </VBtn>
                <VBtn
                    variant="elevated"
                    color="warning"
                    :loading="isLoading"
                    prepend-icon="tabler-device-floppy"
                    @click="saveRole"
                >
                    Save Changes
                </VBtn>
            </VCardActions>
        </VCard>
    </VDialog>
</template>

<style scoped>
.permissions-table {
    border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.permission-chip {
    cursor: pointer;
    transition: transform 0.12s ease, box-shadow 0.12s ease;
}

.permission-chip:hover {
    transform: translateY(-1px);
}
</style>
