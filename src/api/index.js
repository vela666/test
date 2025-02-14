import axios from 'axios'
import { ElMessage } from 'element-plus'
import useUserStore from '@/store/modules/user'
import useHttpCancelStore from '@/store/modules/http-cancel'
import { localTokenKey, localUserIdKey } from '@/enumeration/auth'
import { getLocalValue } from '@/utils'
import { messageBoxConfirmFn, showStatusTip } from './statusProcessing'
import { downloadFile } from '@/utils/excel'
import { v4 as uuidv4 } from 'uuid'
import dayjs from 'dayjs'
import calculateApi from '@/api/modules/analysis/calculate-api.js'
import { domesticOverseasMark } from '@/utils/domesticOverseas.js'

// 由于useUserStore在该阶段不能调用拿不到值故采取该方式
const baseApi = () => {
  const envName = `VITE_APP_BASE_API_${domesticOverseasMark()}`
  if (
    (location.hostname.startsWith('192.168.10') ||
      location.hostname.startsWith('localhost')) &&
    localStorage.getItem('eas_test_api')
  ) {
    // 测试环境后端调试用
    return localStorage.getItem('eas_test_api')
  } else {
    return `${import.meta.env[envName]}`
  }
}

axios.defaults.baseURL = baseApi()
//axios.defaults.withCredentials = true
axios.defaults.timeout = 1000 * 60 * 3

const api = axios
// 不执行取消接口集合
const whiteListApiArr = [
  '/eventGroup/list/',
  '/eventGroup/selectEventGroupRule/',
  '/eventGroup/selectAllEventGroupRule/',
  '/eventGroup/currentSet/',
  '/eventGroup/selectByEventScreenId',
  '/app/selectUserApp',
]

api.interceptors.request.use(
  async (config) => {
    const userStore = useUserStore()
    const httpCancelStore = useHttpCancelStore()
    const localToken = getLocalValue(localTokenKey)
    const localUserId = getLocalValue(localUserIdKey)

    // 不同标签页账号切换账号时
    if (
      localUserId &&
      userStore.userInfo.userId &&
      localUserId !== userStore.userInfo.userId
    ) {
      await messageBoxConfirmFn(1, userStore)
      return Promise.reject('')
    }

    // if (userStore.token && config.headers) {
    if (userStore.token) {
      config.headers[userStore.tokenName] = localToken
    }

    let appId6 = ''
    if (sessionStorage.getItem('appId')) {
      appId6 = sessionStorage.getItem('appId').slice(-6)
    }
    const uuid = `${appId6}-${uuidv4().split('-')[0]}-${dayjs().format('DDHHmmSSS')}`
    config.headers['uuid'] = uuid

    const locale = localStorage.getItem('Accept-Language')
    if (locale === 'en-US') {
      config.headers['Accept-Language'] = locale
    } else {
      config.headers['Accept-Language'] = 'zh-CN'
    }

    let callback = null
    if (config.params && config.params.callback) {
      callback = config.params.callback
      config.params && delete config.params.callback
    } else if (config.data && config.data.callback) {
      callback = config.data.callback
      config.data && delete config.data.callback
    }
    // 有些get请求后面直接跟着参数，所以统一使用some这种写法
    if (!whiteListApiArr.some((el) => config.url?.includes(el))) {
      const controller = new AbortController()
      config.signal = controller.signal
      httpCancelStore.add(controller)
      callback && callback(controller, uuid)
    }
    //todo 其他处理
    return config
  },
  (error) => {
    // do something with request error
    return Promise.reject(error)
  }
)

api.interceptors.response.use(
  (response) => {
    //todo 其他处理
    // 导出文件
    if (
      response?.headers?.['content-type']?.includes('application/octet-stream')
    ) {
      downloadFile(response)

      return response
    }

    // if (
    //   response.headers['content-type'].toLowerCase() ===
    //   'application/octet-stream;charset=utf-8'
    // ) {
    //   return response
    // }
    // if (
    //   response.headers['content-type'].toLowerCase() ===
    //   'application/octet-stream'
    // ) {
    //   return response
    // }
    const res = response.data

    // 各个分析模块查询结果异常单独处理
    if (calculateApi.includes(response?.config?.url)) {
      return Promise.resolve(res)
    }

    if (![200].includes(res.code)) {
      showStatusTip(res)
      if ([600].includes(res.code)) {
        return Promise.resolve(res)
      }
      return Promise.reject(res)
    }
    return Promise.resolve(res)
  },
  (error) => {
    //todo 其他处理
    let message = error.message
    // 系统中断请求时，不提示
    message && message !== 'canceled' && ElMessage.error(message)
    return Promise.reject(error)
  }
)

export default api
