<script setup>
import { ref } from 'vue'

const props = defineProps({
  isDialogVisible: {
    type: Boolean,
    required: true,
  },
  roles: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['update:isDialogVisible'])

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

const normalizeRoles = roles =>
  (roles || [])
    .map(role => {
      if (typeof role === 'string')
        return role

      return role?.name || ''
    })
    .filter(Boolean)

const resetForm = () => {
  firstName.value = ''
  email.value = ''
  mobile.value = ''
  password.value = ''
  confirmPassword.value = ''
  selectedRoles.value = []
  isActive.value = true
}

const dialogVisibleUpdate = val => {
  emit('update:isDialogVisible', val)
  if (!val) resetForm()
}

const validatePasswords = () => {
  if (password.value !== confirmPassword.value)
    return 'Passwords do not match'

  return true
}

const saveUser = async () => {
  if (password.value !== confirmPassword.value) {
    snackBar.value = { visible: true, message: 'Passwords do not match', color: 'error' }

    return
  }

  loading.value = true

  try {
    const payload = {
      name: firstName.value,
      email: email.value,
      mobile: mobile.value,
      password: password.value,
      roles: normalizeRoles(selectedRoles.value),
      is_active: isActive.value,
    }

    await $api('/users', {
      method: 'POST',
      body: payload,
      onResponseError: ({ response }) => {
        throw new Error(response.statusText || 'Failed to create user')
      },
    })

    snackBar.value = { visible: true, message: 'User created successfully', color: 'success' }
    resetForm()
    emit('update:isDialogVisible', false)
  } catch (error) {
    console.error(error)
    snackBar.value = { visible: true, message: error.message || 'Failed to create user', color: 'error' }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <AppFormDialog
    :model-value="props.isDialogVisible"
    title="Add New User"
    :max-width="500"
    submit-text="Create User"
    validate-on-submit
    :loading="loading"
    content-class="pa-6"
    @update:model-value="dialogVisibleUpdate"
    @submit="saveUser"
  >
    <VRow>
      <VCol
        cols="12"
        md="6"
      >
        <VTextField
          v-model="firstName"
          label="Full Name"
          placeholder="John Doe"
          prepend-inner-icon="ri-user-line"
          :rules="[v => !!v || 'Name is required']"
          required
        />
      </VCol>

      <VCol
        cols="12"
        md="6"
      >
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

      <VCol
        cols="12"
        md="6"
      >
        <VTextField
          v-model="password"
          label="Password"
          placeholder="••••••••"
          prepend-inner-icon="ri-lock-line"
          type="password"
          :rules="[v => !!v || 'Password is required']"
          required
        />
      </VCol>

      <VCol
        cols="12"
        md="6"
      >
        <VTextField
          v-model="confirmPassword"
          label="Confirm Password"
          placeholder="••••••••"
          prepend-inner-icon="ri-lock-line"
          type="password"
          :rules="[
            v => !!v || 'Confirm password is required',
            () => validatePasswords()
          ]"
          required
        />
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
    </VRow>
  </AppFormDialog>

  <VSnackbar
    v-model="snackBar.visible"
    location="top"
    :color="snackBar.color"
  >
    {{ snackBar.message }}
  </VSnackbar>
</template>
