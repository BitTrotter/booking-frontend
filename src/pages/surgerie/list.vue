<script setup>
import { isPermission } from '@/utils/constants';


    const router = useRouter()
    const searchPets = ref(null);
    const searchVets = ref(null);
    const specie = ref(null);
    const species = ref(['Perro','Gato','Hámster','Loro','Tortuga','Vaca','Caballo','Cuy','Toro']);
    const surgerie_types = ref(["ESTERILIZACIÓN",
    "CASTRACIÓN",
    "TRAUMATOLÓGICAS",
    "OCULARES",
    "ONCOLÓGICAS",
    "OTRO"]);
    const surgeries = ref([]);
    const currentPage = ref(1);
    const totalPage = ref(1);
    const surgerie_selected_deleted = ref(null);
    const isDeleteSurgerieDialogVisible = ref(false);

    const dateRange = ref(null);
    const type_date = ref(1);
    const state_pay = ref(null);
    const state_vaccination = ref(null);
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
        }
        const resp =  await $api('/surgeries/index?page='+currentPage.value
        ,{
            method: 'POST',
            body:data,
            onResponseError({response}){
              console.log(response);
            }
        })
        console.log(resp);
        totalPage.value = resp.total_page;
        surgeries.value = resp.surgeries.data;
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
        window.open(import.meta.env.VITE_API_BASE_URL+"/surgeries-excel?k=1"+LINK,"_blank");
    }
    const editItem = (item) => {
        router.push({
            name: 'surgerie-edit-id',
            params: {
                id: item.id
            }
        })
    }
    const deleteItem = (item) => {
        surgerie_selected_deleted.value = item;
        isDeleteSurgerieDialogVisible.value = true;
    }
    const deleteSurgerie = (item) => {
        let INDEX = surgeries.value.findIndex((vaccination) => vaccination.id == item.id);
        if(INDEX != -1){
            surgeries.value.splice(INDEX,1);
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
        list();
    }
    const avatarText = value => {
        if (!value)
            return ''
        const nameArray = value.split(' ')
        
        return nameArray.map(word => word.charAt(0).toUpperCase()).join('')
    }
    watch(currentPage,(val) => {
        console.log(val);
        list();
    })
    watch(isDeleteSurgerieDialogVisible,(val) => {
        if(val == false){
            surgerie_selected_deleted.value = null;
        }
    })
    onMounted(() => {
        list()
    })
    definePage({
        meta: {
            permisssion: 'list_surgeries'
        },
    })
</script>
<template>
    <div>
        <VCard title="🏥 Surgeries">
            <VCardText class="d-flex flex-wrap gap-4">
                <VRow>
                    <VCol cols="2">
                        <VSelect
                            :items="[
                                {
                                    name: 'Fecha de la cirugía',
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
                            label="Fechas de cirugía"
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
                        <VBtn
                            color="primary"
                            v-if="isPermission('register_surgeries')"
                            prepend-icon="ri-add-line"
                            @click="router.push({name: 'surgerie-add'})"
                        >
                            Add Surgerie
                        </VBtn>
                    </VCol>

                    <VCol cols="2">
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
                            label="Estado de la vacuna"
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

                    <VCol cols="2">
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
                                Fecha de la cirugía
                            </th>
                            <th class="text-uppercase">
                                Veterinario
                            </th>
                            <th class="text-uppercase">
                                Estado
                            </th>
                            <th class="text-uppercase">
                                Costo
                            </th>
                            <th class="text-uppercase">
                                Acción
                            </th>
                        </tr>
                    </thead>
    
                    <tbody>
                        <tr
                            v-for="item in surgeries"
                            :key="item.id"
                        >
                            <td>
                                <div class="d-flex align-center">
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
                                {{ item.surgerie_date }}
                            </td>
                            <td>
                                {{ item.veterinarie.full_name }}
                            </td>
                            <td>
                                <VChip v-if="item.state == 1" color="warning">
                                    Pendiente
                                </VChip>   
                                <VChip v-if="item.state == 2" color="danger">
                                    Cancelado
                                </VChip> 
                                <VChip v-if="item.state == 3" color="primary">
                                    Atendido
                                </VChip>   
                            </td>
                            <td>
                                {{ item.amount }} PEN
                            </td>
                            <td>
                                <div class="d-flex gap-1">
                                    <IconBtn
                                        size="small"
                                        v-if="isPermission('edit_surgeries')"
                                        @click="editItem(item)"
                                    >
                                        <VIcon icon="ri-pencil-line" />
                                    </IconBtn>
                                    <IconBtn
                                        size="small"
                                        v-if="isPermission('delete_surgeries')"
                                        @click="deleteItem(item)"
                                    >
                                        <VIcon icon="ri-delete-bin-line" />
                                    </IconBtn>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </VTable>

                <VPagination
                    v-model="currentPage"
                    :length="totalPage"
                />
            </VCardText>

            <DeleteSurgerieDialog v-if="surgerie_selected_deleted" :surgerieSelected="surgerie_selected_deleted" @deleteSurgerie="deleteSurgerie" v-model:is-dialog-visible="isDeleteSurgerieDialogVisible" />
        </VCard>
    </div>
</template>
<style>
    .v-btn__prepend {
        margin-inline: 0 !important;
    }
</style>