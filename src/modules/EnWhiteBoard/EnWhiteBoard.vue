<template>
  <EnWhiteBoardEntry />
</template>

<script lang="ts">
export interface EnWhiteBoardIndexMap {
  [key: string]: {
    whiteBoardId: string
    whiteBoardName: string
  }
}

const whiteBoardIndexMap = useSyncModuleData<EnWhiteBoardIndexMap>({
  namespace: 'enWhiteBoardIndexMap',
  defaultData: {},
})

// TODO 获取白板的逻辑
export function getWhiteBoardListBySearchValue(searchValue: string) {
  const testData = [
  ]

  for (let i = 1; i < 21; i++) {
    testData.push({
      whiteBoardId: `en-whiteboard-id-${i}`,
      whiteBoardName: `白板 ${i}`,
    })
  }

  return testData.filter(item => {
    const included = item.whiteBoardName.includes(searchValue) || item.whiteBoardId.includes(searchValue)
    return included
  })
}
</script>

<script setup lang="ts">
import { useSyncModuleData } from '@/utils/SyncData';
import EnWhiteBoardEntry from './EnWhiteBoardEntry.vue';

</script>

<style lang="scss" scoped>

</style>
