<template>
  <div class="EnSyEmojiContainer">
    <span v-html="unicode2Emoji(iconAttr)" />
  </div>
</template>

<script setup lang="ts">

defineProps<{
  iconAttr: string
}>()

const unicode2Emoji = (unicode: string, className = "", needSpan = false, lazy = false) => {
  if (!unicode) {
    return ""
  }
  let emoji = ""
  if (unicode.startsWith("api/icon/getDynamicIcon")) {
    emoji = `<img class="${className}" ${lazy ? "data-" : ""}src="${unicode}"/>`
  } else if (unicode.includes(".")) {
    emoji = `<img class="${className}" ${lazy ? "data-" : ""}src="/emojis/${unicode}"/>`
  } else {
    try {
      unicode.split("-").forEach((item) => {
        if (item.length < 5) {
          emoji += String.fromCodePoint(Number.parseInt(`0${item}`, 16))
        } else {
          emoji += String.fromCodePoint(Number.parseInt(item, 16))
        }
      })
      if (needSpan) {
        emoji = `<span class="${className}">${emoji}</span>`
      }
    } catch (e) {
      // 自定义表情搜索报错 https://github.com/siyuan-note/siyuan/issues/5883
      // 这里忽略错误不做处理
    }
  }
  return emoji
}
</script>

<style lang="scss" scoped>

</style>
