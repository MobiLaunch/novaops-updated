<template>
  <Card>
    <CardHeader>
      <CardTitle>Account Settings</CardTitle>
    </CardHeader>
    <CardContent class="space-y-4">
      <div class="flex items-center gap-4 mb-6">
        <div class="relative">
          <div class="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
            {{ getInitials(accountForm.name) }}
          </div>
          <Button 
            size="icon" 
            variant="outline"
            class="absolute -bottom-1 -right-1 h-8 w-8 rounded-full"
            @click="changeAvatar"
          >
            <Camera class="w-4 h-4" />
          </Button>
        </div>
        <div>
          <p class="text-sm text-muted-foreground">Profile Picture</p>
          <p class="text-xs text-muted-foreground mt-1">Click camera to change</p>
        </div>
      </div>

      <div class="space-y-2">
        <Label for="acc-name">Full Name *</Label>
        <Input id="acc-name" v-model="accountForm.name" placeholder="Your Name" />
      </div>

      <div class="space-y-2">
        <Label for="acc-email">Email *</Label>
        <Input id="acc-email" v-model="accountForm.email" type="email" placeholder="you@example.com" />
      </div>

      <div class="space-y-2">
        <Label for="acc-role">Role</Label>
        <Select v-model="accountForm.role">
          <SelectTrigger id="acc-role">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="owner">Owner</SelectItem>
            <SelectItem value="manager">Manager</SelectItem>
            <SelectItem value="technician">Technician</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div class="pt-4 border-t">
        <p class="text-sm font-medium mb-2">Change Password</p>
        <div class="space-y-3">
          <Input 
            v-model="accountForm.currentPassword" 
            type="password" 
            placeholder="Current password" 
          />
          <Input 
            v-model="accountForm.newPassword" 
            type="password" 
            placeholder="New password" 
          />
          <Input 
            v-model="accountForm.confirmPassword" 
            type="password" 
            placeholder="Confirm new password" 
          />
        </div>
      </div>

      <Button class="w-full" @click="saveAccount">
        <Save class="w-4 h-4 mr-2" />
        Save Changes
      </Button>
    </CardContent>
  </Card>
  <AppAlert
    v-if="validationAlert"
    status="warning"
    :title="validationAlert"
    :inline="true"
    :dismissible="true"
    class="mt-3"
    @dismiss="validationAlert = ''"
  />
  <ToastStack />
</template>

<script setup lang="ts">
import { Camera, Save } from 'lucide-vue-next'
import { Card, CardHeader, CardTitle, CardContent } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import AppAlert from '~/components/ui/AppAlert.vue'
import ToastStack from '~/components/ui/ToastStack.vue'
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
