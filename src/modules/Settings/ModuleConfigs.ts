import { ModuleName_TestLogic } from '@/modules/Test/TestLogic.vue'
import { EnModule } from '@/modules/Settings/EnSettings.vue'
import { ModuleName_DailyNote } from '@/modules/DailyNote/DailyNote.vue'
import { getModuleRefByNamespace } from '@/utils/SyncData'


// 在此处配置模块顺序
const moduleOrder = [
  ModuleName_TestLogic,
  ModuleName_DailyNote,
]


export function flushModuleConfigs() {
  moduleOrder.forEach((moduleName, index) => {
    const moduleRef = getModuleRefByNamespace<EnModule>(moduleName)
    moduleRef.value.data.sort = index + 1
  })
}
