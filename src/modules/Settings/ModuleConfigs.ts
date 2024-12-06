import { EnModule } from '@/modules/Settings/EnSettings.vue'
import { ModuleName_TestLogic } from '@/modules/Test/TestLogic.vue'
import { EN_CONSTANTS } from '@/utils/Constants'
import { getModuleRefByNamespace } from '@/utils/SyncData'


// 在此处配置模块顺序
const moduleOrder = [
  ModuleName_TestLogic,
  EN_CONSTANTS.DAILY_NOTE_MODULE,
]


export function flushModuleConfigs() {
  moduleOrder.forEach((moduleName, index) => {
    const moduleRef = getModuleRefByNamespace<EnModule>(moduleName)
    moduleRef.value.data.sort = index + 1
  })
}
