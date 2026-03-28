<template>
  <v-card>
    <v-card-item>
      <v-card-title>Account Settings</v-card-title>
    </v-card-item>
    <v-card-text class="d-flex flex-column gap-4">
      <div class="d-flex align-center gap-4 mb-2">
        <div class="position-relative">
          <v-avatar color="primary" size="80" class="text-h5 font-weight-bold">
            {{ getInitials(accountForm.name) }}
          </v-avatar>
          <v-btn
            icon="mdi-camera"
            size="x-small"
            variant="outlined"
            class="position-absolute"
            style="bottom:-4px;right:-4px"
            @click="changeAvatar"
          />
        </div>
        <div>
          <p class="text-body-2 text-medium-emphasis">Profile Picture</p>
          <p class="text-caption text-medium-emphasis mt-1">Click camera to change</p>
        </div>
      </div>

      <v-text-field v-model="accountForm.name" label="Full Name *" placeholder="Your Name" />
      <v-text-field v-model="accountForm.email" label="Email *" type="email" placeholder="you@example.com" />
      <v-select v-model="accountForm.role" label="Role" :items="['owner','manager','technician']" />

      <v-divider />
      <p class="text-body-2 font-weight-medium mb-0">Change Password</p>
      <v-text-field v-model="accountForm.currentPassword" type="password" placeholder="Current password" />
      <v-text-field v-model="accountForm.newPassword" type="password" placeholder="New password" />
      <v-text-field v-model="accountForm.confirmPassword" type="password" placeholder="Confirm new password" />

      <v-btn block color="primary" prepend-icon="mdi-content-save" @click="saveAccount">Save Changes</v-btn>
    </v-card-text>
  </v-card>
  <v-alert
    v-if="validationAlert"
    type="warning"
    :text="validationAlert"
    closable
    class="mt-3"
    @click:close="validationAlert = ''"
  />
</template>

<script setup lang="ts">
import { Camera, Save } from 'lucide-vue-next'
import { useToast } from '~/composables/useToast'

const { addNotification } = useNotifications()
const { toast } = useToast()
const validationAlert = ref('')

const accountForm = ref({
  name: '',
  email: '',
  role: 'owner',
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

onMounted(() => {
  if (process.client) {
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
  }
})

const getInitials = (name: string) => {
  if (!name) return 'DU'
  const parts = name.split(' ')
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

const changeAvatar = () => {
  toast.info('Coming Soon', 'Avatar upload will be available in a future update')
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
    localStorage.setItem('accountData', JSON.stringify({
      name: accountForm.value.name,
      email: accountForm.value.email,
      role: accountForm.value.role
    }))
  }

  toast.success('Account Updated', 'Your account settings have been saved')

  accountForm.value.currentPassword = ''
  accountForm.value.newPassword = ''
  accountForm.value.confirmPassword = ''
}
</script>
