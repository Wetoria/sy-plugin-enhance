<template>
  <div class="EnLifeLogSettingTypeItemContainer">
    <a-button @click="addTypeItem">
      <template #icon>
        <icon-plus />
      </template>
    </a-button>
    <template
      v-for="(item, index) in typeItem.items"
      :key="index"
    >
      <a-space>
        <a-input
          v-model="item.type"
          class="EnLifelogTypeItemInput"
        >
          <template #prefix>
            <EnColorPicker
              v-model="item.color"
              type="color"
            />
          </template>
          <template #suffix>
            <a-button
              type="text"
              status="danger"
              @click="deleteTypeItem(index)"
            >
              <template #icon>
                <icon-minus />
              </template>
            </a-button>
          </template>
        </a-input>
      </a-space>
    </template>
  </div>
</template>

<script setup lang="ts">
import EnColorPicker from '@/components/EnColorPicker.vue'


const props = defineProps<{
  typeItem: ILifeLogTypeItem
}>()

const addTypeItem = () => {
  props.typeItem.items.unshift({
    type: '',
    color: props.typeItem.baseColor,
  })
}

const deleteTypeItem = (index: number) => {
  props.typeItem.items = props.typeItem.items.filter((_, i) => i !== index)
}
</script>

<style lang="scss" scoped>
.EnLifeLogSettingTypeItemContainer {
  display: flex;
  flex-wrap: wrap;
  gap: var(--en-gap);
  align-items: center;
  min-height: 30px;
}
.EnLifelogTypeItemInput {
  width: 105px;
  padding-left: var(--en-gap);
  padding-right: var(--en-gap);

  :deep(.arco-input-prefix) {
    padding-right: var(--en-gap);
  }
  :deep(.arco-input-suffix) {
    padding-left: var(--en-gap);
  }
}
</style>
