<script setup>

const props = defineProps({
  isDialogVisible: {
    type: Boolean,
    required: true,
  },
  medicalRecord: {
    type:Object,
    required: true,
  },
  paymentSelected: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update:isDialogVisible','editPayment'])

const dialogVisibleUpdate = val => {
  emit('update:isDialogVisible', val)
}

const form = ref({
   method_payment: 'EFECTIVO',
   amount: 0,
});
const isPasswordVisible = ref(false)
const warning = ref(null);
const success = ref(null);
const error_exists = ref(null);
const method_payments = ref([
    "EFECTIVO",
    "DEPOSITO",
    "YAPE",
    "PLIN"
]);
const medical_record_selected = ref(null);
const fieldsClean = () => {
    form.value = {
        method_payment: 'EFECTIVO',
        amount: 0,
    }
}
const update = async() => {
  warning.value = null;
      if(!form.value.method_payment){
        warning.value = "Se debe seleccionar un metodo de pago para el registro";
        return;
      }
      if(!form.value.amount){
        warning.value = "Se debe digitar una monto para el pago";
        return;
      }

      let data = {
        method_payment: form.value.method_payment,
        amount: form.value.amount,
        appointment_id: medical_record_selected.value.appointment_id,
        vaccination_id:  medical_record_selected.value.vaccination_id,
        surgerie_id:  medical_record_selected.value.surgerie_id,
        medical_record_id: medical_record_selected.value.id,
      }
  try {
    const resp =  await $api('/payments/'+props.paymentSelected.id,{
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
      success.value = "El pago se ha editado correctamente";
      setTimeout(() => {
        success.value = null;
        warning.value = null;
        error_exists.value = null;
        // fieldsClean()
        // emit('update:isDialogVisible', false);
      }, 1500);
      emit('editPayment', resp.payment)
    }
  } catch (error) {
    console.log(error);
    error_exists.value = error;
  }
}
onMounted(() => {
  console.log(props.medicalRecord,props.paymentSelected);
  medical_record_selected.value = props.medicalRecord;
  form.value.method_payment = props.paymentSelected.method_payment;
  form.value.amount = props.paymentSelected.amount;
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
            Edit Payment : {{ props.paymentSelected.id }}
          </h4>
          <!-- <p class="text-sm-body-1 text-center">
            Supported payment methods
          </p> -->
        </div>

        <VRow>
            <VCol cols="6">
                <VSelect
                    v-model="form.method_payment"
                    :items="method_payments"
                    label="Metodos de pago"
                    item-title="name"
                    item-value="id"
                    placeholder="Select Metodo"
                    eager
                />
            </VCol>
            <VCol cols="6">
                <VTextField
                  label="Monto:"
                  v-model="form.amount"
                  type="number"
                  placeholder="Monto de adelanto"
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
