<template>
  <span
    class="enBlockLockContainer"
    v-if="enabled"
    @click="() => manualSwitchLockStatus()"
  >
    <SyIcon
      v-if="lockedTypes.includes(locked)"
      name="iconLock"
    />
    <SyIcon
      v-else
      name="iconUnlock"
    />
  </span>
</template>

<script setup lang="ts">
import dayjs from 'dayjs';
import { onMounted, ref, watch, watchEffect } from 'vue';
import SyIcon from '@/components/SiyuanTheme/SyIcon.vue';

const props = defineProps<{
  pDom: HTMLDivElement
  enabled: boolean
  updated: undefined | dayjs.Dayjs
  autoLockTimeDiff: number
  autoCheckTime: number
}>()

onMounted(() => {
  timeChangeListener()
})

const timeChangeListenerFlag = ref()
const clearTimeChangeListener = () => {
  clearInterval(timeChangeListenerFlag.value)
}
const timeChangeListener = () => {
  clearTimeChangeListener()
  timeChangeListenerFlag.value = setInterval(() => {
    checkLockedStatus()
  }, props.autoCheckTime * 1000)
}

watch([props.autoCheckTime], () => {
  timeChangeListener()
}, { immediate: true })

const lock = (locked: boolean) => {
  const editableDiv = props.pDom.firstChild as HTMLDivElement
  editableDiv.contentEditable = `${!locked}`
  if (locked) {
    props.pDom.contentEditable = `${!locked}`
  } else {
    props.pDom.removeAttribute('contentEditable')
  }
}

const LOCK_STATUS = {
  locked: 'locked',
  unlocked: 'unlocked',
}
const locked  = ref<typeof LOCK_STATUS[keyof typeof LOCK_STATUS]>(LOCK_STATUS.unlocked)
const lockedTypes = [LOCK_STATUS.locked]

const manualSwitchLockStatus = () => {
  if (lockedTypes.includes(locked.value)) {
    locked.value = LOCK_STATUS.unlocked
    timeChangeListener()
  } else {
    locked.value = LOCK_STATUS.locked
  }
}
const judgeIsOverTime = () => {
  const currentTime = dayjs()
  if (!props.updated) {
    return false
  }
  const isOverTime = currentTime.subtract(props.autoLockTimeDiff, 'seconds').isAfter(props.updated)
  return isOverTime
}
const checkLockedStatus = () => {
  if (judgeIsOverTime()) {
    locked.value = LOCK_STATUS.locked
  } else {
    locked.value = LOCK_STATUS.unlocked
  }
}
watchEffect(() => {
  document.documentElement.dataset.enParagraphBlockLock = `${props.enabled}`
})

watch(() => props.enabled, () => {
  if (props.enabled) {
    checkLockedStatus()
  } else {
    locked.value = LOCK_STATUS.unlocked
  }
}, { immediate: true })

watch(locked, () => {
  props.pDom.dataset.enBlockLocked = locked.value
  if (locked.value === LOCK_STATUS.locked) {
    lock(true)
  } else {
    lock(false)
  }
}, { immediate: true })
</script>

<style lang="scss" scoped>
.enBlockLockContainer {
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
