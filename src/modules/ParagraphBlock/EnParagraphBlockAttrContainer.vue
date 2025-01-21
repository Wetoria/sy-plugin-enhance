<template>
  <Teleport
    v-if="toEl"
    :to="toEl"
  >
    <div
      ref="attrContainerRef"
      class="enProtyleAttrContainerComponent"
    >
      <slot
        :created="created"
        :createdFormatted="createdFormatted"
        :updated="updated"
        :updatedFormatted="updatedFormatted"
        :nodeId="nodeId"
        :content="paragraphBlockContent"
      ></slot>
    </div>
  </Teleport>
</template>

<script lang="ts">
import { debounce } from '@/utils'
import { EN_STYLE_KEYS } from '@/utils/Constants'
import dayjs from 'dayjs'
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from 'vue'

export const FORMAT_DATE = 'YYYY/MM/DD'
export const FORMAT_TIME = 'HH:mm:ss'
export const FORMAT_DATE_TIME = `${FORMAT_DATE} ${FORMAT_TIME}`

export const getNodeId = (pDom) => {
  return pDom.dataset.nodeId
}

export const getUpdated = (pDom) => {
  const updateTimeStr = pDom.getAttribute('updated')
  if (!updateTimeStr) {
    return
  }
  return dayjs(updateTimeStr)
}
</script>

<script setup lang="ts">

const props = defineProps<{
  el: HTMLSpanElement
  toEl: HTMLElement
}>()
const nodeId = ref(getNodeId(props.el))
const updated = ref(getUpdated(props.el))
const updatedFormatted = computed(() => updated.value ? `updated: ${updated.value.format(FORMAT_TIME)}` : '')

const created = computed(() => {
  const nodeId = props.el.dataset.nodeId
  const createdInId = nodeId.split('-')[0]
  props.el.setAttribute('created', createdInId)
  return dayjs(createdInId)
})
const createdFormatted = computed(() => `created: ${created.value.format(FORMAT_TIME)}`)

const paragraphBlockContent = ref('')

const watchParagraphAttrChange = () => {
  if (props.el) {
    const handler = () => {
      const content = props.el.firstElementChild.textContent
      paragraphBlockContent.value = content
      const newUpdated = getUpdated(props.el)
      if (!newUpdated) {
        return
      }
      if (!updated.value) {
        updated.value = newUpdated
        return
      }
      if (!newUpdated.isSame(updated.value)) {
        updated.value = newUpdated
      }
    }
    handler()
    const ob = new MutationObserver(debounce(handler, 300))
    ob.observe(props.el, {
      attributes: true,
    })
  }
}

watch(() => props.el, () => {
  watchParagraphAttrChange()
}, { immediate: true })

const attrContainerRef = ref<HTMLDivElement | null>(null)
const resizeObserver = new ResizeObserver(() => {
  if (!attrContainerRef.value) return
  const width = attrContainerRef.value.offsetWidth + 2

  props.el.style.setProperty(EN_STYLE_KEYS.enAttrContainerWidth, `${width}px`)
})

onMounted(() => {
  resizeObserver.observe(attrContainerRef.value)
})
onBeforeUnmount(() => {
  console.log('onBeforeUnmount attr container')
  resizeObserver.disconnect()
  attrContainerRef.value = null
})
</script>

<style lang="scss" scoped>
.enProtyleAttrContainerComponent {
  display: flex;
  justify-content: end;
  align-items: center;
  gap: var(--en-gap);

  width: 100%;

  font-variant-numeric: tabular-nums;
}
</style>
