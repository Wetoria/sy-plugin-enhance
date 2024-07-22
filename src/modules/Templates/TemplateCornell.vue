<template>
  <div></div>
</template>

<script setup lang="ts">
import { usePlugin } from '@/main';
import { Protyle } from 'siyuan';

const plugin = usePlugin()

plugin.protyleSlash.push({
  filter: [
    "add template cornell",
    'atc',
    "插入模板 - 康奈尔",
  ],
  html: `<div class="b3-list-item__first"><span class="b3-list-item__text">${'插入模板 - 康奈尔'}</span></div>`,
  id: "enTemplateInsertCornell",
  callback(protyle: Protyle) {
    const iProtyle = protyle.protyle
    console.log('id is ', iProtyle.selectElement)
    protyle.insert(`{{{row\n{{{col\n{{{row\n线索\n{: style="" }\n{: style="" }\n}}}\n{{{row\n笔记\n{: style="" }\n{: style="" }\n}}}\n}}}\n{{{row\n总结\n{: style="" }\n{: style="" }\n}}}\n}}}\n{: custom-iscornell="true" }`);
  }
})
</script>

<style lang="scss">
[custom-iscornell="true"] {
  & > [data-type="NodeSuperBlock"] {
    // border: 1px solid var(--b3-border-color);
    margin: unset !important;

    // 上面
    &:first-child {
      border-bottom-left-radius: unset;
      border-bottom-right-radius: unset;

      // 左侧
      & [data-type="NodeSuperBlock"]:first-child {
        width: 33%;
        flex: 0 0 auto;
        margin: 0;
        margin-right: var(--en-gap);
        padding: var(--en-gap);
        background-color: var(--b3-font-background10);
        margin-bottom: var(--en-gap);
        border-top-right-radius: unset;
        border-bottom-left-radius: unset;
        border-bottom-right-radius: unset;
        border-radius: unset;
        flex: unset;
        height: auto;

        & > div:first-child {
          color: var(--b3-font-color10);
        }
      }

      // 右侧
      & [data-type="NodeSuperBlock"]:not(:first-child) {
        border-left: unset;
        margin: 0;
        padding: var(--en-gap);
        background-color: var(--b3-font-background2);
        margin-bottom: var(--en-gap);
        border-top-left-radius: unset;
        border-bottom-left-radius: unset;
        border-bottom-right-radius: unset;
        border-radius: unset;
        flex: 1;
        height: auto;

        & > div:first-child {
          color: var(--b3-font-color2);
        }
      }
    }


    // 下面
    &:not(:first-child) {
      border-top-left-radius: unset;
      border-top-right-radius: unset;
      border-radius: unset;
      background-color: var(--b3-font-background12);
      margin: 0;
      padding: var(--en-gap);

      & > div:first-child {
        color: var(--b3-font-color12);
      }
    }
  }
}
</style>
