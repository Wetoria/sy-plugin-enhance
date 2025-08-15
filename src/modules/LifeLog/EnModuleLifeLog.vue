<template>
  <EnSettingsTeleportModule
    :name="moduleOptions.moduleName"
    :display="moduleOptions.moduleDisplayName"
    :module="module"
  >
    <EnSettingsItem>
      <div>
        启用 LifeLog 标记功能
      </div>
      <template #desc>
        <div>
          是否标记 LifeLog 段落。输入 [时间 类型] 或 [时间 类型：备注] 后，会自动将段落标记为 LifeLog 段落。
        </div>
        <div>
          例如：
        </div>
        <div>
          12:00 工作
        </div>
        <div>
          12:00 工作：写日报
        </div>
        <div>
          12:00:00 工作：写日报
        </div>
        <div>
          <a-typography-text type="warning">
            注：该功能只标记日记中的段落。
          </a-typography-text>
        </div>
        <div>
          <a-typography-text type="warning">
            注：如果开头的时间带有任何样式，则不会被标记。可先进行标记，再设置格式。
          </a-typography-text>
        </div>
      </template>
      <template #opt>
        <a-switch v-model="moduleOptions.enableMarker" />
      </template>
    </EnSettingsItem>
    <EnSettingsItem>
      <div>
        检测未完成标记的 LifeLog 段落
      </div>
      <template #opt>
        <a-button @click="startCheckLifeLogParagraph">
          开始检测
        </a-button>
      </template>
    </EnSettingsItem>
    <EnSettingsItem>
      <div>
        显示 LifeLog 段落标记
      </div>
      <template #desc>
        <div>
          是否显示 LifeLog 的标记，并自动吸顶。
        </div>
        <div>
          吸顶：在编辑区顶部，最新一条 LifeLog 会在顶部吸附。当 DailyNote 内容较多时，可以方便地知道上一条记录是什么时候、做了什么事。
        </div>
      </template>
      <template #opt>
        <a-switch v-model="moduleOptions.showLifeLogFlag" />
      </template>
    </EnSettingsItem>
    <EnSettingsItem>
      <div>
        展示时间轴
      </div>
      <template #desc>
        <div>
          是否在笔记区的日记文档左侧展示时间轴
        </div>
        <div>
          <a-space>
            <a-typography-text type="warning">
              点击侧边时间轴，可展开查看 LifeLog 记录。也可
            </a-typography-text>
            <a-button
              v-if="moduleOptions.showLifeLogTimelineAtProtyleLeft"
              type="text"
              @click="openLifeLogTimeline"
            >
              点击查看
            </a-button>
          </a-space>
        </div>
        <div>
          <a-space>
            <template v-if="moduleOptions.showLifeLogTimelineAtProtyleLeft">
              <icon-check-circle style="color: rgb(var(--success-6))" />
            </template>
            <template v-else>
              <icon-close-circle style="color: rgb(var(--danger-6))" />
            </template>
            <a-typography-text>
              打开 LifeLog 记录的快捷键
            </a-typography-text>
          </a-space>
        </div>
      </template>
      <template #opt>
        <a-switch v-model="moduleOptions.showLifeLogTimelineAtProtyleLeft" />
      </template>
    </EnSettingsItem>
    <EnSettingsItem>
      <div>
        隐私模式
      </div>
      <template #desc>
        <div>
          是否开启隐私保护。开启后，仅展示 LifeLog 的类型，不展示具体内容。
        </div>
      </template>
      <template #opt>
        <a-switch v-model="moduleOptions.enablePrivacyMode" />
      </template>
    </EnSettingsItem>

    <EnSettingsItem>
      <div>
        其他功能说明
      </div>
      <template #desc>
        <div>
          插件会增加插入时间的 / 菜单选项，可以快速插入当前时间。格式：00:00。
        </div>
        <div>可输入下方选项进行过滤，建议使用：/df </div>
        <div class="flexColumn">
          <div>- add current time</div>
          <div>- insert current time</div>
          <div>- 插入当前时间</div>
          <div>- adt</div>
          <div>- df now</div>
          <div>- now</div>
        </div>
      </template>
    </EnSettingsItem>

    <EnSettingsItem>
      <div>
        LifeLog 类型
      </div>
      <template #desc>
        <template v-if="!moduleOptions.lifelogTypes">
          <div>
            未设置 LifeLog 类型，
            <a-button @click="setDefaultLifelogTypes">
              设置默认类型
            </a-button>
          </div>
        </template>
        <template v-else>
          <div>
            LifeLog 记录的类型，用于进行醒目提醒。主要分为四大类：
          </div>
          <EnDivider />
          <div>
            <a-space>
              <div
                :style="{
                  color: moduleOptions.lifelogTypes.fixed.baseColor,
                }"
              >
                固定
              </div>
              <EnColorPicker
                v-model="moduleOptions.lifelogTypes.fixed.baseColor"
                type="bgColor"
              />
            </a-space>
          </div>
          <div>
            必须要做的事情。比如吃饭、睡觉。
          </div>
          <EnLifeLogSettingTypeItem
            :typeItem="moduleOptions.lifelogTypes.fixed"
          />
          <EnDivider />
          <div>
            <a-space>
              <div
                :style="{
                  color: moduleOptions.lifelogTypes.growth.baseColor,
                }"
              >
                成长
              </div>
              <EnColorPicker
                v-model="moduleOptions.lifelogTypes.growth.baseColor"
                type="bgColor"
              />
            </a-space>
          </div>
          <div>
            为个人成长而做的事情。比如学习、阅读、事业。
          </div>
          <EnLifeLogSettingTypeItem
            :typeItem="moduleOptions.lifelogTypes.growth"
          />
          <EnDivider />
          <div>
            <a-space>
              <div
                :style="{
                  color: moduleOptions.lifelogTypes.work.baseColor,
                }"
              >
                工作
              </div>
              <EnColorPicker
                v-model="moduleOptions.lifelogTypes.work.baseColor"
                type="bgColor"
              />
            </a-space>
          </div>
          <div>
            为了生活不得不做的。比如工作。（注：个人事业不应归类于此）
          </div>
          <EnLifeLogSettingTypeItem
            :typeItem="moduleOptions.lifelogTypes.work"
          />
          <EnDivider />
          <div>
            <a-space>
              <div
                :style="{
                  color: moduleOptions.lifelogTypes.waste.baseColor,
                }"
              >
                荒废
              </div>
              <EnColorPicker
                v-model="moduleOptions.lifelogTypes.waste.baseColor"
                type="bgColor"
              />
            </a-space>
          </div>
          <div>
            与成长无关的事情。不能单纯的将娱乐活动归于此类，比如有的人打游戏就是工作。
          </div>
          <EnLifeLogSettingTypeItem
            :typeItem="moduleOptions.lifelogTypes.waste"
          />
          <EnDivider />
          <div>
            <a-space>
              <div
                :style="{
                  color: moduleOptions.lifelogTypes.other.baseColor,
                }"
              >
                其他
              </div>
              <EnColorPicker
                v-model="moduleOptions.lifelogTypes.other.baseColor"
                type="bgColor"
              />
            </a-space>
          </div>
          <div>
            其他未分类、或不知道怎么分类的事情，都可以先放到这里。
          </div>
          <div>
            你可以随时调整它们（从该类下删除，再在工作、增等类型下新增）。
          </div>
          <EnLifeLogSettingTypeItem
            :typeItem="moduleOptions.lifelogTypes.other"
          />
        </template>
      </template>
    </EnSettingsItem>

  </EnSettingsTeleportModule>
  <template v-if="moduleOptions.enabled">
    <template v-if="useLifeLogDataControl">
      <EnLifeLogDataControl>
        <template v-if="moduleOptions.showLifeLogTimelineAtProtyleLeft">
          <RenderControl />
          <EnLifeLogWeekGraphModal />
        </template>
      </EnLifeLogDataControl>
    </template>
  </template>

  <EnLifeLogDataCheckerModal
    v-model:visible="lifeLogDataCheckerModalVisible"
    :data="lifeLogDataCheckerModalData"
  />
</template>

<script setup lang="ts">
import EnColorPicker from '@/components/EnColorPicker.vue'
import EnDivider from '@/components/EnDivider.vue'
import { enI18n } from '@/i18n'
import { usePlugin } from '@/main'
import {
  useModule,
  watchConfigChanged,
  watchConfigEnableStatus,
} from '@/modules/EnModuleControl/ModuleProvide'
import EnLifeLogDataCheckerModal from '@/modules/LifeLog/EnLifeLogDataCheckerModal.vue'
import EnLifeLogDataControl from '@/modules/LifeLog/EnLifeLogDataControl.vue'
import EnLifeLogSettingTypeItem from '@/modules/LifeLog/EnLifeLogSettingTypeItem.vue'
import EnLifeLogWeekGraphModal from '@/modules/LifeLog/EnLifeLogWeekGraphModal.vue'
import {
  markLifeLogBlock,
  queryAndMarkLifeLogParagraph,
} from '@/modules/LifeLog/LifeLog'
import RenderControl from '@/modules/LifeLog/RenderControl.vue'
import { moduleEnableStatusSwitcher } from '@/utils'
import {
  EN_CONSTANTS,
  EN_EVENT_BUS_KEYS,
  EN_MODULE_LIST,
} from '@/utils/Constants'
import {
  queryAllByDom,
  useRegisterStyle,
} from '@/utils/DOM'
import { enEventBus } from '@/utils/EnEventBus'
import {
  addSlash,
  getSlashHtml,
  removeSlash,
} from '@/utils/Slash'
import { Message } from '@arco-design/web-vue'
import dayjs from 'dayjs'
import { Protyle } from 'siyuan'
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
} from 'vue'
import EnSettingsItem from '../../modules/Settings/EnSettingsItem.vue'
import EnSettingsTeleportModule from '../../modules/Settings/EnSettingsTeleportModule.vue'


// TODO 增加slash菜单选择LifeLog类型
const plugin = usePlugin()

// #region 基本的模块配置

const {
  module,
  moduleOptions,
} = useModule<LifeLogModule>(EN_MODULE_LIST.LIFELOG, {
  defaultData: {
    enabled: false,
    moduleName: EN_MODULE_LIST.LIFELOG,
    moduleDisplayName: EN_CONSTANTS.LIFELOG_DISPLAY,

    enableMarker: false,
    showLifeLogFlag: false,
    showLifeLogTimelineAtProtyleLeft: false,
    enablePrivacyMode: false,

    lifelogTypes: null,
  },
})

const useLifeLogDataControl = computed(() => moduleOptions.value.showLifeLogTimelineAtProtyleLeft)

const setDefaultLifelogTypes = () => {
  moduleOptions.value.lifelogTypes = {
    fixed: {
      baseColor: '#D3D3D3',
      items: [
        {
          type: '固',
          color: '#D3D3D3',
        },
        {
          type: '固定',
          color: '#D3D3D3',
        },
      ],
    },
    growth: {
      baseColor: '#90EE90',
      items: [
        {
          type: '增',
          color: '#90EE90',
        },
        {
          type: '学习',
          color: '#90EE90',
        },
        {
          type: '阅读',
          color: '#90EE90',
        },
        {
          type: '事业',
          color: '#90EE90',
        },
      ],
    },
    work: {
      baseColor: '#FFD700',
      items: [
        {
          type: '工作',
          color: '#FFD700',
        },
      ],
    },
    waste: {
      baseColor: '#FF0000',
      items: [
        {
          type: '荒废',
          color: '#FF0000',
        },
        {
          type: '废',
          color: '#FF0000',
        },
        {
          type: '娱乐',
          color: '#FF0000',
        },
        {
          type: '玩',
          color: '#FF0000',
        },
      ],
    },
    other: {
      baseColor: 'rgb(71, 255, 248)',
      items: [
        {
          type: '家庭',
          color: 'rgb(71, 255, 248)',
        },
        {
          type: '家',
          color: 'rgb(71, 255, 248)',
        },
        {
          type: '朋友',
          color: 'rgb(156, 123, 85)',
        },
        {
          type: '友',
          color: 'rgb(156, 123, 85)',
        },
      ],
    },
  }
}

// 重置模块数据后为 null，设置默认的 lifelogTypes
// 不使用默认值的方式，是为了防止每次修改后，如果没有下面列出的类型，会自动添加。
// #endregion 基本的模块配置

const flatLifelogTypes = computed(() => {
  if (!moduleOptions.value.lifelogTypes) {
    return []
  }
  return [
    ...moduleOptions.value.lifelogTypes.fixed.items,
    ...moduleOptions.value.lifelogTypes.growth.items,
    ...moduleOptions.value.lifelogTypes.work.items,
    ...moduleOptions.value.lifelogTypes.waste.items,
    ...moduleOptions.value.lifelogTypes.other.items,
  ]
})

watchConfigChanged(
  () => moduleOptions.value.lifelogTypes,
  () => {
    const styleDomRef = useRegisterStyle('en-lifelog-style')
    styleDomRef.value.textContent = `
    html[data-en_enabled_module~="EnableLifelogTag"] {
      ${flatLifelogTypes.value.map((i) => `
        --en-lifelog-color-type-${i.type}: ${i.color};

        [data-type="NodeParagraph"] {
          &[custom-lifelog-type="${i.type}"] {
            --en-lifelog-border-color: ${i.color};
          }
        }
      `).join('')}
    }
    `
    return () => {
      styleDomRef.value.textContent = ''
      styleDomRef.value.remove()
    }
  },
)


const handler = (event: Event) => {
  const scrollArea = event.target as HTMLElement
  const paragraphList = queryAllByDom(scrollArea, '[data-type="NodeParagraph"][custom-lifelog-time]')

  let flag = true
  paragraphList.reverse()
  paragraphList.forEach((p: HTMLElement) => {

    const pRect = p.getBoundingClientRect()
    const sRect = scrollArea.getBoundingClientRect()

    if (pRect.top <= sRect.top && flag) {
      p.classList.toggle('en-stickied', true)
      flag = false
    } else {
      p.classList.toggle('en-stickied', false)
    }
  })
}

let observer = null
const bindedProtyleList = ref([])
const listenerSticky = () => {
  observer = new MutationObserver(() => {
    const protyleContentList = queryAllByDom(document.body, '.protyle-content')
    protyleContentList.forEach((item: HTMLElement) => {
      const exist = bindedProtyleList.value.find((i) => i === item)
      if (exist) {
        return
      }

      item.addEventListener('scroll', handler)
      bindedProtyleList.value.push(item)
    })
  })
  observer.observe(document.body, {
    childList: true, // 观察目标子节点的变化，是否有添加或者删除
    subtree: true, // 观察后代节点，默认为 false
  })
}
const offListenerSticky = () => {
  observer?.disconnect()
  observer = null
  bindedProtyleList.value.forEach((item) => {
    item.removeEventListener('scroll', handler)
  })
  bindedProtyleList.value = []
}

watchConfigEnableStatus(
  () => moduleOptions.value.showLifeLogFlag,
  () => {
    moduleEnableStatusSwitcher('EnableLifelogTag', moduleOptions.value.showLifeLogFlag)
    listenerSticky()
    return () => {
      moduleEnableStatusSwitcher('EnableLifelogTag')
      offListenerSticky()
    }
  },
)


let offLifeLogMarker = null
watchConfigEnableStatus(
  () => moduleOptions.value.enableMarker,
  () => {
    offLifeLogMarker = markLifeLogBlock()
    return () => {
      offLifeLogMarker?.()
      offLifeLogMarker = null
    }
  },
)


const insertCurrentTimeSlas = {
  filter: [
    "add current time",
    'insert current time',
    "插入当前时间",
    'adt',
    'df now',
    'now',
  ],
  html: getSlashHtml(enI18n.lifelogInsertCurrentTime),
  id: "enInsertCurrentTime",
  callback(protyle: Protyle) {
    const timestamp = dayjs().format('HH:mm')
    protyle.insert(timestamp)
  },
}
onMounted(() => {
  addSlash(insertCurrentTimeSlas)
})
onBeforeUnmount(() => {
  removeSlash(insertCurrentTimeSlas)
})


const openLifeLogTimeline = () => {
  enEventBus.emit(EN_EVENT_BUS_KEYS.LIFELOG_OPEN_GRAPH_MODAL)
}

const lifeLogDataCheckerModalVisible = ref(false)
const lifeLogDataCheckerModalData = ref<ILifeLogCheckData>({
  paragraphList: [],
  docDateMap: {},
})
const startCheckLifeLogParagraph = async () => {
  const {
    paragraphList,
    dateMap,
  } = await queryAndMarkLifeLogParagraph()

  if (!paragraphList.length) {
    Message.info('没有需要转换的 LifeLog 段落')
    return
  }

  lifeLogDataCheckerModalData.value = {
    paragraphList,
    docDateMap: dateMap,
  }
  lifeLogDataCheckerModalVisible.value = true
}
</script>

<style>
html[data-en_enabled_module~="EnableLifelogTag"] {

  & [data-type="NodeParagraph"] {

    &[custom-lifelog-type] {
      --en-lifelog-border-color: #D3D3D3;
      --en-lifelog-border-style: 1px solid var(--en-lifelog-border-color);
      border-bottom: var(--en-lifelog-border-style);

      &.en-stickied {
        z-index: 2;
        position: sticky;
        border-left: var(--en-lifelog-border-style);
        border-right: var(--en-lifelog-border-style);
      }
    }

  }

  & {
    [custom-lifelog-type] {
      /* 解决吸顶以后，依旧能看到下方内容的问题 */
      background-color: var(--b3-theme-background);
      &.en-stickied {
        top: -0px;
      }
    }
  }
  &[data-en_enabled_module~="EnhancerIsMobile"] {
    [custom-lifelog-type] {
      &.en-stickied {
        top: -4px;
      }
    }
  }
}
</style>
