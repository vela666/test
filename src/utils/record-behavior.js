import useUserStore from '@/store/modules/user.js'
import { operationLogTrack } from '@/api/modules/common.js'
import { getRandom } from '@/utils'

/*
import { recordBehavior } from '@/utils/record-behavior.js'
recordBehavior({
  moduleName: '通用',
  submoduleName: '登录',
  operate: '登录',
})
*/
export function detectDeviceType() {
  const userAgent = navigator.userAgent
  if (/mobile/i.test(userAgent)) {
    return 'Mobile'
  } else if (/tablet/i.test(userAgent)) {
    return 'Tablet'
  } else {
    return 'Desktop'
  }
}

/**
 * @description 记录用户行为
 * @param {Object} options 包含所有用户行为数据的对象。
 * @param {string} options.moduleName 模块名称。
 * @param {string|number} options.module 日志模块类型：1 项目空间日志，2 看板日志，3 报表日志
 * @param {string} options.businessId 业务ID,如：报表业务ID，看板业务ID
 * @param {string} options.submoduleName 子模块名称。
 * @param {string} options.title 如记录数据看板左侧点击的那个看板名 非必传
 * @param {string} options.operate 行为 如开始分析等
 * @param {string} options.remark 如记录数据看板左侧点击的那个看板id'dashboardId:1043' 分析用的是哪个图"趋势图,1-7"等 非必传
 */

export async function recordBehavior({
  moduleName = '',
  submoduleName = '',
  title = '',
  operate = '',
  remark = '',
  module = 3,
  businessId = '',
}) {
  try {
    // operationLogTrack
    const userStore = useUserStore()
    const appId = sessionStorage.getItem('appId')
    const params = {
      // 操作账号
      account: userStore.userInfo.account,
      // 账号邮箱
      email: userStore.userInfo.email,
      userId: userStore.userInfo.userId,
      // 用户名
      nickName: userStore.userInfo.name,
      // 公司编码
      companyCode: userStore.userInfo.currentCompany,
      // 公司名称
      companyName: userStore.userInfo.currentCompanyName,
      // 一级模块 如分析
      model: moduleName,
      // 二级模块 子模块 如事件分析
      page: submoduleName,
      // 设备类型
      deviceType: detectDeviceType(),
      title,
      operate,
      remark,
      // 浏览器类型
      browser:
        navigator.userAgent.match(
          /(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i
        )[0] || '',
    }
    if (appId) {
      params.appId = appId
    }
    // 特殊记录前端导出操作
    if (businessId) {
      params.businessId = businessId
      params.module = module
    }
    const base64Str = btoa(encodeURIComponent(JSON.stringify(params)))
    const sign = `${base64Str.slice(0, 5)}${getRandom(5, true)}${base64Str.slice(5, -5)}${getRandom(5, true)}${base64Str.slice(-5)}`
    await operationLogTrack({ sign })
  } catch (e) {
    console.log(e)
  }
}
