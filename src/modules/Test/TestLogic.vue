<template>

  <EnSettingsTeleportModule
    v-if="settings.isDebugging"
    :name="moduleName"
    :display="moduleDisplayName"
    :module="module"
  >
    <EnSettingsItem>
      <div>
        Test1
      </div>
      <template #opt>
        <a-switch v-model="moduleOptions.test1" />
      </template>
    </EnSettingsItem>
    <EnSettingsItem>
      <div>
        Test2
      </div>
      <template #opt>
        <a-switch v-model="moduleOptions.test2" />
      </template>
    </EnSettingsItem>
  </EnSettingsTeleportModule>
</template>

<script setup lang="ts">
import EnSettingsTeleportModule from '../Settings/EnSettingsTeleportModule.vue';
import EnSettingsItem from '../Settings/EnSettingsItem.vue';
import { EnModule, useSettings } from '../Settings/EnSettings.vue';
import { onBeforeMount } from 'vue';
import { useSettingModuleInScript } from '@/utils/SyncDataHooks';

onBeforeMount(async () => {
  await loadAndUpdate()
})

const settings = useSettings()
</script>

<script lang="ts">
interface ModuleOptions extends EnModule {
  test1: boolean
  test2: boolean
}

const {
  moduleName,
  moduleDisplayName,
  module,
  moduleOptions,
  loadAndUpdate,
} = useSettingModuleInScript<ModuleOptions>({
  enabled: true,
  moduleName: 'TestLogic',
  moduleDisplayName: 'Test Logic',
  test1: false,
  test2: false,
})

</script>

<style lang="scss" scoped>

</style>
