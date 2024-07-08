<template>
  <a-trigger
    trigger="click"
    position="bl"
    auto-fit-position
    auto-fix-position
    :blur-to-close="false"
    :unmount-on-close="false"
  >
    <div class="container">
      <SyIcon
        :name="iconMap[type]"
      />
    </div>
    <template #content>
      <div class="EnVideoAndAudioBlockPlayPopupContainer">
        <div>
          区间播放
        </div>
        <div class="SwitchArea">
          <div>
            开启区间播放功能
          </div>
          <div>
            <a-switch
              v-model="nodeBlockPlayConfig.enabledBlockPlay"
            />
          </div>
        </div>
        <div class="SwitchArea">
          <div>
            开启循环播放功能
          </div>
          <div>
            <a-switch
              v-model="nodeBlockPlayConfig.enabledLoopPlay"
            />
          </div>
        </div>
        <div>
          当前时间为：
        </div>
        <div>
          <a-input v-model="currentTime"/>
        </div>
        <div>
          设置为区间：
        </div>
        <div class="btns">
          <a-button
            size="mini"
            @click="newBlock.startTime = currentTime"
          >
            开始时间
          </a-button>
          <a-button
            size="mini"
            @click="newBlock.endTime = currentTime"
          >
            结束时间
          </a-button>
        </div>
        <div>
          区间：
        </div>
        <div class="newBlockArea">
          <div class="newBlockTimeItem">
            <a-input
              v-model="newBlock.startTime"
            />
          </div>
          <span>
            ~
          </span>
          <div class="newBlockTimeItem">
            <a-input
              v-model="newBlock.endTime"
            />
          </div>
        </div>
        <div>
          <a-button
            style="width: 100%;"
            @click="addNewBlock"
          >
            添加区间
          </a-button>
        </div>
        <div class="ConfiguredBlockList">
          <div
            class="ConfiguredBlockItem"
          >
            <div class="ColIndex">
              序号
            </div>
            <div class="ColContent">
              区间时间
            </div>
            <div class="ColOperations">
              操作
            </div>
          </div>
          <div
            class="ConfiguredBlockItem"
            v-for="(block, index) of nodeTimeBlockList"
            :key="`${block.startTime}~${block.endTime}`"
          >
            <div class="ColIndex">
              {{ index + 1 }}
            </div>
            <div class="ColContent">
              <a-button
                size="mini"
                type="text"
                @click="setTargetTime(block)"
              >
                {{ `${block.startTime}~${block.endTime}` }}
              </a-button>
            </div>
            <div class="ColOperations">
              <a-button
                size="mini"
                type="text"
                status="danger"
                @click="nodeTimeBlockList = nodeTimeBlockList.filter(i => i != block)"
              >
                <icon-close />
              </a-button>
            </div>
          </div>
        </div>
      </div>
    </template>
  </a-trigger>
</template>

<script setup lang="ts">
import { SyDomNodeTypes } from '@/utils/Siyuan';
import { onBeforeUnmount, onMounted, ref, watchEffect } from 'vue';
import { useSettings } from '../Settings/EnSettings.vue';
import { showMessage } from 'siyuan';
import SyIcon from '@/components/SiyuanTheme/SyIcon.vue';

const iconMap = {
  [SyDomNodeTypes.NodeAudio]: 'iconRecord',
  [SyDomNodeTypes.NodeVideo]: 'iconVideo',
}

const typeMap = {
  [SyDomNodeTypes.NodeAudio]: 'audio',
  [SyDomNodeTypes.NodeVideo]: 'video',
}

const props = defineProps<{
  el: HTMLSpanElement
  nodeId: string
  type: SyDomNodeTypes.NodeAudio | SyDomNodeTypes.NodeVideo
}>()

const currentTime = ref<number>()
const updateCurrentTimeByTarget = () => {
  currentTime.value = target.value.currentTime
}
const updateCurrentTimeBySeek = () => {
  updateCurrentTimeByTarget()
}

interface ATimeBlock {
  startTime: number
  endTime: number
}
const newBlock = ref<ATimeBlock>({
  startTime: 0,
  endTime: 0,
})

const setTargetTime = (newTimeBlock: ATimeBlock) => {
  target.value.currentTime = newTimeBlock.startTime
}

const settings = useSettings()
const nodeTimeBlockList = ref(settings.value.videoAndAudioBlockMap[props.nodeId] || [])
watchEffect(() => {
  settings.value.videoAndAudioBlockMap[props.nodeId] = nodeTimeBlockList.value
})

const nodeBlockPlayConfig = ref(settings.value.videoAndAudioBlockPlayConfigMap[props.nodeId] || {
  enabledBlockPlay: false,
  enabledLoopPlay: false,
})
watchEffect(() => {
  settings.value.videoAndAudioBlockPlayConfigMap[props.nodeId] = nodeBlockPlayConfig.value
})

const target = ref<HTMLVideoElement | HTMLAudioElement>()

const checkIsInValidBlock = () => {
  if (nodeBlockPlayConfig.value.enabledBlockPlay) {
    const currentTargetTime = target.value.currentTime;

    if (nodeTimeBlockList.value.length) {
      // 检查当前时间是否在任何一个允许的播放区间内
      let inAllowedInterval = false;
      for (const interval of nodeTimeBlockList.value) {
        if (currentTargetTime >= interval.startTime && currentTargetTime <= interval.endTime) {
          inAllowedInterval = true;
          break;
        }
      }

      // 如果不在允许的播放区间内，跳转到下一个允许区间的开始时间
      if (!inAllowedInterval) {
        // 找到下一个播放区间
        let nextTime = null
        for (const interval of nodeTimeBlockList.value) {
          if (currentTargetTime < interval.startTime) {
            nextTime = interval.startTime;
            break;
          }
        }
        // 如果没有找到下一个区间，暂停视频
        if (!nextTime) {
          if (nodeBlockPlayConfig.value.enabledLoopPlay) {
            target.value.currentTime = target.value.duration
          } else {
            target.value.pause()
          }
        } else {
          target.value.currentTime = nextTime
        }
      }
    }
  }

}

const checkIsNeedLoop = () => {
  if (nodeBlockPlayConfig.value.enabledLoopPlay) {
    if (nodeBlockPlayConfig.value.enabledBlockPlay && nodeTimeBlockList.value.length) {
      const lastBlock = nodeTimeBlockList.value[nodeTimeBlockList.value.length - 1];
      if (target.value.currentTime >= lastBlock.endTime) {
        target.value.currentTime = nodeTimeBlockList.value[0].startTime
        target.value.play()
      }
    } else {
      if (target.value.currentTime >= target.value.duration) {
        target.value.currentTime = 0
        target.value.play()
      }
    }
  }
}

onMounted(() => {
  const videoOrAudioDom = props.el.parentElement?.parentElement?.querySelector(typeMap[props.type]) as HTMLVideoElement | HTMLAudioElement

  if (!videoOrAudioDom) {
    return
  }

  target.value = videoOrAudioDom
  updateCurrentTimeByTarget()

  videoOrAudioDom.addEventListener('seeking', updateCurrentTimeBySeek);
  videoOrAudioDom.addEventListener('seeked', updateCurrentTimeBySeek);
  videoOrAudioDom.addEventListener('timeupdate', updateCurrentTimeBySeek);
  videoOrAudioDom.addEventListener('timeupdate', checkIsInValidBlock);
  videoOrAudioDom.addEventListener('ended', checkIsNeedLoop);
})
onBeforeUnmount(() => {
  target.value.removeEventListener('seeking', updateCurrentTimeBySeek);
  target.value.removeEventListener('seeked', updateCurrentTimeBySeek);
  target.value.removeEventListener('timeupdate', updateCurrentTimeBySeek);
  target.value.removeEventListener('timeupdate', checkIsInValidBlock);
  target.value.removeEventListener('ended', checkIsNeedLoop);
})

const addNewBlock = () => {
  const {
    startTime,
    endTime,
  } = newBlock.value
  if (startTime >= endTime) {
    showMessage('开始时间请小于结束时间')
    return
  }
  const existSameBlock = nodeTimeBlockList.value.find((item) => item.startTime == startTime && item.endTime == endTime)
  if (existSameBlock) {
    showMessage('存在相同的区间，请重新设置')
    return
  }
  const existSubBlock = nodeTimeBlockList.value.find((item) => item.startTime > startTime && item.endTime < endTime)
  if (existSubBlock) {
    showMessage('当前区间包含已设置的区间，请重新设置')
    return
  }
  const existCrossBlock = nodeTimeBlockList.value.find((item) => (item.endTime > startTime && item.startTime < startTime) || (item.startTime < endTime && item.endTime > endTime))
  if (existCrossBlock) {
    showMessage('存在重叠的区间，请重新设置')
    return
  }
  nodeTimeBlockList.value.push(JSON.parse(JSON.stringify(newBlock.value)))
  nodeTimeBlockList.value.sort((a, b) => {
    return a.startTime - b.startTime
  })
}
</script>

<style lang="scss" scoped>
.container {
}
</style>

<style lang="scss">
.EnVideoAndAudioAttrContainer {
  margin: 0 4px;
}

.EnVideoAndAudioBlockPlayPopupContainer {
  padding: 8px;
  border-radius: 4px;
  border: 1px solid var(--b3-theme-background-light);
  background-color: var(--b3-theme-background);

  display: flex;
  flex-direction: column;
  gap: var(--en-gap);

  .SwitchArea {
    display: flex;
    gap: var(--en-gap);
    width: 100%;
    justify-content: space-between;
    align-items: center;
  }

  .btns {
    display: flex;
    gap: var(--en-gap);

    .arco-btn {
      flex: 1;
    }
  }

  .newBlockArea {
    display: flex;
    gap: var(--en-gap);
    align-items: center;

    .newBlockTimeItem {
      width: 100px;
    }
  }

  .ConfiguredBlockList {
    display: flex;
    flex-direction: column;
    gap: var(--en-gap);

    .ConfiguredBlockItem {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .ColIndex {
        width: 40px;
        display: flex;
        justify-content: center;
        align-items: center;
      }
      .ColContent {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .ColOperations {
        display: flex;
        justify-content: center;
        align-items: center;
      }
    }
  }
}
</style>
