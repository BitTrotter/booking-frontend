<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { requiredValidator, emailValidator } from '@/@core/utils/validators'
import { $api } from '@/utils/api'
import NavbarThemeSwitcher from '@/layouts/components/NavbarThemeSwitcher.vue'
import brandLogo from '@images/logos/logo-final.png'

const route = useRoute()
const router = useRouter()
const refForm = ref()
const isLoading = ref(false)
const errorMessage = ref('')
const isPasswordVisible = ref(false)
const form = ref({ email: '', password: '', remember: false })
const loginImage = import.meta.env.BASE_URL + 'images/login/DIMM-1-7.webp'

definePage({
  meta: { layout: 'blank', unauthenticatedOnly: true },
})

const login = async () => {
  if (isLoading.value) return
  isLoading.value = true
  errorMessage.value = ''

  try {


    const resp = await $api('auth/login', {
      method: 'POST',
      body: {
        email: form.value.email.trim(),
        password: form.value.password,
        remember: form.value.remember,
      },
    })

    localStorage.setItem('userData', JSON.stringify(resp.user))
    localStorage.setItem('accessToken', resp.access_token)
    await router.replace(route.query.to ? String(route.query.to) : '/')
  } catch (error) {
    const status = error?.response?.status || error?.statusCode
    errorMessage.value = [401, 422].includes(status)
      ? 'The email or password is incorrect. Please try again.'
      : 'Unable to sign in right now. Please try again in a moment.'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <main class="login-page">
    <aside class="login-scene" aria-label="Rocky Cabins Retreat">
      <img :src="loginImage" alt="Wooden cabin porch surrounded by trees at Rocky Cabins Retreat"
        class="login-scene__photo" fetchpriority="high" width="6240" height="4160">
      <div class="login-scene__shade" />
      <img :src="brandLogo" alt="Rocky Cabins Retreat" class="login-scene__logo" width="200" height="121">
      <div class="login-scene__story">
        <span class="login-eyebrow">A little closer to nature</span>
        <h2>Great stays.<br> Thoughtfully managed.</h2>
        <p>A welcoming place for your guests.<br>A simpler day for your team.</p>
      </div>
      <div class="login-scene__caption">
        <span class="login-scene__line" />
        <span>Rocky Cabins Retreat</span>
      </div>
    </aside>

    <section class="login-panel" aria-labelledby="login-title">
      <header class="login-panel__header">
        <span class="login-workspace">
          <VIcon icon="ri-leaf-line" size="18" /> Team workspace
        </span>
        <NavbarThemeSwitcher />
      </header>

      <div class="login-content">
        <div class="login-mark">
          <VIcon icon="ri-home-4-line" size="26" />
        </div>
        <span class="login-eyebrow text-secondary">Rocky Cabins Retreat</span>
        <h1 id="login-title">Welcome back.</h1>
        <p class="login-intro">A new day, a new stay. Sign in to manage your reservations and cabins.</p>

        <VForm ref="refForm" class="login-form" @submit.prevent="login">
          <VTextField v-model="form.email" label="Email address" type="email" placeholder="you@example.com"
            autocomplete="username" name="email" prepend-inner-icon="ri-mail-line"
            :rules="[requiredValidator, emailValidator]" :readonly="isLoading" hide-details="auto" />
          <VTextField v-model="form.password" label="Password" placeholder="Enter your password"
            :type="isPasswordVisible ? 'text' : 'password'" autocomplete="current-password" name="password"
            prepend-inner-icon="ri-lock-2-line" :rules="[requiredValidator]" :readonly="isLoading" hide-details="auto">
            <template #append-inner>
              <VBtn :icon="isPasswordVisible ? 'ri-eye-off-line' : 'ri-eye-line'" variant="text" color="secondary"
                size="x-small" :aria-label="isPasswordVisible ? 'Hide password' : 'Show password'"
                :aria-pressed="isPasswordVisible" type="button" @click="isPasswordVisible = !isPasswordVisible" />
            </template>
          </VTextField>
          <VCheckbox v-model="form.remember" label="Remember me" density="compact" hide-details :disabled="isLoading" />
          <VAlert v-if="errorMessage" type="error" variant="tonal" density="compact" role="alert">
            {{ errorMessage }}
          </VAlert>
          <VBtn block type="submit" color="primary" size="large" :loading="isLoading" :disabled="isLoading"
            append-icon="ri-arrow-right-line" class="login-submit">Sign in</VBtn>
        </VForm>

        <div class="login-help">
          <VIcon icon="ri-question-line" size="18" />
          <p>Need access? Contact your administrator.</p>
        </div>
      </div>

      <footer class="login-panel__footer">
        <span>Rocky Cabins Retreat</span>
        <span>Management portal</span>
      </footer>
    </section>
  </main>
</template>

<style scoped lang="scss">
.login-page {
  display: grid;
  grid-template-columns: minmax(0, 1.08fr) minmax(0, 1fr);
  gap: 12px;
  padding: 16px;
  min-block-size: 100vh;
  min-block-size: 100dvh;
  background: rgb(var(--v-theme-background));
}

.login-scene {
  position: relative;
  display: flex;
  overflow: hidden;
  flex-direction: column;
  justify-content: space-between;
  padding: clamp(28px, 4vw, 64px);
  border-radius: 20px;
  background: #203e30;
  color: #fffcf7;
  min-block-size: 640px;
}

.login-scene__photo,
.login-scene__shade {
  position: absolute;
  block-size: 100%;
  inline-size: 100%;
  inset: 0;
}

.login-scene__photo {
  object-fit: cover;
  object-position: 46% center;
}

.login-scene__shade {
  background: linear-gradient(180deg, rgba(12, 27, 19, 0.35), rgba(12, 27, 19, 0.12) 30%, rgba(12, 27, 19, 0.88));
}

.login-scene__logo,
.login-scene__story,
.login-scene__caption {
  position: relative;
}

.login-scene__logo {
  block-size: auto;
  inline-size: 180px;
}

.login-scene__story {
  margin-block-start: auto;
  padding-block: 96px 40px;

  h2 {
    color: inherit;
    font-family: Georgia, "Times New Roman", serif;
    font-size: clamp(36px, 3.8vw, 60px);
    font-weight: 400;
    letter-spacing: -0.035em;
    line-height: 1.12;
    margin-block: 20px;
  }

  p {
    color: #e8e3d8;
    font-size: 15px;
    line-height: 1.8;
    margin: 0;
  }
}

.login-eyebrow {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.login-scene__caption {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  letter-spacing: 0.04em;
}

.login-scene__line {
  background: #d5ac78;
  block-size: 1px;
  inline-size: 36px;
}

.login-panel {
  display: flex;
  flex-direction: column;
  padding: 12px clamp(20px, 4vw, 64px);
  min-inline-size: 0;
}

.login-panel__header,
.login-panel__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  font-size: 12px;
}

.login-workspace {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.login-content {
  inline-size: 100%;
  max-inline-size: 400px;
  margin: auto;
  padding-block: 48px;

  h1 {
    color: rgb(var(--v-theme-on-background));
    font-family: Georgia, "Times New Roman", serif;
    font-size: clamp(36px, 3.3vw, 48px);
    font-weight: 400;
    letter-spacing: -0.04em;
    line-height: 1.15;
    margin-block: 12px 16px;
  }
}

.login-mark {
  display: grid;
  border: 1px solid rgba(var(--v-theme-primary), 0.16);
  border-radius: 14px;
  background: rgba(var(--v-theme-primary), 0.07);
  block-size: 54px;
  color: rgb(var(--v-theme-primary));
  inline-size: 54px;
  margin-block-end: 28px;
  place-items: center;
}

.login-intro {
  color: rgba(var(--v-theme-on-background), var(--v-medium-emphasis-opacity));
  font-size: 15px;
  line-height: 1.7;
  margin-block-end: 32px;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;

  :deep(.v-field) {
    background: rgb(var(--v-theme-surface));
  }
}

.login-submit {
  border-radius: 8px;
  min-block-size: 50px;
}

.login-help {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-block-start: 24px;
  border-block-start: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  margin-block-start: 32px;

  p {
    margin: 0;
    font-size: 13px;
  }
}

.login-panel__footer {
  flex-wrap: wrap;
  padding-block: 16px 8px;
}

@media (max-width: 959px) {
  .login-page {
    grid-template-columns: minmax(0, 1fr);
    padding: 12px;
  }

  .login-scene {
    min-block-size: 220px;
    padding: 24px;
  }

  .login-scene__logo {
    inline-size: 140px;
  }

  .login-scene__story {
    padding-block: 28px 0;
  }

  .login-scene__story h2 {
    font-size: 28px;
    margin-block: 8px 0;
  }

  .login-scene__story h2 br {
    display: none;
  }

  .login-scene__story p,
  .login-scene__story .login-eyebrow,
  .login-scene__caption {
    display: none;
  }

  .login-panel {
    padding: 12px 16px;
  }

  .login-content {
    padding-block: 28px;
  }

  .login-mark {
    display: none;
  }
}
</style>
