<template>
  <div
    class="EnProtyleContainer"
    ref="protyleContainerRef"
  >
    <div></div>
  </div>
</template>

<script setup lang="ts">
import { usePlugin } from '@/main';
import { IProtyleOption, Protyle } from 'siyuan';
import { onMounted, ref, watch } from 'vue';


const protyleContainerRef = ref<HTMLDivElement>()
const protyleRef = ref<Protyle>()

const props = defineProps<{
  blockId: string
  options?: IProtyleOption
}>()

const emits = defineEmits<{
  after: [protyle: Protyle]
  afterRender: [protyle: Protyle]
}>()

const plugin = usePlugin()

const renderProtyle = () => {
  if (!props.blockId) {
    protyleRef.value = null
    if (protyleContainerRef.value) {
      protyleContainerRef.value.innerHTML = `<div></div>`
    }
    return
  }
  const {
    options = {}
  } = props

  const {
    blockId,
    action,
    render,
    ...rest
  } = options

  protyleRef.value = new Protyle(
    plugin.app,
    protyleContainerRef.value?.firstElementChild as HTMLDivElement,
    {
      blockId: blockId || props.blockId,
      action: action || ['cb-get-focus'],
      render: {
        breadcrumb: false,
        ...render,
      },
      after(protyle: Protyle) {
        emits('after', protyle)
      },
      ...rest,
    }
  )
  emits('afterRender', protyleRef.value)
}

onMounted(() => {
  renderProtyle()
})

watch(props, () => {
  renderProtyle()
})

defineExpose({
  protyleRef,
})
</script>

<style lang="scss" scoped>
.EnProtyleContainer {
  width: 100%;
  height: 100%;

  :deep(.protyle) {
    min-height: 100%;

    .protyle-content {
      padding-bottom: 16px;
    }

    .protyle-wysiwyg {
      width: 100%;
      min-height: 100%;
      box-sizing: border-box;
      padding: 16px 16px !important;
      padding-bottom: 64px !important;
    }
  }
}
</style>
