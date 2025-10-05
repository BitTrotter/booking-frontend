<script setup>

const props = defineProps({
  isDialogVisible: {
    type: Boolean,
    required: true,
  },
  medicalRecord: {
    type: Object,
    required: true,
  },
  paymentSelected: {
    type: Object,
    required: true,
  }
})

const emit = defineEmits(['update:isDialogVisible','deletePayment'])

const dialogVisibleUpdate = val => {
  emit('update:isDialogVisible', val)
}

const warning = ref(null);
const success = ref(null);
const error_exists = ref(null);
const medical_record_selected = ref(null);

const deleted = async() => {
  try {
    const resp =  await $api('/payments/'+props.paymentSelected.id+"?appointment_id="+(medical_record_selected.value.appointment_id ?? '')+
        "&vaccination_id="+(medical_record_selected.value.vaccination_id ?? '')+
        "&surgerie_id="+(medical_record_selected.value.surgerie_id ?? '')+
        "&medical_record_id="+medical_record_selected.value.id,{
        method: 'DELETE',
        onResponseError({response}){
          console.log(response);
          error_exists.value = response._data.error;
        }
    })
    console.log(resp);
    success.value = "El pago se ha eliminado correctamente";
    emit('deletePayment', resp.payment)
    emit('update:isDialogVisible', false)
  } catch (error) {
    console.log(error);
    error_exists.value = error;
  }
}

onMounted(() => {
  medical_record_selected.value = props.medicalRecord;
  console.log(medical_record_selected.value,props.paymentSelected);
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
          <h4 class="text-h4 text-center mb-2" v-if="medical_record_selected">
            Deleted Payment : {{ props.paymentSelected.id + ' '+ props.paymentSelected.method_payment }}
          </h4>
          <!-- <p class="text-sm-body-1 text-center">
            Supported payment methods
          </p> -->
        </div>
        <p v-if="medical_record_selected">¿Estas seguro de eliminar el PAGO "{{ props.paymentSelected.amount }} PEN"?</p>
        <VAlert type="error" class="mt-3" v-if="error_exists">
          <strong>En el servidor hubo un error al guardar</strong>
        </VAlert>
        <VAlert type="warning" class="mt-3" v-if="success">
          <strong>{{ success }}</strong>
        </VAlert>
      </VCardText>
      <VCardText class="pa-5">
        <VBtn color="error" class="mb-4" @click="deleted()">
          Eliminar
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
