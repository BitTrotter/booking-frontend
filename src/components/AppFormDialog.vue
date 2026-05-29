<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, required: true },
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  maxWidth: { type: [String, Number], default: 600 },
  submitText: { type: String, default: 'Save' },
  cancelText: { type: String, default: 'Cancel' },
  deleteText: { type: String, default: 'Delete' },
  showDelete: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  deleteLoading: { type: Boolean, default: false },
  canSubmit: { type: Boolean, default: true },
  scrollable: { type: Boolean, default: true },
  submitColor: { type: String, default: 'primary' },
  submitIcon: { type: String, default: '' },
  deleteColor: { type: String, default: 'error' },
  noInternalForm: { type: Boolean, default: false },
  validateOnSubmit: { type: Boolean, default: false },
  flat: { type: Boolean, default: false },
  contentClass: { type: [String, Array, Object], default: () => 'px-6 py-5' },
})

const emit = defineEmits(['update:modelValue', 'submit', 'cancel', 'delete'])

const refForm = ref(null)

const dialogVisible = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val),
})

const handleCancel = () => {
  emit('cancel')
  dialogVisible.value = false
}

const handleSubmit = async () => {
  if (props.validateOnSubmit && !props.noInternalForm) {
    const result = await refForm.value?.validate()
    if (!result?.valid) return
  }
  emit('submit')
}

defineExpose({
  validate: () => refForm.value?.validate(),
  reset: () => refForm.value?.reset(),
  resetValidation: () => refForm.value?.resetValidation(),
})
</script>

<template>
  <VDialog
    v-model="dialogVisible"
    :max-width="maxWidth"
    :scrollable="scrollable"
  >
    <VCard :flat="flat">
      <VCardItem class="py-4 px-6">
        <slot name="header">
          <VCardTitle>{{ title }}</VCardTitle>
          <VCardSubtitle v-if="subtitle">{{ subtitle }}</VCardSubtitle>
        </slot>
        <template #append>
          <VBtn
            icon="ri-close-line"
            variant="text"
            size="small"
            @click="handleCancel"
          />
        </template>
      </VCardItem>

      <VDivider />

      <VCardText :class="contentClass">
        <VForm
          v-if="!noInternalForm"
          ref="refForm"
        >
          <slot />
        </VForm>
        <slot v-else />
      </VCardText>

      <VDivider />

      <VCardText class="d-flex gap-3 pa-4 align-center flex-wrap">
        <slot name="actions">
          <VBtn
            v-if="showDelete"
            :color="deleteColor"
            variant="tonal"
            :loading="deleteLoading"
            @click="emit('delete')"
          >
            {{ deleteText }}
          </VBtn>
          <VSpacer />
          <VBtn
            variant="tonal"
            color="secondary"
            @click="handleCancel"
          >
            {{ cancelText }}
          </VBtn>
          <VBtn
            :color="submitColor"
            variant="elevated"
            :prepend-icon="submitIcon || undefined"
            :loading="loading"
            :disabled="!canSubmit || loading"
            @click="handleSubmit"
          >
            {{ submitText }}
          </VBtn>
        </slot>
      </VCardText>
    </VCard>
  </VDialog>
</template>
