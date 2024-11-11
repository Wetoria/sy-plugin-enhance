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
import { EnModule, useSettingModule, useSettingModuleData, useSettings } from '../Settings/EnSettings.vue';
import { onMounted } from 'vue';
import { loadModuleDataByNamespace } from '@/utils/SyncData';

onMounted(async () => {
  await loadModuleDataByNamespace(moduleName)
})

const settings = useSettings()
</script>

<script lang="ts">
interface ModuleOptions extends EnModule {
  test1: boolean
  test2: boolean
}

const moduleName = 'TestLogic'
const moduleDisplayName = 'Test Logic'

const defaultData: ModuleOptions = {
  enabled: true,
  moduleName,
  moduleDisplayName,
  test1: false,
  test2: false,
}
const module = useSettingModule<ModuleOptions>(moduleName, {
  defaultData,
})
const moduleOptions = useSettingModuleData<ModuleOptions>(moduleName)
</script>

<style lang="scss" scoped>

</style>
