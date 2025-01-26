<template>
  <div class="memo-timeline">
    <div class="timeline-container">
      <div
        v-for="(memo, index) in memos"
        :key="index"
        class="timeline-item"
      >
        <div class="timeline-meta">
          <div class="timeline-time">
            {{ memo.time }}
          </div>
          <div class="timeline-dot"></div>
        </div>
        <div class="timeline-content">
          <div class="memo-card">
            <div class="memo-card-content">
              <EnProtyle
                :block-id="memo.blockId"
                :preview="true"
                disableEnhance
                @after="(protyle) => afterProtyleLoad(protyle, index)"
              />
              <div
                class="protyle-util-area"
                :data-memo-index="index"
              ></div>
            </div>
            <div class="card-actions">
              <span
                class="action-icon"
                @click="handleEdit(index)"
              >
                <svg><use xlink:href="#iconEdit"></use></svg>
              </span>
              <span
                class="action-icon"
                @click="handleDelete(index)"
              >
                <svg><use xlink:href="#iconTrashcan"></use></svg>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Protyle } from 'siyuan'
import type { PropType } from 'vue'
import EnProtyle from '@/components/EnProtyle.vue'
import {
  onBeforeUnmount,
  ref,
} from 'vue'

export interface Memo {
  blockId: string
  time: string
  type?: 'annotation' | 'lifelog' | 'whiteboard' | 'diary'
  hasTimestamp?: boolean
  tags?: string[]
}

const props = defineProps({
  memos: {
    type: Array as PropType<Memo[]>,
    required: true,
  },
})

const emit = defineEmits<{
  (e: 'edit', index: number): void
  (e: 'delete', index: number): void
}>()

const protyleRefs = ref<Map<number, Protyle>>(new Map())

const targetProtyleUtilClassList = [
  'protyle-gutters',
  'protyle-select',
  'protyle-toolbar',
  'protyle-hint',
]

const afterProtyleLoad = (protyle: Protyle, index: number) => {
  protyleRefs.value.set(index, protyle)

  // 移动工具区域到指定位置
  const utilArea = document.querySelector(`.protyle-util-area[data-memo-index="${index}"]`)
  if (utilArea) {
    targetProtyleUtilClassList.forEach((className) => {
      const target = protyle.protyle.element.querySelector(`.${className}`)
      if (target) {
        utilArea.appendChild(target)
      }
    })
  }
}

const handleEdit = (index: number) => {
  emit('edit', index)
}

const handleDelete = (index: number) => {
  emit('delete', index)
}

onBeforeUnmount(() => {
  // 清理 protyle 实例
  protyleRefs.value.forEach((protyle) => {
    const instance = protyle.protyle.getInstance()
    if (instance) {
      instance.destroy?.()
    }
  })
})
</script>

<style lang="scss">
.memo-timeline {
  flex: 1;
  overflow-y: auto;
  position: relative;

  .timeline-container {
    position: relative;
    padding-left: 20px;

    &::before {
      content: '';
      position: absolute;
      left: 4px;
      top: 0;
      bottom: 0;
      width: 2px;
      background-color: var(--b3-border-color);
      opacity: 0.4;
    }

    .timeline-item {
      display: flex;
      flex-direction: column;
      margin-bottom: 24px;
      position: relative;

      .timeline-meta {
        margin-bottom: 8px;
        position: relative;

        .timeline-dot {
          position: absolute;
          left: -20px;
          top: 50%;
          transform: translateY(-50%);
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: var(--b3-theme-primary);
          z-index: 1;
          margin-left: 1px;
        }

        .timeline-time {
          font-size: 12px;
          color: var(--b3-theme-on-surface);
          opacity: 0.68;
        }
      }

      .timeline-content {
        .memo-card {
          background: var(--b3-theme-background);
          border-radius: var(--b3-border-radius);
          padding: 12px;
          border: 1px solid var(--b3-border-color);
          position: relative;

          .memo-card-content {
            position: relative;
          }

          .protyle-util-area {
            position: absolute;
            left: 0;
            right: 0;
            top: 0;
            pointer-events: none;
            z-index: 1;

            :deep(*) {
              pointer-events: auto;
            }
          }

          :deep(.protyle-wysiwyg) {
            padding: 0;

            [contenteditable="true"] {
              cursor: default;
            }
          }

          .card-actions {
            position: absolute;
            top: 8px;
            right: 8px;
            display: flex;
            gap: 4px;
            opacity: 0;
            transition: opacity 0.2s ease;

            .action-icon {
              cursor: pointer;
              padding: 4px;

              svg {
                height: 14px;
                width: 14px;
                fill: currentColor;
                opacity: 0.68;
              }

              &:hover {
                background-color: var(--b3-theme-background-light);
                border-radius: var(--b3-border-radius);

                svg {
                  opacity: 1;
                }
              }
            }
          }

          &:hover {
            .card-actions {
              opacity: 1;
            }
          }
        }
      }
    }
  }
}
</style>
