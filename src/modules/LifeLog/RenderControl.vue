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
import { useProtyleList } from '@/global/ProtyleList'
import EnLifeLogDailyNoteGraph from '@/modules/LifeLog/EnLifeLogDailyNoteGraph.vue'
import {
  computed,
} from 'vue'

const protyleList = useProtyleList()
const protyleContentRefList = computed<IProtyleObserverItem[]>(() => {
  return protyleList.value.filter((item) => item.isDailyNote && item.isEditorProtyle)
})
</script>

<style lang="scss" scoped>

</style>
