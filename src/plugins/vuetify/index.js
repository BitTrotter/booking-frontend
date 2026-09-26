import { deepMerge } from '@antfu/utils'
import { createVuetify } from 'vuetify'
import { VBtn } from 'vuetify/components/VBtn'
import defaults from './defaults'
import { icons } from './icons'
import { themes } from './theme'
import { themeConfig } from '@themeConfig'

// Styles
import { cookieRef } from '@/@layouts/stores/config'
import '@core/scss/template/libs/vuetify/index.scss'
import 'vuetify/styles'

export default function (app) {
  const paletteVersion = cookieRef('panelPaletteVersion', null)
  if (paletteVersion.value !== 'forest-v1') {
    for (const mode of ['light', 'dark']) {
      cookieRef(`${mode}ThemePrimaryColor`, null).value = themes[mode].colors.primary
      cookieRef(`${mode}ThemePrimaryDarkenColor`, null).value = themes[mode].colors['primary-darken-1']
    }
    paletteVersion.value = 'forest-v1'
  }

  const cookieThemeValues = {
    defaultTheme: resolveVuetifyTheme(themeConfig.app.theme),
    themes: {
      light: {
        colors: {
          'primary': cookieRef('lightThemePrimaryColor', themes.light.colors.primary).value,
          'primary-darken-1': cookieRef('lightThemePrimaryDarkenColor', themes.light.colors['primary-darken-1']).value,
        },
      },
      dark: {
        colors: {
          'primary': cookieRef('darkThemePrimaryColor', themes.dark.colors.primary).value,
          'primary-darken-1': cookieRef('darkThemePrimaryDarkenColor', themes.dark.colors['primary-darken-1']).value,
        },
      },
    },
  }

  const optionTheme = deepMerge({ themes }, cookieThemeValues)

  const vuetify = createVuetify({
    aliases: {
      IconBtn: VBtn,
    },
    defaults,
    icons,
    theme: optionTheme,
  })

  app.use(vuetify)
}
