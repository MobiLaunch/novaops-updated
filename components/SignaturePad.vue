<template>
  <div class="flex flex-col gap-2">
    <label class="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">{{ label }}</label>
    <div class="border border-border rounded-xl overflow-hidden bg-surface">
      <canvas
        ref="canvasRef"
        :width="width"
        :height="height"
        class="touch-none"
        style="cursor:crosshair"
        @mousedown="startDrawing"
        @mousemove="draw"
        @mouseup="stopDrawing"
        @mouseleave="stopDrawing"
        @touchstart.prevent="startDrawing"
        @touchmove.prevent="draw"
        @touchend.prevent="stopDrawing"
      />
    </div>
    <div class="flex gap-2 mt-1">
      <v-btn 
        variant="outlined" 
        color="secondary" 
        prepend-icon="mdi-close" 
        class="rounded-full text-xs font-bold text-none" 
        @click="clear" 
      >
        Clear
      </v-btn>
      <v-btn 
        variant="outlined" 
        color="primary" 
        prepend-icon="mdi-content-save" 
        class="rounded-full text-xs font-bold text-none" 
        @click="save" 
      >
        Save Signature
      </v-btn>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const props = defineProps<{
  label?: string
  width?: number
  height?: number
  modelValue?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const isDrawing = ref(false)
const ctx = ref<CanvasRenderingContext2D | null>(null)

onMounted(() => {
  if (canvasRef.value) {
    ctx.value = canvasRef.value.getContext('2d')
    if (ctx.value) {
      ctx.value.strokeStyle = '#000'
      ctx.value.lineWidth = 2
      ctx.value.lineCap = 'round'
    }

    // Load existing signature
    if (props.modelValue) {
      const img = new Image()
      img.onload = () => {
        ctx.value?.drawImage(img, 0, 0)
      }
      img.src = props.modelValue
    }
  }
})

const startDrawing = (e: MouseEvent | TouchEvent) => {
  isDrawing.value = true
  const pos = getPosition(e)
  if (ctx.value && pos) {
    ctx.value.beginPath()
    ctx.value.moveTo(pos.x, pos.y)
  }
}

const draw = (e: MouseEvent | TouchEvent) => {
  if (!isDrawing.value || !ctx.value) return
  const pos = getPosition(e)
  if (pos) {
    ctx.value.lineTo(pos.x, pos.y)
    ctx.value.stroke()
  }
}

const stopDrawing = () => {
  isDrawing.value = false
}

const getPosition = (e: MouseEvent | TouchEvent) => {
  if (!canvasRef.value) return null
  const rect = canvasRef.value.getBoundingClientRect()

  if (e instanceof MouseEvent) {
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }
  } else {
    const touch = e.touches[0]
    return {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    }
  }
}

const clear = () => {
  if (ctx.value && canvasRef.value) {
    ctx.value.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height)
    emit('update:modelValue', '')
  }
}

const save = () => {
  if (canvasRef.value) {
    const dataUrl = canvasRef.value.toDataURL('image/png')
    emit('update:modelValue', dataUrl)
  }
}
</script>
