<script setup>
import navItems from '@/navigation/vertical'
import { useConfigStore } from '@core/stores/config'
import { themeConfig } from '@themeConfig'

// Components
import Footer from '@/layouts/components/Footer.vue'
import NavbarThemeSwitcher from '@/layouts/components/NavbarThemeSwitcher.vue'
import UserProfile from '@/layouts/components/UserProfile.vue'
import NavBarI18n from '@core/components/I18n.vue'

// @layouts plugin
import { VerticalNavLayout } from '@layouts'

// SECTION: Loading Indicator
const isFallbackStateActive = ref(false)
const refLoadingIndicator = ref(null)

watch([
  isFallbackStateActive,
  refLoadingIndicator,
], () => {
  if (isFallbackStateActive.value && refLoadingIndicator.value)
    refLoadingIndicator.value.fallbackHandle()
  if (!isFallbackStateActive.value && refLoadingIndicator.value)
    refLoadingIndicator.value.resolveHandle()
}, { immediate: true })

// !SECTION
const configStore = useConfigStore()

// ℹ️ Provide animation name for vertical nav collapse icon.
const verticalNavHeaderActionAnimationName = ref(null)

watch([
  () => configStore.isVerticalNavCollapsed,
  () => configStore.isAppRTL,
], val => {
  if (configStore.isAppRTL)
    verticalNavHeaderActionAnimationName.value = val[0] ? 'rotate-back-180' : 'rotate-180'
  else
    verticalNavHeaderActionAnimationName.value = val[0] ? 'rotate-180' : 'rotate-back-180'
}, { immediate: true })

const navItemsV = ref([]);
onMounted(() => {
  let USER = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;
  if(USER){
    console.log(USER);
    // LA LISTA DE PERMISOS DEL USUARIO AUTENTICADO
    let permissions = USER.permissions;
    navItems.forEach((nav) => {
      // VAMOS A VALIDAR SI EL USUARIO ES SUPER-ADMIN
      if(USER.role.name == 'Super-Admin'){
        navItemsV.value.push(nav);
      }else{
        // LOS NAV QUE TENGA EL PERMISO ALL PUEDE SER VISTO POR CUALQUIER USUARIO
        if(nav.permission == "all"){
          navItemsV.value.push(nav);
        }
        if(nav.heading){
          // FILTRAMOS LOS PERMISOS QUE SE NECESITA PARA VER ESE HEADING
          let headingP = nav.permissions.filter((permission) => {
            if(permissions.includes(permission)){
              return true;
            }
            return false;
          })
          // SI TENEMOS ALMENOS UN PERMISO PUEDE VERSE EL HEADING
          if(headingP.length > 0){
            navItemsV.value.push(nav);
          }
        }
        // SI EL NAV TIENE SUBMENUS
        if(nav.children){
          let navT = nav;
          // FILTRAMOS SI LOS SUBMENUS PUEDEN SER VISTO CON LOS PERMISOS DEL USUARIO AUTENTICADO
          let newChildren = nav.children.filter((subnav) => {
              if(permissions.includes(subnav.permission)){
                return true;
              }
              return false;
          });
          // ASIGNACIÓN DE LOS NUEVOS SUBMENUS
          navT.children = newChildren;
          navItemsV.value.push(navT);
        }else{
          // VERIFICAMOS SI LOS PERMISOS DE USUARIO PUEDEN VER LA OPCION DE NAVEGACION
          if(permissions.includes(nav.permission)){
            navItemsV.value.push(nav);
          }
        }
      }
    });
  }
})
</script>

<template>
  <VerticalNavLayout :nav-items="navItemsV">
    <!-- 👉 navbar -->
    <template #navbar="{ toggleVerticalOverlayNavActive }">
      <div class="d-flex h-100 align-center">
        <IconBtn
          id="vertical-nav-toggle-btn"
          class="ms-n2 d-lg-none"
          @click="toggleVerticalOverlayNavActive(true)"
        >
          <VIcon icon="ri-menu-line" />
        </IconBtn>

        <NavbarThemeSwitcher />

        <VSpacer />

        <NavBarI18n
          v-if="themeConfig.app.i18n.enable && themeConfig.app.i18n.langConfig?.length"
          :languages="themeConfig.app.i18n.langConfig"
        />
        <UserProfile />
      </div>
    </template>

    <AppLoadingIndicator ref="refLoadingIndicator" />

    <!-- 👉 Pages -->
    <RouterView v-slot="{ Component }">
      <Suspense
        :timeout="0"
        @fallback="isFallbackStateActive = true"
        @resolve="isFallbackStateActive = false"
      >
        <Component :is="Component" />
      </Suspense>
    </RouterView>

    <!-- 👉 Footer -->
    <template #footer>
      <Footer />
    </template>

    <!-- 👉 Customizer -->
    <!-- <TheCustomizer /> -->
  </VerticalNavLayout>
</template>

<style lang="scss">
@keyframes rotate-180 {
  from { transform: rotate(0deg); }
  to { transform: rotate(180deg); }
}

@keyframes rotate-back-180 {
  from { transform: rotate(180deg); }
  to { transform: rotate(0deg); }
}

.layout-vertical-nav {
  .nav-header {
    .header-action {
      animation-duration: 0.35s;
      animation-fill-mode: forwards;
      animation-name: v-bind(verticalNavHeaderActionAnimationName);
      transform: rotate(0deg);
    }
  }
}
</style>
