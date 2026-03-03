<template>
  <div class="bm-root">

    <!-- Loading overlay -->
    <div v-if="bm.loading.value" class="bm-loading-overlay">
      <div class="bm-loading-spinner" />
      <p class="text-sm font-bold mt-3" style="color:hsl(var(--muted-foreground))">Loading Brand Manager…</p>
    </div>

    <!-- ══════════ PAGE HEADER ══════════ -->
    <div class="bm-header">
      <div class="flex items-center gap-4">
        <div class="bm-logo-wrap">
          <Sparkles class="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 class="text-3xl font-black tracking-tight">Brand Manager</h1>
          <p class="text-sm font-medium mt-0.5" style="color:hsl(var(--muted-foreground))">
            Social media, reviews, customer portal &amp; online presence
          </p>
        </div>
      </div>
      <div class="bm-live-badge">
        <span class="bm-live-dot" />
        <span class="text-xs font-black tracking-wide" style="color:#4ade80">REALTIME</span>
      </div>
    </div>

    <!-- ══════════ TAB BAR ══════════ -->
    <div class="bm-tabs">
      <button v-for="tab in tabs" :key="tab.id"
        class="bm-tab" :class="{ active: activeTab === tab.id }"
        @click="activeTab = tab.id">
        <component :is="tab.icon" class="w-4 h-4" />
        {{ tab.label }}
        <span v-if="tab.badge" class="bm-tab-badge" :style="`background:${tab.badgeColor}22;color:${tab.badgeColor}`">
          {{ tab.badge }}
        </span>
      </button>
    </div>

    <!-- ══════════ SOCIAL HUB TAB ══════════ -->
    <template v-if="activeTab === 'social'">

      <div class="bm-section-label">Platform Connections</div>

      <!-- Setup warning: shown when ALL platforms lack App ID env vars -->
      <div v-if="PLATFORMS.every(p => !bm.isPlatformConfigured(p.id))"
        class="flex items-start gap-3 rounded-2xl border p-4 mb-2"
        style="background:#f59e0b08;border-color:#f59e0b30">
        <AlertCircle class="w-4 h-4 mt-0.5 flex-shrink-0" style="color:#f59e0b" />
        <div>
          <p class="text-sm font-black" style="color:#f59e0b">Social OAuth Not Configured</p>
          <p class="text-xs font-medium mt-0.5" style="color:hsl(var(--muted-foreground))">
            Add your platform App IDs to <code class="bg-muted px-1 rounded text-[11px]">.env</code> and restart the server.
            Required keys: <code class="bg-muted px-1 rounded text-[11px]">NUXT_PUBLIC_FB_APP_ID</code>,
            <code class="bg-muted px-1 rounded text-[11px]">NUXT_PUBLIC_GOOGLE_CLIENT_ID</code>,
            <code class="bg-muted px-1 rounded text-[11px]">NUXT_PUBLIC_IG_APP_ID</code>,
            <code class="bg-muted px-1 rounded text-[11px]">NUXT_PUBLIC_YELP_CLIENT_ID</code>.
            See <code class="bg-muted px-1 rounded text-[11px]">.env.example</code> for details.
          </p>
        </div>
      </div>
      <div class="bm-platform-grid">
        <div v-for="platform in PLATFORMS" :key="platform.id"
          class="bm-platform-card"
          :class="{ connected: connectionFor(platform.id)?.connected }"
          :style="connectionFor(platform.id)?.connected ? `border-color:${platform.color}50;background:${platform.color}06` : ''">

          <div class="flex items-start justify-between mb-4">
            <div class="flex items-center gap-3">
              <div class="bm-plat-icon" :style="`background:${platform.color};box-shadow:0 4px 14px ${platform.color}50`">
                <component :is="platform.icon" class="w-5 h-5 text-white" />
              </div>
              <div>
                <p class="text-sm font-black">{{ platform.name }}</p>
                <p class="text-[10px] font-semibold" style="color:hsl(var(--muted-foreground))">
                  {{ connectionFor(platform.id)?.handle || 'Not connected' }}
                </p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span v-if="connectionFor(platform.id)?.connected" class="bm-conn-badge">
                <span class="bm-conn-dot" :style="`background:${platform.color}`" />
                Live
              </span>
              <button class="bm-plat-btn"
                :disabled="connectingPlatform === platform.id || !bm.isPlatformConfigured(platform.id)"
                :title="!bm.isPlatformConfigured(platform.id) ? `Add the ${platform.name} App ID env var to enable this integration` : ''"
                :style="connectionFor(platform.id)?.connected
                  ? 'background:hsl(var(--muted)/0.5);color:hsl(var(--muted-foreground))'
                  : !bm.isPlatformConfigured(platform.id)
                    ? 'background:hsl(var(--muted)/0.4);color:hsl(var(--muted-foreground));opacity:0.7;cursor:not-allowed'
                  : `background:${platform.color}22;color:${platform.color}`"
                @click="handlePlatformToggle(platform)">
                <span v-if="connectingPlatform === platform.id" class="bm-btn-spinner" />
                <template v-else>
                  {{ connectionFor(platform.id)?.connected ? 'Disconnect' : !bm.isPlatformConfigured(platform.id) ? 'Setup Required' : 'Connect' }}
                </template>
              </button>
            </div>
          </div>

          <!-- Stats when connected -->
          <div v-if="connectionFor(platform.id)?.connected" class="bm-plat-stats">
            <template v-if="connectionFor(platform.id)?.meta">
              <div v-for="(val, key) in connectionFor(platform.id)?.meta" :key="key" class="bm-plat-stat">
                <p class="text-[10px] font-bold" style="color:hsl(var(--muted-foreground))">{{ formatMetaKey(String(key)) }}</p>
                <p class="text-sm font-black" :style="`color:${platform.color}`">{{ val }}</p>
              </div>
            </template>
            <p v-else class="text-[10px] font-medium col-span-2" style="color:hsl(var(--muted-foreground))">
              Sync in progress…
            </p>
          </div>
          <div v-else class="bm-plat-connect-cta">
            <p class="text-xs font-medium" style="color:hsl(var(--muted-foreground))">
              {{ platform.description }}
            </p>
          </div>
        </div>
      </div>

      <!-- ── Compose & Schedule ──────────────────────────────── -->
      <div class="bm-section-label" style="margin-top:4px">Compose &amp; Schedule</div>
      <div class="bm-compose-card">
        <div class="bm-compose-header">
          <Edit3 class="w-4 h-4" style="color:hsl(var(--muted-foreground))" />
          <span class="text-sm font-black">New Post</span>

          <!-- Platform target toggles (only connected ones) -->
          <div class="flex gap-2 ml-auto flex-wrap">
            <span v-if="bm.activeConnections.value.length === 0" class="text-xs font-medium" style="color:hsl(var(--muted-foreground))">
              Connect a platform to post
            </span>
            <button v-for="conn in bm.activeConnections.value" :key="conn.platform"
              class="bm-plat-toggle-btn"
              :class="{ active: postTargets.includes(conn.platform) }"
              :style="postTargets.includes(conn.platform) ? `background:${platformColor(conn.platform)}22;color:${platformColor(conn.platform)};border-color:${platformColor(conn.platform)}50` : ''"
              @click="togglePostTarget(conn.platform)">
              <component :is="platformIcon(conn.platform)" class="w-3.5 h-3.5" />
              {{ platformName(conn.platform) }}
            </button>
          </div>
        </div>

        <div class="bm-compose-body">
          <textarea v-model="postText"
            class="bm-compose-textarea"
            placeholder="What's happening at the shop? Share a repair success, promotion, or tip…"
            rows="3" />
          <div class="bm-compose-char" :style="postText.length > 260 ? 'color:#ef4444' : ''">
            {{ postText.length }} / 280
          </div>

          <div class="flex items-center gap-2 mt-3 flex-wrap">
            <button class="bm-compose-action-btn" :class="{ 'bm-btn-active': showScheduler }" @click="showScheduler = !showScheduler">
              <Clock class="w-4 h-4" /> Schedule
            </button>
            <button class="bm-compose-action-btn" @click="insertTemplate">
              <Zap class="w-4 h-4" /> Template
            </button>
            <div v-if="showScheduler" class="flex items-center gap-2 ml-1">
              <input type="datetime-local" v-model="scheduledTime" class="bm-schedule-input" />
            </div>
            <button class="bm-post-btn ml-auto"
              :disabled="posting || !postText.trim() || postTargets.length === 0"
              @click="submitPost">
              <span v-if="posting" class="bm-btn-spinner" style="border-top-color:white" />
              <template v-else>
                <Send class="w-4 h-4" />
                {{ scheduledTime ? 'Schedule' : 'Post Now' }}
              </template>
            </button>
          </div>
        </div>

        <div v-if="postTargets.length > 0" class="bm-post-targets-row">
          <span class="text-[10px] font-bold" style="color:hsl(var(--muted-foreground))">POSTING TO:</span>
          <span v-for="pid in postTargets" :key="pid" class="bm-target-chip"
            :style="`background:${platformColor(pid)}22;color:${platformColor(pid)};border-color:${platformColor(pid)}40`">
            <component :is="platformIcon(pid)" class="w-3 h-3" />
            {{ platformName(pid) }}
          </span>
        </div>
      </div>

      <!-- ── Scheduled / Draft Posts ─────────────────────────── -->
      <div v-if="bm.posts.value.length > 0">
        <div class="bm-section-label">Scheduled Posts</div>
        <div class="space-y-3">
          <div v-for="post in bm.posts.value" :key="post.id" class="bm-scheduled-row">
            <div class="flex items-center gap-3 flex-1 min-w-0">
              <div class="bm-sched-time-badge">
                <Clock class="w-3 h-3" />
                {{ post.scheduled_for ? formatTime(post.scheduled_for) : 'Draft' }}
              </div>
              <p class="text-sm font-medium truncate">{{ post.content }}</p>
            </div>
            <div class="flex items-center gap-2 flex-shrink-0">
              <span v-for="pid in post.targets" :key="pid"
                class="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                :style="`background:${platformColor(pid)}`">
                <component :is="platformIcon(pid)" class="w-3 h-3 text-white" />
              </span>
              <button class="bm-icon-btn" style="color:#ef4444" @click="bm.deletePost(post.id)">
                <X class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

    </template>

    <!-- ══════════ INTERACTIONS TAB ══════════ -->
    <template v-if="activeTab === 'interactions'">

      <div class="flex items-center gap-3 flex-wrap">
        <div class="relative">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style="color:hsl(var(--muted-foreground))" />
          <input v-model="interactionSearch" placeholder="Search interactions…" class="bm-search-input" />
        </div>
        <div class="flex gap-2 flex-wrap">
          <button v-for="f in interactionFilters" :key="f.label"
            class="bm-filter-btn" :class="{ active: interactionFilter === f.label }"
            :style="interactionFilter === f.label ? `background:${f.color}22;color:${f.color};border-color:${f.color}50` : ''"
            @click="interactionFilter = f.label">
            <component :is="f.icon" class="w-3.5 h-3.5" />
            {{ f.label }}
            <span v-if="f.count > 0" class="bm-count-badge" :style="`background:${f.color}22;color:${f.color}`">{{ f.count }}</span>
          </button>
        </div>
        <button class="bm-refresh-btn ml-auto" @click="refreshInteractions">
          <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': refreshing }" />
          Refresh
        </button>
      </div>

      <!-- Add manual interaction (for testing / manual logging) -->
      <div v-if="showAddInteraction" class="bm-compose-card">
        <div class="bm-compose-header">
          <Plus class="w-4 h-4" style="color:hsl(var(--muted-foreground))" />
          <span class="text-sm font-black">Log Interaction Manually</span>
          <button class="ml-auto bm-icon-btn" @click="showAddInteraction = false"><X class="w-4 h-4" /></button>
        </div>
        <div class="bm-compose-body space-y-3">
          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1"><label class="bm-label">Platform</label>
              <select v-model="newInteraction.platform" class="bm-input">
                <option v-for="p in PLATFORMS" :key="p.id" :value="p.id">{{ p.name }}</option>
              </select>
            </div>
            <div class="space-y-1"><label class="bm-label">Type</label>
              <select v-model="newInteraction.type" class="bm-input">
                <option>Review</option><option>Comment</option><option>Message</option>
              </select>
            </div>
            <div class="space-y-1"><label class="bm-label">Author Name</label>
              <input v-model="newInteraction.author_name" class="bm-input" placeholder="John D." />
            </div>
            <div class="space-y-1"><label class="bm-label">Rating (1–5)</label>
              <input v-model.number="newInteraction.rating" type="number" min="1" max="5" class="bm-input" placeholder="Optional" />
            </div>
          </div>
          <div class="space-y-1"><label class="bm-label">Content</label>
            <textarea v-model="newInteraction.content" rows="3" class="bm-input resize-none" style="height:auto;padding-top:12px" placeholder="Paste or type the review/comment text…" />
          </div>
          <div class="space-y-1"><label class="bm-label">Original URL (optional)</label>
            <input v-model="newInteraction.url" class="bm-input" placeholder="https://…" />
          </div>
          <button class="bm-post-btn" :disabled="!newInteraction.content.trim() || !newInteraction.author_name.trim() || savingInteraction" @click="saveNewInteraction">
            <span v-if="savingInteraction" class="bm-btn-spinner" style="border-top-color:white" />
            <template v-else><Plus class="w-4 h-4" /> Save Interaction</template>
          </button>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <button v-if="!showAddInteraction" class="bm-compose-action-btn" @click="showAddInteraction = true">
          <Plus class="w-4 h-4" /> Log Manually
        </button>
      </div>

      <!-- Interaction feed -->
      <div class="space-y-3">
        <div v-for="item in filteredInteractions" :key="item.id"
          class="bm-interaction-card"
          :class="{ unread: item.unread }"
          :style="item.unread ? `border-left-color:${platformColor(item.platform)}` : ''">

          <div class="flex items-start gap-3">
            <div class="bm-interaction-avatar" :style="`background:${avatarColor(item.author_name)}22;color:${avatarColor(item.author_name)}`">
              {{ initials(item.author_name) }}
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="text-sm font-black">{{ item.author_name }}</span>
                <span class="bm-platform-chip" :style="`background:${platformColor(item.platform)}18;color:${platformColor(item.platform)}`">
                  <component :is="platformIcon(item.platform)" class="w-3 h-3" />
                  {{ platformName(item.platform) }}
                </span>
                <span class="bm-type-chip" :style="`background:${typeColor(item.type)}18;color:${typeColor(item.type)}`">{{ item.type }}</span>
                <div v-if="item.rating" class="flex gap-0.5 ml-1">
                  <span v-for="i in 5" :key="i" class="text-xs" :style="i <= item.rating ? 'color:#f59e0b' : 'color:hsl(var(--muted-foreground))'">★</span>
                </div>
                <span class="text-[10px] ml-auto font-medium" style="color:hsl(var(--muted-foreground))">{{ timeAgo(item.interaction_at) }}</span>
                <span v-if="item.unread" class="w-2 h-2 rounded-full flex-shrink-0" style="background:#ec4899" />
              </div>
              <p class="text-sm mt-1.5 leading-relaxed">{{ item.content }}</p>
              <div class="flex items-center gap-3 mt-2">
                <div class="bm-sentiment" :style="`color:${sentimentColor(item.sentiment)}`">
                  <component :is="sentimentIcon(item.sentiment)" class="w-3 h-3" />
                  <span class="text-[10px] font-bold capitalize">{{ item.sentiment }}</span>
                </div>
                <span v-if="item.likes" class="text-[10px] font-medium" style="color:hsl(var(--muted-foreground))">{{ item.likes }} likes</span>
              </div>
            </div>
          </div>

          <!-- Our reply (saved) -->
          <div v-if="item.our_reply" class="bm-our-reply">
            <div class="flex items-center gap-2 mb-1">
              <div class="w-5 h-5 rounded-full flex items-center justify-center" style="background:linear-gradient(135deg,#6366f1,#8b5cf6)">
                <Sparkles class="w-2.5 h-2.5 text-white" />
              </div>
              <span class="text-[10px] font-black" style="color:#6366f1">Our Reply</span>
              <span class="text-[10px]" style="color:hsl(var(--muted-foreground))">
                · {{ item.reply_posted_at ? timeAgo(item.reply_posted_at) : 'Saved, not yet posted' }}
              </span>
              <span v-if="item.reply_posted_at" class="text-[10px] font-bold px-2 py-0.5 rounded-full" style="background:#10b98118;color:#10b981">
                Posted to {{ item.reply_posted_at }}
              </span>
            </div>
            <p class="text-xs">{{ item.our_reply }}</p>
          </div>

          <div class="bm-interaction-actions">
            <button class="bm-reply-btn" @click="startReply(item)">
              <component :is="item.our_reply ? Edit3 : MessageCircle" class="w-3.5 h-3.5" />
              {{ item.our_reply ? 'Edit Reply' : 'Reply' }}
            </button>
            <button class="bm-action-btn" :style="item.starred ? 'color:#f59e0b' : ''" @click="bm.toggleStar(item)">
              <Star class="w-3.5 h-3.5" :fill="item.starred ? '#f59e0b' : 'none'" />
            </button>
            <button class="bm-action-btn" title="Mark read" @click="bm.markRead(item.id)">
              <Check class="w-3.5 h-3.5" />
            </button>
            <button class="bm-action-btn" style="color:#ef4444" title="Archive" @click="bm.archiveInteraction(item.id)">
              <Archive class="w-3.5 h-3.5" />
            </button>
            <a v-if="item.url" :href="item.url" target="_blank" class="bm-action-btn ml-auto" title="View original">
              <ExternalLink class="w-3.5 h-3.5" />
            </a>
          </div>

          <!-- Reply composer -->
          <div v-if="replyingToId === item.id" class="bm-reply-composer">
            <div class="bm-ai-suggestions">
              <Sparkles class="w-3 h-3 flex-shrink-0" style="color:#8b5cf6" />
              <span class="text-[10px] font-black" style="color:#8b5cf6">Suggestions:</span>
              <button v-for="sug in replySuggestions(item)" :key="sug"
                class="bm-suggestion-chip" @click="replyText = sug">
                {{ sug.substring(0, 42) }}{{ sug.length > 42 ? '…' : '' }}
              </button>
            </div>
            <textarea v-model="replyText" class="bm-reply-textarea mt-2"
              :placeholder="`Reply on ${platformName(item.platform)}…`" rows="2"
              @keydown.ctrl.enter.prevent="submitReply(item)"
              @keydown.meta.enter.prevent="submitReply(item)" />
            <div class="flex items-center gap-2 mt-2">
              <span class="text-[10px]" style="color:hsl(var(--muted-foreground))">{{ replyText.length }} chars · ⌘↵ to save</span>
              <button class="bm-cancel-btn ml-auto" @click="replyingToId = null; replyText = ''">Cancel</button>
              <button class="bm-submit-reply-btn" :disabled="!replyText.trim() || postingReply" @click="submitReply(item)">
                <span v-if="postingReply" class="bm-btn-spinner" style="border-top-color:white" />
                <template v-else><Save class="w-3.5 h-3.5" /> Save Reply</template>
              </button>
            </div>
          </div>
        </div>

        <div v-if="filteredInteractions.length === 0 && !bm.loading.value" class="bm-empty-state">
          <div class="bm-empty-icon"><MessageCircle class="w-8 h-8" style="opacity:0.4" /></div>
          <p class="font-black text-sm mt-3">No interactions yet</p>
          <p class="text-xs mt-1" style="color:hsl(var(--muted-foreground))">
            Connect platforms above, or log interactions manually.
          </p>
        </div>
      </div>

    </template>

    <!-- ══════════ ANALYTICS TAB ══════════ -->
    <template v-if="activeTab === 'analytics'">

      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div v-for="stat in analyticsStats" :key="stat.label"
          class="bm-stat-card" :style="`background:${stat.color}0d;border-color:${stat.color}28`">
          <div class="flex items-center justify-between mb-3">
            <div class="bm-stat-icon" :style="`background:${stat.color}22;color:${stat.color}`">
              <component :is="stat.icon" class="w-4 h-4" />
            </div>
          </div>
          <p class="text-[10px] font-bold" style="color:hsl(var(--muted-foreground))">{{ stat.label }}</p>
          <p class="text-2xl font-black mt-1" :style="`color:${stat.color}`">{{ stat.value }}</p>
          <p class="text-[10px] mt-1 font-medium" style="color:hsl(var(--muted-foreground))">{{ stat.sub }}</p>
        </div>
      </div>

      <!-- Rating distribution -->
      <div class="bm-section-label">Rating Breakdown</div>
      <div class="bm-settings-card">
        <div class="p-6 space-y-3">
          <div v-for="star in [5,4,3,2,1]" :key="star" class="flex items-center gap-3">
            <div class="flex gap-0.5 flex-shrink-0" style="width:60px">
              <span v-for="i in 5" :key="i" class="text-xs" :style="i <= star ? 'color:#f59e0b' : 'color:hsl(var(--muted-foreground))'">★</span>
            </div>
            <div class="bm-bar-track flex-1">
              <div class="bm-bar-fill" :style="`width:${ratingPct(star)}%;background:#f59e0b`" />
            </div>
            <span class="text-xs font-black w-6 text-right" style="color:#f59e0b;flex-shrink:0">{{ ratingCount(star) }}</span>
          </div>
          <p v-if="reviewInteractions.length === 0" class="text-xs text-center py-4" style="color:hsl(var(--muted-foreground))">No reviews logged yet.</p>
        </div>
      </div>

      <!-- Connected platform overview -->
      <div class="bm-section-label">Platform Overview</div>
      <div class="space-y-3">
        <div v-for="conn in bm.activeConnections.value" :key="conn.id" class="bm-perf-row">
          <div class="flex items-center gap-3" style="width:160px;flex-shrink:0">
            <div class="w-8 h-8 rounded-[14px] flex items-center justify-center" :style="`background:${platformColor(conn.platform)}`">
              <component :is="platformIcon(conn.platform)" class="w-4 h-4 text-white" />
            </div>
            <span class="text-sm font-black">{{ platformName(conn.platform) }}</span>
          </div>
          <div class="flex-1">
            <div class="flex items-center gap-4 flex-wrap">
              <div v-for="(val, key) in conn.meta" :key="key" class="bm-plat-stat" style="min-width:80px">
                <p class="text-[10px] font-bold" style="color:hsl(var(--muted-foreground))">{{ formatMetaKey(String(key)) }}</p>
                <p class="text-sm font-black" :style="`color:${platformColor(conn.platform)}`">{{ val }}</p>
              </div>
              <div class="bm-plat-stat">
                <p class="text-[10px] font-bold" style="color:hsl(var(--muted-foreground))">Last Sync</p>
                <p class="text-xs font-semibold" :style="`color:${platformColor(conn.platform)}`">{{ conn.last_synced_at ? timeAgo(conn.last_synced_at) : 'Never' }}</p>
              </div>
            </div>
          </div>
        </div>
        <div v-if="bm.activeConnections.value.length === 0" class="bm-empty-state">
          <div class="bm-empty-icon"><BarChart3 class="w-8 h-8" style="opacity:0.4" /></div>
          <p class="font-black text-sm mt-3">No platforms connected</p>
          <p class="text-xs mt-1" style="color:hsl(var(--muted-foreground))">Connect platforms in the Social Hub tab to see analytics here.</p>
        </div>
      </div>
    </template>

    <!-- ══════════ WEBSITE / PORTAL TAB ══════════ -->
    <template v-if="activeTab === 'website'">

      <!-- Customer Portal -->
      <div class="bm-settings-card">
        <div class="bm-settings-card-header" style="background:#f59e0b08">
          <div class="bm-settings-icon" style="background:linear-gradient(135deg,#f59e0b,#d97706)">
            <Globe class="w-5 h-5 text-white" />
          </div>
          <div class="flex-1">
            <p class="text-sm font-black">Customer Portal</p>
            <p class="text-xs font-medium" style="color:hsl(var(--muted-foreground))">Let customers check repair status online</p>
          </div>
          <button class="bm-toggle" :class="{ active: bm.settings.value.portal_enabled }" @click="bm.settings.value.portal_enabled = !bm.settings.value.portal_enabled">
            <span class="bm-toggle-thumb"><component :is="bm.settings.value.portal_enabled ? Check : X" class="w-3 h-3" /></span>
          </button>
        </div>
        <div class="p-6 space-y-4">
          <div class="space-y-2">
            <label class="bm-label">Portal URL Slug</label>
            <div class="flex items-center gap-2">
              <span class="text-sm font-medium" style="color:hsl(var(--muted-foreground))">novaops.app/</span>
              <input v-model="bm.settings.value.portal_slug" placeholder="your-shop" class="bm-input flex-1" />
            </div>
          </div>
          <div class="space-y-2">
            <label class="bm-label">Welcome Message</label>
            <textarea v-model="bm.settings.value.welcome_message" rows="2" class="bm-input resize-none" style="height:auto;padding-top:12px"
              placeholder="Welcome! Enter your ticket ID to check your repair status." />
          </div>
        </div>
      </div>

      <!-- Online Booking -->
      <div class="bm-settings-card">
        <div class="bm-settings-card-header" style="background:#8b5cf608">
          <div class="bm-settings-icon" style="background:linear-gradient(135deg,#8b5cf6,#7c3aed)">
            <Calendar class="w-5 h-5 text-white" />
          </div>
          <div class="flex-1">
            <p class="text-sm font-black">Online Booking</p>
            <p class="text-xs font-medium" style="color:hsl(var(--muted-foreground))">Allow customers to book appointments online</p>
          </div>
          <button class="bm-toggle" :class="{ active: bm.settings.value.booking_enabled }" @click="bm.settings.value.booking_enabled = !bm.settings.value.booking_enabled">
            <span class="bm-toggle-thumb"><component :is="bm.settings.value.booking_enabled ? Check : X" class="w-3 h-3" /></span>
          </button>
        </div>
        <div v-if="bm.settings.value.booking_enabled" class="p-6 grid grid-cols-2 gap-4">
          <div class="space-y-2"><label class="bm-label">Open Time</label><input v-model="bm.settings.value.booking_open" type="time" class="bm-input" /></div>
          <div class="space-y-2"><label class="bm-label">Close Time</label><input v-model="bm.settings.value.booking_close" type="time" class="bm-input" /></div>
          <div class="col-span-2 space-y-2">
            <label class="bm-label">Slot Duration</label>
            <div class="flex gap-2">
              <button v-for="d in [15,30,60]" :key="d"
                class="px-5 py-2.5 rounded-full text-xs font-black transition-all hover:scale-105"
                :style="bm.settings.value.slot_duration === d ? 'background:#8b5cf624;color:#8b5cf6;outline:2px solid #8b5cf650;outline-offset:0' : 'background:hsl(var(--muted)/0.5);color:hsl(var(--muted-foreground))'"
                @click="bm.settings.value.slot_duration = d">{{ d }} min</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Auto-response rules -->
      <div class="bm-settings-card">
        <div class="bm-settings-card-header" style="background:#10b98108">
          <div class="bm-settings-icon" style="background:linear-gradient(135deg,#10b981,#059669)">
            <Zap class="w-5 h-5 text-white" />
          </div>
          <div class="flex-1">
            <p class="text-sm font-black">Auto-Response Rules</p>
            <p class="text-xs font-medium" style="color:hsl(var(--muted-foreground))">Automatically reply to reviews based on triggers</p>
          </div>
          <button class="bm-toggle" :class="{ active: bm.settings.value.auto_response_enabled }" @click="bm.settings.value.auto_response_enabled = !bm.settings.value.auto_response_enabled">
            <span class="bm-toggle-thumb"><component :is="bm.settings.value.auto_response_enabled ? Check : X" class="w-3 h-3" /></span>
          </button>
        </div>
        <div v-if="bm.settings.value.auto_response_enabled" class="p-6 space-y-3">
          <div v-for="rule in bm.rules.value" :key="rule.id"
            class="flex items-start gap-3 p-4 rounded-[18px]" style="background:hsl(var(--muted)/0.3)">
            <div class="flex-1 min-w-0">
              <p class="text-xs font-black">{{ ruleTriggerLabel(rule) }}</p>
              <p class="text-[10px] font-medium mt-0.5" style="color:hsl(var(--muted-foreground))">{{ rule.response_text.substring(0, 70) }}…</p>
            </div>
            <button class="bm-toggle-small" :class="{ active: rule.enabled }" @click="rule.enabled = !rule.enabled; bm.updateRule(rule)">
              <span class="bm-toggle-thumb-sm" />
            </button>
          </div>
          <p v-if="bm.rules.value.length === 0" class="text-xs py-2" style="color:hsl(var(--muted-foreground))">Loading rules…</p>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <button class="bm-save-btn" :disabled="saving" @click="handleSaveSettings">
          <span v-if="saving" class="bm-btn-spinner" style="border-top-color:white" />
          <template v-else><Save class="w-4 h-4" /> Save Brand Settings</template>
        </button>
      </div>

    </template>

  </div>

    <!-- ══════════════════════════════════════════════════════
         CUSTOMER DISPLAY TAB
    ══════════════════════════════════════════════════════════ -->
    <template v-if="activeTab === 'display'">

      <!-- Header row -->
      <div class="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 class="text-xl font-black">Customer Display</h2>
          <p class="text-xs font-medium mt-1" style="color:hsl(var(--muted-foreground))">
            Full-screen TV display for your waiting area. Works on any smart TV, Chromecast, Fire Stick, or browser.
          </p>
        </div>
        <div class="flex items-center gap-3">
          <button class="disp-btn disp-btn--outline" @click="previewDisplay">
            <Eye class="w-4 h-4" /> Preview
          </button>
          <button class="disp-btn disp-btn--primary" @click="saveDisplay" :disabled="savingDisplay">
            <div v-if="savingDisplay" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <Save v-else class="w-4 h-4" />
            Save Display
          </button>
        </div>
      </div>

      <!-- Pairing wizard -->
      <div class="disp-pair-card" :class="{ 'disp-pair-card--paired': displayPaired }">
        <div class="disp-pair-inner">
          <div class="disp-pair-icon" :style="displayPaired ? 'background: linear-gradient(135deg,#10b981,#059669)' : 'background: linear-gradient(135deg,#6366f1,#8b5cf6)'">
            <component :is="displayPaired ? CheckCircle : Tv" class="w-6 h-6 text-white" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-black">{{ displayPaired ? 'Display Connected' : 'Pair Your Customer Display' }}</p>
            <p class="text-xs font-medium mt-0.5" style="color:hsl(var(--muted-foreground))">
              {{ displayPaired
                ? `Last seen: ${displayLastSeen || 'just now'} · ${displayUrl}`
                : 'Open the display URL on your TV and it will sync automatically' }}
            </p>
          </div>
          <div class="flex items-center gap-2">
            <button v-if="!displayPaired" class="disp-pair-step-btn" @click="pairStep = 1; showPairWizard = true">
              <Cast class="w-4 h-4" /> Start Pairing
            </button>
            <template v-else>
              <button class="disp-btn disp-btn--sm disp-btn--outline" @click="copyDisplayUrl">
                <Copy class="w-3.5 h-3.5" /> Copy URL
              </button>
              <button class="disp-btn disp-btn--sm" @click="openDisplayUrl" style="background:#10b981">
                <ExternalLinkIcon class="w-3.5 h-3.5" /> Open Display
              </button>
            </template>
          </div>
        </div>

        <!-- Pairing wizard inline -->
        <Transition name="wizard-slide">
        <div v-if="showPairWizard" class="disp-wizard">
          <!-- Step 1: Choose casting method -->
          <div v-if="pairStep === 1" class="disp-wizard-step">
            <p class="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4">Step 1 — Choose your display method</p>
            <div class="disp-method-grid">
              <button
                v-for="method in castMethods" :key="method.id"
                class="disp-method-card"
                :class="{ 'disp-method-card--active': pairMethod === method.id }"
                @click="pairMethod = method.id"
              >
                <div class="disp-method-icon" :style="`background:${method.color}20;color:${method.color}`">
                  <component :is="method.icon" class="w-6 h-6" />
                </div>
                <p class="text-sm font-black mt-2">{{ method.name }}</p>
                <p class="text-xs font-medium mt-0.5" style="color:hsl(var(--muted-foreground))">{{ method.desc }}</p>
                <div v-if="pairMethod === method.id" class="disp-method-check">
                  <Check class="w-3 h-3" />
                </div>
              </button>
            </div>
            <div class="flex justify-end mt-4">
              <button class="disp-btn disp-btn--primary" :disabled="!pairMethod" @click="pairStep = 2">
                Continue →
              </button>
            </div>
          </div>

          <!-- Step 2: Instructions -->
          <div v-if="pairStep === 2" class="disp-wizard-step">
            <p class="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4">Step 2 — Set up your display</p>
            <div class="disp-instructions">
              <div v-for="(step, i) in pairInstructions" :key="i" class="disp-instruction-row">
                <div class="disp-instruction-num">{{ i + 1 }}</div>
                <div>
                  <p class="text-sm font-bold">{{ step.title }}</p>
                  <p class="text-xs font-medium mt-0.5" style="color:hsl(var(--muted-foreground))">{{ step.desc }}</p>
                  <div v-if="step.code" class="disp-code-block">
                    <code>{{ step.code }}</code>
                    <button class="disp-copy-btn" @click="copyText(step.code)">
                      <Copy class="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- QR code placeholder -->
            <div class="disp-qr-row" v-if="pairMethod !== 'chromecast'">
              <div class="disp-qr-box">
                <QrCode class="w-10 h-10 opacity-30" />
                <p class="text-xs font-bold mt-2 opacity-50">QR → Display URL</p>
              </div>
              <div class="disp-url-box">
                <p class="text-[10px] font-black uppercase tracking-widest mb-1" style="color:hsl(var(--muted-foreground))">Display URL</p>
                <p class="text-xs font-mono font-bold break-all">{{ displayUrl }}</p>
              </div>
            </div>

            <div class="flex justify-between mt-4">
              <button class="disp-btn disp-btn--outline" @click="pairStep = 1">← Back</button>
              <button class="disp-btn disp-btn--primary" @click="pairStep = 3">
                I've opened the display →
              </button>
            </div>
          </div>

          <!-- Step 3: Confirm -->
          <div v-if="pairStep === 3" class="disp-wizard-step text-center">
            <div class="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style="background:linear-gradient(135deg,#10b981,#059669)">
              <CheckCircle class="w-8 h-8 text-white" />
            </div>
            <h3 class="text-lg font-black">Display Ready!</h3>
            <p class="text-sm font-medium mt-1 mb-4" style="color:hsl(var(--muted-foreground))">
              Your customer display is set up. Build your slide sequence below and hit "Save Display" to push content live.
            </p>
            <button class="disp-btn disp-btn--primary" @click="completePairing">
              Build My Slides →
            </button>
          </div>
        </div>
        </Transition>
      </div>

      <!-- Two-panel layout: Slide list + Editor -->
      <div class="disp-builder">

        <!-- Left: Slide sequence -->
        <div class="disp-sequence">
          <div class="disp-sequence-header">
            <p class="text-[10px] font-black uppercase tracking-widest" style="color:hsl(var(--muted-foreground))">Slide Sequence</p>
            <span class="text-xs font-bold" style="color:hsl(var(--muted-foreground))">{{ displaySlides.length }} slides</span>
          </div>

          <!-- Slide list (drag handles for future drag-and-drop) -->
          <div class="disp-slide-list" ref="slideListEl">
            <div
              v-for="(slide, i) in displaySlides"
              :key="slide.id"
              class="disp-slide-item"
              :class="{ 'disp-slide-item--active': selectedSlide === i }"
              @click="selectedSlide = i"
            >
              <div class="disp-slide-drag">
                <GripVertical class="w-4 h-4" style="color:hsl(var(--muted-foreground)/0.4)" />
              </div>
              <div class="disp-slide-thumb" :style="`background:${slide.config?.bg || '#1a1a2e'}`">
                <component :is="slideTypeIcon(slide.type)" class="w-5 h-5" style="color:rgba(255,255,255,0.5)" />
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-black truncate">{{ slide.name || slideTypeLabel(slide.type) }}</p>
                <p class="text-[10px] font-bold" style="color:hsl(var(--muted-foreground))">{{ slide.duration / 1000 }}s · {{ slideTypeLabel(slide.type) }}</p>
              </div>
              <div class="flex items-center gap-1">
                <button class="disp-slide-action" :disabled="i === 0" @click.stop="moveSlide(i, -1)">
                  <ChevronUp class="w-3.5 h-3.5" />
                </button>
                <button class="disp-slide-action" :disabled="i === displaySlides.length - 1" @click.stop="moveSlide(i, 1)">
                  <ChevronDown class="w-3.5 h-3.5" />
                </button>
                <button class="disp-slide-action disp-slide-action--danger" @click.stop="removeSlide(i)">
                  <Trash2 class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div v-if="displaySlides.length === 0" class="disp-slide-empty">
              <Layers class="w-8 h-8 opacity-30" />
              <p>No slides yet.<br>Add one below.</p>
            </div>
          </div>

          <!-- Add slide buttons -->
          <div class="disp-add-slide-section">
            <p class="text-[10px] font-black uppercase tracking-widest mb-3" style="color:hsl(var(--muted-foreground))">Add Slide</p>
            <div class="disp-add-grid">
              <button
                v-for="type in slideTypes"
                :key="type.id"
                class="disp-add-btn"
                @click="addSlide(type.id)"
              >
                <div class="disp-add-btn-icon" :style="`background:${type.color}18;color:${type.color}`">
                  <component :is="type.icon" class="w-4 h-4" />
                </div>
                <span class="text-xs font-bold">{{ type.label }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Right: Slide editor -->
        <div class="disp-editor">
          <div v-if="selectedSlide !== null && displaySlides[selectedSlide]" class="disp-editor-inner">

            <!-- Editor header -->
            <div class="disp-editor-header">
              <div class="flex items-center gap-2">
                <div class="disp-edit-type-badge" :style="`background:${currentSlideTypeObj?.color}18;color:${currentSlideTypeObj?.color}`">
                  <component :is="currentSlideTypeObj?.icon" class="w-3.5 h-3.5" />
                  {{ slideTypeLabel(displaySlides[selectedSlide].type) }}
                </div>
              </div>
              <div class="flex items-center gap-2">
                <label class="text-[10px] font-black uppercase tracking-widest" style="color:hsl(var(--muted-foreground))">Duration</label>
                <div class="disp-duration-btns">
                  <button v-for="d in [4000,8000,12000,20000]" :key="d"
                    class="disp-dur-btn"
                    :class="{ active: displaySlides[selectedSlide].duration === d }"
                    @click="displaySlides[selectedSlide].duration = d">
                    {{ d/1000 }}s
                  </button>
                </div>
              </div>
            </div>

            <!-- Slide name -->
            <div class="disp-field-row">
              <label class="m3-label">Slide Name</label>
              <input v-model="displaySlides[selectedSlide].name" placeholder="My slide name..." class="m3-input" />
            </div>

            <!-- Background -->
            <div class="disp-field-group">
              <label class="m3-label">Background</label>
              <div class="flex items-center gap-3">
                <select v-model="displaySlides[selectedSlide].config.bgType" class="m3-input" style="flex:1">
                  <option value="solid">Solid Color</option>
                  <option value="gradient">Gradient</option>
                  <option value="mesh">Mesh Gradient</option>
                </select>
                <div class="disp-color-swatch">
                  <input type="color" v-model="displaySlides[selectedSlide].config.bg" class="disp-color-input" />
                </div>
              </div>
              <div class="disp-preset-colors">
                <button
                  v-for="c in bgPresets" :key="c"
                  class="disp-preset-swatch"
                  :style="`background:${c}`"
                  :class="{ active: displaySlides[selectedSlide].config.bg === c }"
                  @click="displaySlides[selectedSlide].config.bg = c"
                />
              </div>
            </div>

            <!-- Accent color -->
            <div class="disp-field-group">
              <label class="m3-label">Accent Color</label>
              <div class="flex items-center gap-3">
                <div class="disp-preset-colors">
                  <button
                    v-for="c in accentPresets" :key="c"
                    class="disp-preset-swatch"
                    :style="`background:${c}`"
                    :class="{ active: displaySlides[selectedSlide].config.accentColor === c }"
                    @click="displaySlides[selectedSlide].config.accentColor = c"
                  />
                </div>
                <div class="disp-color-swatch">
                  <input type="color" v-model="displaySlides[selectedSlide].config.accentColor" class="disp-color-input" />
                </div>
              </div>
            </div>

            <!-- ── Type-specific fields ── -->

            <!-- PROMO fields -->
            <template v-if="displaySlides[selectedSlide].type === 'promo'">
              <div class="disp-field-group">
                <label class="m3-label">Badge Text</label>
                <input v-model="displaySlides[selectedSlide].config.badge" placeholder="e.g. LIMITED TIME OFFER" class="m3-input" />
              </div>
              <div class="disp-field-group">
                <label class="m3-label">Headline</label>
                <input v-model="displaySlides[selectedSlide].config.headline" placeholder="SAME-DAY REPAIRS" class="m3-input" />
              </div>
              <div class="disp-field-group">
                <label class="m3-label">Headline Size (px)</label>
                <input type="range" v-model.number="displaySlides[selectedSlide].config.headlineSize" min="40" max="160" step="4" class="disp-range" />
                <span class="text-xs font-bold" style="color:hsl(var(--muted-foreground))">{{ displaySlides[selectedSlide].config.headlineSize }}px</span>
              </div>
              <div class="disp-field-group">
                <label class="m3-label">Body Text</label>
                <textarea v-model="displaySlides[selectedSlide].config.body" rows="2" placeholder="iPhone · Android · Tablet · Laptop" class="m3-textarea" />
              </div>
              <div class="disp-field-group">
                <label class="m3-label">Call to Action</label>
                <input v-model="displaySlides[selectedSlide].config.cta" placeholder="Call us: (555) 123-4567" class="m3-input" />
              </div>
              <div class="disp-field-group">
                <label class="m3-label">Text Alignment</label>
                <div class="disp-align-btns">
                  <button v-for="a in ['left','center','right']" :key="a"
                    class="disp-align-btn"
                    :class="{ active: displaySlides[selectedSlide].config.align === a }"
                    @click="displaySlides[selectedSlide].config.align = a">{{ a }}</button>
                </div>
              </div>
            </template>

            <!-- WELCOME fields -->
            <template v-if="displaySlides[selectedSlide].type === 'welcome'">
              <div class="disp-field-group">
                <label class="m3-label">Shop Name</label>
                <input v-model="displaySlides[selectedSlide].config.shopName" placeholder="Your Shop Name" class="m3-input" />
              </div>
              <div class="disp-field-group">
                <label class="m3-label">Tagline</label>
                <input v-model="displaySlides[selectedSlide].config.tagline" placeholder="Expert device repairs, fast." class="m3-input" />
              </div>
              <div class="disp-field-group">
                <label class="m3-label">Service Strips (one per line)</label>
                <textarea
                  :value="(displaySlides[selectedSlide].config.strips || []).join(String.fromCharCode(10))"
                  @input="displaySlides[selectedSlide].config.strips = ($event.target as HTMLTextAreaElement).value.split(String.fromCharCode(10)).filter(Boolean)"
                  rows="4" placeholder="iPhone &amp; Android&#10;Tablets&#10;Laptops&#10;Game Consoles" class="m3-textarea" />
              </div>
            </template>

            <!-- MENU fields -->
            <template v-if="displaySlides[selectedSlide].type === 'menu'">
              <div class="disp-field-group">
                <label class="m3-label">Menu Title</label>
                <input v-model="displaySlides[selectedSlide].config.title" placeholder="Repair Services" class="m3-input" />
              </div>
              <div class="disp-field-group">
                <label class="m3-label">Subtitle</label>
                <input v-model="displaySlides[selectedSlide].config.subtitle" placeholder="Professional Same-Day Service" class="m3-input" />
              </div>
              <div class="disp-field-group">
                <label class="m3-label">Filter Categories (leave empty = show all)</label>
                <div class="disp-category-chips">
                  <button
                    v-for="cat in availableServiceCategories" :key="cat"
                    class="disp-cat-chip"
                    :class="{ active: (displaySlides[selectedSlide].config.categories || []).includes(cat) }"
                    @click="toggleMenuCategory(cat)"
                  >{{ cat }}</button>
                </div>
              </div>
            </template>

            <!-- TICKETS fields -->
            <template v-if="displaySlides[selectedSlide].type === 'tickets'">
              <div class="disp-field-group">
                <label class="m3-label">Max Tickets to Show</label>
                <div class="disp-align-btns">
                  <button v-for="n in [4,6,8,12]" :key="n"
                    class="disp-align-btn"
                    :class="{ active: displaySlides[selectedSlide].config.maxTickets === n }"
                    @click="displaySlides[selectedSlide].config.maxTickets = n">{{ n }}</button>
                </div>
              </div>
            </template>

            <!-- Live preview strip -->
            <div class="disp-preview-strip" :style="slideBackground(displaySlides[selectedSlide])">
              <div class="disp-preview-label">
                <component :is="currentSlideTypeObj?.icon" class="w-3 h-3" />
                LIVE PREVIEW
              </div>
              <p class="disp-preview-headline">
                {{ displaySlides[selectedSlide].config?.headline
                   || displaySlides[selectedSlide].config?.shopName
                   || displaySlides[selectedSlide].config?.title
                   || slideTypeLabel(displaySlides[selectedSlide].type) }}
              </p>
            </div>

          </div>
          <div v-else class="disp-editor-empty">
            <LayoutGrid class="w-12 h-12 opacity-20" />
            <p class="text-sm font-bold mt-3 opacity-40">Select a slide to edit it,<br>or add a new one →</p>
          </div>
        </div>
      </div>

      <!-- Display settings (footer, shop name, etc) -->
      <div class="disp-settings-card">
        <p class="text-sm font-black mb-4 flex items-center gap-2"><Settings2 class="w-4 h-4 opacity-60" /> Display Settings</p>
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <label class="m3-label">Shop Name (footer)</label>
            <input v-model="displayConfig2.shopName" placeholder="Your shop name" class="m3-input" />
          </div>
          <div class="space-y-2">
            <label class="m3-label">Show Footer</label>
            <div class="disp-toggle-row">
              <button class="disp-toggle" :class="{ active: displayConfig2.showFooter !== false }" @click="displayConfig2.showFooter = displayConfig2.showFooter === false ? true : false">
                <div class="disp-toggle-thumb" />
              </button>
              <span class="text-xs font-bold" style="color:hsl(var(--muted-foreground))">{{ displayConfig2.showFooter !== false ? 'On' : 'Off' }}</span>
            </div>
          </div>
        </div>
      </div>

    </template>


</template>

<script setup lang="ts">
import {
  Sparkles, Globe, Calendar, Check, X, Save, Search, Plus,
  MessageCircle, Star, Edit3, Send, Clock, Zap,
  RefreshCw, Archive, ExternalLink, ThumbsUp, ThumbsDown,
  BarChart3, TrendingUp, Users, Eye, AlertCircle,
  Monitor, Tv, Cast, Wifi, Copy, Play, Pause, Trash2,
  ChevronUp, ChevronDown, Settings2, Wrench, DollarSign,
  Layers, LayoutGrid, Radio, GripVertical, QrCode, ExternalLink as ExternalLinkIcon,
  Smartphone, RotateCcw, CheckCircle
} from 'lucide-vue-next'

definePageMeta({ middleware: ['auth'] })

const bm = useBrandManager()
const { addNotification } = useNotifications()

// ── Load data on mount, cleanup on unmount ────────────────────────
onMounted(bm.load)
onUnmounted(bm.cleanup)

// ── Platform metadata (static, no API needed) ─────────────────────
const FacebookIcon  = { template: '<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>' }
const InstagramIcon = { template: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>' }
const GoogleIcon    = { template: '<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>' }
const YelpIcon      = { template: '<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M12.28 2C6.62 2 2 6.62 2 12.28c0 4.34 2.73 8.06 6.59 9.52.15-1.27.27-3.22.05-4.6-.2-1.26-1.33-7.95-1.33-7.95s-.33-.65-.33-1.62c0-1.52.88-2.66 1.97-2.66.93 0 1.38.7 1.38 1.53 0 .93-.6 2.33-.9 3.63-.26 1.08.53 1.97 1.6 1.97 1.91 0 3.19-2.44 3.19-5.33 0-2.2-1.49-3.85-4.2-3.85-3.06 0-4.96 2.28-4.96 4.84 0 .88.26 1.5.66 1.98.18.22.21.3.14.56l-.23.88c-.07.26-.3.36-.56.26C3.55 10.63 3 9.2 3 7.56 3 4.5 5.5 1.5 9.97 1.5c3.63 0 6.03 2.6 6.03 5.4 0 3.72-2.08 6.51-5.13 6.51-1.03 0-2-.55-2.33-1.17l-.65 2.57c-.23.87-.85 1.96-1.27 2.62.96.29 1.97.45 3.02.45 5.66 0 10.28-4.62 10.28-10.28S17.94 2 12.28 2z"/></svg>' }

const PLATFORMS = [
  { id: 'facebook',  name: 'Facebook',        color: '#1877F2', icon: FacebookIcon,  description: 'Connect Facebook Business Suite to pull reviews, comments, and post updates.' },
  { id: 'google',    name: 'Google Reviews',  color: '#EA4335', icon: GoogleIcon,    description: 'Connect Google Business Profile to manage reviews and reply via Google My Business API.' },
  { id: 'instagram', name: 'Instagram',       color: '#E1306C', icon: InstagramIcon, description: 'Connect Instagram to monitor comments and DMs from your business profile.' },
  { id: 'yelp',      name: 'Yelp',            color: '#C41200', icon: YelpIcon,      description: 'Connect Yelp to monitor reviews. Note: Yelp API is read-only; replies are manual.' },
]

const PLATFORM_MAP = Object.fromEntries(PLATFORMS.map(p => [p.id, p]))

function platformColor(id: string) { return PLATFORM_MAP[id]?.color ?? '#6366f1' }
function platformName(id: string)  { return PLATFORM_MAP[id]?.name  ?? id }
function platformIcon(id: string)  { return PLATFORM_MAP[id]?.icon  ?? MessageCircle }
function connectionFor(platformId: string) { return bm.connections.value.find(c => c.platform === platformId) }
function formatMetaKey(k: string) { return k.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) }
function formatTime(iso: string) { return new Date(iso).toLocaleString() }

// ── Tabs ──────────────────────────────────────────────────────────
const activeTab = ref<'social' | 'interactions' | 'analytics' | 'website' | 'display'>('social')
const tabs = computed(() => [
  { id: 'social',        label: 'Social Hub',   icon: Sparkles,      badge: null,                         badgeColor: '' },
  { id: 'interactions',  label: 'Interactions', icon: MessageCircle, badge: bm.unreadCount.value || null,  badgeColor: '#ec4899' },
  { id: 'analytics',    label: 'Analytics',    icon: BarChart3,     badge: null,                         badgeColor: '' },
  { id: 'website',      label: 'Web & Portal', icon: Globe,         badge: null,                         badgeColor: '' },
  { id: 'display',      label: 'Customer Display', icon: Monitor,     badge: 'NEW',                         badgeColor: '#10b981' },
])

// ── Platform connect/disconnect ───────────────────────────────────
const connectingPlatform = ref<string | null>(null)

async function handlePlatformToggle(platform: typeof PLATFORMS[0]) {
  const conn = connectionFor(platform.id)
  if (conn?.connected) {
    if (!confirm(`Disconnect ${platform.name}? Real-time syncing will stop.`)) return
    try { await bm.disconnectPlatform(conn) } catch (e: any) { addNotification('Error', e.message, 'error') }
  } else {
    connectingPlatform.value = platform.id
    try { await bm.connectPlatform(platform.id) } finally { connectingPlatform.value = null }
  }
}

// ── Compose ───────────────────────────────────────────────────────
const postText      = ref('')
const postTargets   = ref<string[]>([])
const showScheduler = ref(false)
const scheduledTime = ref('')
const posting       = ref(false)

const POST_TEMPLATES = [
  "🛠️ Another successful repair! Brought this device back to life today — screen replacement done right. Book yours now!",
  "⭐ Thank you for the amazing reviews lately! We work hard to make sure every repair is done right. Drop your broken device anytime.",
  "📱 Cracked screen? Don't panic! We fix iPhones, Androids, iPads & more. Same-day service available. Come see us!",
  "🔧 New parts just arrived! Faster turnarounds on iPhone 15, Samsung S24 & more. Get your repair booked today.",
]

function togglePostTarget(id: string) {
  const idx = postTargets.value.indexOf(id)
  if (idx > -1) postTargets.value.splice(idx, 1)
  else postTargets.value.push(id)
}
function insertTemplate() { postText.value = POST_TEMPLATES[Math.floor(Math.random() * POST_TEMPLATES.length)] }

async function submitPost() {
  if (!postText.value.trim() || postTargets.value.length === 0) return
  posting.value = true
  try {
    await bm.createPost(postText.value, [...postTargets.value], scheduledTime.value || undefined)
    postText.value = ''; scheduledTime.value = ''; showScheduler.value = false
  } catch (e: any) {
    addNotification('Post Failed', e.message, 'error')
  } finally {
    posting.value = false
  }
}

// ── Interactions ──────────────────────────────────────────────────
const interactionSearch = ref('')
const interactionFilter = ref('All')
const refreshing        = ref(false)
const replyingToId      = ref<string | null>(null)
const replyText         = ref('')
const postingReply      = ref(false)
const showAddInteraction = ref(false)
const savingInteraction  = ref(false)

const newInteraction = ref({
  platform: 'google', type: 'Review' as const, author_name: '', content: '', rating: null as number | null, url: '',
})

const interactionFilters = computed(() => [
  { label: 'All',         icon: MessageCircle, color: '#6366f1', count: bm.interactions.value.length },
  { label: 'Unread',      icon: AlertCircle,   color: '#ec4899', count: bm.unreadCount.value },
  { label: 'Reviews',     icon: Star,          color: '#f59e0b', count: bm.interactions.value.filter(i => i.type === 'Review').length },
  { label: 'Comments',    icon: MessageCircle, color: '#3b82f6', count: bm.interactions.value.filter(i => i.type === 'Comment').length },
  { label: 'Starred',     icon: Star,          color: '#f59e0b', count: bm.interactions.value.filter(i => i.starred).length },
  { label: 'Needs Reply', icon: Send,          color: '#ef4444', count: bm.interactions.value.filter(i => !i.our_reply).length },
])

const filteredInteractions = computed(() => {
  let list = bm.interactions.value
  if (interactionFilter.value === 'Unread')       list = list.filter(i => i.unread)
  else if (interactionFilter.value === 'Reviews')  list = list.filter(i => i.type === 'Review')
  else if (interactionFilter.value === 'Comments') list = list.filter(i => i.type === 'Comment')
  else if (interactionFilter.value === 'Starred')  list = list.filter(i => i.starred)
  else if (interactionFilter.value === 'Needs Reply') list = list.filter(i => !i.our_reply)
  if (interactionSearch.value) {
    const q = interactionSearch.value.toLowerCase()
    list = list.filter(i => i.author_name.toLowerCase().includes(q) || i.content.toLowerCase().includes(q))
  }
  return list
})

async function refreshInteractions() {
  refreshing.value = true
  try { await bm.load() } finally { refreshing.value = false }
}

async function saveNewInteraction() {
  if (!newInteraction.value.content.trim() || !newInteraction.value.author_name.trim()) return
  savingInteraction.value = true
  try {
    const sentiment = (newInteraction.value.rating ?? 3) >= 4 ? 'positive' : (newInteraction.value.rating ?? 3) <= 2 ? 'negative' : 'neutral'
    await bm.addInteraction({
      ...newInteraction.value,
      sentiment,
      url: newInteraction.value.url || null,
      rating: newInteraction.value.rating || null,
    })
    newInteraction.value = { platform: 'google', type: 'Review', author_name: '', content: '', rating: null, url: '' }
    showAddInteraction.value = false
  } catch (e: any) {
    addNotification('Error', e.message, 'error')
  } finally {
    savingInteraction.value = false
  }
}

function startReply(item: any) {
  if (replyingToId.value === item.id) { replyingToId.value = null; replyText.value = ''; return }
  replyingToId.value = item.id
  replyText.value = item.our_reply ?? ''
}

function replySuggestions(item: any) {
  const name = item.author_name.split(' ')[0]
  if (item.type === 'Review' && (item.rating ?? 0) >= 4) return [
    `Thank you so much ${name}! We're thrilled you had a great experience. See you next time! 🙏`,
    `Wonderful, ${name}! Your kind words mean the world to our whole team.`,
  ]
  if (item.type === 'Review' && (item.rating ?? 5) <= 2) return [
    `Hi ${name}, we sincerely apologize and want to make this right. Please contact us directly.`,
    `Thank you for the honest feedback ${name}. We're taking this seriously — please reach out.`,
  ]
  return [
    `Hi ${name}! Yes, we do — stop by or call for a free estimate. Same-day service available! 😊`,
    `Great question ${name}! Send us a message and we'll get you sorted right away.`,
  ]
}

async function submitReply(item: any) {
  if (!replyText.value.trim()) return
  postingReply.value = true
  try {
    await bm.postReply(item, replyText.value.trim())
    // Attempt to post to platform via server route
    try {
      const res = await $fetch('/api/brand/reply', { method: 'POST', body: { interaction_id: item.id } })
      if ((res as any).ok) {
        addNotification('Posted', `Reply posted to ${item.platform}`, 'success')
      } else {
        addNotification('Saved (not posted)', (res as any).platform_error ?? 'Platform posting needs API credentials', 'warning')
      }
    } catch {
      // Server route not configured yet — reply is still saved to DB
      addNotification('Reply Saved', 'Reply saved. Platform posting needs OAuth credentials.', 'info')
    }
    replyingToId.value = null
    replyText.value = ''
  } catch (e: any) {
    addNotification('Error', e.message, 'error')
  } finally {
    postingReply.value = false
  }
}

// ── Analytics (derived from real interactions) ────────────────────
const reviewInteractions = computed(() => bm.interactions.value.filter(i => i.type === 'Review' && i.rating))

const avgRating = computed(() => {
  if (!reviewInteractions.value.length) return null
  const sum = reviewInteractions.value.reduce((acc, i) => acc + (i.rating ?? 0), 0)
  return (sum / reviewInteractions.value.length).toFixed(1)
})

const responseRate = computed(() => {
  const total = bm.interactions.value.length
  if (!total) return '—'
  const replied = bm.interactions.value.filter(i => i.our_reply).length
  return Math.round((replied / total) * 100) + '%'
})

function ratingCount(star: number) { return reviewInteractions.value.filter(i => i.rating === star).length }
function ratingPct(star: number) {
  if (!reviewInteractions.value.length) return 0
  return (ratingCount(star) / reviewInteractions.value.length) * 100
}

const analyticsStats = computed(() => [
  { label: 'Interactions', value: String(bm.interactions.value.length), color: '#6366f1', icon: MessageCircle, sub: 'Total logged' },
  { label: 'Avg Rating',   value: avgRating.value ? `${avgRating.value}★` : '—', color: '#f59e0b', icon: Star, sub: `From ${reviewInteractions.value.length} reviews` },
  { label: 'Platforms',    value: String(bm.activeConnections.value.length), color: '#10b981', icon: TrendingUp, sub: 'Connected' },
  { label: 'Response Rate',value: responseRate.value, color: '#3b82f6', icon: Users, sub: 'Interactions replied to' },
])

// ── Utilities ─────────────────────────────────────────────────────
function typeColor(type: string) { return ({ Review: '#f59e0b', Comment: '#3b82f6', Message: '#8b5cf6' } as any)[type] ?? '#6366f1' }
function sentimentColor(s: string) { return ({ positive: '#10b981', neutral: '#f59e0b', negative: '#ef4444' } as any)[s] ?? '#6366f1' }
function sentimentIcon(s: string) { return ({ positive: ThumbsUp, neutral: AlertCircle, negative: ThumbsDown } as any)[s] ?? AlertCircle }

function initials(name: string) { return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() }
const AVATAR_COLORS = ['#6366f1','#ec4899','#f59e0b','#10b981','#3b82f6','#8b5cf6','#ef4444','#06b6d4']
function avatarColor(name: string) { let h = 0; for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xFFFF; return AVATAR_COLORS[h % AVATAR_COLORS.length] }

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const min  = Math.floor(diff / 60000)
  if (min < 1)   return 'just now'
  if (min < 60)  return `${min}m ago`
  const h = Math.floor(min / 60)
  if (h < 24)    return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function ruleTriggerLabel(rule: any) {
  if (rule.trigger_type === 'rating_gte') return `${rule.trigger_value}-star or higher reviews`
  if (rule.trigger_type === 'rating_lte') return `${rule.trigger_value}-star or lower reviews`
  if (rule.trigger_type === 'keyword')    return `Review mentions "${rule.trigger_value}"`
  return rule.trigger_type
}

// ── Save settings ─────────────────────────────────────────────────
const saving = ref(false)
async function handleSaveSettings() {
  saving.value = true
  try { await bm.saveSettings() } catch (e: any) { addNotification('Error', e.message, 'error') } finally { saving.value = false }
}


// ══════════════════════════════════════════════════════════════════
// CUSTOMER DISPLAY LOGIC
// ══════════════════════════════════════════════════════════════════

const { $supabase } = useNuxtApp()

// ── Pairing state ─────────────────────────────────────────────────
const showPairWizard = ref(false)
const pairStep = ref(1)
const pairMethod = ref('')
const displayPaired = ref(false)
const displayLastSeen = ref('')

const castMethods = [
  { id: 'browser',    name: 'Smart TV Browser', icon: Tv,         color: '#6366f1', desc: 'Open the URL directly in your TV browser' },
  { id: 'chromecast', name: 'Chromecast / Cast', icon: Cast,      color: '#f59e0b', desc: 'Cast a tab from Chrome to Chromecast or Cast-enabled TV' },
  { id: 'firestick',  name: 'Fire Stick / Roku',icon: Wifi,       color: '#f97316', desc: 'Open Silk browser on Fire Stick or the web browser on Roku' },
  { id: 'phone',      name: 'Phone / Tablet',    icon: Smartphone, color: '#10b981', desc: 'Use any device in full-screen mode as a display' },
]

const pairInstructions = computed(() => {
  const url = displayUrl.value
  const methods: Record<string, Array<{title:string, desc:string, code?:string}>> = {
    browser: [
      { title: 'Open your TV browser', desc: 'Navigate to the browser app on your smart TV' },
      { title: 'Enter the display URL', desc: 'Type or paste this URL in the address bar', code: url },
      { title: 'Go full screen', desc: 'Press the full-screen button or F11. The display will connect automatically.' },
    ],
    chromecast: [
      { title: 'Open Chrome on your computer', desc: 'Make sure your Chromecast is on the same network' },
      { title: 'Navigate to the display URL', desc: 'Open a new tab and paste this URL', code: url },
      { title: 'Cast the tab', desc: 'Click the ⋮ menu → Cast… → Select your Chromecast device' },
    ],
    firestick: [
      { title: 'Open Silk Browser on Fire Stick', desc: 'Or use the built-in browser on Roku' },
      { title: 'Navigate to the display URL', desc: 'Enter this address in the browser', code: url },
      { title: 'Enable full screen', desc: 'Use the remote to maximize the browser window' },
    ],
    phone: [
      { title: 'Open the display URL', desc: 'Paste this URL in your phone or tablet browser', code: url },
      { title: 'Enable full screen', desc: 'Tap the full-screen icon or use Add to Home Screen for a native feel' },
    ],
  }
  return methods[pairMethod.value] || []
})

function completePairing() {
  displayPaired.value = true
  showPairWizard.value = false
  pairStep.value = 1
}

// ── Display URL ───────────────────────────────────────────────────
const { $supabase: _sb2 } = useNuxtApp()

// We derive the URL from the current user session
const displayUrl = computed(() => {
  // Get the current user's profile id from supabase
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
  return `${baseUrl}/display?shop=${currentProfileId.value}`
})

const currentProfileId = ref('')

onMounted(async () => {
  const { data: { user } } = await ($supabase as any).auth.getUser()
  if (user) currentProfileId.value = user.id

  // Load saved display config from profile
  const { data: profile } = await ($supabase as any)
    .from('profiles')
    .select('display_slides, display_config')
    .eq('id', user?.id)
    .single()

  if (profile) {
    if (profile.display_slides?.length) {
      displaySlides.value = profile.display_slides
      displayPaired.value = true // if they have slides, they've set this up before
    }
    if (profile.display_config) {
      displayConfig2.value = profile.display_config
    }
  }
})

function copyDisplayUrl() {
  navigator.clipboard.writeText(displayUrl.value)
  addNotification('Copied!', 'Display URL copied to clipboard', 'success')
}

function openDisplayUrl() {
  window.open(displayUrl.value, '_blank')
}

function copyText(text: string) {
  navigator.clipboard.writeText(text)
  addNotification('Copied!', 'URL copied to clipboard', 'success')
}

function previewDisplay() {
  window.open(displayUrl.value, '_blank')
}

// ── Slide state ───────────────────────────────────────────────────
const displaySlides = ref<any[]>([])
const selectedSlide = ref<number | null>(null)
const displayConfig2 = ref<any>({ shopName: '', showFooter: true })
const savingDisplay = ref(false)

const bgPresets = ['#0f0f13', '#1a1a2e', '#0d1117', '#0c1a0e', '#1a0d2e', '#0f1a1a', '#1a0d0d', '#f8fafc']
const accentPresets = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#06b6d4']

const slideTypes = [
  { id: 'welcome',  label: 'Welcome',      icon: Sparkles,    color: '#6366f1' },
  { id: 'promo',    label: 'Promo Slide',  icon: Radio,       color: '#ec4899' },
  { id: 'tickets',  label: 'Ticket Board', icon: Layers,      color: '#f59e0b' },
  { id: 'menu',     label: 'Price Menu',   icon: DollarSign,  color: '#10b981' },
  { id: 'queue',    label: 'Queue Status', icon: LayoutGrid,  color: '#3b82f6' },
]

function slideTypeLabel(type: string) {
  return slideTypes.find(s => s.id === type)?.label || type
}

function slideTypeIcon(type: string) {
  return slideTypes.find(s => s.id === type)?.icon || Layers
}

const currentSlideTypeObj = computed(() => {
  if (selectedSlide.value === null) return null
  const s = displaySlides.value[selectedSlide.value]
  if (!s) return null
  return slideTypes.find(t => t.id === s.type) || null
})

const availableServiceCategories = computed(() => {
  const appStore = useAppStore()
  const cats = new Set<string>()
  ;(appStore.services || []).forEach((s: any) => { if (s.category) cats.add(s.category) })
  return Array.from(cats)
})

function toggleMenuCategory(cat: string) {
  if (selectedSlide.value === null) return
  const slide = displaySlides.value[selectedSlide.value]
  if (!slide.config.categories) slide.config.categories = []
  const idx = slide.config.categories.indexOf(cat)
  if (idx >= 0) slide.config.categories.splice(idx, 1)
  else slide.config.categories.push(cat)
}

function addSlide(type: string) {
  const defaults: Record<string, any> = {
    welcome: { shopName: '', tagline: 'Expert device repairs, fast.', strips: ['iPhone & Android', 'Tablets', 'Laptops', 'Game Consoles'], bg: '#0f0f13', accentColor: '#6366f1', bgType: 'solid' },
    promo:   { headline: 'SAME-DAY REPAIRS', headlineSize: 96, body: 'iPhone · Android · Tablet · Laptop', badge: '', cta: '', align: 'center', bg: '#1a1a2e', accentColor: '#6366f1', bgType: 'gradient', headlineColor: '#ffffff', bodyColor: 'rgba(255,255,255,0.7)' },
    tickets: { maxTickets: 6, bg: '#0d1117', accentColor: '#6366f1', bgType: 'solid' },
    menu:    { title: 'Repair Services', subtitle: 'Professional Same-Day Service', categories: [], bg: '#0c1a0e', accentColor: '#10b981', bgType: 'solid' },
    queue:   { bg: '#1a0d2e', accentColor: '#6366f1', bgType: 'mesh' },
  }
  const newSlide = {
    id: Date.now().toString(),
    type,
    name: slideTypeLabel(type),
    duration: 8000,
    config: defaults[type] || { bg: '#0f0f13', accentColor: '#6366f1', bgType: 'solid' },
  }
  displaySlides.value.push(newSlide)
  selectedSlide.value = displaySlides.value.length - 1
}

function removeSlide(i: number) {
  displaySlides.value.splice(i, 1)
  if (selectedSlide.value !== null) {
    if (selectedSlide.value >= displaySlides.value.length) {
      selectedSlide.value = displaySlides.value.length - 1
    }
    if (displaySlides.value.length === 0) selectedSlide.value = null
  }
}

function moveSlide(i: number, dir: number) {
  const j = i + dir
  if (j < 0 || j >= displaySlides.value.length) return
  const slides = displaySlides.value
  ;[slides[i], slides[j]] = [slides[j], slides[i]]
  selectedSlide.value = j
}

function slideBackground(slide: any) {
  const bg = slide.config?.bg || '#0f0f13'
  const accent = slide.config?.accentColor || '#6366f1'
  if (slide.config?.bgType === 'gradient') return `background: linear-gradient(135deg, ${bg}, ${accent})`
  if (slide.config?.bgType === 'mesh') return `background: radial-gradient(ellipse at 20% 50%, ${accent}30 0%, transparent 60%), ${bg}`
  return `background: ${bg}`
}

async function saveDisplay() {
  savingDisplay.value = true
  try {
    const { data: { user } } = await ($supabase as any).auth.getUser()
    if (!user) throw new Error('Not authenticated')

    await ($supabase as any)
      .from('profiles')
      .update({
        display_slides: displaySlides.value,
        display_config: displayConfig2.value,
      })
      .eq('id', user.id)

    addNotification('Display Saved!', 'Your customer display has been updated. Changes are live immediately.', 'success')
  } catch (e: any) {
    addNotification('Save Failed', e.message || 'Could not save display', 'error')
  } finally {
    savingDisplay.value = false
  }
}

// ── End display logic ─────────────────────────────────────────────

</script>

<style scoped>
.bm-root { display:flex;flex-direction:column;gap:24px;padding-bottom:40px;position:relative; }

/* Loading */
.bm-loading-overlay { position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:hsl(var(--background)/0.7);backdrop-filter:blur(4px);border-radius:24px;z-index:10;pointer-events:none; }
.bm-loading-spinner { width:36px;height:36px;border-radius:50%;border:3px solid hsl(var(--muted));border-top-color:#6366f1;animation:bmSpin 0.7s linear infinite; }
@keyframes bmSpin { to { transform:rotate(360deg); } }

/* Spinner inside buttons */
.bm-btn-spinner { display:inline-block;width:14px;height:14px;border-radius:50%;border:2px solid rgba(255,255,255,0.3);border-top-color:white;animation:bmSpin 0.7s linear infinite;flex-shrink:0; }

/* Header */
.bm-header { display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px; }
.bm-logo-wrap { width:48px;height:48px;border-radius:24px;display:flex;align-items:center;justify-content:center;flex-shrink:0;background:linear-gradient(135deg,#6366f1,#8b5cf6);box-shadow:0 4px 20px #6366f140; }
.bm-live-badge { display:flex;align-items:center;gap:8px;padding:8px 16px;border-radius:99px;background:hsl(var(--card));border:1.5px solid #4ade8030; }
.bm-live-dot { width:8px;height:8px;border-radius:50%;background:#4ade80;box-shadow:0 0 8px #4ade80;animation:bmPulse 2s infinite; }
@keyframes bmPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.55;transform:scale(1.25)} }

/* Tabs */
.bm-tabs { display:flex;gap:4px;background:hsl(var(--muted)/0.4);border-radius:20px;padding:4px;width:fit-content;flex-wrap:wrap; }
.bm-tab { display:flex;align-items:center;gap:7px;padding:8px 18px;border-radius:16px;font-size:13px;font-weight:700;color:hsl(var(--muted-foreground));background:none;border:none;cursor:pointer;transition:all 0.2s;white-space:nowrap; }
.bm-tab:hover { color:hsl(var(--foreground)); }
.bm-tab.active { background:hsl(var(--card));color:hsl(var(--foreground));box-shadow:0 2px 8px rgba(0,0,0,0.12); }
.bm-tab-badge { font-size:9px;font-weight:900;padding:2px 7px;border-radius:99px; }
.bm-section-label { font-size:10px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:hsl(var(--muted-foreground)); }

/* Platform grid */
.bm-platform-grid { display:grid;grid-template-columns:repeat(2,1fr);gap:14px; }
@media(max-width:580px){ .bm-platform-grid{grid-template-columns:1fr} }
@media(min-width:900px){ .bm-platform-grid{grid-template-columns:repeat(4,1fr)} }
.bm-platform-card { padding:20px;border-radius:28px;background:hsl(var(--card));border:2px solid hsl(var(--border)/0.5);transition:all 0.3s cubic-bezier(0.34,1.2,0.64,1); }
.bm-platform-card:hover { transform:translateY(-3px);box-shadow:0 10px 32px rgba(0,0,0,0.1); }
.bm-platform-card.connected { transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,0.08); }
.bm-plat-icon { width:40px;height:40px;border-radius:16px;display:flex;align-items:center;justify-content:center;flex-shrink:0; }
.bm-conn-badge { display:flex;align-items:center;gap:5px;font-size:10px;font-weight:800;padding:4px 10px;border-radius:99px;background:hsl(var(--muted)/0.4); }
.bm-conn-dot { width:6px;height:6px;border-radius:50%;animation:bmPulse 2s infinite; }
.bm-plat-btn { font-size:11px;font-weight:800;padding:5px 12px;border-radius:10px;border:none;cursor:pointer;transition:all 0.2s;white-space:nowrap;display:flex;align-items:center;gap:5px; }
.bm-plat-btn:hover:not(:disabled) { opacity:0.8;transform:scale(1.04); }
.bm-plat-btn:disabled { opacity:0.6;cursor:wait; }
.bm-plat-stats { display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-top:4px; }
.bm-plat-stat { padding:8px 10px;border-radius:12px;background:hsl(var(--muted)/0.3); }
.bm-plat-connect-cta { padding:10px;border-radius:14px;background:hsl(var(--muted)/0.2); }

/* Compose */
.bm-compose-card { border-radius:28px;background:hsl(var(--card));border:2px solid hsl(var(--border)/0.6);overflow:hidden; }
.bm-compose-header { display:flex;align-items:center;gap:10px;padding:16px 20px;border-bottom:1px solid hsl(var(--border)/0.4);flex-wrap:wrap; }
.bm-compose-body { padding:16px 20px 20px; }
.bm-compose-textarea { width:100%;padding:12px 14px;border-radius:16px;font-size:14px;font-weight:500;resize:none;background:hsl(var(--muted)/0.4);border:2px solid hsl(var(--border)/0.6);outline:none;transition:border 0.2s;color:hsl(var(--foreground));font-family:inherit;line-height:1.6; }
.bm-compose-textarea:focus { border-color:#6366f1;box-shadow:0 0 0 3px #6366f118; }
.bm-compose-char { text-align:right;font-size:10px;font-weight:600;color:hsl(var(--muted-foreground));margin-top:4px;transition:color 0.2s; }
.bm-compose-action-btn { display:flex;align-items:center;gap:6px;padding:7px 14px;border-radius:12px;font-size:12px;font-weight:700;background:hsl(var(--muted)/0.5);border:1.5px solid hsl(var(--border)/0.5);cursor:pointer;transition:all 0.2s;color:hsl(var(--foreground)); }
.bm-compose-action-btn:hover,.bm-btn-active { background:hsl(var(--accent));transform:scale(1.03); }
.bm-schedule-input { height:34px;padding:0 10px;border-radius:10px;font-size:12px;font-weight:600;background:hsl(var(--muted)/0.5);border:1.5px solid hsl(var(--border)/0.6);outline:none;color:hsl(var(--foreground)); }
.bm-post-btn { display:flex;align-items:center;gap:7px;padding:9px 20px;border-radius:14px;font-size:13px;font-weight:900;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;border:none;cursor:pointer;box-shadow:0 4px 16px #6366f138;transition:all 0.3s cubic-bezier(0.34,1.5,0.64,1); }
.bm-post-btn:not(:disabled):hover { transform:scale(1.05) translateY(-1px); }
.bm-post-btn:disabled { opacity:0.45;cursor:not-allowed; }
.bm-plat-toggle-btn { display:flex;align-items:center;gap:5px;padding:5px 12px;border-radius:10px;font-size:11px;font-weight:800;background:hsl(var(--muted)/0.5);border:1.5px solid hsl(var(--border)/0.5);cursor:pointer;transition:all 0.2s;color:hsl(var(--muted-foreground)); }
.bm-plat-toggle-btn.active { transform:scale(1.04); }
.bm-post-targets-row { display:flex;align-items:center;gap:8px;padding:10px 20px;border-top:1px solid hsl(var(--border)/0.4);background:hsl(var(--muted)/0.2);flex-wrap:wrap; }
.bm-target-chip { display:flex;align-items:center;gap:5px;font-size:10px;font-weight:800;padding:4px 10px;border-radius:99px;border:1.5px solid transparent; }

/* Scheduled */
.bm-scheduled-row { display:flex;align-items:center;gap:12px;padding:12px 16px;border-radius:18px;background:hsl(var(--card));border:1.5px solid hsl(var(--border)/0.5); }
.bm-sched-time-badge { display:flex;align-items:center;gap:5px;font-size:10px;font-weight:800;padding:4px 10px;border-radius:99px;background:#8b5cf618;color:#8b5cf6;flex-shrink:0;white-space:nowrap; }
.bm-icon-btn { width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;background:none;border:none;cursor:pointer;transition:all 0.2s; }
.bm-icon-btn:hover { background:hsl(var(--accent)); }

/* Interactions */
.bm-search-input { height:40px;padding-left:36px;padding-right:14px;border-radius:99px;font-size:13px;font-weight:600;background:hsl(var(--muted)/0.5);border:2px solid hsl(var(--border)/0.6);outline:none;transition:border 0.2s;color:hsl(var(--foreground));min-width:200px; }
.bm-search-input:focus { border-color:#6366f1; }
.bm-filter-btn { display:flex;align-items:center;gap:5px;padding:7px 14px;border-radius:99px;font-size:12px;font-weight:700;background:hsl(var(--muted)/0.5);border:1.5px solid hsl(var(--border)/0.5);cursor:pointer;transition:all 0.2s;color:hsl(var(--muted-foreground));white-space:nowrap; }
.bm-filter-btn.active { font-weight:900; }
.bm-count-badge { font-size:9px;font-weight:900;padding:2px 6px;border-radius:99px; }
.bm-refresh-btn { display:flex;align-items:center;gap:6px;padding:7px 14px;border-radius:99px;font-size:12px;font-weight:700;background:hsl(var(--muted)/0.5);border:1.5px solid hsl(var(--border)/0.5);cursor:pointer;color:hsl(var(--muted-foreground));transition:all 0.2s; }
.bm-refresh-btn:hover { color:hsl(var(--foreground)); }
.bm-interaction-card { padding:18px 20px;border-radius:24px;background:hsl(var(--card));border:2px solid hsl(var(--border)/0.5);border-left-width:2px;transition:all 0.22s;display:flex;flex-direction:column;gap:12px; }
.bm-interaction-card:hover { transform:translateY(-1px);box-shadow:0 6px 20px rgba(0,0,0,0.07); }
.bm-interaction-card.unread { border-left-width:4px; }
.bm-interaction-avatar { width:40px;height:40px;border-radius:18px;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:900;flex-shrink:0; }
.bm-platform-chip { display:inline-flex;align-items:center;gap:4px;font-size:10px;font-weight:800;padding:3px 8px;border-radius:99px; }
.bm-type-chip { display:inline-flex;align-items:center;font-size:10px;font-weight:800;padding:3px 8px;border-radius:99px; }
.bm-sentiment { display:inline-flex;align-items:center;gap:4px; }
.bm-our-reply { padding:12px 14px;border-radius:16px;background:hsl(var(--muted)/0.3);border-left:3px solid #6366f1; }
.bm-interaction-actions { display:flex;align-items:center;gap:6px;flex-wrap:wrap; }
.bm-reply-btn { display:flex;align-items:center;gap:5px;padding:6px 14px;border-radius:10px;font-size:12px;font-weight:800;background:hsl(var(--muted)/0.5);border:1.5px solid hsl(var(--border)/0.6);cursor:pointer;color:hsl(var(--foreground));transition:all 0.2s; }
.bm-reply-btn:hover { background:hsl(var(--accent));transform:scale(1.03); }
.bm-action-btn { width:32px;height:32px;border-radius:10px;display:flex;align-items:center;justify-content:center;background:none;border:none;cursor:pointer;color:hsl(var(--muted-foreground));transition:all 0.2s; }
.bm-action-btn:hover { background:hsl(var(--accent));color:hsl(var(--foreground));transform:scale(1.08); }
.bm-reply-composer { border-top:1px solid hsl(var(--border)/0.4);padding-top:14px; }
.bm-ai-suggestions { display:flex;align-items:center;gap:8px;flex-wrap:wrap; }
.bm-suggestion-chip { font-size:11px;font-weight:600;padding:5px 12px;border-radius:10px;background:hsl(var(--muted)/0.4);border:1.5px solid #8b5cf630;cursor:pointer;color:hsl(var(--foreground));transition:all 0.18s; }
.bm-suggestion-chip:hover { background:#8b5cf618;border-color:#8b5cf650;transform:scale(1.02); }
.bm-reply-textarea { width:100%;padding:10px 12px;border-radius:14px;font-size:13px;font-weight:500;resize:none;background:hsl(var(--muted)/0.4);border:2px solid hsl(var(--border)/0.6);outline:none;transition:border 0.2s;color:hsl(var(--foreground));font-family:inherit;line-height:1.5; }
.bm-reply-textarea:focus { border-color:#6366f1; }
.bm-cancel-btn { font-size:12px;font-weight:700;padding:6px 14px;border-radius:10px;background:none;border:1.5px solid hsl(var(--border)/0.6);cursor:pointer;color:hsl(var(--muted-foreground));transition:all 0.2s; }
.bm-submit-reply-btn { display:flex;align-items:center;gap:6px;padding:7px 18px;border-radius:12px;font-size:12px;font-weight:900;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;border:none;cursor:pointer;transition:all 0.3s cubic-bezier(0.34,1.5,0.64,1); }
.bm-submit-reply-btn:not(:disabled):hover { transform:scale(1.05); }
.bm-submit-reply-btn:disabled { opacity:0.4;cursor:not-allowed; }
.bm-empty-state { display:flex;flex-direction:column;align-items:center;padding:48px 16px;border-radius:28px;background:hsl(var(--card));border:2px solid hsl(var(--border)/0.5);text-align:center; }
.bm-empty-icon { width:64px;height:64px;border-radius:24px;display:flex;align-items:center;justify-content:center;background:hsl(var(--muted)/0.4); }

/* Analytics */
.bm-stat-card { padding:20px;border-radius:24px;border:2px solid;transition:transform 0.3s cubic-bezier(0.34,1.2,0.64,1); }
.bm-stat-card:hover { transform:translateY(-3px); }
.bm-stat-icon { width:36px;height:36px;border-radius:14px;display:flex;align-items:center;justify-content:center; }
.bm-perf-row { display:flex;align-items:center;gap:16px;padding:16px 20px;border-radius:20px;background:hsl(var(--card));border:1.5px solid hsl(var(--border)/0.5);flex-wrap:wrap; }
.bm-perf-bars { display:flex;flex-direction:column;gap:8px; }
.bm-perf-bar-row { display:flex;align-items:center;gap:10px; }
.bm-bar-track { flex:1;height:6px;border-radius:99px;background:hsl(var(--muted)/0.5);overflow:hidden;min-width:80px; }
.bm-bar-fill { height:100%;border-radius:99px;transition:width 0.8s cubic-bezier(0.34,1,0.64,1); }

/* Settings */
.bm-settings-card { border-radius:28px;overflow:hidden;background:hsl(var(--card));border:2px solid hsl(var(--border)/0.6); }
.bm-settings-card-header { display:flex;align-items:center;gap:12px;padding:20px 24px;border-bottom:1px solid hsl(var(--border)/0.5); }
.bm-settings-icon { width:40px;height:40px;border-radius:18px;display:flex;align-items:center;justify-content:center;flex-shrink:0; }
.bm-label { display:block;font-size:10px;font-weight:800;color:hsl(var(--muted-foreground));text-transform:uppercase;letter-spacing:0.1em; }
.bm-input { width:100%;height:48px;padding:0 16px;border-radius:20px;font-size:14px;font-weight:500;background:hsl(var(--muted)/0.5);border:2px solid hsl(var(--border)/0.7);outline:none;transition:all 0.2s;color:hsl(var(--foreground)); }
.bm-input:focus { border-color:#f59e0b;box-shadow:0 0 0 3px #f59e0b18; }
.bm-toggle { position:relative;width:56px;height:32px;border-radius:999px;background:hsl(var(--muted));border:2px solid hsl(var(--border)/0.8);transition:all 0.35s cubic-bezier(0.34,1.56,0.64,1);flex-shrink:0;cursor:pointer; }
.bm-toggle.active { background:#6366f1;border-color:#6366f1;box-shadow:0 2px 12px #6366f138; }
.bm-toggle-thumb { position:absolute;top:3px;left:3px;width:22px;height:22px;border-radius:50%;background:white;display:flex;align-items:center;justify-content:center;color:hsl(var(--muted-foreground));transition:all 0.35s cubic-bezier(0.34,1.56,0.64,1);box-shadow:0 2px 6px rgba(0,0,0,0.18); }
.bm-toggle.active .bm-toggle-thumb { left:calc(100% - 25px);color:#6366f1; }
.bm-toggle-small { position:relative;width:44px;height:26px;border-radius:999px;background:hsl(var(--muted));border:2px solid hsl(var(--border)/0.8);cursor:pointer;transition:all 0.3s;flex-shrink:0; }
.bm-toggle-small.active { background:#10b981;border-color:#10b981; }
.bm-toggle-thumb-sm { position:absolute;top:2px;left:2px;width:18px;height:18px;border-radius:50%;background:white;transition:all 0.3s;box-shadow:0 1px 4px rgba(0,0,0,0.18); }
.bm-toggle-small.active .bm-toggle-thumb-sm { left:calc(100% - 20px); }
.bm-save-btn { align-self:flex-start;display:flex;align-items:center;gap:8px;height:48px;padding:0 28px;border-radius:99px;font-size:14px;font-weight:900;color:white;background:linear-gradient(135deg,#6366f1,#8b5cf6);box-shadow:0 4px 16px #6366f138;border:none;cursor:pointer;transition:all 0.3s cubic-bezier(0.34,1.5,0.64,1); }
.bm-save-btn:hover:not(:disabled) { transform:scale(1.04) translateY(-1px); }
.bm-save-btn:disabled { opacity:0.5;cursor:not-allowed; }


/* ══ CUSTOMER DISPLAY BUILDER ══════════════════════════════════════ */

/* Pair card */
.disp-pair-card {
  border-radius: 28px; background: hsl(var(--card));
  border: 2px solid hsl(var(--border)/0.5);
  overflow: hidden; transition: border-color 0.3s ease;
}
.disp-pair-card--paired { border-color: #10b98140; }
.disp-pair-inner {
  display: flex; align-items: center; gap: 16px; padding: 20px 24px; flex-wrap: wrap;
}
.disp-pair-icon {
  width: 44px; height: 44px; border-radius: 22px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.disp-pair-step-btn {
  display: flex; align-items: center; gap: 6px;
  padding: 9px 18px; border-radius: 99px;
  font-size: 13px; font-weight: 800; color: white;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  box-shadow: 0 4px 14px #6366f140; border: none; cursor: pointer;
  transition: all 0.3s cubic-bezier(0.34,1.5,0.64,1);
  white-space: nowrap;
}
.disp-pair-step-btn:hover { transform: scale(1.05) translateY(-1px); }

/* Wizard */
.disp-wizard {
  border-top: 1px solid hsl(var(--border)/0.4);
  padding: 24px; background: hsl(var(--muted)/0.2);
}
.disp-wizard-step { display: flex; flex-direction: column; gap: 16px; }

.disp-method-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
@media (max-width: 700px) { .disp-method-grid { grid-template-columns: repeat(2, 1fr); } }
.disp-method-card {
  position: relative; padding: 20px 16px; border-radius: 20px;
  background: hsl(var(--muted)/0.4);
  border: 2px solid hsl(var(--border)/0.6);
  cursor: pointer; text-align: center;
  transition: all 0.3s cubic-bezier(0.34, 1.3, 0.64, 1);
}
.disp-method-card:hover { transform: translateY(-3px); border-color: hsl(var(--border)); }
.disp-method-card--active { border-color: #6366f1 !important; background: #6366f108; }
.disp-method-icon {
  width: 48px; height: 48px; border-radius: 24px;
  display: flex; align-items: center; justify-content: center; margin: 0 auto;
}
.disp-method-check {
  position: absolute; top: 10px; right: 10px;
  width: 20px; height: 20px; border-radius: 50%;
  background: #6366f1; display: flex; align-items: center; justify-content: center; color: white;
}

/* Instructions */
.disp-instructions { display: flex; flex-direction: column; gap: 16px; }
.disp-instruction-row { display: flex; gap: 14px; align-items: flex-start; }
.disp-instruction-num {
  width: 28px; height: 28px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 900; flex-shrink: 0;
  background: #6366f120; color: #6366f1;
}
.disp-code-block {
  display: flex; align-items: center; gap: 8px; margin-top: 8px;
  padding: 10px 14px; border-radius: 14px;
  background: hsl(var(--muted)/0.5); border: 1.5px solid hsl(var(--border)/0.5);
  font-size: 12px; font-family: monospace; word-break: break-all;
}
.disp-copy-btn {
  flex-shrink: 0; padding: 4px; border-radius: 8px;
  background: none; border: none; cursor: pointer;
  color: hsl(var(--muted-foreground)); transition: all 0.2s;
}
.disp-copy-btn:hover { color: hsl(var(--foreground)); background: hsl(var(--muted)); }

.disp-qr-row { display: flex; gap: 16px; align-items: stretch; }
.disp-qr-box {
  width: 100px; flex-shrink: 0; border-radius: 16px;
  border: 2px dashed hsl(var(--border)/0.5);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 12px;
}
.disp-url-box {
  flex: 1; padding: 14px 16px; border-radius: 16px;
  background: hsl(var(--muted)/0.4); border: 1.5px solid hsl(var(--border)/0.5);
}

/* Buttons */
.disp-btn {
  display: inline-flex; align-items: center; gap: 7px;
  padding: 9px 18px; border-radius: 99px;
  font-size: 13px; font-weight: 800; border: none; cursor: pointer;
  transition: all 0.3s cubic-bezier(0.34, 1.4, 0.64, 1);
  white-space: nowrap;
}
.disp-btn:hover:not(:disabled) { transform: scale(1.04) translateY(-1px); }
.disp-btn:active:not(:disabled) { transform: scale(0.96); }
.disp-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.disp-btn--primary {
  background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white;
  box-shadow: 0 4px 14px #6366f140;
}
.disp-btn--outline {
  background: transparent; color: hsl(var(--foreground));
  outline: 2px solid hsl(var(--border)); outline-offset: 0;
}
.disp-btn--sm { padding: 6px 14px; font-size: 12px; }

/* Builder layout */
.disp-builder {
  display: grid; grid-template-columns: 320px 1fr; gap: 16px; align-items: start;
}
@media (max-width: 900px) { .disp-builder { grid-template-columns: 1fr; } }

/* Slide sequence */
.disp-sequence {
  border-radius: 24px; background: hsl(var(--card));
  border: 1.5px solid hsl(var(--border)/0.5);
  overflow: hidden;
}
.disp-sequence-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 18px; border-bottom: 1px solid hsl(var(--border)/0.4);
}
.disp-slide-list { display: flex; flex-direction: column; gap: 2px; padding: 8px; min-height: 80px; }
.disp-slide-item {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 12px; border-radius: 16px; cursor: pointer;
  transition: all 0.2s ease;
}
.disp-slide-item:hover { background: hsl(var(--muted)/0.5); }
.disp-slide-item--active { background: #6366f110 !important; outline: 1.5px solid #6366f140; outline-offset: 0; }
.disp-slide-drag { cursor: grab; flex-shrink: 0; }
.disp-slide-thumb {
  width: 40px; height: 28px; border-radius: 8px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
}
.disp-slide-action {
  width: 26px; height: 26px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  background: none; border: none; cursor: pointer;
  color: hsl(var(--muted-foreground)); transition: all 0.2s;
}
.disp-slide-action:hover:not(:disabled) { background: hsl(var(--muted)); color: hsl(var(--foreground)); }
.disp-slide-action:disabled { opacity: 0.25; cursor: not-allowed; }
.disp-slide-action--danger:hover:not(:disabled) { background: #ef444420; color: #ef4444; }
.disp-slide-empty {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 8px; padding: 32px; text-align: center;
  font-size: 12px; font-weight: 600; color: hsl(var(--muted-foreground));
}

.disp-add-slide-section { padding: 16px; border-top: 1px solid hsl(var(--border)/0.4); }
.disp-add-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
.disp-add-btn {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 12px; border-radius: 14px;
  background: hsl(var(--muted)/0.4);
  border: 1.5px solid hsl(var(--border)/0.5);
  cursor: pointer; transition: all 0.25s cubic-bezier(0.34, 1.4, 0.64, 1);
}
.disp-add-btn:hover { transform: scale(1.03) translateY(-1px); background: hsl(var(--muted)/0.7); }
.disp-add-btn-icon { width: 30px; height: 30px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }

/* Editor panel */
.disp-editor {
  border-radius: 24px; background: hsl(var(--card));
  border: 1.5px solid hsl(var(--border)/0.5);
  min-height: 480px; display: flex; flex-direction: column;
}
.disp-editor-inner { padding: 24px; display: flex; flex-direction: column; gap: 20px; }
.disp-editor-empty {
  flex: 1; display: flex; flex-direction: column;
  align-items: center; justify-content: center; padding: 48px; text-align: center;
}
.disp-editor-header {
  display: flex; align-items: center; justify-content: space-between;
  padding-bottom: 16px; border-bottom: 1px solid hsl(var(--border)/0.4);
}
.disp-edit-type-badge {
  display: flex; align-items: center; gap: 6px;
  padding: 5px 12px; border-radius: 99px;
  font-size: 11px; font-weight: 900;
}
.disp-duration-btns { display: flex; gap: 4px; }
.disp-dur-btn {
  padding: 5px 10px; border-radius: 10px;
  font-size: 11px; font-weight: 800;
  background: hsl(var(--muted)/0.5);
  border: 1.5px solid hsl(var(--border)/0.5);
  cursor: pointer; transition: all 0.2s; color: hsl(var(--muted-foreground));
}
.disp-dur-btn.active { background: #6366f120; border-color: #6366f160; color: #6366f1; }
.disp-dur-btn:hover { color: hsl(var(--foreground)); }

.disp-field-row { display: flex; flex-direction: column; gap: 6px; }
.disp-field-group { display: flex; flex-direction: column; gap: 8px; }

/* Colors */
.disp-color-swatch {
  width: 48px; height: 48px; border-radius: 20px; flex-shrink: 0;
  border: 2px solid hsl(var(--border)/0.5); overflow: hidden;
  cursor: pointer;
}
.disp-color-input { width: 100%; height: 100%; border: none; padding: 0; cursor: pointer; }
.disp-preset-colors { display: flex; flex-wrap: wrap; gap: 6px; }
.disp-preset-swatch {
  width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0;
  border: 2px solid transparent; cursor: pointer;
  transition: all 0.25s cubic-bezier(0.34, 1.5, 0.64, 1);
}
.disp-preset-swatch:hover { transform: scale(1.2); }
.disp-preset-swatch.active { border-color: white; box-shadow: 0 0 0 2px #6366f1, 0 2px 8px rgba(0,0,0,0.2); transform: scale(1.15); }

/* Range input */
.disp-range {
  width: 100%; height: 6px; border-radius: 3px;
  background: hsl(var(--muted)); outline: none; cursor: pointer;
}
.disp-range::-webkit-slider-thumb {
  width: 18px; height: 18px; border-radius: 50%;
  background: #6366f1; cursor: pointer; -webkit-appearance: none;
  box-shadow: 0 2px 6px #6366f140;
}

/* Align buttons */
.disp-align-btns { display: flex; gap: 4px; }
.disp-align-btn {
  padding: 7px 16px; border-radius: 12px;
  font-size: 12px; font-weight: 800; text-transform: capitalize;
  background: hsl(var(--muted)/0.5);
  border: 1.5px solid hsl(var(--border)/0.5);
  cursor: pointer; color: hsl(var(--muted-foreground)); transition: all 0.2s;
}
.disp-align-btn.active { background: #6366f120; border-color: #6366f160; color: #6366f1; }
.disp-align-btn:hover { color: hsl(var(--foreground)); }

/* Category chips */
.disp-category-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.disp-cat-chip {
  padding: 5px 14px; border-radius: 99px;
  font-size: 11px; font-weight: 800;
  background: hsl(var(--muted)/0.5);
  border: 1.5px solid hsl(var(--border)/0.5);
  cursor: pointer; color: hsl(var(--muted-foreground)); transition: all 0.2s;
}
.disp-cat-chip.active { background: #10b98120; border-color: #10b98160; color: #10b981; }
.disp-cat-chip:hover { color: hsl(var(--foreground)); }

/* Live preview strip */
.disp-preview-strip {
  border-radius: 20px; padding: 24px 28px; min-height: 100px;
  display: flex; flex-direction: column; justify-content: center;
  transition: all 0.4s ease;
}
.disp-preview-label {
  display: flex; align-items: center; gap: 5px;
  font-size: 9px; font-weight: 900; letter-spacing: 0.2em;
  text-transform: uppercase; color: rgba(255,255,255,0.4); margin-bottom: 8px;
}
.disp-preview-headline {
  font-size: 28px; font-weight: 900; color: white;
  letter-spacing: -0.02em; text-transform: uppercase;
}

/* Display settings card */
.disp-settings-card {
  padding: 24px; border-radius: 24px;
  background: hsl(var(--card)); border: 1.5px solid hsl(var(--border)/0.5);
}

/* Toggle */
.disp-toggle-row { display: flex; align-items: center; gap: 10px; }
.disp-toggle {
  width: 44px; height: 26px; border-radius: 99px;
  background: hsl(var(--muted)/0.6); border: none; cursor: pointer;
  position: relative; transition: all 0.3s ease;
  padding: 0;
}
.disp-toggle.active { background: #6366f1; }
.disp-toggle-thumb {
  position: absolute; top: 3px; left: 3px;
  width: 20px; height: 20px; border-radius: 50%;
  background: white; transition: all 0.3s cubic-bezier(0.34, 1.5, 0.64, 1);
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}
.disp-toggle.active .disp-toggle-thumb { left: 21px; }

/* Wizard transition */
.wizard-slide-enter-active { transition: all 0.4s cubic-bezier(0.34, 1.2, 0.64, 1); }
.wizard-slide-leave-active { transition: all 0.3s ease; }
.wizard-slide-enter-from { opacity: 0; transform: translateY(-12px); }
.wizard-slide-leave-to { opacity: 0; transform: translateY(-8px); }

</style>
