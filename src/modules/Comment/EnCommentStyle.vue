<template>
  <slot></slot>
</template>

<script setup lang="ts">
import {
  EN_COMMENT_KEYS,
  getNodeIdByCommentId,
  injectCommentIdList,
  injectCommentOptions,
} from '@/modules/Comment/Comment'
import { useRegisterStyle } from '@/utils/DOM'
import {
  onBeforeUnmount,
  watchEffect,
} from 'vue'

const commentOptions = injectCommentOptions()

// #region 监听思源事件，更新评论样式
const commentIdList = injectCommentIdList()

const styleDomRef = useRegisterStyle('en-line-comment-style')
onBeforeUnmount(() => {
  styleDomRef.value.remove()
})
// 监听 commentIdList 的变化，更新样式
watchEffect(() => {
  const lineSelectorList = commentIdList.value.map((i) => {
    const nodeId = getNodeIdByCommentId(i)
    return `[data-node-id="${nodeId}"] [data-type~="${i}"]`
  })
  const blockSelectorList = commentIdList.value.map((i) => {
    const nodeId = getNodeIdByCommentId(i)
    return `[data-node-id="${nodeId}"][${EN_COMMENT_KEYS.commentIdInAttribute}~="${i}"]`
  })

  const isHighlight = commentOptions.value.commentStyle === 'highlight'
  const borderStyle = commentOptions.value.commentStyle === 'wavy' ? 'dashed' : commentOptions.value.commentStyle

  if (isHighlight) {
    styleDomRef.value.textContent = `
      ${lineSelectorList.join(', ')} {
        background-color: ${commentOptions.value.commentUnderlineColor};
        box-decoration-break: clone;

        & * {
          background-color: ${commentOptions.value.commentUnderlineColor};
          box-decoration-break: clone;
        }
      }
      ${blockSelectorList.join(', ')} {
        &[data-type="NodeParagraph"],
        &[data-type="NodeHeading"],
        [data-type="NodeParagraph"],
        [data-type="NodeHeading"] {
          & > div:first-child {
            background-color: ${commentOptions.value.commentUnderlineColor};
            box-decoration-break: clone;
          }
        }

        [data-type="NodeWidget"],
        [data-type="NodeBlockQueryEmbed"],
        [data-type="NodeHTMLBlock"],
        [data-type="NodeCodeBlock"],
        [data-type="NodeVideo"] video,
        [data-type="NodeAudio"] audio,
        [data-type="NodeIFrame"] {
          background-color: ${commentOptions.value.commentUnderlineColor};
          box-decoration-break: clone;
        }
      }
    `

    return
  }
  styleDomRef.value.textContent = `
    ${lineSelectorList.join(', ')} {
      text-decoration-line: underline;
      text-decoration-style: ${commentOptions.value.commentStyle};
      text-decoration-color: ${commentOptions.value.commentUnderlineColor};
      text-decoration-thickness: ${commentOptions.value.commentUnderlineWidth}px;

      & * {
        text-decoration-line: underline;
        text-decoration-style: ${commentOptions.value.commentStyle};
        text-decoration-color: ${commentOptions.value.commentUnderlineColor};
        text-decoration-thickness: ${commentOptions.value.commentUnderlineWidth}px;
      }
    }
    ${blockSelectorList.join(', ')} {
      &[data-type="NodeParagraph"],
      &[data-type="NodeHeading"],
      [data-type="NodeParagraph"],
      [data-type="NodeHeading"] {
        & > div:first-child {
          text-decoration-line: underline;
          text-decoration-style: ${commentOptions.value.commentStyle};
          text-decoration-color: ${commentOptions.value.commentUnderlineColor};
          text-decoration-thickness: ${commentOptions.value.commentUnderlineWidth}px;

          & * {
            text-decoration-line: underline;
            text-decoration-style: ${commentOptions.value.commentStyle};
            text-decoration-color: ${commentOptions.value.commentUnderlineColor};
            text-decoration-thickness: ${commentOptions.value.commentUnderlineWidth}px;
          }

          img {
            border: ${commentOptions.value.commentUnderlineWidth}px ${borderStyle} ${commentOptions.value.commentUnderlineColor};
          }
        }
      }

      [data-type="NodeWidget"],
      [data-type="NodeBlockQueryEmbed"],
      [data-type="NodeHTMLBlock"],
      [data-type="NodeCodeBlock"],
      [data-type="NodeVideo"] video,
      [data-type="NodeAudio"] audio,
      [data-type="NodeIFrame"] {
        border: ${commentOptions.value.commentUnderlineWidth}px ${borderStyle} ${commentOptions.value.commentUnderlineColor};
      }
    }
  `
})



// #endregion 监听思源事件，更新评论样式
</script>

<style lang="scss" scoped>

</style>
