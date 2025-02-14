import { defineStore } from 'pinia'
import { reactive, ref, computed, watch } from 'vue'
import { getUserApp, topApp } from '@/api/modules/app'
import useUserStore from './user'
import useEventStore from './event'
const useAppStore = defineStore('app', () => {
  const eventStore = useEventStore()
  const userStore = useUserStore()
  const appList = ref([])
  const appLoading = ref(false)
  // AppSelect 组件选中app
  const app = ref('')
  /**
   * @description 查询用户所属项目组下的应用
   * @returns
   */
  async function getAppList() {
    let res = {}
    appLoading.value = true
    appList.value = []
    try {
      res = await getUserApp({ keyWord: '' })
      if (res.code === 200 && res.data) {
        appList.value = res.data
        selectAppId(appList.value)
      }
    } catch (error) {
      console.log(error)
    } finally {
      appLoading.value = false
    }

    return res
  }
  /**
   * @description 清空应用列表
   * @returns
   */
  function clearAppList() {
    appList.value = []
    app.value = ''
    selectAppId(appList.value)
  }

  // 设置选中appId
  const selectAppId = (data) => {
    const userId = userStore.userInfo.userId
    if (Array.isArray(data)) {
      const appId =
        sessionStorage.getItem('appId') || localStorage.getItem(userId)
      /*新创建账号没有缓存应用，直接往下执行选中第一个应用*/
      //if (!appId) return
      const find = data.find((el) => el.appId === appId)
      if (find) {
        app.value = appId
      } else {
        const apps = data[0]
        if (apps?.appId) {
          app.value = apps.appId
        } else {
          app.value = ''
          localStorage.removeItem(userId)
          sessionStorage.removeItem('appId')
          return
        }
      }
      let newAppid = app.value || localStorage.getItem(userId)
      newAppid = newAppid === 'null' ? '' : newAppid || ''
      localStorage.setItem(userId, newAppid)
      sessionStorage.setItem('appId', newAppid)
    }
  }

  /* watch(
    appList,
    (newVal) => {
      selectAppId(newVal)
    },
    {
      deep: true,
    }
  ) */

  // 事件相关获取
  watch(app, async (val) => {
    eventStore.getEventsAbout(val)
  })
  return { appList, getAppList, appLoading, selectAppId, clearAppList, app }
})

export default useAppStore
