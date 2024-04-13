<template>
  <span
    class="enBlockLockContainer"
    v-if="enabled"
    @click="() => manualSwitchLockStatus()"
  >
    <icon-font type="en-lock"  v-if="lockedTypes.includes(locked)" />
    <icon-font type="en-unlock" v-else />
  </span>
</template>

<script setup lang="ts">
import dayjs from 'dayjs';
import { onMounted, ref, watch, watchEffect } from 'vue';
import { getUpdated } from './EnParagraphBlockTime.vue';

const props = defineProps<{
  pDom: HTMLDivElement
  enabled: boolean
  autoLockTimeDiff: number
  autoCheckTime: number
}>()

const updated = ref(getUpdated(props.pDom))
onMounted(() => {
  timeChangeListener()
})

const timeChangeListenerFlag = ref()
const timeChangeListener = () => {
  clearInterval(timeChangeListenerFlag.value)
  timeChangeListenerFlag.value = setInterval(() => {
    updated.value = getUpdated(props.pDom)
    checkLockedStatus()
  }, props.autoCheckTime * 1000)
}

watch(() => props.autoCheckTime, () => {
  console.log('props.autoCheckTime is ', props.autoCheckTime)
  timeChangeListener()
})

const lock = (locked: boolean) => {
  const editableDiv = props.pDom.firstChild as HTMLDivElement
  editableDiv.contentEditable = `${!locked}`
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
  if (!updated.value) {
    return false
  }
  const isOverTime = currentTime.subtract(props.autoLockTimeDiff, 'seconds').isAfter(updated.value)
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

watch(props, () => {
  if (props.enabled) {
    checkLockedStatus()
  } else {
    locked.value = LOCK_STATUS.unlocked
  }
}, { immediate: true })

watchEffect(() => {
  props.pDom.dataset.enBlockLocked = locked.value
  if (locked.value === LOCK_STATUS.locked) {
    lock(true)
  } else {
    lock(false)
  }
})
</script>

<style lang="scss" scoped>
.enBlockLockContainer {
  cursor: pointer;
}
</style>
