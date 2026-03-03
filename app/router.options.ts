import type { RouterConfig } from '@nuxt/schema'
import { createWebHashHistory } from 'vue-router'

export default <RouterConfig>{
    // Use hash history mode for desktop app file:// serving
    history: base => import.meta.client ? createWebHashHistory(base) : undefined
}
