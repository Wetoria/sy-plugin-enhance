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

  const needUnderline = commentOptions.value.commentStyle
  const needHighlight = commentOptions.value.enableHighlight
  const borderStyle = commentOptions.value.commentStyle === 'wavy' ? 'dashed' : commentOptions.value.commentStyle

  const underLineStyle = needUnderline
    ? `
      text-decoration-line: underline;
      text-decoration-style: ${commentOptions.value.commentStyle};
      text-decoration-color: ${commentOptions.value.commentUnderlineColor};
      text-decoration-thickness: ${commentOptions.value.commentUnderlineWidth}px;
    `
    : ''

  const assetsBorderStyle = needUnderline
    ? `
      border: ${commentOptions.value.commentUnderlineWidth}px ${borderStyle} var(--en-comment-highlight-color, ${commentOptions.value.commentUnderlineColor});
    `
    : ''

  const highlightStyle = needHighlight
    ? `
      background-color: ${commentOptions.value.commentBackgroundColor};
    `
    : ''

  styleDomRef.value.textContent = `
    ${lineSelectorList.map((item) => {
      return `
        ${item} {
          ${underLineStyle}
          ${highlightStyle}

          & * {
            ${underLineStyle}
            ${highlightStyle}
          }
        }
      `
    }).join('\n')}
    ${blockSelectorList.map((item) => {
      return `
        ${item} {
          --en-comment-highlight-color: ${commentOptions.value.commentUnderlineColor};

          &[data-type="NodeParagraph"],
          &[data-type="NodeHeading"],
          [data-type="NodeParagraph"],
          [data-type="NodeHeading"] {
            & > div:first-child {
              ${underLineStyle}
              ${highlightStyle}
              ${needHighlight ? `display: inline;` : ''}

              & *:not([data-type*="en-comment-id"]) {
                ${underLineStyle}
              }

              img {
                ${assetsBorderStyle}
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
            ${assetsBorderStyle}
            ${highlightStyle}
          }
        }
      `
    }).join('\n')}
  `
})



// #endregion 监听思源事件，更新评论样式
</script>

<style lang="scss" scoped>

</style>
