<template>
  <a-color-picker
    :modelValue="modelValue"
    show-history
    show-preset
    :preset-colors="presetColors"
    v-bind="$attrs"
    @change="handleChange"
  />
</template>

<script lang="ts" setup>
import {
  siyuanBgColorList,
  siyuanColorList,
} from '@/modules/Editor/EnFont.vue'
import {
  computed,
  onMounted,
  ref,
  watch,
} from 'vue'

const props = defineProps<{
  type: 'color' | 'bgColor'
  defaultIndex?: number | string
}>()


const modelValue = defineModel()
const colorList = ref([])
const bgColorList = ref([])

const presetColors = computed(() => {
  if (props.type === 'color') {
    return colorList.value
  } else if (props.type == 'bgColor') {
    return bgColorList.value
  }
  return undefined
})

const defaultValue = computed(() => presetColors.value[props.defaultIndex || 0])

let resetting = false
const setDefaultColor = () => {
  if (!modelValue.value) {
    resetting = true
    modelValue.value = defaultValue.value
  }
}

watch(modelValue, () => {
  setDefaultColor()
})

onMounted(() => {
  setTimeout(() => {
    const styles = getComputedStyle(document.body)
    colorList.value = []
    bgColorList.value = []

    const themeFontColor = styles.getPropertyValue('--b3-theme-on-background')
    colorList.value.push(themeFontColor)

    siyuanColorList.forEach((item) => {
      const key = item.replace('var(', '').replace(')', '')
      const myColor = styles.getPropertyValue(key)
      colorList.value.push(myColor)
    })

    const themeBgColor = styles.getPropertyValue('--b3-theme-background')
    bgColorList.value.push(themeBgColor)

    siyuanBgColorList.forEach((item) => {
      const key = item.replace('var(', '').replace(')', '')
      const myColor = styles.getPropertyValue(key)
      bgColorList.value.push(myColor)
    })

    setDefaultColor()
  }, 1000)
})

const handleChange = (value) => {
  if (resetting) {
    resetting = false
    return
  }
  modelValue.value = value
}
</script>
