<template>
  <template
    v-for="(item, index) of paragraphOnlyLinkList"
    :key="`${item.dataset.nodeId}-${index}`"
  >
    <EnProtyleCustomArea
      :getTargetBlockDom="() => item"
      name="enParagraphLinkCardArea"
    >
      <template #customArea>
        <div style="width: 100%; border: 1px solid red;">
          {{ item.dataset.nodeId }} need render link card
        </div>
        <a-button @click="handleClick">
          比如这样渲染一个 button
        </a-button>
      </template>
    </EnProtyleCustomArea>
  </template>
</template>

<script setup lang="ts">
import EnProtyleCustomArea from '@/components/EnProtyleCustomArea.vue'
import { injectParagraphOnlyLink } from '@/modules/ParagraphBlock/EnParagraphBlock'
import { Message } from '@arco-design/web-vue'



const paragraphOnlyLinkList = injectParagraphOnlyLink()

const handleClick = () => {
  Message.info('点击了')
}

</script>

<style lang="scss" scoped>

</style>

<style lang="scss">
// 如果不需要盖住原文的区域的话，删掉这部分样式即可
.enParagraphLinkCardArea {
  position: absolute;
  width: 100%;
  height: 100%;
  background: red;
  top: 1px;
  z-index: 1;
  overflow: hidden;
}
</style>
