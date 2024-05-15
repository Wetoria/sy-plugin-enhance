<template>
  <Teleport
    :to="pProtyleAttrRef"
    v-if="pProtyleAttrRef"
  >
    <slot
      :created="created"
      :createdFormatted="createdFormatted"
      :updated="updated"
      :updatedFormatted="updatedFormatted"
    ></slot>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import dayjs from 'dayjs';
import { debounce } from '@/utils';

const props = defineProps<{
  el: HTMLSpanElement
}>()
const updated = ref(getUpdated(props.el))
const updatedFormatted = computed(() => updated.value ? `updated: ${updated.value.format(FORMAT_TIME)}` : '')

const created = computed(() => {
  const nodeId = props.el.dataset.nodeId
  const createdInId = nodeId.split('-')[0]
  props.el.setAttribute('created', createdInId)
  return dayjs(createdInId)
})
const createdFormatted = computed(() => `created: ${created.value.format(FORMAT_TIME)}`)

const getRef = () => {
  if (!props.el) return
  const protyleAttr = props.el.querySelector('.protyle-attr')
  if (!protyleAttr) return
  return protyleAttr.querySelector('.enProtyleAttrContainer')
}

const pProtyleAttrRef = ref(getRef())

const watchParagraphAttrChange = () => {
  if (props.el) {
    const handler = () => {
      pProtyleAttrRef.value = getRef()
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
      childList: true,
      subtree: true,
      attributes: true,
    })
  }
}

watch(() => props.el, () => {
  watchParagraphAttrChange()
}, { immediate: true })

</script>

<script lang="ts">
export const FORMAT_DATE = 'YYYY/MM/DD'
export const FORMAT_TIME = 'HH:mm:ss'
export const FORMAT_DATE_TIME = `${FORMAT_DATE} ${FORMAT_TIME}`

export const getUpdated = (pDom) => {
  const updateTimeStr = pDom.getAttribute('updated')
  if (!updateTimeStr) {
    return
  }
  return dayjs(updateTimeStr)
}
</script>

<style lang="scss">

</style>
