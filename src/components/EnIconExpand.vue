<template>
  <div
    class="EnIconExpand"
    :class="{
      expanded,
    }"
  >
    <div
      class="EnIconExpand__icon"
      @click="switchExpanded"
    >
      <slot name="trigger">
      </slot>
    </div>
    <div
      ref="contentRef"
      class="EnIconExpand__content"
      :style="{
        width: `${contentWidth}px`,
      }"
    >
      <a-space>
        <slot></slot>
      </a-space>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  nextTick,
  onMounted,
  ref,
} from 'vue'

const expanded = ref(false)
const contentRef = ref<HTMLElement>()
const contentWidth = ref(0)

const switchExpanded = async () => {
  const newExpanded = !expanded.value

  if (newExpanded) {
    // 展开时，先设置为0，然后动画到实际宽度
    contentWidth.value = 0
    await nextTick()
    // 获取内容的实际宽度
    if (contentRef.value) {
      const actualWidth = contentRef.value.scrollWidth
      contentWidth.value = actualWidth
    }
  } else {
    // 收起时，动画到0
    contentWidth.value = 0
  }

  // 防止过早设置，导致元素移动的问题
  expanded.value = newExpanded
}

onMounted(() => {
  // 初始化时，如果未展开则宽度为0
  if (!expanded.value) {
    contentWidth.value = 0
  }
})
</script>

<style lang="scss" scoped>
.EnIconExpand {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: start;

  &.expanded {
    gap: 4px;
  }

  .EnIconExpand__icon {
    display: flex;
    cursor: pointer;
    user-select: none;
  }

  .EnIconExpand__content {
    overflow: hidden;
    transition: width 0.3s ease-in-out;
    white-space: nowrap;
  }
}
</style>
