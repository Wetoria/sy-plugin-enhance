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
      @transitionend="onTransitionEnd"
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
const desiredExpanded = ref(false)
const contentRef = ref<HTMLElement>()
const contentWidth = ref(0)

const switchExpanded = async () => {
  const newExpanded = !desiredExpanded.value
  desiredExpanded.value = newExpanded

  if (newExpanded) {
    // 展开：立即添加 expanded 类（让 gap 生效），宽度从 0 动画到内容宽
    expanded.value = true
    contentWidth.value = 0
    await nextTick()
    if (contentRef.value) {
      const actualWidth = contentRef.value.scrollWidth
      contentWidth.value = actualWidth
    }
  } else {
    // 收起：仅把宽度动画到 0，expanded 类在动画结束后再移除
    contentWidth.value = 0
  }
}

const onTransitionEnd = (event: TransitionEvent) => {
  if (event.propertyName !== 'width') return
  // 动画结束后，如果目标是收起，则此时再移除 expanded 类，避免提前改变 gap
  if (!desiredExpanded.value) {
    expanded.value = false
  }
}

onMounted(() => {
  // 初始为收起状态，宽度为 0
  expanded.value = false
  desiredExpanded.value = false
  contentWidth.value = 0
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
