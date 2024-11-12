import { EnModule, useSettingModule, useSettingModuleData } from '@/modules/Settings/EnSettings.vue'
import { onBeforeMount } from 'vue'
import { loadModuleDataByNamespace, updateModuleDataByNamespaceWithLoadFile } from './SyncData'

export function useSettingModuleInSetup<T extends EnModule>(props: T) {
  const moduleRes = useSettingModuleInScript(props)

  const {
    loadAndUpdate,
  } = moduleRes

  onBeforeMount(async () => {
    await loadAndUpdate()
  })

  return {
    ...moduleRes,
  }
}

export function useSettingModuleInScript<T extends EnModule>(props: T) {
  const {
    moduleName,
    moduleDisplayName,
  } = props

  const defaultData = JSON.parse(JSON.stringify(props))

  const module = useSettingModule<T>(moduleName, {
    defaultData,
  })
  const moduleOptions = useSettingModuleData<T>(moduleName)


  const load = async () => {
    return await loadModuleDataByNamespace(moduleName)
  }

  const loadAndUpdate = async () => {
    await updateModuleDataByNamespaceWithLoadFile(moduleName)
  }

  return {
    moduleName,
    moduleDisplayName,
    module,
    moduleOptions,
    defaultData,
    load,
    loadAndUpdate,
  }
}
