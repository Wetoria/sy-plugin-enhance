<template>
  <EnSettingsTeleport
    name="testLogic"
  >
    <EnSettingsItem mode="vertical">
      <div>
        Test1
      </div>
      <template #opt>
        <a-switch v-model="moduleValue1.data.test" />
        <a-input
          v-model="moduleValue1.data.test2.inputValue"
        />
      </template>
    </EnSettingsItem>
    <EnSettingsItem mode="vertical">
      <div>
        Test3 与 Test1 namespace 相同
      </div>
      <template #opt>
        <a-switch v-model="moduleValue3.data.test" />
        <a-input
          v-model="moduleValue3.data.test2.inputValue"
        />
      </template>
    </EnSettingsItem>
    <EnSettingsItem mode="vertical">
      <div>
        Test2
      </div>
      <template #opt>
        <a-switch v-model="moduleValue2.data.test" />
      </template>
    </EnSettingsItem>
  </EnSettingsTeleport>
</template>

<script setup lang="ts">
import EnSettingsTeleport from '../Settings/EnSettingsTeleport.vue';
import EnSettingsItem from '../Settings/EnSettingsItem.vue';
import { useSyncModuleData } from '@/utils/SyncData';

const moduleValue1 = useSyncModuleData({
  namespace: 'testLogic1',
  defaultData: {
    test: false,
    test2: {
      inputValue: '',
    },
  },
})
const moduleValue2 = useSyncModuleData({
  namespace: 'testLogic2',
  defaultData: {
    test: false,
  },
})
const moduleValue3 = useSyncModuleData({
  namespace: 'testLogic1',
  defaultData: {
    test: false,
    test2: {
      inputValue: '',
    },
  },
})

</script>

<style lang="scss" scoped>

</style>
