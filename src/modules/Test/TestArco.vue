<template>
  <div class="test" v-if="settings.enableLockParagraph">
    <!-- <AButton>Test</AButton> -->
  </div>
</template>

<script setup lang="ts">
const settings = useSettings()
</script>



<script lang="ts">
import { useSettings } from '@/logic/Settings';
import { ref } from 'vue';

export interface TestArcoType {
  test: boolean;
}
export function testFunc(path) {
  const test = ref('test')
  console.log(`log in test Func by: ${path}. ${test.value}`)
}
</script>

<style lang="scss" scoped>
.test {
  display: flex;
  pointer-events: all;
}
</style>
