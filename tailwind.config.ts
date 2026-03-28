import type { Config } from 'tailwindcss'

export default <Partial<Config>>{
  theme: {
    extend: {},
  },
  corePlugins: {
    preflight: false, // Prevents Tailwind's CSS reset from clashing with Vuetify's reset
  }
}
