<template>
  <div class="bg-surface border border-border rounded-xl overflow-hidden">
    <div class="p-4 border-b border-border">
      <h3 class="text-sm font-black m-0">Account Settings</h3>
    </div>
    <div class="p-4 flex flex-col gap-4">
      <div class="flex items-center gap-4 mb-2">
        <div class="relative">
          <div
            class="w-20 h-20 rounded-full bg-primary text-white flex items-center justify-center text-xl font-bold overflow-hidden"
          >
            <img v-if="avatarUrl" :src="avatarUrl" alt="" class="w-full h-full object-cover" />
            <span v-else>{{ getInitials(accountForm.name) }}</span>
          </div>
          <Button
            rounded
            variant="outlined"
            class="!absolute !w-7 !h-7"
            style="bottom: -4px; right: -4px"
            @click="openAvatarPicker"
          >
            <i class="mdi mdi-camera-text-xs"></i>
          </Button>
          <input
            ref="avatarFileInput"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            class="hidden"
            @change="onAvatarSelected"
          >
        </div>
        <div>
          <p class="text-sm text-muted-foreground m-0">Profile Picture</p>
          <p class="text-xs text-muted-foreground mt-1 m-0">Click camera to change</p>
        </div>
      </div>

      <div class="flex flex-col gap-1.5">
        <label class="text-[10px] font-bold text-muted-foreground uppercase">Full Name *</label>
        <InputText v-model="accountForm.name" placeholder="Your Name" class="w-full rounded-xl" />
      </div>
      <div class="flex flex-col gap-1.5">
        <label class="text-[10px] font-bold text-muted-foreground uppercase">Email *</label>
        <InputText v-model="accountForm.email" type="email" placeholder="you@example.com" class="w-full rounded-xl" />
      </div>
      <div class="flex flex-col gap-1.5">
        <label class="text-[10px] font-bold text-muted-foreground uppercase">Role</label>
        <Select
          v-model="accountForm.role"
          :options="roleOptions"
          option-label="label"
          option-value="value"
          class="w-full"
        />
      </div>

      <hr class="border-border" />
      <p class="text-sm font-medium m-0">Change Password</p>
      <InputText v-model="accountForm.currentPassword" type="password" placeholder="Current password" class="w-full rounded-xl" />
      <InputText v-model="accountForm.newPassword" type="password" placeholder="New password" class="w-full rounded-xl" />
      <InputText v-model="accountForm.confirmPassword" type="password" placeholder="Confirm new password" class="w-full rounded-xl" />

      <Button label="Save Changes" class="w-full font-bold text-none" @click="saveAccount">
        <i class="mdi mdi-content-save-mr-2"></i>
      </Button>
    </div>
  </div>

  <Message
    v-if="validationAlert"
    severity="warn"
    :closable="true"
    class="mt-3"
    @close="validationAlert = ''"
  >
    {{ validationAlert }}
  </Message>
</template>

<script setup lang="ts">
import { useToast } from '~/composables/useToast'

const AVATAR_STORAGE_KEY = 'novaops_account_avatar'
const MAX_AVATAR_BYTES = 4 * 1024 * 1024
const MAX_AVATAR_EDGE = 256

const { toast } = useToast()
const validationAlert = ref('')
const avatarUrl = ref('')
const avatarFileInput = ref<HTMLInputElement | null>(null)

const roleOptions = [
  { label: 'Owner', value: 'owner' },
  { label: 'Manager', value: 'manager' },
  { label: 'Technician', value: 'technician' },
]

const accountForm = ref({
  name: '',
  email: '',
  role: 'owner',
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})

onMounted(() => {
  if (process.client) {
    try {
      const saved = localStorage.getItem('accountData')
      if (saved) {
        const data = JSON.parse(saved)
        accountForm.value.name = data.name || 'Demo User'
        accountForm.value.email = data.email || 'demo@novaops.com'
        accountForm.value.role = data.role || 'owner'
      } else {
        accountForm.value.name = 'Demo User'
        accountForm.value.email = 'demo@novaops.com'
      }
    } catch {
      accountForm.value.name = 'Demo User'
      accountForm.value.email = 'demo@novaops.com'
    }
    avatarUrl.value = localStorage.getItem(AVATAR_STORAGE_KEY) || ''
  }
})

const getInitials = (name: string) => {
  if (!name) return 'DU'
  const parts = name.split(' ')
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

function openAvatarPicker() {
  avatarFileInput.value?.click()
}

function dataUrlFromImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      try {
        let { width, height } = img
        if (width < 1 || height < 1) {
          reject(new Error('Invalid image dimensions'))
          return
        }
        if (width > MAX_AVATAR_EDGE || height > MAX_AVATAR_EDGE) {
          const scale = Math.min(MAX_AVATAR_EDGE / width, MAX_AVATAR_EDGE / height)
          width = Math.round(width * scale)
          height = Math.round(height * scale)
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Could not read image'))
          return
        }
        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', 0.88))
      } catch (e) {
        reject(e)
      }
    }
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Could not load image'))
    }
    img.src = objectUrl
  })
}

async function onAvatarSelected(ev: Event) {
  const input = ev.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return

  if (!file.type.startsWith('image/')) {
    toast.warning('Unsupported file', 'Choose a JPEG, PNG, WebP, or GIF image.')
    return
  }
  if (file.size > MAX_AVATAR_BYTES) {
    toast.warning('File too large', 'Use an image under 4 MB.')
    return
  }

  try {
    const dataUrl = await dataUrlFromImageFile(file)
    avatarUrl.value = dataUrl
    localStorage.setItem(AVATAR_STORAGE_KEY, dataUrl)
    toast.success('Profile photo saved', 'Shown on this device only.')
  } catch (err: any) {
    console.warn('[AccountSettings] avatar:', err)
    toast.danger('Could not use image', err?.message || 'Try a different file.')
  }
}

const saveAccount = () => {
  validationAlert.value = ''

  if (!accountForm.value.name || !accountForm.value.email) {
    validationAlert.value = 'Name and email are required'
    toast.warning('Validation Error', 'Name and email are required')
    return
  }

  if (accountForm.value.newPassword) {
    if (accountForm.value.newPassword !== accountForm.value.confirmPassword) {
      validationAlert.value = 'New passwords do not match'
      toast.danger('Password Mismatch', 'New passwords do not match')
      return
    }
    if (accountForm.value.newPassword.length < 6) {
      validationAlert.value = 'Password must be at least 6 characters'
      toast.warning('Weak Password', 'Password must be at least 6 characters')
      return
    }
  }

  if (process.client) {
    localStorage.setItem(
      'accountData',
      JSON.stringify({
        name: accountForm.value.name,
        email: accountForm.value.email,
        role: accountForm.value.role,
      }),
    )
  }

  toast.success('Account Updated', 'Your account settings have been saved')

  accountForm.value.currentPassword = ''
  accountForm.value.newPassword = ''
  accountForm.value.confirmPassword = ''
}
</script>
