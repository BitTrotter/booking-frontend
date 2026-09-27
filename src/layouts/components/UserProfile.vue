<script setup>
import { useRouter } from 'vue-router'
import avatar1 from '@images/avatars/avatar-1.png'
import { clearAuthSession } from '@/utils/auth'

const router = useRouter()

const logout = async () => {
  clearAuthSession()
  await router.push('/login')
}
</script>

<template>
  <div class="user-profile">
    <VMenu min-width="180" location="bottom end" offset="12">
      <template #activator="{ props }">
        <VBtn v-bind="props" icon variant="text" size="44" aria-label="Open account menu">
          <VBadge dot bordered location="bottom right" offset-x="2" offset-y="2" color="success"
            class="user-profile-badge">
            <VAvatar size="38">
              <VImg :src="avatar1" alt="Account avatar" />
            </VAvatar>
          </VBadge>
        </VBtn>
      </template>
      <VList class="pa-2">
        <VListItem rounded="lg" base-color="error" prepend-icon="ri-logout-box-r-line" @click="logout">
          <VListItemTitle>Logout</VListItemTitle>
        </VListItem>
      </VList>
    </VMenu>
  </div>
</template>

<style scoped lang="scss">
.user-profile {
  display: flex;
  align-items: center;
  margin-inline-end: 16px;
}

.user-profile-badge :deep(.v-badge__badge::after) {
  color: rgb(var(--v-theme-surface));
}
</style>
