<template>
  <span
    class="enBlockLockContainer"
    v-if="enabled"
    @click="manualSwitchLockStatus"
  >
    <icon-font type="en-lock"  v-if="lockedTypes.includes(locked)" />
    <icon-font type="en-unlock" v-else />
  </span>
</template>

<script setup lang="ts">
import dayjs from 'dayjs';
import { ref, watchEffect } from 'vue';
import { getUpdated } from './EnParagraphBlockTime.vue';

const props = defineProps<{
  pDom: HTMLDivElement
  enabled: boolean
  autoLockTimeDiff: number
}>()

const updated = ref(getUpdated(props.pDom))

const lock = (locked: boolean) => {
  const editableDiv = props.pDom.firstChild as HTMLDivElement
  if (!editableDiv) {
    return
  }
  editableDiv.contentEditable = `${!locked}`
}

const LOCK_STATUS = {
  auto: 'auto',
  locked: 'locked',
  unlocked: 'unlocked',
}
const locked  = ref<typeof LOCK_STATUS[keyof typeof LOCK_STATUS]>(LOCK_STATUS.auto)
const lockedTypes = [LOCK_STATUS.auto, LOCK_STATUS.locked]

const manualSwitchLockStatus = () => {
  if (lockedTypes.includes(locked.value)) {
    locked.value = LOCK_STATUS.unlocked
  } else {
    locked.value = LOCK_STATUS.locked
  }
}
const judgeIsOverTime = () => {
  const currentTime = dayjs()
  const isOverTime = currentTime.subtract(props.autoLockTimeDiff, 'seconds').isAfter(updated.value)
  return isOverTime
}
watchEffect(() => {
  document.documentElement.dataset.enParagraphBlockLock = `${props.enabled}`
  if (props.enabled) {
    if (judgeIsOverTime()) {
      locked.value = LOCK_STATUS.auto
    } else {
      locked.value = LOCK_STATUS.unlocked
    }
  }
})

const listenerTimeChangeFlag = ref()
const listenerTimeChange = () => {
  if (listenerTimeChangeFlag.value) {
    clearInterval(listenerTimeChangeFlag.value)
  }
  listenerTimeChangeFlag.value = setInterval(() => {
    // 每秒更新段落更新时间
    const newUpdated = getUpdated(props.pDom)
    updated.value = newUpdated

    const isOverTime =judgeIsOverTime()
    if (isOverTime) {
      locked.value = LOCK_STATUS.auto
    } else {
      locked.value = LOCK_STATUS.unlocked
    }
  }, 1000)
}

watchEffect(() => {
  if (props.enabled) {
    listenerTimeChange()
    if (locked.value === LOCK_STATUS.auto) {
      if (judgeIsOverTime()) {
        lock(true)
      } else {
        lock(false)
      }
    } else if (locked.value === LOCK_STATUS.locked) {
      lock(true)
    } else {
      lock(false)
    }
  } else {
    clearInterval(listenerTimeChangeFlag.value)
    lock(false)
  }
})
</script>

<style lang="scss">

</style>
