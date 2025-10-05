<script setup>

    const router = useRouter()
    const searchPets = ref(null);
    const searchVets = ref(null);
    const specie = ref(null);
    const species = ref(['Perro','Gato','Hámster','Loro','Tortuga','Vaca','Caballo','Cuy','Toro']);
    const type_services = ref([
        {
            id: 1,
            name: 'Citas medicas',
        },
        {
            id: 2,
            name: 'Vacunas',
        },
        {
            id: 3,
            name: 'Cirujía'
        }
    ]);

    const payments = ref([]);
    const currentPage = ref(1);
    const totalPage = ref(1);
    const medical_record_selected_deleted = ref(null);
    const isDeletePaymentDialogVisible = ref(false);
    const isAddPaymentDialogVisible = ref(false);
    const isEditPaymentDialogVisible = ref(false);

    const dateRange = ref(null);
    const type_date = ref(1);
    const state_pay = ref(null);
    const state_vaccination = ref(null);
    const type_service = ref(null);

    const medical_record_selected = ref(null);
    const payment_edit_selected = ref(null);
    const payment_delete_selected = ref(null);
    const list = async() => {
        let data = {
            type_date: type_date.value,
            start_date: dateRange.value ? dateRange.value.split("to")[0] : null,
            end_date: dateRange.value ? dateRange.value.split("to")[1] : null,
            state_pay: state_pay.value,
            state: state_vaccination.value,
            specie: specie.value,
            search_pets: searchPets.value,
            search_vets: searchVets.value,
            type_service: type_service.value,
        }
        const resp =  await $api('/payments/index?page='+currentPage.value
        ,{
            method: 'POST',
            body:data,
            onResponseError({response}){
              console.log(response);
            }
        })
        console.log(resp);
        totalPage.value = resp.total_page;
        payments.value = resp.medical_records.data;
    }
    const downloadExcel = () => {
        let LINK = "";
        if(dateRange.value){
            LINK += "&type_date="+type_date.value;
            LINK += "&start_date="+dateRange.value.split("to")[0]; 
            LINK += "&end_date="+dateRange.value.split("to")[1]; 
        }
        if(state_pay.value){
            LINK += "&state_pay="+state_pay.value;
        }
        if(state_vaccination.value){
            LINK += "&state="+state_vaccination.value;
        }
        if(specie.value){
            LINK += "&specie="+specie.value;
        }
        if(searchPets.value){
            LINK += "&search_pets="+searchPets.value;
        }
        if(searchVets.value){
            LINK += "&search_vets="+searchVets.value;
        }
        if(type_service.value){
            LINK += "&type_service="+type_service.value;
        }
        window.open(import.meta.env.VITE_API_BASE_URL+"/payments-excel?k=1"+LINK,"_blank");
    }
    const deleteItem = (item,payment) => {
        medical_record_selected_deleted.value = item;
        isDeletePaymentDialogVisible.value = true;
        payment_delete_selected.value = payment;
    }
    const deletePayment = (updatedMedicalRecord) => {
        let INDEX = payments.value.findIndex((payment) => payment.id == updatedMedicalRecord.id);
        if(INDEX != -1){
            updatedMedicalRecord.is_view = true;
            payments.value[INDEX]=updatedMedicalRecord;
        }
    }
    const reset = () => {
        searchPets.value = null;
        searchVets.value = null;
        specie.value = null;
        dateRange.value = null;
        state_pay.value = null;
        state_vaccination.value = null;
        type_date.value = 1;
        currentPage.value = 1;
        type_service.value = null;
        list();
    }
    const avatarText = value => {
        if (!value)
            return ''
        const nameArray = value.split(' ')
        
        return nameArray.map(word => word.charAt(0).toUpperCase()).join('')
    }
    const addPayment = (updatedMedicalRecord) => {
        console.log(updatedMedicalRecord);
        let INDEX = payments.value.findIndex((item) => item.id == updatedMedicalRecord.id);
        if(INDEX != -1){
            updatedMedicalRecord.is_view = true;
            payments.value[INDEX] = updatedMedicalRecord;
        }
    }
    const createPayment = (item) => {
        isAddPaymentDialogVisible.value = true
        medical_record_selected.value = item;
    }
    const editPayment = (item,payment) => {
        isEditPaymentDialogVisible.value = true;
        payment_edit_selected.value = payment;
        medical_record_selected.value = item;
    }
    const updatedPayment = (updatedMedicalRecord) => {
        console.log(updatedMedicalRecord);
        let INDEX = payments.value.findIndex((item) => item.id == updatedMedicalRecord.id);
        if(INDEX != -1){
            updatedMedicalRecord.is_view = true;
            payments.value[INDEX] = updatedMedicalRecord;
        }
    }
    watch(currentPage,(val) => {
        console.log(val);
        list();
    })
    watch(isDeletePaymentDialogVisible,(val) => {
        if(val == false){
            medical_record_selected_deleted.value = null;
            payment_delete_selected.value = null;
        }
    })
    watch(isAddPaymentDialogVisible,(val) => {
        if(val == false){
            medical_record_selected.value = null;
        }
    })
    watch(isEditPaymentDialogVisible,(val) => {
        if(val == false){
            medical_record_selected.value = null;
        }
    })
    onMounted(() => {
        list()
    })
    definePage({
        meta: {
            permisssion: 'show_payment'
        },
    })
</script>
<template>
    <div>
        <VCard title="💵 Pagos">
            <VCardText class="d-flex flex-wrap gap-4">
                <VRow>
                    <VCol cols="2">
                        <VSelect
                            :items="type_services"
                            v-model="type_service"
                            label="Tipo de servicio"
                            item-title="name"
                            item-value="id"
                            placeholder="Select Type"
                            eager
                        />
                    </VCol>
                    <VCol cols="2">
                        <VSelect
                            :items="[
                                {
                                    name: 'Fecha del servicio',
                                    id: 1,
                                },
                                {
                                    name: 'Fecha de registro',
                                    id: 2,
                                },
                            ]"
                            v-model="type_date"
                            label="Tipo"
                            item-title="name"
                            item-value="id"
                            placeholder="Select Type"
                            eager
                        />
                    </VCol>
                    <VCol cols="3">
                        <AppDateTimePicker
                            v-model="dateRange"
                            label="Fechas del servicio"
                            placeholder="Select fecha"
                            :config="{ mode: 'range' }"
                        />
                    </VCol>
                    <VCol cols="2">
                        <VSelect
                            :items="species"
                            v-model="specie"
                            label="Especie"
                            item-title="name"
                            item-value="id"
                            placeholder="Select Especie"
                            eager
                        />
                    </VCol>
                    
                    <VCol cols="2">
                        <div class="d-flex">
                            <VBtn
                                color="info"
                                class="mx-1"
                                prepend-icon="ri-search-2-line"
                                @click="list()"
                            >
                            </VBtn>
                            <VBtn
                                color="secondary"
                                class="mx-1"
                                prepend-icon="ri-restart-line"
                                @click="reset()"
                            >
                            </VBtn>
                            <VBtn
                                color="success"
                                class="mx-1"
                                prepend-icon="ri-file-excel-2-line"
                                @click="downloadExcel()"
                            >
                            </VBtn>
                        </div>
                    </VCol>
                    <VCol cols="2">
                        <!-- <VBtn
                            color="primary"
                            prepend-icon="ri-add-line"
                            @click="router.push({name: 'surgerie-add'})"
                        >
                            Add Surgerie
                        </VBtn> -->
                    </VCol>

                    <VCol cols="2" v-if="type_service">
                        <VSelect
                            :items="[
                                {
                                    name: 'Pendiente',
                                    id: 1,
                                },
                                {
                                    name: 'Cancelado',
                                    id: 2,
                                },
                                {
                                    name: 'Atendido',
                                    id: 3,
                                }
                            ]"
                            v-model="state_vaccination"
                            label="Estado del servicio"
                            item-title="name"
                            item-value="id"
                            placeholder="Select Estado"
                            eager
                        />
                    </VCol>
                    <VCol cols="2" v-if="type_service">
                        <VSelect
                            :items="[
                                {
                                    name: 'Pendiente',
                                    id: 1,
                                },
                                {
                                    name: 'Parcial',
                                    id: 2,
                                },
                                {
                                    name: 'Completo',
                                    id: 3,
                                }
                            ]"
                            v-model="state_pay"
                            label="Estado de pago"
                            item-title="name"
                            item-value="id"
                            placeholder="Select Estado"
                            eager
                        />
                    </VCol>
                    <VCol cols="3">
                        <VTextField
                            v-model="searchPets"
                            placeholder="Search Pets"
                            density="compact"
                            class="me-3"
                            @keyup.enter="list"
                        />
                    </VCol>
                    <VCol cols="3">
                        <VTextField
                            v-model="searchVets"
                            placeholder="Search Veterinaries"
                            density="compact"
                            class="me-3"
                            @keyup.enter="list"
                        />
                    </VCol>

                    
                </VRow>
            </VCardText>

            <VCardText class="pa-5">
                <VTable>
                    <thead>
                        <tr>
                            <th class="text-uppercase">
                                Mascota
                            </th>
                            <th class="text-uppercase">
                                Especie
                            </th>
                            <th class="text-uppercase">
                                Fecha del servicio
                            </th>
                            <th class="text-uppercase">
                                Tipo de servicio
                            </th>
                            <th class="text-uppercase">
                                Veterinario
                            </th>
                            <th class="text-uppercase">
                                Costo
                            </th>
                            <th class="text-uppercase">
                                Monto cancelado
                            </th>
                            <th class="text-uppercase">
                                Estado de pago
                            </th>
                            <th class="text-uppercase">
                                Acción
                            </th>
                        </tr>
                    </thead>
    
                    <tbody>
                        <template v-for="item in payments"
                        :key="item.id">
                            <tr
                                
                            >
                                <td>
                                    <div class="d-flex align-center">
                                        <VBtn
                                            color="success"
                                            variant="text"
                                            prepend-icon="ri-add-line"
                                            @click="item.is_view = !item.is_view"
                                        >
                                        </VBtn>
                                        <VAvatar
                                        size="32"
                                        :color="item.pet.photo ? '' : 'primary'"
                                        :class="item.pet.photo ? '' : 'v-avatar-light-bg primary--text'"
                                        :variant="!item.pet.photo ? 'tonal' : undefined"
                                        >
                                        <VImg
                                            v-if="item.pet.photo"
                                            :src="item.pet.photo"
                                        />
                                            <span
                                                v-else
                                                class="text-sm"
                                                >{{ avatarText(item.pet.name) }}</span>
                                        
                                        </VAvatar> 
                                        <div class="d-flex flex-column ms-3">
                                        <span class="d-block font-weight-medium text-high-emphasis text-truncate">{{ item.pet.name }}</span>
                                        </div>
                                    </div>
    
                                </td>
                                <td>
                                    {{ item.pet.specie }}
                                </td>
                                <td>
                                    {{ item.event_date }}
                                </td>
                                <td>
                                    <VChip v-if="item.event_type == 1" color="primary">
                                        Cita Medica
                                    </VChip>   
                                    <VChip v-if="item.event_type == 2" color="warning">
                                        Vacuna
                                    </VChip> 
                                    <VChip v-if="item.event_type == 3" color="success">
                                        Cirujía
                                    </VChip>  
                                </td>
                                <td>
                                    {{ item.veterinarie.full_name }}
                                </td>
                                <!-- <td>
                                    <VChip v-if="item.state == 1" color="warning">
                                        Pendiente
                                    </VChip>   
                                    <VChip v-if="item.state == 2" color="danger">
                                        Cancelado
                                    </VChip> 
                                    <VChip v-if="item.state == 3" color="primary">
                                        Atendido
                                    </VChip>   
                                </td> -->
                                <td style="text-wrap-mode: nowrap;">
                                    {{ item.amount }} PEN
                                </td>
                                <td style="text-wrap-mode: nowrap;">
                                    {{ item.payment_total }} PEN
                                </td>
                                <td>
                                    <VChip v-if="item.state_pay == 1" color="danger">
                                        Pendiente
                                    </VChip>   
                                    <VChip v-if="item.state_pay == 2" color="warning">
                                        Parcial
                                    </VChip> 
                                    <VChip v-if="item.state_pay == 3" color="success">
                                        Completo
                                    </VChip>   
                                </td>
                                <td>
                                    <VBtn
                                        color="primary"
                                         variant="text"
                                        prepend-icon="ri-add-line"
                                        @click="createPayment(item)"
                                    >
                                    </VBtn>
                                </td>
                            </tr>
                            <template v-for="(payment, index2) in item.payments" :key="index2">
                                <tr v-if="item.is_view">
                                    <td></td>
                                    <td></td>
                                    <td></td>
                                    <td></td>
                                    <td></td>
                                    <td>{{ payment.method_payment }}</td>
                                    <td></td>
                                    <td>{{ payment.amount }} PEN</td>
                                    <td>
                                        <div class="d-flex gap-1">
                                        <IconBtn
                                            size="small"
                                            @click="editPayment(item,payment)"
                                        >
                                            <VIcon icon="ri-pencil-line" />
                                        </IconBtn>
                                        <IconBtn
                                            size="small"
                                            @click="deleteItem(item,payment)"
                                        >
                                            <VIcon icon="ri-delete-bin-line" />
                                        </IconBtn>
                                    </div>
                                    </td>
                                </tr>
                            </template>
                        </template>
                    </tbody>
                </VTable>

                <VPagination
                    v-model="currentPage"
                    :length="totalPage"
                />
            </VCardText>

            <AddPaymentDialog v-if="medical_record_selected" @addPayment="addPayment" :medicalRecord="medical_record_selected" v-model:is-dialog-visible="isAddPaymentDialogVisible" />
            <EditPaymentDialog v-if="medical_record_selected && payment_edit_selected" @editPayment="updatedPayment" :medicalRecord="medical_record_selected" :paymentSelected="payment_edit_selected" v-model:is-dialog-visible="isEditPaymentDialogVisible" />

            <DeletePaymentDialog v-if="medical_record_selected_deleted" :medicalRecord="medical_record_selected_deleted" :paymentSelected="payment_delete_selected" @deletePayment="deletePayment" v-model:is-dialog-visible="isDeletePaymentDialogVisible" />
        </VCard>
    </div>
</template>
<style>
    .v-btn__prepend {
        margin-inline: 0 !important;
    }
</style>