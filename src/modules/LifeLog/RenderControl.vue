<template>
  <template
    v-for="item of protyleContentRefList"
    :key="item.enLoopKey"
  >
    <EnLifeLogDailyNoteGraph
      :enProtyleItem="item"
    />
  </template>
</template>

<script setup lang="ts">
import { injectGlobalWindowData } from '@/modules/EnModuleControl/ModuleProvide'
import EnLifeLogDailyNoteGraph from '@/modules/LifeLog/EnLifeLogDailyNoteGraph.vue'
import {
  computed,
} from 'vue'

const globalWindowData = injectGlobalWindowData()
const protyleContentRefList = computed<IProtyleObserverItem[]>(() => {
  return globalWindowData.value.protyleList.filter((item) => item.isDailyNote)
})
</script>

<style lang="scss" scoped>

</style>
