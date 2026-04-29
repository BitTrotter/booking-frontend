<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  isDialogVisible: {
    type: Boolean,
    required: true,
  },
  roles: {
    type: Array,
    default: () => [],
  },
  user: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['update:isDialogVisible', 'user-updated'])
const refForm = ref()
const loading = ref(false)
const snackBar = ref({
  visible: false,
  message: '',
  color: 'success',
})

const firstName = ref('')
const email = ref('')
const mobile = ref('')
const password = ref('')
const confirmPassword = ref('')
const selectedRoles = ref([])
const isActive = ref(true)
const permissions = ref([])

const normalizeRoles = roles =>
  (roles || [])
    .map(role => {
      if (typeof role === 'string')
        return role
      return role?.name || ''
    })
    .filter(Boolean)

const dialogVisibleUpdate = val => {
  emit('update:isDialogVisible', val)
}

watch(() => props.user, newUser => {
  if (newUser) {
    firstName.value = newUser.name || ''
    email.value = newUser.email || ''
    mobile.value = newUser.mobile || ''
    password.value = ''
    confirmPassword.value = ''
    isActive.value = newUser.is_active !== false
    permissions.value = newUser.permissions || []
    selectedRoles.value = normalizeRoles(newUser.roles)
    refForm.value?.resetValidation()
  }
}, { immediate: true })

const validatePasswords = () => {
  if (password.value && password.value !== confirmPassword.value)
    return 'Passwords do not match'
  return true
}

const saveUser = async () => {
  const validation = await refForm.value?.validate()
  if (!validation?.valid)
    return

  if (password.value && password.value !== confirmPassword.value) {
    snackBar.value = { visible: true, message: 'Passwords do not match', color: 'error' }
    return
  }

  loading.value = true

  try {
    const payload = {
      name: firstName.value,
      email: email.value,
      mobile: mobile.value,
      roles: normalizeRoles(selectedRoles.value),
      is_active: isActive.value,
    }

    if (password.value)
      payload.password = password.value

    const resp = await $api(`/users/${props.user.id}`, {
      method: 'PUT',
      body: payload,
      onResponseError: ({ response }) => {
        throw new Error(response.statusText || 'Failed to update user')
      },
    })

    snackBar.value = { visible: true, message: 'User updated successfully', color: 'success' }
    emit('update:isDialogVisible', false)
    emit('user-updated')
  } catch (error) {
    console.error(error)
    snackBar.value = { visible: true, message: error.message || 'Failed to update user', color: 'error' }
  } finally {
    loading.value = false
  }
}

const deleteUser = async () => {
  if (!confirm('Are you sure you want to delete this user?')) return

  loading.value = true

  try {
    await $api(`/users/${props.user.id}`, {
      method: 'DELETE',
      onResponseError: ({ response }) => {
        throw new Error(response.statusText || 'Failed to delete user')
      },
    })

    snackBar.value = { visible: true, message: 'User deleted successfully', color: 'success' }
    emit('update:isDialogVisible', false)
    emit('user-updated')
  } catch (error) {
    console.error(error)
    snackBar.value = { visible: true, message: error.message || 'Failed to delete user', color: 'error' }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <VDialog :model-value="props.isDialogVisible" max-width="500" @update:model-value="dialogVisibleUpdate">
    <VCard>
      <VCardTitle class="text-h5 font-weight-bold mb-2">Edit User</VCardTitle>
      <VDivider />

      <VCardText class="pa-6">
        <VForm ref="refForm">
          <VRow>
            <VCol cols="12" md="6">
              <VTextField
                v-model="firstName"
                label="Full Name"
                placeholder="John Doe"
                prepend-inner-icon="ri-user-line"
                :rules="[v => !!v || 'Name is required']"
                required
              />
            </VCol>

            <VCol cols="12" md="6">
              <VSelect
                v-model="isActive"
                :items="[
                  { title: 'Active', value: true },
                  { title: 'Inactive', value: false }
                ]"
                label="Status"
                prepend-inner-icon="ri-shield-check-line"
              />
            </VCol>

            <VCol cols="12">
              <VTextField
                v-model="email"
                label="Email"
                placeholder="john@example.com"
                prepend-inner-icon="ri-mail-line"
                type="email"
                :rules="[
                  v => !!v || 'Email is required',
                  v => /.+@.+\..+/.test(v) || 'Email must be valid'
                ]"
                required
              />
            </VCol>

            <VCol cols="12">
              <VTextField
                v-model="mobile"
                label="Mobile Number"
                placeholder="+1 (555) 123-4567"
                prepend-inner-icon="ri-phone-line"
                :rules="[v => !!v || 'Mobile is required']"
                required
              />
            </VCol>

            <VCol cols="12">
              <VDivider class="my-2" />
              <div class="text-body-2 font-weight-medium mb-3">Change Password (optional)</div>
            </VCol>

            <VCol cols="12" md="6">
              <VTextField
                v-model="password"
                label="New Password"
                placeholder="Leave blank to keep current"
                prepend-inner-icon="ri-lock-line"
                type="password"
              />
            </VCol>

            <VCol cols="12" md="6">
              <VTextField
                v-model="confirmPassword"
                label="Confirm Password"
                placeholder="••••••••"
                prepend-inner-icon="ri-lock-line"
                type="password"
                :rules="[() => validatePasswords()]"
              />
            </VCol>

            <VCol cols="12">
              <VDivider class="my-2" />
            </VCol>

            <VCol cols="12">
              <VSelect
                v-model="selectedRoles"
                :items="props.roles"
                item-title="name"
                item-value="name"
                label="Assign Roles"
                prepend-inner-icon="ri-shield-user-line"
                multiple
                chips
                clearable
              />
            </VCol>

            <VCol v-if="permissions.length > 0" cols="12">
              <div class="text-body-2 font-weight-medium mb-3">Permissions</div>
              <div class="d-flex flex-wrap gap-2">
                <VChip
                  v-for="(perm, index) in permissions"
                  :key="`${props.user?.id}-${perm}-${index}`"
                  size="small"
                  variant="tonal"
                >
                  {{ perm }}
                </VChip>
              </div>
            </VCol>
          </VRow>
        </VForm>
      </VCardText>

      <VDivider />

      <VCardText class="d-flex gap-3 pa-6 flex-wrap">
        <VBtn
          color="primary"
          :loading="loading"
          @click="saveUser"
        >
          Update User
        </VBtn>
        <VBtn color="secondary" variant="tonal" @click="dialogVisibleUpdate(false)">
          Cancel
        </VBtn>
        <VBtn color="error" variant="tonal" :loading="loading" @click="deleteUser">
          Delete User
        </VBtn>
      </VCardText>

      <VSnackbar v-model="snackBar.visible" location="top" :color="snackBar.color">
        {{ snackBar.message }}
      </VSnackbar>
    </VCard>
  </VDialog>
</template>

