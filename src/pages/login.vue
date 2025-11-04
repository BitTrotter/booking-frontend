<script setup>
import { useGenerateImageVariant } from '@/@core/composable/useGenerateImageVariant'
import AuthProvider from '@/views/pages/authentication/AuthProvider.vue'
import authV2LoginIllustrationBorderedDark from '@images/pages/auth-v2-login-illustration-bordered-dark.png'
import authV2LoginIllustrationBorderedLight from '@images/pages/auth-v2-login-illustration-bordered-light.png'
import authV2LoginIllustrationDark from '@images/pages/auth-v2-login-illustration-dark.png'
import authV2LoginIllustrationLight from '@images/pages/auth-v2-login-illustration-light.png'
import authV2LoginMaskDark from '@images/pages/auth-v2-login-mask-dark.png'
import authV2LoginMaskLight from '@images/pages/auth-v2-login-mask-light.png'
import { VNodeRenderer } from '@layouts/components/VNodeRenderer'
import { themeConfig } from '@themeConfig'
import { set } from '@vueuse/core'

const error_login = ref(false)
const succes_login = ref(false)
const route = useRoute()
const router = useRouter()
const form = ref({
  email: '',
  password: '',
  remember: false,
})

definePage({
  meta: {
    layout: 'blank',
    unauthenticatedOnly: true,
  },
})




const login = async () => {
  try {
    error_login.value = false
    const resp = await $api('auth/login', {
      method: 'POST',
      body: {
        email: form.value.email,
        password: form.value.password,
        remember: form.value.remember,
      },
      onResponseError: ({ response }) => {
        throw new Error(response.statusText || 'Login failed')
      },
    })
    succes_login.value = true

    
    localStorage.setItem('userData', JSON.stringify(resp.user));
    localStorage.setItem('accessToken', resp.access_token);

    await nextTick(async()=>{
     await setTimeout(()=>{
        router.replace(route.query.to ? String(route.query.to): '/')
        
      }, 2000)

    })
    // navigateTo('/')
  } catch (error) {
    error_login.value = true
    succes_login.value = true
    console.error('Login failed:', error)
  }
}






const isPasswordVisible = ref(false)
const authV2LoginMask = useGenerateImageVariant(authV2LoginMaskLight, authV2LoginMaskDark)
const authV2LoginIllustration = useGenerateImageVariant(authV2LoginIllustrationLight, authV2LoginIllustrationDark, authV2LoginIllustrationBorderedLight, authV2LoginIllustrationBorderedDark, true)
</script>

<template>
  <RouterLink to="/">
    <div class="app-logo auth-logo">
      <VNodeRenderer :nodes="themeConfig.app.logo" />
      <h1 class="app-logo-title">
        {{ themeConfig.app.title }}
      </h1>
    </div>
  </RouterLink>

  <VRow no-gutters class="auth-wrapper">
    <VCol md="8" class="d-none d-md-flex align-center justify-center position-relative">
      <div class="d-flex align-center justify-center pa-10">
        <img :src="authV2LoginIllustration" class="auth-illustration w-100" alt="auth-illustration">
      </div>
      <VImg :src="authV2LoginMask" class="d-none d-md-flex auth-footer-mask" alt="auth-mask" />
    </VCol>
    <VCol cols="12" md="4" class="auth-card-v2 d-flex align-center justify-center"
      style="background-color: rgb(var(--v-theme-surface));">
      <VCard flat :max-width="500" class="mt-12 mt-sm-0 pa-5 pa-lg-7">
        <VCardText>
          <h4 class="text-h4 mb-1">
            Welcome to <span class="text-capitalize">{{ themeConfig.app.title }}! 👋🏻s</span>
          </h4>

          <p class="mb-0">
            Please sign-in to your account and start the adventure
          </p>
        </VCardText>

        <VCardText>
          <VForm @submit.prevent="login()">
            <VRow>
              <!-- email -->
              <VCol cols="12">
                <VTextField v-model="form.email" autofocus label="Email" type="email" placeholder="johndoe@email.com" />
              </VCol>


              <!-- password -->
              <VCol cols="12">
                <VTextField v-model="form.password" label="Password" placeholder="············"
                  :type="isPasswordVisible ? 'text' : 'password'"
                  :append-inner-icon="isPasswordVisible ? 'ri-eye-off-line' : 'ri-eye-line'"
                  @click:append-inner="isPasswordVisible = !isPasswordVisible" />
                <VAlert class="mt-2" title="Alert" type="error" closable v-if="error_login">
                  Login error: Invalid email or password.
                </VAlert> <!-- remember me checkbox -->
                <VAlert class="mt-2" border="bottom" color="success" variant="tonal" v-if="succes_login">
                  Good Morning! Start your day with some alerts.
                </VAlert>
                <div class="d-flex align-center justify-space-between flex-wrap my-6 gap-x-2">
                  <VCheckbox v-model="form.remember" label="Remember me" />

                  <a class="text-primary" href="#">
                    Forgot Password?
                  </a>
                </div>

                <!-- login button -->
                <VBtn block type="submit">
                  Login
                </VBtn>
              </VCol>

              <!-- create account -->
              <VCol cols="12" class="text-body-1 text-center">
                <span class="d-inline-block">
                  New on our platform?
                </span>
                <a class="text-primary ms-1 d-inline-block text-body-1" href="#">
                  Create an account
                </a>
              </VCol>

              <VCol cols="12" class="d-flex align-center">
                <VDivider />
                <span class="mx-4 text-high-emphasis">or</span>
                <VDivider />
              </VCol>

              <!-- auth providers -->
              <VCol cols="12" class="text-center">
                <AuthProvider />
              </VCol>
            </VRow>
          </VForm>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>
</template>

<style lang="scss">
@use "@core/scss/template/pages/page-auth.scss";
</style>
