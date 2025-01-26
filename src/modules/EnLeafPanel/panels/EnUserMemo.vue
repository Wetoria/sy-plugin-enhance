<template>
  <div class="en-user-memo">
    <div class="memo-input-card">
      <textarea
        v-model="newMemo"
        class="b3-text-field fn__block"
        placeholder="写点什么..."
        rows="3"
      ></textarea>
      <div class="divider"></div>
      <div class="memo-toolbar">
        <button
          class="b3-button b3-button--outline"
          @click="addMemo"
        >
          <svg class="action-icon"><use xlink:href="#iconAdd"></use></svg>
          {{ isEditing ? '更新' : '添加' }}
        </button>
        <button
          v-if="isEditing"
          class="b3-button b3-button--text"
          @click="cancelEdit"
        >
          取消
        </button>
      </div>
    </div>

    <!-- 功能按钮栏 -->
    <div class="memo-actions">
      <div class="action-group">
        <button class="b3-button b3-button--text">
          <svg class="action-icon"><use xlink:href="#iconCalendar"></use></svg>
          时间
        </button>
        <button class="b3-button b3-button--text">
          <svg class="action-icon"><use xlink:href="#iconTags"></use></svg>
          标签
        </button>
        <button class="b3-button b3-button--text">
          <svg class="action-icon"><use xlink:href="#iconSort"></use></svg>
          排序
        </button>
      </div>
      <div class="action-group">
        <button class="b3-button b3-button--text">
          <svg class="action-icon"><use xlink:href="#iconSearch"></use></svg>
        </button>
      </div>
    </div>

    <!-- 时间线列表 -->
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
            <div class="memo-content">
              {{ memo.content }}
            </div>
            <div class="memo-actions">
              <span
                class="action-icon"
                @click="editMemo(index)"
              >
                <svg><use xlink:href="#iconEdit"></use></svg>
              </span>
              <span
                class="action-icon"
                @click="deleteMemo(index)"
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
import { ref } from 'vue'

interface Memo {
  content: string
  time: string
}

const memos = ref<Memo[]>([])
const newMemo = ref('')
const isEditing = ref(false)
const editingIndex = ref(-1)

const addMemo = () => {
  if (!newMemo.value.trim()) return

  if (isEditing.value && editingIndex.value !== -1) {
    // 更新现有备忘录
    memos.value[editingIndex.value] = {
      content: newMemo.value,
      time: `${new Date().toLocaleString()} (已编辑)`,
    }
    isEditing.value = false
    editingIndex.value = -1
  } else {
    // 添加新备忘录
    memos.value.unshift({
      content: newMemo.value,
      time: new Date().toLocaleString(),
    })
  }

  newMemo.value = ''
}

const editMemo = (index: number) => {
  isEditing.value = true
  editingIndex.value = index
  newMemo.value = memos.value[index].content
}

const deleteMemo = (index: number) => {
  memos.value.splice(index, 1)
}

const cancelEdit = () => {
  isEditing.value = false
  editingIndex.value = -1
  newMemo.value = ''
}
</script>

<style lang="scss">
.en-user-memo {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 8px;
  padding: 8px;

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

      .action-icon {
        height: 14px;
        width: 14px;
        margin-right: 4px;
        fill: currentColor;
      }
    }
  }

  // 功能按钮栏样式
  .memo-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 4px 0;
    border-bottom: 1px solid var(--b3-border-color);

    .action-group {
      display: flex;
      gap: 8px;

      .action-icon {
        height: 14px;
        width: 14px;
        fill: currentColor;
      }
    }
  }

  // 时间线样式
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
          background: var(--b3-theme-background);
          border-radius: var(--b3-border-radius);
          padding: 12px;
          border: 1px solid var(--b3-border-color);

          .memo-content {
            font-size: 14px;
            line-height: 1.5;
            white-space: pre-wrap;
            margin-bottom: 8px;
          }

          .memo-actions {
            display: flex;
            gap: 8px;
            justify-content: flex-end;
            border-bottom: none;
            padding: 0;

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
        }
      }
    }
  }
}
</style>
