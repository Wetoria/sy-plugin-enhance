<template>
  <div class="memo-input-card">
    <textarea
      v-model="inputValue"
      class="b3-text-field fn__block"
      placeholder="写点什么..."
      rows="3"
    ></textarea>
    <div class="divider"></div>
    <div class="memo-toolbar">
      <button
        class="b3-button b3-button--outline"
        @click="handleSubmit"
      >
        {{ isEditing ? '更新' : '添加' }}
      </button>
      <button
        v-if="isEditing"
        class="b3-button b3-button--text"
        @click="handleCancel"
      >
        取消
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  modelValue: string
  isEditing: boolean
}

const props = defineProps({
  modelValue: {
    type: String,
    required: true,
  },
  isEditing: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'submit'): void
  (e: 'cancel'): void
}>()

const inputValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const handleSubmit = () => {
  emit('submit')
}

const handleCancel = () => {
  emit('cancel')
}
</script>

<style lang="scss">
.memo-input-card {
  background: var(--b3-theme-background);
  border-radius: var(--b3-border-radius);
  padding: 8px;

  textarea {
    resize: none;
    border: none !important;
    background: none;
    padding: 0;
    margin-bottom: 8px;
    box-shadow: none !important;

    &:focus {
      box-shadow: none !important;
      border: none !important;
    }

    &::placeholder {
      color: var(--b3-theme-on-surface);
      opacity: 0.5;
    }
  }

  .divider {
    height: 1px;
    background-color: var(--b3-border-color);
    opacity: 0.3;
    margin: 0 -8px 8px -8px;
  }

  .memo-toolbar {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }
}
</style>
