import PluginInfo from '@/../plugin.json'
import { fetchPost } from 'siyuan'

const pluginName = (PluginInfo as any).name

export function loadData(storageName: string) {
  return new Promise((resolve) => {
    fetchPost("/api/file/getFile", { path: `/data/storage/petal/${pluginName}/${storageName}` }, (response) => {
      resolve(response)
    })
  })
}
export function saveData(storageName: string, data: any) {
  return new Promise((resolve) => {
    const pathString = `/data/storage/petal/${pluginName}/${storageName}`
    let file: File
    if (typeof data === "object") {
      file = new File([new Blob([JSON.stringify(data)], {
        type: "application/json",
      })], pathString.split("/").pop())
    } else {
      file = new File([new Blob([data])], pathString.split("/").pop())
    }
    const formData = new FormData()
    formData.append("path", pathString)
    formData.append("file", file)
    formData.append("isDir", "false")
    fetchPost("/api/file/putFile", formData, (response) => {
      resolve(response)
    })
  })
}

export function removeData(storageName: string) {
  return new Promise((resolve) => {

    fetchPost("/api/file/removeFile", { path: `/data/storage/petal/${pluginName}/${storageName}` }, (response) => {
      resolve(response)
    })
  })
}
