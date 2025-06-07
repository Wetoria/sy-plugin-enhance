<template>
  <EnModal
    v-model:visible="visible"
    title="LifeLog 数据检查"
  >
    <template #title>
      <div>
        核对 LifeLog
      </div>
    </template>
    <div class="EnLifeLogCheckerContainer">
      <div v-if="onlyOneDateMatchedParagraphList.length">
        <div>
          <a-typography-text
            bold
            type="primary"
          >
            可直接转换的块
          </a-typography-text>
        </div>
        <div
          v-for="item in onlyOneDateMatchedParagraphList"
          :key="item.id"
          class="row flexAlignCenter"
        >
          <icon-check-circle style="color: rgb(var(--success-6))" />
          <span>{{ `${item.date} ${item.markdown}` }}</span>
          <EnBlockJumper :block-id="item.id" />
        </div>

      </div>
      <div v-if="multipleDateMatchedParagraphList.length">
        <div>
          <a-typography-text
            bold
            type="primary"
          >
            需要确认的块
          </a-typography-text>
        </div>
        <div>
          请选择要绑定的日期
        </div>
        <div
          v-for="item in multipleDateMatchedParagraphList"
          :key="item.id"
        >
          <div class="row flexAlignCenter">
            <icon-question-circle style="color: rgb(var(--orange-6))" />
            <span>{{ `${item.markdown}` }}</span>
            <EnBlockJumper :block-id="item.id" />
          </div>

          <div
            v-for="date in props.data.docDateMap[item.root_id]"
            :key="date"
          >
            <a-radio
              v-model="item.date"
              :value="date"
            >
              {{ date }}
            </a-radio>
          </div>
        </div>
      </div>
      <div>
        <div>
          <a-typography-text
            bold
            type="primary"
          >
            无法转换的块
          </a-typography-text>
        </div>
        <div>
          段落内容已经设置了格式，将不会进行转换
        </div>
        <div
          v-for="item in cannotConvertParagraphList"
          :key="item.id"
          class="row flexAlignCenter"
        >
          <icon-close-circle style="color: rgb(var(--danger-6))" />
          <span>{{ `${item.markdown}` }}</span>
          <EnBlockJumper :block-id="item.id" />
        </div>
      </div>
      <div>
        <a-button
          type="primary"
          @click="startConvert"
        >
          开始转换
        </a-button>
      </div>
    </div>
  </EnModal>
</template>

<script setup lang="ts">
import EnBlockJumper from '@/components/EnBlockJumper.vue'
import EnModal from '@/components/EnModal.vue'
import {
  convertLifeLogParagraph,
  lifelogKeyMap,
} from '@/modules/LifeLog/LifeLog'
import { Message } from '@arco-design/web-vue'
import dayjs from 'dayjs'
import { computed } from 'vue'

const props = defineProps<{
  data: ILifeLogCheckData
  visible: boolean
}>()
const visible = defineModel<boolean>('visible')

const canConvertParagraphList = computed(() => {
  return props.data?.paragraphList.filter((i) => {
    const contentStart = i.content.split('：')[0]
    const markdownStart = i.markdown.split('：')[0]
    return contentStart === markdownStart
  })
})

const cannotConvertParagraphList = computed(() => {
  return props.data?.paragraphList.filter((i) => {
    return !canConvertParagraphList.value.some((j) => i == j)
  })
})

const onlyOneDateMatchedParagraphList = computed(() => {
  return canConvertParagraphList.value.filter((i) => {
    const isOnlyOne = props.data?.docDateMap[i.root_id].length === 1
    if (isOnlyOne) {
      i.date = dayjs(props.data?.docDateMap[i.root_id][0]).format(lifelogKeyMap.YYYY_MM_DD)
    }
    return isOnlyOne
  })
})

const multipleDateMatchedParagraphList = computed(() => {
  return canConvertParagraphList.value.filter((i) => {
    return props.data?.docDateMap[i.root_id].length > 1
  })
})

const startConvert = async () => {
  const dataValid = canConvertParagraphList.value.every((i) => i.date)
  if (!dataValid) {
    Message.error('请先完成日期选择')
    return
  }
  const data = canConvertParagraphList.value.map((i) => {
    return {
      id: i.id,
      content: i.content,
      date: i.date,
    }
  })
  try {
    await convertLifeLogParagraph(data)
    Message.success('转换成功')
    visible.value = false
  } catch (error) {
    Message.error('转换失败')
  }
}

</script>

<style lang="scss" scoped>
.EnLifeLogCheckerContainer {
  display: flex;
  flex-direction: column;
  padding: 8px 16px;
  gap: 8px;
}
</style>
