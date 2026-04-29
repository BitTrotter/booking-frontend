<script setup>
import { VBtn, VTextField } from 'vuetify/components'


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

const warning = ref(false)
const emit = defineEmits(['update:isDialogVisible'])
let warnError = ref("")
const succses = ref(false)
let firstName = ref('')
let email = ref('')
let mobile = ref('')
let password = ref('')
let checkbox = ref(false)
let selectedRol = ref([])

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
    roles: normalizeRoles(selectedRol.value),
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

      <VCardText class="pa-5">
        <VForm @submit.prevent="(saveUser)">
          <VRow>
            <!-- 👉 First Name -->
            <VCol cols="12">
              <VRow no-gutters>
                <VCol cols="12" md="3">
                  <label for="firstNameHorizontalIcons">First Name</label>
                </VCol>

                <VCol cols="12" md="9">
                  <VTextField id="firstNameHorizontalIcons" v-model="firstName" prepend-inner-icon="ri-user-line"
                    placeholder="John" persistent-placeholder />
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
                  <VTextField id="emailHorizontalIcons" v-model="email" prepend-inner-icon="ri-mail-line"
                    placeholder="johndoe@email.com" persistent-placeholder />
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
                  <VTextField id="mobileHorizontalIcons" v-model="mobile" type="number"
                    prepend-inner-icon="ri-smartphone-line" placeholder="+1 123 456 7890" persistent-placeholder />
                </VCol>
              </VRow>
            </VCol>

            <!-- 👉 Password -->
            <VCol cols="12">
              <VRow no-gutters>
                <VCol cols="12" md="3">
                  <label for="passwordHorizontalIcons">Password</label>
                </VCol>

                <VCol cols="12" md="9">
                  <VTextField id="passwordHorizontalIcons" v-model="password" prepend-inner-icon="ri-lock-line"
                    autocomplete="on" type="password" placeholder="············" persistent-placeholder />
                </VCol>
              </VRow>
            </VCol>
            <VCol cols="12">
              <VRow no-gutters>
                <VCol cols="12" md="3">
                  <label for="passwordHorizontalIcons">Roles</label>
                </VCol>

                <VCol cols="12" md="9">

                  <VCombobox v-model="selectedRol" :items="props.roles" item-title="name" item-value="name"
                    label="Roles" multiple chips />
                </VCol>
              </VRow>
            </VCol>


            <!-- 👉 Checkbox -->
            <VCol cols="12">
              <VRow no-gutters>
                <VCol cols="12" md="3" />
                <VCol cols="12" md="9">
                  <VCheckbox v-model="checkbox" label="Remember me" />
                </VCol>
              </VRow>
            </VCol>

            <!-- 👉 submit and reset button -->
            <VCol cols="12">
              <VRow no-gutters>
                <VCol cols="12" md="3" />
                <VCol cols="12" md="9">
                  <VBtn type="submit" class="me-4">
                    Submit
                  </VBtn>
                  <VBtn color="secondary" variant="tonal" type="reset">
                    Reset
                  </VBtn>
                </VCol>
              </VRow>
            </VCol>
          </VRow>
        </VForm>

      </VCardText>

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
