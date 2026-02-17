<template>
  <Menubar class="border-0 bg-transparent shadow-none h-auto p-0 space-x-0">
    <!-- Navigate menu -->
    <MenubarMenu>
      <MenubarTrigger class="text-xs font-medium text-muted-foreground hover:text-foreground px-2.5 py-1.5 rounded-md data-[state=open]:bg-muted data-[state=open]:text-foreground">
        Navigate
      </MenubarTrigger>
      <MenubarContent>
        <MenubarGroup>
          <MenubarItem @click="navigateTo('/dashboard')">
            <LayoutDashboard class="mr-2 h-3.5 w-3.5 text-indigo-500" /> Dashboard
          </MenubarItem>
          <MenubarItem @click="navigateTo('/tickets')">
            <TicketCheck class="mr-2 h-3.5 w-3.5 text-amber-500" /> Tickets
            <MenubarShortcut>
              <span class="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-600">New</span>
            </MenubarShortcut>
          </MenubarItem>
          <MenubarItem @click="navigateTo('/housecalls')">
            <MapPin class="mr-2 h-3.5 w-3.5 text-emerald-500" /> House Calls
          </MenubarItem>
          <MenubarItem @click="navigateTo('/customers')">
            <Users class="mr-2 h-3.5 w-3.5 text-blue-500" /> Customers
          </MenubarItem>
        </MenubarGroup>
        <MenubarSeparator />
        <MenubarGroup>
          <MenubarItem @click="navigateTo('/inventory')">
            <Package class="mr-2 h-3.5 w-3.5 text-violet-500" /> Inventory
          </MenubarItem>
          <MenubarItem @click="navigateTo('/calendar')">
            <CalendarDays class="mr-2 h-3.5 w-3.5 text-cyan-500" /> Calendar
          </MenubarItem>
          <MenubarItem @click="navigateTo('/pos')">
            <ShoppingCart class="mr-2 h-3.5 w-3.5 text-pink-500" /> POS
            <MenubarShortcut>
              <span class="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-600">Live</span>
            </MenubarShortcut>
          </MenubarItem>
          <MenubarItem @click="navigateTo('/reports')">
            <FileText class="mr-2 h-3.5 w-3.5 text-orange-500" /> Reports
          </MenubarItem>
        </MenubarGroup>
      </MenubarContent>
    </MenubarMenu>

    <!-- Quick Actions menu -->
    <MenubarMenu>
      <MenubarTrigger class="text-xs font-medium text-muted-foreground hover:text-foreground px-2.5 py-1.5 rounded-md data-[state=open]:bg-muted data-[state=open]:text-foreground">
        Quick Add
      </MenubarTrigger>
      <MenubarContent>
        <MenubarGroup>
          <MenubarItem @click="navigateTo('/tickets?new=true')">
            <Plus class="mr-2 h-3.5 w-3.5 text-amber-500" /> New Ticket
            <MenubarShortcut>⌘T</MenubarShortcut>
          </MenubarItem>
          <MenubarItem @click="navigateTo('/housecalls?new=true')">
            <Plus class="mr-2 h-3.5 w-3.5 text-emerald-500" /> New House Call
            <MenubarShortcut>⌘H</MenubarShortcut>
          </MenubarItem>
          <MenubarItem @click="navigateTo('/customers?new=true')">
            <Plus class="mr-2 h-3.5 w-3.5 text-blue-500" /> New Customer
            <MenubarShortcut>⌘U</MenubarShortcut>
          </MenubarItem>
        </MenubarGroup>
        <MenubarSeparator />
        <MenubarGroup>
          <MenubarItem @click="navigateTo('/pos')">
            <ShoppingCart class="mr-2 h-3.5 w-3.5 text-pink-500" /> Open Register
            <MenubarShortcut>⌘R</MenubarShortcut>
          </MenubarItem>
        </MenubarGroup>
      </MenubarContent>
    </MenubarMenu>

    <!-- View menu -->
    <MenubarMenu>
      <MenubarTrigger class="text-xs font-medium text-muted-foreground hover:text-foreground px-2.5 py-1.5 rounded-md data-[state=open]:bg-muted data-[state=open]:text-foreground">
        View
      </MenubarTrigger>
      <MenubarContent class="w-44">
        <MenubarGroup>
          <MenubarCheckboxItem v-model:checked="showSidebar">Sidebar</MenubarCheckboxItem>
          <MenubarCheckboxItem v-model:checked="compactMode">Compact Mode</MenubarCheckboxItem>
        </MenubarGroup>
        <MenubarSeparator />
        <MenubarGroup>
          <MenubarItem inset @click="navigateTo('/reports')">
            <BarChart2 class="mr-2 h-3.5 w-3.5 text-orange-500" /> Analytics
            <MenubarShortcut>⌘A</MenubarShortcut>
          </MenubarItem>
        </MenubarGroup>
        <MenubarSeparator />
        <MenubarGroup>
          <MenubarItem inset @click="navigateTo('/settings')">
            Preferences
          </MenubarItem>
        </MenubarGroup>
      </MenubarContent>
    </MenubarMenu>
  </Menubar>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import {
  LayoutDashboard, TicketCheck, MapPin, Users, Package,
  CalendarDays, ShoppingCart, FileText, Plus, BarChart2
} from 'lucide-vue-next'
import {
  Menubar, MenubarMenu, MenubarTrigger, MenubarContent, MenubarItem,
  MenubarSeparator, MenubarShortcut, MenubarGroup, MenubarCheckboxItem
} from '~/components/ui/menubar'

const showSidebar = ref(true)
const compactMode = ref(false)
</script>
