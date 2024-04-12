<template>
  <div class="ProtyleBottomContainer">
    <div v-if="settings.isDebugging">Protyle Bottom Area</div>
    <EnProtyleBottomIndicator
      :blockId="protyle.block.id"
    />
    <!-- <EnProtyleBottomBackLink
    /> -->
  </div>
</template>

<script setup lang="ts">
import { computed, watchEffect } from 'vue';
import EnProtyleBottomIndicator from './EnProtyleBottomIndicator.vue';
import { IProtyle } from 'siyuan/types';
import EnProtyleBottomBackLink from './BackLink/EnProtyleBottomBackLink.vue';
import { useSettings } from '@/modules/Settings/EnSettings.vue';

const settings = useSettings()

interface IProtyleBottom {
  detail: any
  element: HTMLDivElement
  enArea: HTMLDivElement
}
const props = defineProps<{
  protyleBottom: IProtyleBottom
}>()

const protyleBottom = computed(() => props.protyleBottom)
const protyle = computed(() => protyleBottom.value.detail.protyle as IProtyle)

const checkProtyleContentPadding = () => {
  const {
    element,
    enArea: div
  } = props.protyleBottom
  const wysiwyg: HTMLDivElement = element.querySelector('.protyle-wysiwyg')
  if (wysiwyg) {
    const bindPadding = () => {
      const leftPadding = Number(wysiwyg.style.paddingLeft.replace('px', ''))
      const rightPadding = Number(wysiwyg.style.paddingRight.replace('px', ''))
      div.style.paddingLeft = (leftPadding - 8) + 'px'
      div.style.paddingRight = (rightPadding - 8) + 'px'
      // IMP 改成可以配置的
      wysiwyg.style.paddingBottom = '68px'
    }
    bindPadding()
    let flag = null
    const ob = new MutationObserver(() => {
      if (flag) {
        clearTimeout(flag)
      }
      flag = setTimeout(() => {
        bindPadding()
      }, 0)
    })
    ob.observe(wysiwyg, {
      childList: true, // 观察目标子节点的变化，是否有添加或者删除
      subtree: true,
      attributes: true,
    })
  }
}

watchEffect(() => {
  console.log('el is ', props.protyleBottom.element)
  checkProtyleContentPadding()
})
</script>

<style lang="scss" scoped>
.enhanceProtyleBottomContainer {
  display: flex;
  flex-direction: column;
  background-color: red;

  .ProtyleBottomContainer {
    padding-bottom: 30px;
  }
}
</style>
