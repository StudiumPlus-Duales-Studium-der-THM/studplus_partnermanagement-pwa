import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

export default createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        colors: {
          // StudiumPlus Corporate Identity
          primary: '#8CC927',        // StudiumPlus Grün
          secondary: '#3E4B56',      // StudiumPlus Dunkelgrau
          accent: '#8CC927',         // Grün für Akzente
          error: '#F44336',
          info: '#2196F3',
          success: '#8CC927',        // Grün für Erfolg
          warning: '#FF9800',
          background: '#FFFFFF',
          surface: '#FFFFFF',
          'surface-variant': '#F5F5F5',
          'on-surface': '#3E4B56',
          'on-primary': '#3E4B56'    // Dunkler Text auf grünem Hintergrund
        }
      },
      dark: {
        colors: {
          // StudiumPlus Corporate Identity (Dark Mode)
          primary: '#8CC927',        // StudiumPlus Grün (bleibt gleich)
          secondary: '#D1D6D8',      // Hellgrau für Kontrast
          accent: '#8CC927',         // Grün für Akzente
          error: '#F44336',
          info: '#2196F3',
          success: '#8CC927',        // Grün für Erfolg
          warning: '#FF9800',
          background: '#1A1A1A',     // Sehr dunkler Hintergrund
          surface: '#3E4B56',        // StudiumPlus Dunkelgrau für Karten/Surfaces
          'surface-variant': '#2A3942',
          'on-surface': '#FFFFFF',
          'on-primary': '#3E4B56'    // Dunkler Text auf grünem Hintergrund
        }
      }
    }
  },
  defaults: {
    VBtn: {
      variant: 'elevated',
      rounded: 'lg'
    },
    VCard: {
      rounded: 'lg',
      elevation: 2
    },
    VTextField: {
      variant: 'outlined',
      density: 'comfortable'
    },
    VAutocomplete: {
      variant: 'outlined',
      density: 'comfortable'
    },
    VTextarea: {
      variant: 'outlined',
      density: 'comfortable'
    }
  }
})
