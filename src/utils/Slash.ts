import { enI18n } from '@/i18n'
import { usePlugin } from '@/main'
import { Protyle } from 'siyuan'

export interface ISlash {
  filter: string[]
  html: string
  id: string
  callback: (protyle: Protyle, nodeElement: HTMLElement) => void
}


export function addSlash(slash: ISlash) {
  const plugin = usePlugin()
  slash.filter.unshift(enI18n.pluginName)
  slash.filter.unshift('叶归')
  plugin.protyleSlash.push(slash)
}

export function removeSlashById(id: string) {
  const plugin = usePlugin()
  plugin.protyleSlash = plugin.protyleSlash.filter((i) => i.id !== id)
}

export function removeSlash(slash: ISlash) {
  removeSlashById(slash.id)
}

export function batchAddSlash(slashList: ISlash[]) {
  slashList.forEach((slash) => {
    addSlash(slash)
  })
}

export function batchRemoveSlash(slashList: ISlash[]) {
  slashList.forEach((slash) => {
    removeSlash(slash)
  })
}

export function getSlashHtml(langText: string, meta?: string, iconName: string = 'iconEnLeaf2') {
  return `
    <div class="b3-list-item__first">
      <svg class="b3-list-item__graphic">
        <use xlink:href="#${iconName}"></use>
      </svg>
      <span class="b3-list-item__text">
        ${langText}
      </span>
      ${meta ? `<span class="b3-list-item__meta">${meta}</span>` : ''}
    </div>
  `
}
