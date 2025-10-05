<script setup>

const props = defineProps({
  isDialogVisible: {
    type: Boolean,
    required: true,
  },
  roles: {
    type: Object,
    required:true,
  },
  userSelected:{
    type: Object,
    required: true,
  }
})

const emit = defineEmits(['update:isDialogVisible','editUser'])

const dialogVisibleUpdate = val => {
  emit('update:isDialogVisible', val)
}

const form = ref({
    name: null,
    surname: null,
    email: null,
    phone: null,
    type_document: 'DNI',
    n_document: null,
    birthday: null,
    designation: null,
    gender: null,
    role_id: null,
    password: null,
});
const type_documents = [
    'DNI',
    'PASAPORTE',
    'CARNET DE EXTRANJERIA'
];
const isPasswordVisible = ref(false)
const warning = ref(null);
const success = ref(null);
const error_exists = ref(null);
const FILE_AVATAR = ref(null);
const IMAGEN_PREVIZUALIZA = ref(null);
const roles = ref([]);

const update = async() => {
  warning.value = null;
      if(!form.value.name){
        warning.value = "Se debe llenar el nombre del usuario";
        return;
      }
      if(!form.value.surname){
        warning.value = "Se debe llenar el apellido del usuario";
        return;
      }
      if(!form.value.email){
        warning.value = "Se debe llenar el email del usuario";
        return;
      }
      if(!form.value.phone){
        warning.value = "Se debe llenar el telefono del usuario";
        return;
      }
      if(!form.value.gender){
        warning.value = "Se debe llenar el genero del usuario";
        return;
      }
      if(!form.value.role_id){
        warning.value = "Se debe seleccionar un rol para el usuario";
        return;
      }

    let formData = new FormData();

    formData.append("name",form.value.name);
    formData.append("surname",form.value.surname);
    formData.append("email",form.value.email);
    if(form.value.type_document){
        formData.append("type_document",form.value.type_document);
    }
    if(form.value.n_document){
        formData.append("n_document",form.value.n_document);
    }
    formData.append("phone",form.value.phone);
    formData.append("gender",form.value.gender);
    if(form.value.designation){
        formData.append("designation",form.value.designation);
    }
    if(form.value.password){
        formData.append("password",form.value.password);
    }
    formData.append("role_id",form.value.role_id);
    if(form.value.birthday){
        formData.append("birthday",form.value.birthday);
    }
    if(FILE_AVATAR.value){
        formData.append("imagen",FILE_AVATAR.value);
    }
  try {
    success.value = null;
    const resp =  await $api('/staffs/'+props.userSelected.id,{
        method: 'POST',
        body:formData,
        onResponseError({response}){
          console.log(response);
          error_exists.value = response._data.error;
        }
    })
    console.log(resp);
    if(resp.message == 403){
      warning.value = resp.message_text;
    }else{
      success.value = "El usuario se ha editado correctamente";
      setTimeout(() => {
        warning.value = null;
        error_exists.value = null;
      }, 1500);
      emit('editUser', resp.user)
    }
  } catch (error) {
    console.log(error);
    error_exists.value = error;
  }
}

const loadFile = ($event) => {
    if($event.target.files[0].type.indexOf("image") < 0){
        FILE_AVATAR.value = null;
        IMAGEN_PREVIZUALIZA.value = null;
      warning.value = "SOLAMENTE PUEDEN SER ARCHIVOS DE TIPO IMAGEN";
      return;
    }
    warning.value = '';
    FILE_AVATAR.value = $event.target.files[0];
    let reader = new FileReader();
    reader.readAsDataURL(FILE_AVATAR.value);
    reader.onloadend = () => IMAGEN_PREVIZUALIZA.value = reader.result;
}

onMounted(() => {
    roles.value = props.roles;
    form.value.name = props.userSelected.name;
    form.value.surname = props.userSelected.surname
    form.value.email = props.userSelected.email
    form.value.phone = props.userSelected.phone
    form.value.type_document = props.userSelected.type_document
    form.value.n_document = props.userSelected.n_document
    form.value.birthday = props.userSelected.birthday
    form.value.designation = props.userSelected.designation
    form.value.gender = props.userSelected.gender
    form.value.role_id = parseInt(props.userSelected.role_id)
    IMAGEN_PREVIZUALIZA.value = props.userSelected.avatar;
})
</script>

<template>
  <VDialog
    :model-value="props.isDialogVisible"
    max-width="750"
    @update:model-value="dialogVisibleUpdate"
  >
    <VCard class="refer-and-earn-dialog pa-3 pa-sm-11">
      <!-- 👉 dialog close btn -->
      <DialogCloseBtn
        variant="text"
        size="default"
        @click="emit('update:isDialogVisible', false)"
      />

      <VCardText class="pa-5">
        <div class="mb-6">
          <h4 class="text-h4 text-center mb-2">
            Edit User : {{ props.userSelected.id }}
          </h4>
          <!-- <p class="text-sm-body-1 text-center">
            Supported payment methods
          </p> -->
        </div>

        <VRow>
            <VCol cols="6">
                <VTextField
                  label="Nombre:"
                  v-model="form.name"
                  placeholder="Example: Rafael"
                />
            </VCol>
            <VCol cols="6">
                <VTextField
                  label="Apellido:"
                  v-model="form.surname"
                  placeholder="Example: Mendoza"
                />
            </VCol>

            <VCol cols="4">
                <VTextField
                  label="Telefono:"
                  type="number"
                  v-model="form.phone"
                  placeholder="Example: 99999999"
                />
            </VCol>
            <VCol cols="4">
                <VSelect
                    :items="type_documents"
                    v-model="form.type_document"
                    label="Tipo de documento"
                    placeholder="Select Item"
                    eager
                />
            </VCol>
            <VCol cols="4">
                <VTextField
                  label="N° de documento:"
                  type="number"
                  v-model="form.n_document"
                  placeholder="Example: Mendoza"
                />
            </VCol>

            <VCol cols="4">
                <AppDateTimePicker
                    v-model="form.birthday"
                    label="Cumpleaños"
                    placeholder="Select date"
                />
            </VCol>
            <VCol cols="4">
                <VRadioGroup
                    v-model="form.gender"
                    inline
                >
                    <VRadio
                    label="Masculino"
                    value="M"
                    />
                    <VRadio
                    label="Femenino"
                    value="F"
                    />
                </VRadioGroup>
            </VCol>
            <VCol cols="4">
                <VTextarea
                    v-model="form.designation"
                    label="Designación"
                    placeholder="Text"
                />
            </VCol>
            <VCol cols="6">
                <VRow>
                    <VCol cols="12">
                        <VFileInput label="File input" @change="loadFile($event)" />
                    </VCol>
                    <VCol cols="12" v-if="IMAGEN_PREVIZUALIZA">
                        <VImg
                        width="137"
                        height="176"
                        :src="IMAGEN_PREVIZUALIZA"
                        />
                    </VCol>
                </VRow>
            </VCol>
            <VCol cols="6">
                <VSelect
                    :items="roles"
                    v-model="form.role_id"
                    label="Rol"
                    item-title="name"
                    item-value="id"
                    placeholder="Select Rol"
                    eager
                />
            </VCol>
            <VCol cols="6">
                <VTextField
                  v-model="form.email"
                  label="Email"
                  type="email"
                  placeholder="johndoe@email.com"
                />
            </VCol>
            <VCol cols="6">
                <VTextField
                  v-model="form.password"
                  label="Password"
                  placeholder="············"
                  :type="isPasswordVisible ? 'text' : 'password'"
                  :append-inner-icon="isPasswordVisible ? 'ri-eye-off-line' : 'ri-eye-line'"
                  @click:append-inner="isPasswordVisible = !isPasswordVisible"
                />
            </VCol>
        </VRow>

        <VAlert type="warning" class="mt-3" v-if="warning">
          <strong>{{ warning }}</strong>
        </VAlert>
        <VAlert type="error" class="mt-3" v-if="error_exists">
          <strong>En el servidor hubo un error al guardar</strong>
        </VAlert>
        <VAlert type="success" class="mt-3" v-if="success">
          <strong>{{ success }}</strong>
        </VAlert>
      </VCardText>
      <VCardText class="pa-5">
        <VBtn color="primary" class="mb-4" @click="update()">
          Editar
        </VBtn>
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
