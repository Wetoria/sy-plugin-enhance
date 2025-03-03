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
              <template v-if="memo.type === 'whiteboard'">
                <div class="whiteboard-preview">
                  <VueFlow
                    v-if="memo.whiteBoardConfig?.boardOptions?.nodes"
                    :nodes="memo.whiteBoardConfig.boardOptions.nodes"
                    :edges="memo.whiteBoardConfig.boardOptions.edges"
                    :defaultViewport="memo.whiteBoardConfig.boardOptions.viewport"
                    :fitView="true"
                    :panOnDrag="false"
                    :zoomOnScroll="false"
                    :zoomOnPinch="false"
                    :preventScrolling="true"
                    :nodesConnectable="false"
                    :nodesDraggable="false"
                    :elementsSelectable="false"
                  >
                    <template #node-EnWhiteBoardNodeProtyle="node">
                      <div class="minimap-node" />
                    </template>
                    <template #edge-EnWhiteBoardEdgeBase="edge">
                      <div class="minimap-edge" />
                    </template>
                    <MiniMap
                      :zoomable="false"
                      :pannable="false"
                      maskColor="transparent"
                    />
                  </VueFlow>
                  <div class="whiteboard-title">
                    <svg class="whiteboard-icon"><use xlink:href="#iconLayout"></use></svg>
                    <span class="whiteboard-name">{{ memo.docPath }}</span>
                  </div>
                </div>
              </template>
              <template v-else-if="memo.type === 'annotation'">
                <div v-if="memo.blockId" class="annotation-container">
                  <EnProtyle
                    :block-id="memo.blockId"
                    :preview="true"
                    disableEnhance
                    :options="{
                      render: {
                        gutter: false,
                        breadcrumb: false,
                        scroll: false,
                      },
                    }"
                    @after="(protyle) => afterProtyleLoad(protyle, index)"
                  />
                  <div class="annotation-source" v-if="memo.docPath">
                    <span class="annotation-source-label">来源：</span>
                    <span class="annotation-source-path" @click="openDocument(memo.docId)">{{ getDocName(memo.docPath) }}</span>
                    <span class="annotation-ref-link" @click="openBlock(memo.blockId)">
                      <svg><use xlink:href="#iconLink"></use></svg>
                      <span>查看原文</span>
                    </span>
                  </div>
                </div>
                <div v-else class="annotation-error">
                  <div class="error-message">
                    <svg><use xlink:href="#iconExclamation"></use></svg>
                    <span>无法加载批注内容</span>
                  </div>
                </div>
              </template>
              <template v-else>
                <EnProtyle
                  :block-id="memo.blockId"
                  :preview="true"
                  disableEnhance
                  :options="{
                    render: {
                      gutter: false,
                      breadcrumb: false,
                      scroll: false,
                    },
                  }"
                  @after="(protyle) => afterProtyleLoad(protyle, index)"
                />
                <div
                  class="protyle-util-area"
                  :data-memo-index="index"
                ></div>
              </template>
            </div>
            <div class="card-actions">
              <span
                class="action-icon"
                @click="handleEdit(index)"
              >
                <svg><use xlink:href="#iconEdit"></use></svg>
              </span>
              <span
                v-if="memo.type !== 'daily' && memo.type !== 'whiteboard'"
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
import { request } from '@/api'
import EnProtyle from '@/components/EnProtyle.vue'
import { VueFlow } from '@vue-flow/core'
import { MiniMap } from '@vue-flow/minimap'
import { openTab } from 'siyuan'
import {
  onBeforeUnmount,
  ref,
  watch,
} from 'vue'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/minimap/dist/style.css'

export interface Memo {
  blockId: string
  time: string
  type: 'daily' | 'whiteboard' | 'annotation' | string
  content?: string
  dailyNoteId?: string
  blockType?: string
  dateValue?: string
  docId?: string
  docPath?: string
  whiteBoardConfig?: any
  originalBlockId?: string
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

// 添加对 props.memos 的监听
watch(() => props.memos, (newMemos) => {
  console.log('Timeline received memos:', newMemos)
}, { deep: true })

const protyleRefs = ref<Map<number, Protyle>>(new Map())

const targetProtyleUtilClassList = [
  'protyle-gutters',
  'protyle-select',
  'protyle-toolbar',
  'protyle-hint',
]

const afterProtyleLoad = (protyle: Protyle, index: number) => {
  console.log('Protyle loaded for memo:', props.memos[index])
  console.log('Protyle block ID:', props.memos[index].blockId)
  console.log('Protyle instance:', protyle)
  
  protyleRefs.value.set(index, protyle)

  // 设置为只读
  const wysiwygEl = protyle.protyle.wysiwyg.element
  if (wysiwygEl) {
    wysiwygEl.setAttribute('contenteditable', 'false')
    console.log('Set contenteditable to false')
  } else {
    console.warn('wysiwyg element not found')
  }

  // 移动工具区域到指定位置
  const utilArea = document.querySelector(`.protyle-util-area[data-memo-index="${index}"]`)
  if (utilArea) {
    targetProtyleUtilClassList.forEach((className) => {
      const target = protyle.protyle.element.querySelector(`.${className}`)
      if (target) {
        utilArea.appendChild(target)
      }
    })
    console.log('Moved util area elements')
  } else {
    console.warn('Util area not found for index:', index)
  }
}

// 渲染白板minimap
const renderWhiteboardMinimap = async (blockId: string) => {
  const data = {
    stmt: `
      SELECT
        content
      FROM blocks
      WHERE id = '${blockId}'
    `,
  }
  try {
    const result = await request('/api/query/sql', data)
    if (result && result.length > 0) {
      const content = result[0].content
      // 从content中提取白板数据
      const match = content.match(/data-options="([^"]*)"/)
      if (match) {
        const options = JSON.parse(decodeURIComponent(match[1]))
        return options
      }
    }
  } catch (err) {
    console.error('Failed to get whiteboard content:', err)
  }
  return null
}

const handleEdit = (index: number) => {
  emit('edit', index)
}

const handleDelete = (index: number) => {
  const memo = props.memos[index]
  if (memo.type === 'daily' || memo.type === 'whiteboard') {
    return // 日记和白板不允许删除
  }
  emit('delete', index)
}

// 打开文档
const openDocument = (docId: string) => {
  if (!docId) return
  
  openTab({
    app: window.siyuan.ws.app,
    doc: {
      id: docId,
    }
  })
}

// 从文档路径中获取文档名称
const getDocName = (docPath: string) => {
  if (!docPath) return '未知文档'
  
  // 从路径中提取文档名
  const parts = docPath.split('/')
  return parts[parts.length - 1] || docPath
}

// 打开指定的块
const openBlock = (blockId: string) => {
  if (!blockId) return
  
  // 使用思源API打开块
  openTab({
    app: window.siyuan.ws.app,
    doc: {
      id: blockId,
      action: ['cb-get-focus'],
    }
  })
}

// 获取引用块的内容
const getRefContent = async (blockId: string) => {
  if (!blockId) return null
  
  try {
    const data = {
      stmt: `
        SELECT
          content,
          markdown
        FROM blocks
        WHERE id = '${blockId}'
      `
    }
    const result = await request('/api/query/sql', data)
    if (result && result.length > 0) {
      return result[0]
    }
  } catch (err) {
    console.error('Failed to get ref content:', err)
  }
  return null
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

    .vue-flow__nodes.vue-flow__container>div>.minimap-node {
      display: none;
    }

    .vue-flow__panel {
      position: relative;
      z-index: 5;
      margin: 0px;
    }

    &::before {
      content: '';
      position: absolute;
      left: 4px;
      top: 0;
      bottom: 0;
      width: 1px;
      background-color: var(--b3-border-color);
      opacity: 0.4;
    }

    .timeline-item {
      display: flex;
      flex-direction: column;
      margin-bottom: 12px;
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

.whiteboard-preview {
  aspect-ratio: 16/9;
  position: relative;
  background: var(--b3-theme-surface);
  border-radius: var(--b3-border-radius);
  border: 1px solid var(--b3-border-color);
  overflow: hidden;

  :deep(.vue-flow) {
    position: absolute;
    inset: 0;
    background-color: var(--b3-theme-background);

    .vue-flow__viewport {
      transform: none !important;
    }

    .vue-flow__minimap {
      position: absolute;
      inset: 0;
      width: 100% !important;
      height: 100% !important;
      transform: none;
      margin: 0;
      border-radius: 0;
      background: none;
      border: none;
      box-shadow: none;
      opacity: 1;
      pointer-events: none;

      .vue-flow__minimap-node {
        fill: var(--b3-theme-primary);
        stroke: var(--b3-theme-on-surface);
        stroke-width: 1;
        opacity: 0.6;
      }
    }

    // 隐藏所有不必要的元素
    .vue-flow__controls,
    .vue-flow__background,
    .vue-flow__panel {
      display: none;
    }
  }

  .minimap-node {
    width: 100%;
    height: 100%;
    background-color: var(--b3-theme-primary);
    border-radius: var(--b3-border-radius);
    opacity: 0.6;
  }

  .minimap-edge {
    stroke: var(--b3-theme-on-surface);
    stroke-width: 1;
    opacity: 0.6;
  }

  .whiteboard-title {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 0px;
    background: linear-gradient(to bottom, transparent, rgba(0, 0, 0, 0.1));
    color: var(--b3-theme-on-background);
    font-size: 14px;

    .whiteboard-icon {
      width: 14px;
      height: 14px;
      fill: currentColor;
      flex-shrink: 0;
    }

    .whiteboard-name {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
}

.annotation-container {
  width: 100%;
}

.annotation-error {
  padding: 16px;
  background-color: var(--b3-theme-error-lighter);
  border-radius: var(--b3-border-radius);
  border-left: 3px solid var(--b3-theme-error);
  
  .error-message {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--b3-theme-error);
    
    svg {
      width: 16px;
      height: 16px;
      fill: currentColor;
    }
  }
}

.annotation-source {
  font-size: 12px;
  color: var(--b3-theme-on-surface-light);
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
  
  .annotation-source-path {
    color: var(--b3-theme-primary);
    cursor: pointer;
    
    &:hover {
      text-decoration: underline;
    }
  }
  
  .annotation-ref-link {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    color: var(--b3-theme-primary);
    cursor: pointer;
    padding: 2px 6px;
    border-radius: var(--b3-border-radius);
    background-color: var(--b3-theme-background);
    
    svg {
      width: 12px;
      height: 12px;
      fill: currentColor;
    }
    
    &:hover {
      background-color: var(--b3-theme-surface-light);
      text-decoration: underline;
    }
  }
}
</style>
