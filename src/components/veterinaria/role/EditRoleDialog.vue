<script setup>

const props = defineProps({
  isDialogVisible: {
    type: Boolean,
    required: true,
  },
  rolSelected: {
    type: Object,
    required: true,
  }
})

const emit = defineEmits(['update:isDialogVisible','addRole'])

const dialogVisibleUpdate = val => {
  emit('update:isDialogVisible', val)
}
const LIST_PERMISSION = PERMISOS;
const role = ref(null);
const permissions = ref([]);
const warning = ref(null);
const success = ref(null);
const error_exists = ref(null);
const role_selected = ref(null);

const addPermission = (permiso) => {
  let INDEX = permissions.value.findIndex((perm) => perm == permiso);
  if(INDEX != -1){
    permissions.value.splice(INDEX,1);
  }else{
    permissions.value.push(permiso);
  }
  console.log(permissions.value);
}

const store = async() => {
  warning.value = null;
  if(!role.value){
    warning.value = "Se debe llenar el nombre del rol";
    return;
  }
  if(permissions.value.length == 0){
    warning.value = "Se debe seleccionar al menos un permiso";
    return;
  }

  let data = {
    name: role.value,
    permissions: permissions.value,
  }

  try {
    const resp =  await $api('/role/'+role_selected.value.id,{
        method: 'PATCH',
        body:data,
        onResponseError({response}){
          console.log(response);
          error_exists.value = response._data.error;
        }
    })
    console.log(resp);
    if(resp.message == 403){
      warning.value = resp.message_text;
    }else{
      success.value = "El rol se ha editado correctamente";
      emit('addRole', true)
    }
  } catch (error) {
    console.log(error);
    error_exists.value = error;
  }
}

onMounted(() => {
  role_selected.value = props.rolSelected;
  console.log(role_selected.value);
  role.value = role_selected.value.name;
  permissions.value = role_selected.value.permissions_pluck;
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
          <h4 class="text-h4 text-center mb-2" v-if="role_selected">
            Edit Role : {{ role_selected.id }}
          </h4>
          <!-- <p class="text-sm-body-1 text-center">
            Supported payment methods
          </p> -->
        </div>

        <VTextField
          label="Rol:"
          v-model="role"
          placeholder="Example: Administrador"
        />

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
        <VBtn color="primary" class="mb-4" @click="store()">
          Editar
        </VBtn>
        <VTable>
          <thead>
            <tr>
              <th class="text-uppercase">
                Modulo
              </th>
              <th class="text-uppercase">
                Permisos
              </th>
            </tr>
          </thead>
  
          <tbody>
            <tr
              v-for="(item, index) in LIST_PERMISSION"
              :key="index"
            >
              <td>
                {{ item.name }}
              </td>
              <td>
                <ul>
                  <li v-for="(permiso, index2) in item.permisos" :key="index2" style="list-style: none;">
                    <VCheckbox
                      v-model="permissions"
                      :label="permiso.name"
                      :value="permiso.permiso"
                      @click="addPermission(permiso.permiso)"
                    />
                  </li>
                </ul>
              </td>
            </tr>
          </tbody>
        </VTable>
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
