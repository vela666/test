import { defineStore } from 'pinia'
import { computed, reactive, toRefs } from 'vue'
import {
  localTokenKey,
  localTokenNameKey,
  localUserIdKey,
} from '@/enumeration/auth'
import { getLocalValue, setLocalValue, removeLocalValue } from '@/utils'
// import useRouteStore from './route'
// import useAppStore from './app'
// import router from '@/router'
import {
  doLogin,
  doLogout,
  getCurrentUserInfo,
  modifyPassword,
} from '@/api/modules/user'
import { Base64 } from 'js-base64'
import { domesticOverseasMark } from '@/utils/domesticOverseas.js'

const initVal = () => {
  // 登陆版本
  const loginVersion = localStorage.getItem('loginVersion')
    ? +localStorage.getItem('loginVersion')
    : null
  return {
    userInfo: {
      // 到期时间
      // valid: '2024-06-01',
      account: '',
      companyList: [],
      currentCompany: '',
      currentCompanyName: '',
      email: '',
      name: '',
      status: -1,
      // 账号类型：0 普通用户、1 超管、2 企业管理员
      type: 0,
      userId: '',
      // 国内/海外
      supportVersion: -1,
      // 当前选择版本
      currentVersion: domesticOverseasMark(),
      // 登陆版本
      loginVersion,
      passwordChanged: -1,
    },
    userAuth: {
      hasUserInfo: false,
      token: getLocalValue(localTokenKey),
      tokenName: getLocalValue(localTokenNameKey),
    },
  }
}
const useUserStore = defineStore('user', () => {
  // const routeStore = useRouteStore()
  // const appStore = useAppStore()
  const userInfo = reactive(initVal().userInfo)
  const userAuth = reactive(initVal().userAuth)
  /*
  const baseApi = computed(() => {
    const envName = `VITE_APP_BASE_API_${userInfo.currentVersion}`
    if (
      location.hostname.indexOf('192.168.10') > -1 &&
      localStorage.getItem('eas_test_api')
    ) {
      // 测试环境后端调试用
      return localStorage.getItem('eas_test_api')
    } else {
      return `${import.meta.env[envName]}`
    }
  })
*/

  const FTUrl = computed(() => {
    const envName = `VITE_APP_EXTERNAL_FT_API_${userInfo.currentVersion}`
    return `${import.meta.env[envName]}`
  })

  /**
   * 登录
   * @param {object} data 用户数据
   * @param {string} data.account 账号
   * @param {string} data.password 密码
   * @returns
   */
  async function login(data) {
    //登录请求接口
    //请求成功设置token
    data.password = Base64.encode(data.password)
    const res = await doLogin(data)
    if (res.code === 200 && res.data) {
      // 清除app列表
      // appStore.clearAppList()
      // 清除路由
      // routeStore.removeRoutes()
      setToken(res.data)
      setLoginVersion(userInfo.currentVersion)
      await getUserInfo()
    }
    return res
  }

  /**
   * 重置用户信息和token
   * @returns
   */
  async function resetUser() {
    //清除token
    removeLocalValue(localTokenNameKey)
    removeLocalValue(localTokenKey)
    // 重置userStore
    Object.assign(userInfo, initVal().userInfo)
    Object.assign(userAuth, initVal().userAuth)
    sessionStorage.clear()
    // 清除sessionStorage保存的appId
    // sessionStorage.removeItem('appId')
  }

  /**
   * 登出
   * @returns
   */
  async function logout() {
    await doLogout()
    //重置用户信息和token
    await resetUser()
    location.reload()
    /* router.replace({
          name: 'login',
          query: {
            redirect: router.currentRoute.value.fullPath,
          },
        })*/
  }

  /**
   * @description 获取当前登录用户信息
   * @returns
   */
  async function getUserInfo() {
    const res = await getCurrentUserInfo()
    if (res.code === 200 && res.data) {
      setLocalValue(localUserIdKey, res.data.userId)
      Object.assign(userInfo, res.data)
      userAuth.hasUserInfo = true
    }
  }

  /**
   * @description 修改登录密码
   * @returns
   */
  async function updatePassword(data) {
    let params = {
      currentPassword: Base64.encode(data['currentPassword']),
      newPassword: Base64.encode(data['newPassword']),
      confirmPassword: Base64.encode(data['confirmPassword']),
      userId: data['userId'],
    }
    const res = await modifyPassword(params)
    return res
  }

  const setLoginVersion = (val = 3) => {
    userInfo.loginVersion = +val
    localStorage.setItem('loginVersion', val)
  }

  const setToken = ({ tokenName, tokenValue }) => {
    setLocalValue(localTokenNameKey, tokenName)
    setLocalValue(localTokenKey, tokenValue)
    userAuth.tokenName = tokenName
    userAuth.token = tokenValue
  }

  // 添加当前登陆版本
  if (!userInfo.loginVersion) {
    setLoginVersion()
  }

  return {
    ...toRefs(userAuth),
    userInfo,
    // baseApi,
    FTUrl,
    login,
    logout,
    setToken,
    getUserInfo,
    updatePassword,
    resetUser,
    setLoginVersion,
  }
})
export default useUserStore
