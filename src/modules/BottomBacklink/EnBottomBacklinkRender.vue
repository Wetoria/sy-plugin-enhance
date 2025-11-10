<template>
  <template
    v-for="item of protyleContentRefList"
    :key="item.protyleBlockId"
  >
    <RenderArea
      :blockId="item.protyleBlockId"
      :protyleContentEl="item.protyleContentEl"
    />
  </template>
</template>

<script setup lang="ts">
import { useProtyleList } from '@/global/ProtyleList'
import RenderArea from '@/modules/BottomBacklink/RenderArea.vue'
import { useModule } from '@/modules/EnModuleControl/ModuleProvide'
import {
  EN_MODULE_LIST,
  EN_STYLE_KEYS,
} from '@/utils/Constants'
import {
  computed,
  onBeforeUnmount,
  watchEffect,
} from 'vue'



const protyleList = useProtyleList()
const protyleContentRefList = computed(() =>
  // 只渲染编辑区和闪卡中的文档
  protyleList.value.filter((item) => item.isEditorProtyle || item.isFlashCardProtyle),
)


const {
  moduleOptions,
} = useModule<BottomBacklinkModuleOptions>(EN_MODULE_LIST.EN_BOTTOM_BACKLINK)

// 更新底部反链离文档底部的距离
watchEffect(() => {
  document.documentElement.style.setProperty(EN_STYLE_KEYS.enBottomBacklinkTopDistance, `${moduleOptions.value.bottomBacklinkTopDistance}px`)
})
onBeforeUnmount(() => {
  document.documentElement.style.removeProperty(EN_STYLE_KEYS.enBottomBacklinkTopDistance)
})

</script>

<style lang="scss" scoped>

</style>
