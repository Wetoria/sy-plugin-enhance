<template>
  <Teleport :to="toEl">
    <div
      class="tagPlaceholder"
      :style="{
        width: `${pWidth}px`,
        height: `${pHeight}px`,
      }"
    >
    </div>
    <template v-if="el.firstElementChild.textContent">
      <template
        v-for="item of randomCount"
        :key="item"
      >
        <a-tag>
          测试 Tag {{ item }}
        </a-tag>
      </template>
    </template>
  </Teleport>
</template>

<script setup lang="ts">
import { debounce } from '@/utils'
import { getLastCharPositionFromTextNode } from '@/utils/DOM'
import {
  nextTick,
  onMounted,
  ref,
} from 'vue'

const props = defineProps<{
  el: HTMLSpanElement
  toEl: HTMLElement
}>()

const randomCount = Math.floor(Math.random() * 15) + 1

const pWidth = ref(0)
const pHeight = ref(0)
const handler = debounce(() => {
  console.log('handler', props.el)
  const nodes = props.el?.firstChild?.childNodes || []
  // 添加一个递归函数来查找最后一个非空的 textNode
  const findLastTextNode = (nodes: NodeList): Text | null => {
    for (let i = nodes.length - 1; i >= 0; i--) {
      const node = nodes[i]
      if (node.nodeType === Node.TEXT_NODE) {
        // 如果是文本节点且不为空（去除空白字符）
        if (node.textContent?.trim()) {
          return node as Text
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        // 如果是元素节点，递归查找其子节点
        const lastTextNode = findLastTextNode(node.childNodes)
        if (lastTextNode) {
          return lastTextNode
        }
      }
    }
    return null
  }

  nextTick(() => {
    const toElRect = props.toEl.getBoundingClientRect()
    const currentHeight = props.el.clientHeight
    if (!props.el?.firstElementChild?.textContent) {
      return
    }
    if (toElRect.height > currentHeight) {
      props.el.style.setProperty('--en-super-tag-margin-bottom', `${toElRect.height - currentHeight + 4 + 4}px`)
    }
    // props.el.style.height = `${toElRect.height}px`
  })

  const lastNode = findLastTextNode(nodes)
  if (!lastNode) {
    pWidth.value = 0
    pHeight.value = 0
    return
  }
  const lastCharPosition = getLastCharPositionFromTextNode(lastNode)
  console.log('lastCharPosition', lastCharPosition)
  if (!lastCharPosition) {
    pWidth.value = 0
    pHeight.value = 0
    return
  }
  const rect = props.el.firstElementChild.getBoundingClientRect()
  pWidth.value = lastCharPosition.right - rect.left
  pHeight.value = lastCharPosition.bottom - rect.top

}, 0)
const observer = new MutationObserver(handler)

observer.observe(props.el, {
  childList: true,
  subtree: true,
  characterData: true,
})
onMounted(() => {
  handler()
})
</script>

<style lang="scss" scoped>
.tagPlaceholder {
  display: inline-block;
}
</style>

<style lang="scss">
.enTestTag {
  width: 100%;
  position: absolute;
  top: 4px;
  left: 4px;
  z-index: 1000;
  pointer-events: none;

  display: flex;
  flex-wrap: wrap;
  align-items: end;
  gap: var(--en-gap);
}

div[data-type="NodeParagraph"] {
  margin-bottom: var(--en-super-tag-margin-bottom) !important;
}
</style>
