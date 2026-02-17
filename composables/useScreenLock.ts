// composables/useScreenLock.ts
export const useScreenLock = () => {
  const lockTimeout = ref<NodeJS.Timeout | null>(null)
  const LOCK_DELAY = 3 * 60 * 1000 // 3 minutes in milliseconds

  const resetLockTimer = () => {
    if (!process.client) return

    // Clear existing timer
    if (lockTimeout.value) {
      clearTimeout(lockTimeout.value)
    }

    // Update last activity
    localStorage.setItem('last_activity', Date.now().toString())

    // Set new timer
    lockTimeout.value = setTimeout(() => {
      lockScreen()
    }, LOCK_DELAY)
  }

  const lockScreen = () => {
    if (!process.client) return
    
    const currentPath = useRoute().path
    
    // Don't lock on login or lock screen
    if (currentPath === '/login' || currentPath === '/lock') return

    localStorage.setItem('screen_locked', 'true')
    navigateTo('/lock')
  }

  const checkLockStatus = () => {
    if (!process.client) return

    const isLocked = localStorage.getItem('screen_locked') === 'true'
    const lastActivity = localStorage.getItem('last_activity')
    const currentPath = useRoute().path

    if (isLocked && currentPath !== '/lock') {
      navigateTo('/lock')
      return
    }

    // Check if enough time has passed since last activity
    if (lastActivity) {
      const timeSinceActivity = Date.now() - parseInt(lastActivity)
      if (timeSinceActivity > LOCK_DELAY && currentPath !== '/login' && currentPath !== '/lock') {
        lockScreen()
        return
      }
    }

    // Start the auto-lock timer
    resetLockTimer()
  }

  const setupActivityListeners = () => {
    if (!process.client) return

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
    
    events.forEach(event => {
      document.addEventListener(event, resetLockTimer, true)
    })
  }

  const cleanup = () => {
    if (lockTimeout.value) {
      clearTimeout(lockTimeout.value)
    }
  }

  return {
    resetLockTimer,
    lockScreen,
    checkLockStatus,
    setupActivityListeners,
    cleanup
  }
}
