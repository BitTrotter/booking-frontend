<script setup>
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
    designation: null,
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
const days = ref(['Lunes','Martes','Miércoles','Jueves','Viernes']);
const hour_days = ref([]);
const selected_segment_time = ref([]);
const schedule_hour_veterinarie = ref([]);
const load_request = ref(null);
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

const config = async () => {
    try {
        const resp = await $api("/veterinaries/config",{
            method: 'GET',
            onResponseError({response}){
                console.log(response);
                error_exists.value = response._data.error;
            }
        })
        console.log(resp);
        roles.value = resp.roles;
        hour_days.value  = resp.schedule_hours_groups;
    } catch (error) {
        console.log(error);
    }
}
const selectSegmentTimeAll = ($event,segment_times,day) => {
    if($event.target.checked){
        // EL CHECKBOX ESTA MARCADO
        segment_times.forEach(segment_time => {
            selectedSegmentTime($event,segment_time,day);
            let INDEX = selected_segment_time.value.findIndex(seg_time => seg_time == segment_time.id+'-'+day);
            if(INDEX == -1){
                selected_segment_time.value.push(segment_time.id+'-'+day);
            }
        });
    }else{
        // EL CHECKBOX ESTA DESMARCADO
        segment_times.forEach(segment_time => {
            selectedSegmentTime($event,segment_time,day);
            let INDEX = selected_segment_time.value.findIndex(seg_time => seg_time == segment_time.id+'-'+day);
            if(INDEX != -1){
                selected_segment_time.value.splice(INDEX,1);
            }
        })
    }
}
const selectSegmentTimeAllGroups = ($event,segment_times) => {
    if($event.target.checked){
        // EL CHECKBOX ESTA MARCADO
        days.value.forEach((day) => {
            segment_times.forEach(segment_time => {
                selectedSegmentTime($event,segment_time,day);
                let INDEX = selected_segment_time.value.findIndex(seg_time => seg_time == segment_time.id+'-'+day);
                if(INDEX == -1){
                    selected_segment_time.value.push(segment_time.id+'-'+day);
                }
            });
        })
    }else{
        // EL CHECKBOX ESTA DESMARCADO
        days.value.forEach((day) => {
            segment_times.forEach(segment_time => {
                selectedSegmentTime($event,segment_time,day);
                let INDEX = selected_segment_time.value.findIndex(seg_time => seg_time == segment_time.id+'-'+day);
                if(INDEX != -1){
                    selected_segment_time.value.splice(INDEX,1);
                }
            })
        })
    }
}
const selectedSegmentTime = ($event,segment_time,day) => {
    if($event.target.checked){
        // EL CHECKBOX ESTA MARCADO
            let INDEX = schedule_hour_veterinarie.value.findIndex(seg_time => seg_time.id_seg == segment_time.id+'-'+day);
            if(INDEX == -1){
                schedule_hour_veterinarie.value.push({
                    id_seg:segment_time.id+'-'+day,
                    segment_time_id: segment_time.id,
                    day: day,
                });
            }
    }else{
        // EL CHECKBOX ESTA DESMARCADO
        let INDEX = schedule_hour_veterinarie.value.findIndex(seg_time => seg_time.id_seg == segment_time.id+'-'+day);
        if(INDEX != -1){
            schedule_hour_veterinarie.value.splice(INDEX,1);
        }
    }
}

const fieldsClean = () => {
    form.value = {
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
    }
    FILE_AVATAR.value = null;
    IMAGEN_PREVIZUALIZA.value = null;
    schedule_hour_veterinarie.value = [];
    selected_segment_time.value = [];
}

const store = async() => {
  warning.value = null;
    if(schedule_hour_veterinarie.value.length == 0){
        warning.value = "Debes programar la disponibilidad laboral del veterinario";
        return;
      }
      if(!form.value.name){
        warning.value = "Se debe llenar el nombre del veterinario";
        return;
      }
      if(!form.value.surname){
        warning.value = "Se debe llenar el apellido del veterinario";
        return;
      }
      if(!form.value.email){
        warning.value = "Se debe llenar el email del veterinario";
        return;
      }
      if(!form.value.phone){
        warning.value = "Se debe llenar el telefono del veterinario";
        return;
      }
      if(!form.value.gender){
        warning.value = "Se debe llenar el genero del veterinario";
        return;
      }
      if(!FILE_AVATAR.value){
        warning.value = "Se debe seleccionar un avatar para el veterinario";
        return;
      }
      if(!form.value.role_id){
        warning.value = "Se debe seleccionar un rol para el veterinario";
        return;
      }
      if(!form.value.password){
        warning.value = "Se debe digitar una contraseña para el veterinario";
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
    formData.append("password",form.value.password);
    formData.append("role_id",form.value.role_id);
    if(form.value.birthday){
        formData.append("birthday",form.value.birthday);
    }
    formData.append("imagen",FILE_AVATAR.value)
    formData.append("schedule_hour_veterinarie",JSON.stringify(schedule_hour_veterinarie.value));
  try {
    load_request.value = true;
    const resp =  await $api('/veterinaries',{
        method: 'POST',
        body:formData,
        onResponseError({response}){
          console.log(response);
          error_exists.value = response._data.error;
        }
    })
    console.log(resp);
    load_request.value = false;
    if(resp.message == 403){
      warning.value = resp.message_text;
    }else{
      success.value = "El veterinario se ha creado correctamente";
      setTimeout(() => {
        success.value = null;
        warning.value = null;
        error_exists.value = null;
        fieldsClean()
      }, 1500);
    }
  } catch (error) {
    console.log(error);
    error_exists.value = error;
  }
}
onMounted(() => {
    config();
})

definePage({
    meta: {
        permisssion: 'register_veterinary'
    },
})
</script>

<template>
    <div>
        <VCard class="refer-and-earn-dialog pa-3 pa-sm-11">
            <VCardText class="pa-5">
                <div class="mb-6">
                <h4 class="text-h4 text-center mb-2">
                    Add Veterinarie 🧑‍⚕️
                </h4>
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
            <VCardText class="pa-5 py-0">
                <VBtn color="primary" class="mb-4" @click="store()">
                Crear
                </VBtn>
            </VCardText>

            <VCardText class="pa-5">
                {{ selected_segment_time }}
                <VTable>
                    <thead>
                    <tr>
                        <th class="text-uppercase">
                            DIAS/HORAS
                        </th>

                        <th class="text-uppercase" v-for="(day, index) in days" :key="index">
                            {{ day }}
                        </th>
                    </tr>
                    </thead>
    
                    <tbody>
                        <tr
                            v-for="item in hour_days"
                            :key="item.hour"
                        >
                            <td>
                            {{ item.hour_format }}
                                <VCheckbox
                                        @click="selectSegmentTimeAllGroups($event,item.segments_time)"
                                        label="Todos"
                                        v-if="!load_request"
                                    />
                            </td>
                            
                            <td v-for="(day, index) in days" :key="index">
                                <div class="demo-space-x my-2">
                                    <VCheckbox
                                        @click="selectSegmentTimeAll($event,item.segments_time,day)"
                                        label="Todos"
                                        v-if="!load_request"
                                    />
                                    <template v-for="(segment_time, index) in item.segments_time" :key="index">
                                        <VCheckbox
                                        @click="selectedSegmentTime($event,segment_time,day)"
                                        v-model="selected_segment_time"
                                        :label="segment_time.hour_start_format+' '+segment_time.hour_end_format"
                                        :value="segment_time.id+'-'+day"
                                        />
                                    </template>
                                </div>
                            </td>

                        </tr>
                    </tbody>
                </VTable>
            </VCardText>

        </VCard>
    </div>
</template>
<style>
.v-selection-control .v-label {
    font-size: small;
}
.v-checkbox.v-input {
    margin: 0;
}
</style>