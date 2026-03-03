<template>
  <div class="flex flex-col gap-6">

    <!-- ── Page Header ─────────────────────────────────────────────── -->
    <div class="flex items-center justify-between flex-wrap gap-4">
      <div class="flex items-center gap-4">
        <div class="page-icon-wrap">
          <MessageCircle class="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 class="text-3xl font-black tracking-tight">Messages</h1>
          <p class="text-sm text-muted-foreground font-medium mt-0.5">Customer email & chat communication hub</p>
        </div>
      </div>
      <div class="flex items-center gap-3">

        <!-- Notification bell -->
        <div class="relative" ref="bellWrapEl">
          <button class="notif-bell-btn" :class="{ 'active': bellOpen }" @click="bellOpen = !bellOpen">
            <Bell class="w-5 h-5" />
            <span v-if="unreadCount > 0" class="notif-badge">{{ unreadCount > 9 ? '9+' : unreadCount }}</span>
          </button>

          <!-- Notification dropdown -->
          <Transition name="notif-drop">
            <div v-if="bellOpen" class="notif-panel">
              <!-- Panel header -->
              <div class="notif-panel-header">
                <div class="flex items-center gap-2">
                  <div class="w-7 h-7 rounded-[14px] flex items-center justify-center" style="background:#f59e0b20">
                    <Bell class="w-3.5 h-3.5" style="color:#f59e0b" />
                  </div>
                  <span class="text-sm font-black">Notifications</span>
                  <span v-if="unreadCount > 0" class="text-[10px] font-black px-2 py-0.5 rounded-full" style="background:#ef444420;color:#ef4444">{{ unreadCount }} new</span>
                </div>
                <div class="flex items-center gap-1">
                  <button v-if="notifications.length" class="text-[10px] font-bold px-2.5 py-1.5 rounded-full hover:bg-muted/60 transition-all text-muted-foreground" @click="markAllAsRead">Mark all read</button>
                  <button v-if="notifications.length" class="text-[10px] font-bold px-2.5 py-1.5 rounded-full hover:bg-red-500/10 transition-all" style="color:#ef4444" @click="clearAll">Clear</button>
                </div>
              </div>

              <!-- Notification list -->
              <div class="notif-list">
                <div v-if="!notifications.length" class="notif-empty">
                  <Bell class="w-8 h-8 opacity-20" />
                  <p class="text-sm font-bold mt-2">All caught up</p>
                  <p class="text-xs text-muted-foreground">No new notifications</p>
                </div>
                <TransitionGroup name="notif-item" tag="div">
                  <div v-for="n in notifications" :key="n.id"
                    class="notif-item"
                    :class="[n.type, { unread: !n.read }]"
                    @click="markAsRead(n.id)">
                    <div class="notif-item-icon" :class="n.type">
                      <CheckCircle v-if="n.type === 'success'" class="w-3.5 h-3.5" />
                      <AlertTriangle v-else-if="n.type === 'warning'" class="w-3.5 h-3.5" />
                      <AlertCircle v-else-if="n.type === 'error'" class="w-3.5 h-3.5" />
                      <Info v-else class="w-3.5 h-3.5" />
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-xs font-black truncate">{{ n.title }}</p>
                      <p class="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">{{ n.message }}</p>
                      <p class="text-[10px] text-muted-foreground/60 mt-1">{{ formatNotifTime(n.timestamp) }}</p>
                    </div>
                    <button class="notif-dismiss" @click.stop="removeNotification(n.id)">
                      <X class="w-3 h-3" />
                    </button>
                  </div>
                </TransitionGroup>
              </div>
            </div>
          </Transition>
        </div>

        <!-- Compose button -->
        <button class="msg-fab flex items-center gap-2.5 h-10 px-5 rounded-full text-sm font-black text-white"
          style="background:linear-gradient(135deg,#ec4899,#db2777);box-shadow:0 4px 20px #ec489950"
          @click="openCompose">
          <Pencil class="w-4 h-4" /> Compose
        </button>
      </div>
    </div>

    <!-- ── Gmail Connection Banner ────────────────────────────────── -->
    <div v-if="!gmailConnected" class="rounded-[20px] p-4 flex items-center justify-between flex-wrap gap-3"
      style="background:linear-gradient(135deg,#ea443514,#4285f414);outline:2px solid #4285f428;outline-offset:0">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-full flex items-center justify-center" style="background:#4285f424">
          <Mail class="w-5 h-5" style="color:#4285f4" />
        </div>
        <div>
          <p class="text-sm font-bold">Connect Gmail to send real emails</p>
          <p class="text-xs text-muted-foreground">Authorize your Google account to send &amp; receive via Gmail API</p>
        </div>
      </div>
      <button @click="connectGmail" class="h-9 px-5 rounded-full text-sm font-bold text-white"
        style="background:linear-gradient(135deg,#4285f4,#2b6cb0);box-shadow:0 4px 16px #4285f430">
        Connect Gmail
      </button>
    </div>
    <div v-else class="rounded-[20px] p-3 px-5 flex items-center gap-3 flex-wrap"
      style="background:#10b98114;outline:2px solid #10b98128;outline-offset:0">
      <div class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style="background:#10b98124">
        <Check class="w-4 h-4" style="color:#10b981" />
      </div>
      <p class="text-sm font-bold flex-1"><span style="color:#10b981">Gmail Connected</span> — {{ gmailEmail }}</p>
      <div class="flex items-center gap-2">
        <span v-if="syncing" class="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
          <RefreshCw class="w-3 h-3 animate-spin" /> Syncing…
        </span>
        <span v-else-if="lastSyncTime" class="text-xs text-muted-foreground font-medium">
          Synced {{ lastSyncTime }}
        </span>
        <button @click="syncGmailInbox" :disabled="syncing"
          class="h-8 px-4 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
          style="background:#10b98122;color:#10b981;outline:1.5px solid #10b98130;outline-offset:0">
          <RefreshCw class="w-3 h-3" :class="syncing ? 'animate-spin' : ''" /> Sync Inbox
        </button>
      </div>
    </div>

    <!-- ── Stats Row ──────────────────────────────────────────────── -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div v-for="stat in msgStats" :key="stat.label"
        class="rounded-[24px] p-4 flex flex-col gap-2"
        :style="`background:${stat.color}14;outline:2px solid ${stat.color}28;outline-offset:0`">
        <div class="flex items-center justify-between">
          <div class="w-9 h-9 rounded-[18px] flex items-center justify-center" :style="`background:${stat.color}24`">
            <component :is="stat.icon" class="w-4.5 h-4.5" :style="`color:${stat.color}`" />
          </div>
        </div>
        <div>
          <p class="text-xs font-semibold text-muted-foreground">{{ stat.label }}</p>
          <p class="text-2xl font-black" :style="`color:${stat.color}`">{{ stat.value }}</p>
        </div>
      </div>
    </div>

    <!-- ── Main Layout ────────────────────────────────────────────── -->
    <div class="msg-layout">

      <!-- ── Sidebar: Thread List ───────────────────────────────── -->
      <div class="msg-sidebar">
        <!-- Search + Filters -->
        <div class="p-4 border-b border-border/50">
          <div class="relative mb-3">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input v-model="threadSearch" placeholder="Search messages…"
              class="w-full h-10 pl-10 pr-4 rounded-full text-sm font-medium"
              style="background:hsl(var(--muted)/0.5);border:2px solid hsl(var(--border)/0.6);outline:none"
              @focus="e => e.target.style.borderColor='#ec4899'"
              @blur="e => e.target.style.borderColor='hsl(var(--border)/0.6)'" />
          </div>
          <div class="flex gap-1.5 flex-wrap">
            <button v-for="f in threadFilters" :key="f"
              class="px-3 py-1 rounded-full text-xs font-bold transition-all"
              :style="threadFilter === f
                ? 'background:#ec489920;color:#ec4899;outline:2px solid #ec489940;outline-offset:0'
                : 'background:hsl(var(--muted)/0.5);color:hsl(var(--muted-foreground))'"
              @click="threadFilter = f">{{ f }}</button>
          </div>
        </div>

        <!-- Thread list -->
        <div class="flex-1 overflow-y-auto">
          <div v-for="thread in filteredThreads" :key="thread.id"
            class="msg-thread-item"
            :class="{ 'active': selectedThread?.id === thread.id, 'unread': thread.unread }"
            @click="selectThread(thread)">
            <div class="msg-avatar" :style="`background:${thread.color}20;color:${thread.color}`">
              {{ thread.initials }}
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-baseline justify-between gap-2">
                <p class="text-sm font-black truncate">{{ thread.name }}</p>
                <span class="text-[10px] text-muted-foreground flex-shrink-0">{{ thread.time }}</span>
              </div>
              <p class="text-xs text-muted-foreground truncate mt-0.5">{{ thread.preview }}</p>
              <div class="flex items-center gap-2 mt-1">
                <span v-if="thread.ticketId" class="text-[9px] font-black px-2 py-0.5 rounded-full"
                  style="background:#f59e0b18;color:#f59e0b">#{{ thread.ticketId }}</span>
                <span class="text-[9px] font-bold px-2 py-0.5 rounded-full capitalize"
                  :style="`background:${channelColor(thread.channel)}18;color:${channelColor(thread.channel)}`">
                  {{ thread.channel }}
                </span>
              </div>
            </div>
            <div v-if="thread.unread" class="w-2 h-2 rounded-full bg-pink-500 flex-shrink-0 mt-1" />
          </div>

          <div v-if="filteredThreads.length === 0" class="flex flex-col items-center gap-3 py-12 px-4 text-center">
            <div class="w-12 h-12 rounded-[20px] flex items-center justify-center" style="background:#ec489914">
              <MessageCircle class="w-6 h-6" style="color:#ec4899;opacity:0.5" />
            </div>
            <p class="font-black text-sm">No threads found</p>
            <p class="text-xs text-muted-foreground">Start a conversation by composing a message</p>
          </div>
        </div>
      </div>

      <!-- ── Message Pane ───────────────────────────────────────── -->
      <div class="msg-pane">
        <template v-if="selectedThread">

          <!-- Thread header -->
          <div class="msg-pane-header">
            <div class="msg-avatar-lg" :style="`background:${selectedThread.color}20;color:${selectedThread.color}`">
              {{ selectedThread.initials }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="font-black text-base">{{ selectedThread.name }}</p>
              <div class="flex items-center gap-3 mt-0.5 flex-wrap">
                <span class="text-xs text-muted-foreground font-medium">{{ selectedThread.email }}</span>
                <span v-if="selectedThread.ticketId" class="text-[10px] font-black px-2 py-0.5 rounded-full"
                  style="background:#f59e0b18;color:#f59e0b">Ticket #{{ selectedThread.ticketId }}</span>
              </div>
            </div>
            <div class="flex items-center gap-2 flex-shrink-0">
              <button class="msg-icon-btn" title="Call customer" @click="callCustomer">
                <Phone class="w-4 h-4" />
              </button>
              <button class="msg-icon-btn" title="Archive thread" @click="archiveThread">
                <Archive class="w-4 h-4" />
              </button>
              <button class="msg-icon-btn" title="Mark unread" @click="toggleUnread">
                <Mail class="w-4 h-4" />
              </button>
              <button class="msg-icon-btn" title="Delete thread" style="color:#ef4444" @click="deleteThread">
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- Messages -->
          <div ref="messagesEl" class="msg-messages-area">

            <!-- Ticket context banner -->
            <div v-if="selectedThread.ticketId" class="msg-ticket-banner">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-[14px] flex items-center justify-center" style="background:#f59e0b20">
                  <TicketCheck class="w-4 h-4" style="color:#f59e0b" />
                </div>
                <div>
                  <p class="text-xs font-black">Ticket #{{ selectedThread.ticketId }}</p>
                  <p class="text-[10px] text-muted-foreground">{{ ticketInfo?.device }} — {{ ticketInfo?.issue }}</p>
                </div>
                <span class="ml-auto text-[10px] font-black px-2.5 py-1 rounded-full" style="background:#f59e0b20;color:#f59e0b">
                  {{ ticketInfo?.status }}
                </span>
              </div>
            </div>

            <!-- Message bubbles -->
            <div v-for="msg in selectedThread.messages" :key="msg.id"
              class="msg-bubble-row" :class="msg.from === 'shop' ? 'outbound' : 'inbound'">
              <div class="msg-bubble" :class="msg.from === 'shop' ? 'outbound' : 'inbound'">
                <p class="text-sm leading-relaxed">{{ msg.body }}</p>
                <div class="flex items-center gap-2 mt-1.5">
                  <span class="text-[10px] opacity-60">{{ msg.time }}</span>
                  <span v-if="msg.channel" class="text-[9px] font-bold opacity-60 capitalize">· {{ msg.channel }}</span>
                  <CheckCheck v-if="msg.from === 'shop' && msg.read" class="w-3 h-3 opacity-60 ml-auto" style="color:#4ade80" />
                  <Check v-else-if="msg.from === 'shop'" class="w-3 h-3 opacity-60 ml-auto" />
                </div>
              </div>
            </div>
          </div>

          <!-- Reply area -->
          <div class="msg-reply-area">
            <!-- Channel toggle + quick replies -->
            <div class="flex items-center gap-2 mb-3 flex-wrap">
              <div class="flex bg-muted/40 rounded-full p-1 gap-1">
                <button v-for="ch in ['email', 'sms', 'chat']" :key="ch"
                  class="px-3 py-1 rounded-full text-xs font-bold capitalize transition-all"
                  :style="replyChannel === ch
                    ? `background:${channelColor(ch)}20;color:${channelColor(ch)}`
                    : 'color:hsl(var(--muted-foreground))'"
                  @click="replyChannel = ch">
                  {{ ch }}
                </button>
              </div>
              <div class="flex gap-2 ml-auto flex-wrap">
                <button v-for="qr in quickReplies" :key="qr"
                  class="px-3 py-1.5 rounded-full text-xs font-semibold transition-all hover:scale-105"
                  style="background:hsl(var(--muted)/0.5);border:1.5px solid hsl(var(--border)/0.6)"
                  @click="replyBody = qr">
                  {{ qr.substring(0, 28) }}{{ qr.length > 28 ? '…' : '' }}
                </button>
              </div>
            </div>

            <!-- Subject (email only) -->
            <input v-if="replyChannel === 'email'" v-model="replySubject"
              placeholder="Subject…"
              class="w-full h-9 px-4 rounded-[14px] text-sm font-medium mb-2"
              style="background:hsl(var(--muted)/0.4);border:1.5px solid hsl(var(--border)/0.6);outline:none" />

            <div class="flex gap-3 items-end">
              <div class="flex-1 relative">
                <textarea v-model="replyBody"
                  :placeholder="`Type a ${replyChannel} message to ${selectedThread.name}…`"
                  class="msg-textarea"
                  rows="3"
                  @keydown.ctrl.enter.prevent="sendReply"
                  @keydown.meta.enter.prevent="sendReply" />
                <div class="absolute bottom-2 right-3 flex gap-1.5">
                  <button class="msg-textarea-btn" title="Attach file" @click="attachFile">
                    <Paperclip class="w-4 h-4" />
                  </button>
                  <button class="msg-textarea-btn" title="Insert template" @click="templateOpen = true">
                    <FileText class="w-4 h-4" />
                  </button>
                </div>
              </div>
              <button class="msg-send-btn" :disabled="!replyBody.trim()" @click="sendReply">
                <Send class="w-4 h-4" />
              </button>
            </div>
            <p class="text-[10px] text-muted-foreground mt-1.5 font-medium">⌘↵ or Ctrl+Enter to send</p>
          </div>

        </template>

        <!-- Empty state -->
        <template v-else>
          <div class="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
            <div class="w-20 h-20 rounded-[32px] flex items-center justify-center" style="background:#ec489914">
              <MessageCircle class="w-10 h-10" style="color:#ec4899;opacity:0.4" />
            </div>
            <h3 class="text-lg font-black">No conversation selected</h3>
            <p class="text-sm text-muted-foreground max-w-xs">Select a thread on the left or compose a new message to a customer.</p>
            <button class="msg-fab flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-black text-white"
              style="background:linear-gradient(135deg,#ec4899,#db2777)"
              @click="openCompose">
              <Pencil class="w-4 h-4" /> Compose
            </button>
          </div>
        </template>
      </div>
    </div>

    <!-- ── Compose Dialog ─────────────────────────────────────────── -->
    <Dialog v-model:open="composeOpen">
      <DialogContent class="max-w-lg">
        <div class="flex flex-col gap-5 p-7">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-[20px] flex items-center justify-center"
              style="background:linear-gradient(135deg,#ec4899,#db2777)">
              <Pencil class="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 class="text-base font-black">New Message</h2>
              <p class="text-xs text-muted-foreground font-medium">Send email or SMS to a customer</p>
            </div>
          </div>

          <!-- To / Channel -->
          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-2">
              <label class="m3-label">To</label>
              <CustomerSelect v-model="compose.customerId" />
            </div>
            <div class="space-y-2">
              <label class="m3-label">Via</label>
              <div class="flex gap-1.5 mt-1">
                <button v-for="ch in ['email', 'sms', 'chat']" :key="ch"
                  class="flex-1 py-2 rounded-[12px] text-xs font-black capitalize transition-all"
                  :style="compose.channel === ch
                    ? `background:${channelColor(ch)};color:white;box-shadow:0 4px 12px ${channelColor(ch)}40`
                    : 'background:hsl(var(--muted)/0.5);color:hsl(var(--muted-foreground))'"
                  @click="compose.channel = ch">{{ ch }}</button>
              </div>
            </div>
          </div>

          <!-- Ticket link (optional) -->
          <div class="space-y-2">
            <label class="m3-label">Link to Ticket (optional)</label>
            <select v-model="compose.ticketId" class="compose-select">
              <option value="">No ticket</option>
              <option v-for="t in customerTickets" :key="t.id" :value="t.id">
                #{{ t.id }} — {{ t.device }} ({{ t.status }})
              </option>
            </select>
          </div>

          <!-- Subject (email) -->
          <div v-if="compose.channel === 'email'" class="space-y-2">
            <label class="m3-label">Subject</label>
            <input v-model="compose.subject" placeholder="Repair status update…" class="compose-input" />
          </div>

          <!-- Body -->
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <label class="m3-label">Message</label>
              <div class="flex gap-1.5">
                <button v-for="tmpl in emailTemplates.slice(0,3)" :key="tmpl.name"
                  class="text-[10px] font-bold px-2 py-1 rounded-[8px] transition-all hover:scale-105"
                  style="background:hsl(var(--muted)/0.5);color:hsl(var(--muted-foreground))"
                  @click="applyTemplate(tmpl)">{{ tmpl.name }}</button>
              </div>
            </div>
            <textarea v-model="compose.body" rows="5" placeholder="Type your message…"
              class="compose-textarea" />
          </div>

          <div class="flex gap-3">
            <button class="flex-1 h-12 rounded-full font-bold text-sm"
              style="outline:2px solid hsl(var(--border));outline-offset:0"
              @click="composeOpen = false">Cancel</button>
            <button class="flex-1 h-12 rounded-full font-black text-sm text-white"
              style="background:linear-gradient(135deg,#ec4899,#db2777);box-shadow:0 4px 16px #ec489940"
              :disabled="!compose.customerId || !compose.body.trim()"
              @click="sendCompose">
              <span class="flex items-center justify-center gap-2"><Send class="w-4 h-4" /> Send</span>
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <!-- ── Template Picker Dialog ─────────────────────────────────── -->
    <Dialog v-model:open="templateOpen">
      <DialogContent class="max-w-md">
        <div class="flex flex-col gap-4 p-7">
          <h2 class="text-base font-black">Message Templates</h2>
          <div class="space-y-2 max-h-80 overflow-y-auto">
            <button v-for="tmpl in emailTemplates" :key="tmpl.name"
              class="w-full text-left p-4 rounded-[20px] transition-all hover:scale-[1.01]"
              style="background:hsl(var(--muted)/0.4);outline:1.5px solid hsl(var(--border)/0.5);outline-offset:0"
              @click="replyBody = tmpl.body; templateOpen = false">
              <p class="text-sm font-black mb-1">{{ tmpl.name }}</p>
              <p class="text-xs text-muted-foreground line-clamp-2">{{ tmpl.body }}</p>
            </button>
          </div>
          <button class="h-10 rounded-full text-sm font-bold"
            style="outline:2px solid hsl(var(--border));outline-offset:0"
            @click="templateOpen = false">Close</button>
        </div>
      </DialogContent>
    </Dialog>

  </div>
</template>

<script setup lang="ts">
import {
  MessageCircle, Pencil, Search, Send, Phone, Archive, Mail, Trash2,
  TicketCheck, FileText, Paperclip, CheckCheck, Check, Bell,
  CheckCircle, AlertTriangle, AlertCircle, Info, X, RefreshCw
} from 'lucide-vue-next'
import { Dialog, DialogContent } from '~/components/ui/dialog'
import { storeToRefs } from 'pinia'

definePageMeta({ middleware: ['auth'] })

const appStore = useAppStore()
const { customers, tickets, settings, notificationPrefs } = storeToRefs(appStore)
const { addNotification, notifications, removeNotification, markAsRead, markAllAsRead, clearAll, unreadCount } = useNotifications()
const route = useRoute()
const { $supabase } = useNuxtApp()

// ── Notification bell state ─────────────────────────────────────────
const bellOpen = ref(false)
const bellWrapEl = ref<HTMLElement | null>(null)

function formatNotifTime(ts: string) {
  const diff = Date.now() - new Date(ts).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'Just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

// Close bell panel on outside click
function onDocClick(e: MouseEvent) {
  if (bellWrapEl.value && !bellWrapEl.value.contains(e.target as Node)) {
    bellOpen.value = false
  }
}
onMounted(() => document.addEventListener('mousedown', onDocClick))
onUnmounted(() => document.removeEventListener('mousedown', onDocClick))

// ── Gmail connection state ──────────────────────────────────────────
const brandManager = useBrandManager()
const gmailConnected = ref(false)
const gmailEmail = ref('')
const currentProfileId = ref('')

async function checkGmailConnection() {
  if (!$supabase) return
  try {
    const { data: { user } } = await ($supabase as any).auth.getUser()
    if (!user) return
    currentProfileId.value = user.id
    const { data } = await ($supabase as any)
      .from('social_connections')
      .select('handle, connected')
      .eq('profile_id', user.id)
      .eq('platform', 'gmail')
      .maybeSingle()
    if (data?.connected) {
      gmailConnected.value = true
      gmailEmail.value = data.handle || 'Connected'
    }
  } catch { /* non-fatal */ }
}

async function connectGmail() {
  await brandManager.connectPlatform('gmail')
  // Re-check after popup closes
  setTimeout(() => checkGmailConnection(), 2000)
}

// ── Gmail inbox sync ─────────────────────────────────────────────────
const syncing = ref(false)
const lastSyncTime = ref('')

async function syncGmailInbox() {
  if (!currentProfileId.value || syncing.value) return
  syncing.value = true
  try {
    const result = await $fetch(`/api/fetch-emails?profileId=${currentProfileId.value}&maxResults=100`) as any
    if (result?.ok) {
      lastSyncTime.value = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      // Reload threads to reflect newly synced messages
      await loadMessages()
      if (result.synced > 0 && notificationPrefs.value.newMessage) {
        addNotification('Inbox Synced', `${result.inbound} new, ${result.outbound} sent messages loaded`, 'success')
      }
    }
  } catch (err: any) {
    addNotification('Sync Failed', err.message || 'Could not sync Gmail inbox', 'error')
  } finally {
    syncing.value = false
  }
}

// ── Thread state ────────────────────────────────────────────────────
const threadSearch  = ref('')
const threadFilter  = ref('All')
const threadFilters = ['All', 'Unread', 'Email', 'SMS', 'Chat']
const selectedThread = ref<any>(null)
const messagesEl = ref<HTMLElement | null>(null)

// ── Reply state ─────────────────────────────────────────────────────
const replyBody    = ref('')
const replySubject = ref('')
const replyChannel = ref<'email' | 'sms' | 'chat'>('email')

// ── Compose dialog state ────────────────────────────────────────────
const composeOpen = ref(false)
const compose = ref({ customerId: '', ticketId: '', channel: 'email', subject: '', body: '' })
const templateOpen = ref(false)

// ── Demo data (fallback when Supabase unavailable) ──────────────────
const DEMO_THREADS: any[] = [
  {
    id: 1, name: 'Maria Santos', email: 'maria@email.com', initials: 'MS', color: '#ec4899',
    channel: 'email', ticketId: null, unread: true, time: '10:32 AM',
    preview: 'When will my phone be ready? I need it for work tomorrow.',
    messages: [
      { id: 1, from: 'customer', body: 'Hi! Just wanted to check in on my Samsung Galaxy repair. Do you have an update?', time: '9:14 AM', channel: 'email', read: true },
      { id: 2, from: 'shop', body: 'Hi Maria! We received your device and the screen replacement is in progress. We expect to finish by end of day.', time: '9:45 AM', channel: 'email', read: true },
      { id: 3, from: 'customer', body: 'When will my phone be ready? I need it for work tomorrow.', time: '10:32 AM', channel: 'email', read: false },
    ],
  },
  {
    id: 2, name: 'James O\'Brien', email: 'james@obrien.net', initials: 'JO', color: '#3b82f6',
    channel: 'sms', ticketId: 47, unread: false, time: 'Yesterday',
    preview: 'Thanks for the update! I\'ll come pick it up at 5.',
    messages: [
      { id: 1, from: 'shop', body: 'Hi James, your MacBook Pro is ready for pickup! The logic board replacement went smoothly. Give us a call if you have questions.', time: 'Yesterday 2:00 PM', channel: 'sms', read: true },
      { id: 2, from: 'customer', body: 'Thanks for the update! I\'ll come pick it up at 5.', time: 'Yesterday 2:15 PM', channel: 'sms', read: true },
    ],
  },
  {
    id: 3, name: 'Priya Nair', email: 'priya.n@gmail.com', initials: 'PN', color: '#8b5cf6',
    channel: 'chat', ticketId: 51, unread: true, time: '2h ago',
    preview: 'Is there any warranty on the repair?',
    messages: [
      { id: 1, from: 'customer', body: 'Hello, I brought in my iPad last week — order #51. What\'s the status?', time: '2h ago', channel: 'chat', read: false },
      { id: 2, from: 'customer', body: 'Is there any warranty on the repair?', time: '1h ago', channel: 'chat', read: false },
    ],
  },
  {
    id: 4, name: 'Tom Whitfield', email: 'tom.w@company.io', initials: 'TW', color: '#10b981',
    channel: 'email', ticketId: null, unread: false, time: 'Mon',
    preview: 'Perfect, see you then.',
    messages: [
      { id: 1, from: 'shop', body: 'Hi Tom, we have a slot available Tuesday at 2pm for your laptop diagnostics. Would that work for you?', time: 'Mon 11:00 AM', channel: 'email', read: true },
      { id: 2, from: 'customer', body: 'Perfect, see you then.', time: 'Mon 11:24 AM', channel: 'email', read: true },
    ],
  },
]

// ── Thread colors by email hash ─────────────────────────────────────
const THREAD_COLORS = ['#ec4899', '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6']
function hashColor(str: string) {
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0
  return THREAD_COLORS[Math.abs(hash) % THREAD_COLORS.length]
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffHrs = diffMs / (1000 * 60 * 60)
  if (diffHrs < 1) return `${Math.round(diffMs / 60000)}m ago`
  if (diffHrs < 24) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  if (diffHrs < 48) return 'Yesterday'
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

// ── Reactive threads ────────────────────────────────────────────────
const threads = ref<any[]>([])
const supabaseAvailable = ref(false)

// ── Load messages from Supabase ─────────────────────────────────────
async function loadMessages() {
  if (!$supabase) {
    threads.value = [...DEMO_THREADS]
    return
  }

  try {
    const { data: { user } } = await ($supabase as any).auth.getUser()
    if (!user) { threads.value = [...DEMO_THREADS]; return }

    const { data, error } = await ($supabase as any)
      .from('messages')
      .select('*')
      .eq('profile_id', user.id)
      .order('created_at', { ascending: true })

    if (error) {
      // Table might not exist yet — fall back to demo data
      console.warn('[Messages] Supabase error, using demo data:', error.message)
      threads.value = [...DEMO_THREADS]
      return
    }

    supabaseAvailable.value = true

    if (!data || data.length === 0) {
      threads.value = [...DEMO_THREADS]
      return
    }

    // Group messages into threads by customer_email
    const grouped = new Map<string, any[]>()
    for (const msg of data) {
      const key = msg.customer_email || msg.customer_name || `unknown-${msg.id}`
      if (!grouped.has(key)) grouped.set(key, [])
      grouped.get(key)!.push(msg)
    }

    const threadList: any[] = []
    for (const [email, msgs] of grouped) {
      const lastMsg = msgs[msgs.length - 1]
      const name = lastMsg.customer_name || email
      const initials = name.substring(0, 2).toUpperCase()
      const unreadCount = msgs.filter((m: any) => m.direction === 'inbound' && !m.read).length
      const ticketId = msgs.find((m: any) => m.ticket_id)?.ticket_id || null

      threadList.push({
        id: email,
        name,
        email,
        initials,
        color: hashColor(email),
        channel: lastMsg.channel || 'email',
        ticketId,
        unread: unreadCount > 0,
        time: formatTime(lastMsg.created_at),
        preview: lastMsg.body?.substring(0, 100) || '',
        messages: msgs.map((m: any) => ({
          id: m.id,
          from: m.direction === 'outbound' ? 'shop' : 'customer',
          body: m.body,
          time: formatTime(m.created_at),
          channel: m.channel,
          read: m.read,
          subject: m.subject,
        })),
      })
    }

    // Sort by most recent message
    threadList.sort((a, b) => {
      const aLast = grouped.get(a.email)!.at(-1)
      const bLast = grouped.get(b.email)!.at(-1)
      return new Date(bLast.created_at).getTime() - new Date(aLast.created_at).getTime()
    })

    threads.value = threadList
  } catch (err) {
    console.warn('[Messages] Error loading, using demo data:', err)
    threads.value = [...DEMO_THREADS]
  }
}

// ── Filtered threads ────────────────────────────────────────────────
const filteredThreads = computed(() => {
  let list = threads.value
  if (threadFilter.value === 'Unread') list = list.filter(t => t.unread)
  else if (threadFilter.value === 'Email') list = list.filter(t => t.channel === 'email')
  else if (threadFilter.value === 'SMS')   list = list.filter(t => t.channel === 'sms')
  else if (threadFilter.value === 'Chat')  list = list.filter(t => t.channel === 'chat')
  if (threadSearch.value) {
    const q = threadSearch.value.toLowerCase()
    list = list.filter(t =>
      t.name.toLowerCase().includes(q) ||
      t.email.toLowerCase().includes(q) ||
      t.preview.toLowerCase().includes(q)
    )
  }
  return list
})

// ── Stats ────────────────────────────────────────────────────────────
const msgStats = computed(() => [
  { label: 'Total Threads', value: threads.value.length, color: '#ec4899', icon: MessageCircle },
  { label: 'Unread', value: threads.value.filter(t => t.unread).length, color: '#f59e0b', icon: Mail },
  { label: 'Sent Today', value: threads.value.reduce((n, t) => n + t.messages.filter((m: any) => m.from === 'shop').length, 0), color: '#3b82f6', icon: Send },
  { label: 'Customers', value: new Set(threads.value.map(t => t.email)).size, color: '#10b981', icon: TicketCheck },
])

// ── Thread selection ─────────────────────────────────────────────────
function selectThread(thread: any) {
  selectedThread.value = thread
  replyChannel.value = thread.channel || 'email'
  thread.unread = false

  // Mark messages as read in Supabase
  if (supabaseAvailable.value && $supabase) {
    const unreadIds = thread.messages
      .filter((m: any) => m.from === 'customer' && !m.read)
      .map((m: any) => m.id)
      .filter((id: any) => typeof id === 'number')

    if (unreadIds.length > 0) {
      ;($supabase as any)
        .from('messages')
        .update({ read: true })
        .in('id', unreadIds)
        .then(() => {
          thread.messages.forEach((m: any) => { if (m.from === 'customer') m.read = true })
        })
        .catch(() => {/* non-fatal */})
    }
  }

  nextTick(() => scrollToBottom())
}

const ticketInfo = computed(() => {
  if (!selectedThread.value?.ticketId) return null
  return tickets.value?.find((t: any) => t.id === selectedThread.value.ticketId) ?? null
})

const channelColor = (ch: string) =>
  ({ email: '#3b82f6', sms: '#10b981', chat: '#8b5cf6' })[ch] ?? '#ec4899'

// ── Quick replies ────────────────────────────────────────────────────
const quickReplies = [
  'Your device is ready for pickup!',
  'We\'re waiting for a part — we\'ll update you shortly.',
  'Repair completed. Please come in at your convenience.',
]

// ── Email templates ──────────────────────────────────────────────────
const emailTemplates = [
  {
    name: 'Ready for Pickup',
    body: `Hi {name},\n\nGreat news — your device repair is complete and ready for pickup at your convenience!\n\nPlease bring your ticket receipt when you come in.\n\nThanks,\nThe Team`,
  },
  {
    name: 'Parts Delay',
    body: `Hi {name},\n\nWe wanted to give you an update on your repair. We're currently awaiting a part from our supplier. We expect to receive it within 2–3 business days and will contact you as soon as work is complete.\n\nWe apologize for the wait and appreciate your patience!\n\nBest,\nThe Team`,
  },
  {
    name: 'Estimate Approval',
    body: `Hi {name},\n\nWe've completed our diagnostic and have an estimate ready for your review. Please reply to this message or call us to approve the repair so we can get started right away.\n\nThank you!\nThe Team`,
  },
  {
    name: 'Warranty Reminder',
    body: `Hi {name},\n\nThis is a friendly reminder that your recent repair comes with a 90-day warranty. If you experience any related issues within this period, please don't hesitate to reach out.\n\nThanks for choosing us!\nThe Team`,
  },
  {
    name: 'Follow-up',
    body: `Hi {name},\n\nWe hope your repaired device is working great! We'd love to hear how things are going. If you have any issues or questions, we're always here to help.\n\nBest,\nThe Team`,
  },
]

function applyTemplate(tmpl: any) {
  const name = selectedThread.value?.name?.split(' ')[0] || 'there'
  compose.value.body = tmpl.body.replace(/{name}/g, name)
}

// ── Insert message into Supabase ─────────────────────────────────────
async function insertMessage(msgData: {
  customerEmail: string
  customerName: string
  channel: string
  direction: string
  subject?: string
  body: string
  ticketId?: number | null
}) {
  if (!supabaseAvailable.value || !$supabase) return null

  try {
    const { data: { user } } = await ($supabase as any).auth.getUser()
    if (!user) return null

    // Find customer ID by email
    let customerId = null
    if (msgData.customerEmail) {
      const customer = customers.value?.find((c: any) =>
        c.email === msgData.customerEmail || c.phone === msgData.customerEmail
      )
      if (customer) customerId = customer.id
    }

    const { data, error } = await ($supabase as any)
      .from('messages')
      .insert({
        profile_id: user.id,
        customer_id: customerId,
        customer_email: msgData.customerEmail,
        customer_name: msgData.customerName,
        channel: msgData.channel,
        direction: msgData.direction,
        subject: msgData.subject || '',
        body: msgData.body,
        ticket_id: msgData.ticketId || null,
        read: msgData.direction === 'outbound',
        delivered: false,
      })
      .select()
      .single()

    if (error) {
      console.warn('[Messages] Insert error:', error.message)
      return null
    }
    return data
  } catch (err) {
    console.warn('[Messages] Insert failed:', err)
    return null
  }
}

// ── Send email via API ───────────────────────────────────────────────
async function sendEmailApi(to: string, subject: string, body: string) {
  try {
    const resp = await $fetch('/api/send-email', {
      method: 'POST',
      body: { to, subject, body, profileId: currentProfileId.value || undefined },
    })
    return resp as any
  } catch (err: any) {
    console.warn('[Messages] Email API error:', err)
    return { ok: false, delivered: false, error: err.message }
  }
}

// ── Reply send ────────────────────────────────────────────────────────
async function sendReply() {
  if (!replyBody.value.trim() || !selectedThread.value) return

  const msgBody = replyBody.value.trim()
  const thread = selectedThread.value

  // Optimistic UI update
  const localMsg = {
    id: Date.now(),
    from: 'shop',
    body: msgBody,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    channel: replyChannel.value,
    read: false,
  }
  thread.messages.push(localMsg)
  thread.preview = msgBody
  thread.time = 'Just now'
  replyBody.value = ''
  replySubject.value = ''

  // Persist to Supabase
  const inserted = await insertMessage({
    customerEmail: thread.email,
    customerName: thread.name,
    channel: replyChannel.value,
    direction: 'outbound',
    subject: replySubject.value,
    body: msgBody,
    ticketId: thread.ticketId,
  })

  // Update the local message ID if persisted
  if (inserted) localMsg.id = inserted.id

  // Send email if channel is email
  if (replyChannel.value === 'email' && thread.email) {
    const emailResult = await sendEmailApi(
      thread.email,
      replySubject.value || `Re: Message from ${settings.value?.businessName || 'our shop'}`,
      msgBody
    )
    if (emailResult?.delivered) {
      addNotification('Email Sent', `Email delivered to ${thread.name}`, 'success')
    } else {
      addNotification('Message Saved', `${replyChannel.value} saved to ${thread.name} (email delivery not configured)`, 'info')
    }
  } else {
    addNotification('Message Sent', `${replyChannel.value} sent to ${thread.name}`, 'success')
  }

  nextTick(() => scrollToBottom())
}

// ── Compose send ──────────────────────────────────────────────────────
async function sendCompose() {
  if (!compose.value.customerId || !compose.value.body.trim()) return
  const customer = customers.value?.find((c: any) => c.id == compose.value.customerId)
  if (!customer) return

  const msgBody = compose.value.body
  const channel = compose.value.channel

  const msg = {
    id: Date.now(),
    from: 'shop',
    body: msgBody,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    channel,
    read: false,
  }

  const existing = threads.value.find(t => t.email === customer.email)
  if (existing) {
    existing.messages.push(msg)
    existing.preview = msgBody
    existing.time = 'Just now'
    selectedThread.value = existing
  } else {
    const newThread = {
      id: Date.now(),
      name: customer.name,
      email: customer.email || customer.phone || '',
      initials: customer.name?.substring(0, 2).toUpperCase() || '??',
      color: hashColor(customer.email || customer.name || ''),
      channel,
      ticketId: compose.value.ticketId ? Number(compose.value.ticketId) : null,
      unread: false,
      time: 'Just now',
      preview: msgBody,
      messages: [msg],
    }
    threads.value.unshift(newThread)
    selectedThread.value = newThread
  }

  // Persist to Supabase
  const inserted = await insertMessage({
    customerEmail: customer.email || customer.phone || '',
    customerName: customer.name,
    channel,
    direction: 'outbound',
    subject: compose.value.subject,
    body: msgBody,
    ticketId: compose.value.ticketId ? Number(compose.value.ticketId) : null,
  })

  if (inserted) msg.id = inserted.id

  // Send email if channel is email
  if (channel === 'email' && customer.email) {
    const emailResult = await sendEmailApi(
      customer.email,
      compose.value.subject || `Message from ${settings.value?.businessName || 'our shop'}`,
      msgBody
    )
    if (emailResult?.delivered) {
      addNotification('Email Sent', `Email delivered to ${customer.name}`, 'success')
    } else {
      addNotification('Message Saved', `Message saved to ${customer.name} (email delivery not configured)`, 'info')
    }
  } else {
    addNotification('Message Sent', `${channel} sent to ${customer.name}`, 'success')
  }

  compose.value = { customerId: '', ticketId: '', channel: 'email', subject: '', body: '' }
  composeOpen.value = false
  nextTick(() => scrollToBottom())
}

// ── Thread actions ────────────────────────────────────────────────────
function callCustomer() {
  const phone = customers.value?.find((c: any) => c.email === selectedThread.value?.email)?.phone
  if (phone) window.open(`tel:${phone}`)
  else addNotification('No Phone', 'Customer has no phone number on file', 'warning')
}

function archiveThread() {
  if (!selectedThread.value) return
  threads.value = threads.value.filter(t => t.id !== selectedThread.value?.id)
  selectedThread.value = null
  addNotification('Archived', 'Thread archived', 'info')
}

function toggleUnread() {
  if (selectedThread.value) selectedThread.value.unread = !selectedThread.value.unread
}

function deleteThread() {
  if (!selectedThread.value || !confirm('Delete this conversation?')) return
  threads.value = threads.value.filter(t => t.id !== selectedThread.value?.id)
  selectedThread.value = null
}

// ── Compose opener (from query string — called from ticket detail) ──
function openCompose() {
  compose.value = { customerId: '', ticketId: '', channel: 'email', subject: '', body: '' }
  if (route.query.compose) {
    if (route.query.customerId) compose.value.customerId = String(route.query.customerId)
    if (route.query.ticketId) compose.value.ticketId = String(route.query.ticketId)
  }
  composeOpen.value = true
}

const customerTickets = computed(() =>
  compose.value.customerId
    ? (tickets.value ?? []).filter((t: any) => String(t.customerId) === String(compose.value.customerId))
    : []
)

function attachFile() {
  addNotification('Attach File', 'File attachment support coming soon', 'info')
}

function scrollToBottom() {
  if (messagesEl.value) {
    messagesEl.value.scrollTop = messagesEl.value.scrollHeight
  }
}

// ── Realtime subscription for incoming messages ──────────────────────
function setupRealtime() {
  if (!$supabase || !supabaseAvailable.value) return

  ;($supabase as any)
    .channel('messages-realtime')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
    }, (payload: any) => {
      const msg = payload.new
      if (!msg || msg.direction !== 'inbound') return

      // Find or create the thread
      const threadKey = msg.customer_email || msg.customer_name
      const existing = threads.value.find(t => t.email === threadKey)

      const newMsg = {
        id: msg.id,
        from: 'customer',
        body: msg.body,
        time: formatTime(msg.created_at),
        channel: msg.channel,
        read: false,
      }

      if (existing) {
        existing.messages.push(newMsg)
        existing.preview = msg.body?.substring(0, 100) || ''
        existing.time = 'Just now'
        existing.unread = true
      } else {
        threads.value.unshift({
          id: threadKey,
          name: msg.customer_name || threadKey,
          email: threadKey,
          initials: (msg.customer_name || threadKey).substring(0, 2).toUpperCase(),
          color: hashColor(threadKey),
          channel: msg.channel,
          ticketId: msg.ticket_id,
          unread: true,
          time: 'Just now',
          preview: msg.body?.substring(0, 100) || '',
          messages: [newMsg],
        })
      }

      if (notificationPrefs.value.newMessage) {
        addNotification('New Message', `${msg.customer_name || 'Customer'}: ${msg.body?.substring(0, 50)}…`, 'info')
      }
    })
    .subscribe()
}

// ── Initialize ───────────────────────────────────────────────────────
onMounted(async () => {
  await loadMessages()
  await checkGmailConnection()
  // Auto-sync inbox on page load if Gmail is connected
  if (gmailConnected.value) {
    syncGmailInbox()
  }
  setupRealtime()
  if (route.query.compose) openCompose()
})
</script>

<style scoped>
/* ── Notification Bell ───────────────────────────────────────────── */
.notif-bell-btn {
  position: relative;
  width: 42px; height: 42px;
  border-radius: 18px;
  display: flex; align-items: center; justify-content: center;
  background: hsl(var(--muted)/0.5);
  border: 2px solid hsl(var(--border)/0.6);
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  color: hsl(var(--muted-foreground));
}
.notif-bell-btn:hover { background: hsl(var(--muted)/0.8); color: hsl(var(--foreground)); transform: scale(1.05); }
.notif-bell-btn.active { background: #f59e0b18; border-color: #f59e0b40; color: #f59e0b; }
.notif-badge {
  position: absolute; top: -4px; right: -4px;
  min-width: 18px; height: 18px;
  border-radius: 99px;
  background: #ef4444;
  color: white;
  font-size: 9px; font-weight: 900;
  display: flex; align-items: center; justify-content: center;
  padding: 0 4px;
  border: 2px solid hsl(var(--card));
  animation: notif-pop 0.3s cubic-bezier(0.34,1.56,0.64,1);
}
@keyframes notif-pop { from { transform: scale(0); } to { transform: scale(1); } }

.notif-panel {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  width: 360px;
  border-radius: 24px;
  background: hsl(var(--popover));
  border: 1.5px solid hsl(var(--border)/0.7);
  box-shadow: 0 20px 60px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.08);
  overflow: hidden;
  z-index: 100;
  transform-origin: top right;
}
.notif-panel-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid hsl(var(--border)/0.5);
  background: hsl(var(--muted)/0.2);
}
.notif-list {
  max-height: 420px;
  overflow-y: auto;
  padding: 6px;
}
.notif-list::-webkit-scrollbar { width: 3px; }
.notif-list::-webkit-scrollbar-thumb { background: hsl(var(--border)); border-radius: 99px; }
.notif-empty {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 40px 20px;
  color: hsl(var(--muted-foreground));
}
.notif-item {
  display: flex; align-items: flex-start; gap: 10px;
  padding: 10px 12px;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.15s;
  margin-bottom: 2px;
  position: relative;
}
.notif-item:hover { background: hsl(var(--muted)/0.5); }
.notif-item.unread { background: hsl(var(--muted)/0.3); }
.notif-item.unread::before {
  content: '';
  position: absolute; left: 4px; top: 50%; transform: translateY(-50%);
  width: 5px; height: 5px; border-radius: 50%;
  background: #ec4899;
}
.notif-item-icon {
  width: 28px; height: 28px; border-radius: 12px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
}
.notif-item-icon.info    { background: #3b82f620; color: #3b82f6; }
.notif-item-icon.success { background: #10b98120; color: #10b981; }
.notif-item-icon.warning { background: #f59e0b20; color: #f59e0b; }
.notif-item-icon.error   { background: #ef444420; color: #ef4444; }
.notif-dismiss {
  width: 24px; height: 24px; border-radius: 8px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  background: none; border: none; cursor: pointer;
  color: hsl(var(--muted-foreground)); opacity: 0;
  transition: all 0.2s;
}
.notif-item:hover .notif-dismiss { opacity: 1; }
.notif-dismiss:hover { background: hsl(var(--muted)/0.8); color: hsl(var(--foreground)); }

/* Bell dropdown transition */
.notif-drop-enter-active { transition: all 0.25s cubic-bezier(0.34,1.56,0.64,1); }
.notif-drop-leave-active  { transition: all 0.15s ease; }
.notif-drop-enter-from    { opacity: 0; transform: scale(0.92) translateY(-6px); }
.notif-drop-leave-to      { opacity: 0; transform: scale(0.96) translateY(-4px); }

/* Notification item list transition */
.notif-item-enter-active  { transition: all 0.25s cubic-bezier(0.34,1.56,0.64,1); }
.notif-item-leave-active  { transition: all 0.15s ease; }
.notif-item-enter-from    { opacity: 0; transform: translateX(16px); }
.notif-item-leave-to      { opacity: 0; transform: translateX(-8px); }


.msg-fab { transition:transform 0.4s cubic-bezier(0.34,1.56,0.64,1),box-shadow 0.3s; }
.msg-fab:hover { transform:scale(1.05) translateY(-2px); }
.msg-fab:active { transform:scale(0.92); }

.msg-layout { display:grid;grid-template-columns:320px 1fr;gap:16px;height:calc(100vh - 340px);min-height:500px; }
@media (max-width: 768px) { .msg-layout { grid-template-columns:1fr;height:auto; } }

.msg-sidebar { display:flex;flex-direction:column;border-radius:28px;background:hsl(var(--card));outline:2px solid hsl(var(--border)/0.6);outline-offset:0;overflow:hidden; }

.msg-thread-item { display:flex;align-items:flex-start;gap:12px;padding:14px 16px;cursor:pointer;border-bottom:1px solid hsl(var(--border)/0.3);transition:all 0.15s; }
.msg-thread-item:hover { background:hsl(var(--accent)/0.5); }
.msg-thread-item.active { background:hsl(var(--accent)); }
.msg-thread-item.unread .msg-avatar { box-shadow:0 0 0 2px #ec4899; }

.msg-avatar { width:40px;height:40px;border-radius:18px;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:900;flex-shrink:0; }
.msg-avatar-lg { width:44px;height:44px;border-radius:20px;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:900;flex-shrink:0; }

.msg-pane { display:flex;flex-direction:column;border-radius:28px;background:hsl(var(--card));outline:2px solid hsl(var(--border)/0.6);outline-offset:0;overflow:hidden; }
.msg-pane-header { display:flex;align-items:center;gap:12px;padding:16px 20px;border-bottom:1px solid hsl(var(--border)/0.5);flex-shrink:0; }
.msg-icon-btn { width:36px;height:36px;border-radius:14px;display:flex;align-items:center;justify-content:center;color:hsl(var(--muted-foreground));transition:all 0.2s;background:none;border:none;cursor:pointer; }
.msg-icon-btn:hover { background:hsl(var(--accent));color:hsl(var(--foreground));transform:scale(1.1); }

.msg-ticket-banner { margin:12px 16px 0;padding:12px 16px;border-radius:16px;background:#f59e0b10;border:1.5px solid #f59e0b30; }

.msg-messages-area { flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:12px; }

.msg-bubble-row { display:flex; }
.msg-bubble-row.outbound { justify-content:flex-end; }
.msg-bubble-row.inbound { justify-content:flex-start; }
.msg-bubble { max-width:70%;padding:12px 16px;border-radius:20px;line-height:1.5; }
.msg-bubble.outbound { background:linear-gradient(135deg,#ec4899,#db2777);color:white;border-bottom-right-radius:6px; }
.msg-bubble.inbound { background:hsl(var(--muted)/0.6);border-bottom-left-radius:6px; }

.msg-reply-area { padding:16px;border-top:1px solid hsl(var(--border)/0.5);flex-shrink:0; }
.msg-textarea { width:100%;padding:12px 52px 12px 14px;border-radius:18px;font-size:13px;font-weight:500;resize:none;background:hsl(var(--muted)/0.4);border:2px solid hsl(var(--border)/0.6);outline:none;transition:all 0.2s;color:hsl(var(--foreground));font-family:inherit;line-height:1.6; }
.msg-textarea:focus { border-color:#ec4899;box-shadow:0 0 0 3px #ec489918; }
.msg-textarea-btn { position:absolute;padding:6px;border-radius:10px;color:hsl(var(--muted-foreground));background:none;border:none;cursor:pointer;transition:all 0.2s; }
.msg-textarea-btn:hover { color:hsl(var(--foreground));background:hsl(var(--accent)); }
.msg-send-btn { width:44px;height:44px;border-radius:18px;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#ec4899,#db2777);color:white;border:none;cursor:pointer;flex-shrink:0;transition:all 0.3s cubic-bezier(0.34,1.56,0.64,1);align-self:flex-end; }
.msg-send-btn:not(:disabled):hover { transform:scale(1.1); }
.msg-send-btn:disabled { opacity:0.4;cursor:not-allowed; }

.m3-label { display:block;font-size:10px;font-weight:800;color:hsl(var(--muted-foreground));text-transform:uppercase;letter-spacing:0.12em;margin-bottom:0.5rem; }
.compose-select { width:100%;height:44px;padding:0 12px;border-radius:18px;font-size:13px;font-weight:500;background:hsl(var(--muted)/0.5);border:2px solid hsl(var(--border)/0.7);outline:none;transition:border 0.2s;color:hsl(var(--foreground)); }
.compose-select:focus { border-color:#ec4899; }
.compose-input { width:100%;height:44px;padding:0 16px;border-radius:18px;font-size:13px;font-weight:500;background:hsl(var(--muted)/0.5);border:2px solid hsl(var(--border)/0.7);outline:none;transition:border 0.2s;color:hsl(var(--foreground)); }
.compose-input:focus { border-color:#ec4899; }
.compose-textarea { width:100%;padding:12px 14px;border-radius:18px;font-size:13px;font-weight:500;resize:none;background:hsl(var(--muted)/0.5);border:2px solid hsl(var(--border)/0.7);outline:none;transition:border 0.2s;color:hsl(var(--foreground));font-family:inherit;line-height:1.6; }
.compose-textarea:focus { border-color:#ec4899; }
</style>
