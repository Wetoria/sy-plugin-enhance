<template>
  <div class="test" v-if="settings.enableLockParagraph">
    <!-- <AButton>Test</AButton> -->
  </div>
</template>

<script setup lang="ts">
const settings = useSettings()
</script>



<script lang="ts">
import { EnhancerGlobal, registerModule } from '@/global';
import { useSettings } from '@/logic/Settings';
import { onMounted, onUnmounted, ref } from 'vue';
import EnSettings from '../Settings/EnSettings.vue';


registerModule('testArco', {})
onMounted(() => {
  console.log('test arco mounted')
  console.log('EnhancerGlobal is ', EnhancerGlobal.testArco);
  testFunc('testArco')
})
onUnmounted(() => {
  console.log('test arco unmounted')
  EnhancerGlobal.testArco.test = false
  console.log('EnhancerGlobal is ', EnhancerGlobal.testArco);
})
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
