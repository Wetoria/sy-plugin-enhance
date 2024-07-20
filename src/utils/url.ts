export const basePluginUrlScheme = 'siyuan://plugins/sy-plugin-enhance'

export enum URL_TYPE_MAP {
  VideoAndAudio = 'VideoAndAudio',
}

interface EnURLParams {
  type?: keyof typeof URL_TYPE_MAP
}

export interface EnVideoAndAudioUrlParams extends EnURLParams{
  t?: string
  bid?: string
}

export const urlSchemeCreator = (params: EnURLParams = {} as any) => {
  const keys = Object.keys(params)
  let base = `${basePluginUrlScheme}`
  if (keys.length) {
    base += '?'
    base += keys.map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`).join('&')
  }

  return base
}

export function isPluginUrl(url: URL): boolean {
  return `${url.protocol}${url.pathname}` === basePluginUrlScheme
}

export function isTargetPluginType(href: string, targetType: EnURLParams['type']): boolean {
  let result = false
  try {
    const linkUrl = new URL(href)
    const linkUrlSearchParams = linkUrl.searchParams
    if (isPluginUrl(linkUrl) && linkUrlSearchParams.get('type') === targetType) {
      result = true
    }
  } catch(err) {
    result = false
  }
  return result
}

export function convertSiyuanLinkIntoNormal(str: string) {
  return str.replace(/&amp;/g, "&")
}
