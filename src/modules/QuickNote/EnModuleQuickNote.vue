<template>
  <EnSettingsTeleportModule
    :name="moduleOptions.moduleName"
    :display="moduleOptions.moduleDisplayName"
    :module="module"
    always
  >
    <EnSettingsItem mode="vertical">
      <div>
        创建模式
      </div>
      <template #desc>
        <div>
          选择一键记事创建内容的模式：添加至目标块，或追加至笔记本的日记中。
        </div>
        <div>
          如果目标为容器块（比如文档），则会插入容器块的末尾。
        </div>
        <div>
          如果目标非容器块（比如段落），则会插入目标块的后方。
        </div>
        <div>
          <a-typography-text type="warning">
            注：修改本设置会更新一键记事窗口中的配置。
          </a-typography-text>
        </div>
        <div>
          窗口中的配置独立于该设置。你随时可以在窗口中更改成你想要的模式。
        </div>
        <div v-if="moduleOptions.targetId">
          已选文档：
          <a-link
            @click="openTargetDoc"
          >
            点击跳转至目标块
          </a-link>
        </div>
      </template>
      <template #opt>
        <div class="EnNotebookSelector">
          <EnBlockAppendModeSelector
            v-model="moduleOptions.notebookId"
            v-model:targetId="moduleOptions.targetId"
            :notebookList="openedNotebookList"
            :mode="globalData.quickNoteMode"
          />
        </div>
      </template>
    </EnSettingsItem>
    <EnSettingsItem mode="vertical">
      <div>
        一键记事创建新块的延时
      </div>
      <template #desc>
        <div>
          一键记事关闭窗口后，重新创建块的延迟时间。单位：秒。
        </div>
        <div>
          应用场景：比如关闭了一键记事以后，突然又想追加内容，在延时时间内，不会创建新块，可继续编写之前的内容。
        </div>
      </template>
      <template #opt>
        <a-input-number
          v-model="moduleOptions.newBlockDelay"
          placeholder="Please Enter"
          mode="button"
          :readOnly="plugin.isMobile"
          :step="1"
          :min="1"
        />
      </template>
    </EnSettingsItem>
  </EnSettingsTeleportModule>

  <template v-if="plugin.isMobile">
    <EnQuickNoteMobile />
  </template>
  <template v-else>
    <EnQuickNote />
  </template>
</template>

<script setup lang="ts">
import EnBlockAppendModeSelector from '@/components/EnBlockAppendModeSelector.vue'
import { usePlugin } from '@/main'
import {
  injectGlobalData,
  useModule,
} from '@/modules/EnModuleControl/ModuleProvide'
import EnQuickNote from '@/modules/QuickNote/EnQuickNote.vue'
import EnQuickNoteMobile from '@/modules/QuickNote/EnQuickNoteMobile.vue'
import EnSettingsItem from '@/modules/Settings/EnSettingsItem.vue'
import EnSettingsTeleportModule from '@/modules/Settings/EnSettingsTeleportModule.vue'
import {
  EN_CONSTANTS,
  EN_MODULE_LIST,
} from '@/utils/Constants'
import { openDocById } from '@/utils/Note'
import {
  computed,
} from 'vue'

const plugin = usePlugin()

const {
  module,
  moduleOptions,
} = useModule<EnModuleQuickNote>(EN_MODULE_LIST.QUICK_NOTE, {
  defaultData: {
    enabled: true,
    moduleName: EN_MODULE_LIST.QUICK_NOTE,
    moduleDisplayName: EN_CONSTANTS.QUICK_NOTE_DISPLAY,

    notebookId: '',
    targetId: '',
    newBlockDelay: 5,
  },
})

const globalData = injectGlobalData()
globalData.value.quickNoteMode = ['targetBlock']
const openedNotebookList = computed(() => globalData.value.openedNotebookList)

const openTargetDoc = () => {
  if (!moduleOptions.value.targetId) {
    return
  }
  openDocById(moduleOptions.value.targetId)
}
</script>

<style lang="scss" scoped>
.EnNotebookSelector {
  min-width: 100%;

  :deep(.arco-select.isSelectedNotebook) {
    min-width: 185px;
  }
}
</style>
