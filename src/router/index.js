import { createRouter, createWebHashHistory } from 'vue-router'
import { constantRoutes } from './routes'
import { mobileConstantRoutes } from '@mobile/router/routes'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
NProgress.configure({ showSpinner: false })
import { useNProgress } from '@vueuse/integrations/useNProgress'
const { isLoading } = useNProgress()
import getPageTitle from '@/utils/get-page-title'
import useUserStore from '@/store/modules/user'
import useRouteStore from '@/store/modules/route'
import useAppStore from '@/store/modules/app'
import useHttpCancelStore from '@/store/modules/http-cancel'
import { getMenuList } from '@/api/modules/menu'
import { asyncCodeLogin } from '@/api/modules/user'
import { generateVersionUrl } from '@/utils/domesticOverseas.js'
import { ElMessageBox } from 'element-plus'
import { updateUrlParams } from '@/utils'
import { isMobile } from '@/utils/mobile.js'

const history = createWebHashHistory()

let routes = constantRoutes
if (isMobile()) {
  routes = mobileConstantRoutes
}

const router = createRouter({
  history,
  routes,
})

const whiteList = ['/login', '/reset-password', '/set-password']
const notAppIdPath = ['/system', '/my-apps']

router.beforeEach(async (to, from, next) => {
  if (to.query.virtualAppId) {
    // 点击菜单跳转，多个appid错乱问题处理
    sessionStorage.setItem('appId', to.query.virtualAppId)
  }

  const httpCancelStore = useHttpCancelStore()
  if ((!from || to.path !== from.path) && to.path !== '/see-plate') {
    // 强行中断请求
    httpCancelStore.remove()
  }

  isLoading.value = true
  const userStore = useUserStore()
  const routeStore = useRouteStore()
  const appStore = useAppStore()
  // 国内国外版本切换则执行
  if (to.query.v_change_code) {
    try {
      // 先重置下之前的登陆信息
      await userStore.resetUser()
      userStore.setLoginVersion(userStore.userInfo.currentVersion)
      const { data } = await asyncCodeLogin({
        code: to.query.v_change_code,
      })
      userStore.setToken(data)
      next({
        path: to.path,
        redirect: '/',
        query: null,
      })
    } catch (e) {
      next({
        name: 'login',
        query: null,
      })
    }
    // 账号激活跟加入企业不跳转
  } else if (
    to.href.indexOf('/set-password?linkCode=') > -1 ||
    to.href.indexOf('/login?linkCode=') > -1
  ) {
    next()
    // 判断是否已经登录（是否有token）;
  } else if (userStore.token) {
    // 判断是否生成路由
    if (routeStore.isGenerate) {
      // 如果已登录状态下，进入登录页会强制跳转到主页
      if (whiteList.includes(to.path)) {
        next('/')
      } else {
        // 处理子路由的鼠标右键新标签页跳转问题
        if (to.path.startsWith('/operate')) {
          next(`/external/data-operate?operate=/#${to.path}`)
        } else {
          if (isMobile()) {
            next()
          } else {
            if (
              userStore.userInfo.type !== 1 &&
              !sessionStorage.getItem('appId') &&
              !notAppIdPath.some((path) => to.path.startsWith(path))
            ) {
              next('/my-apps')
            } else {
              // 正常访问页面
              next()
            }
          }
        }
      }
    } else {
      try {
        // 判断是否有用户信息
        if (!userStore.hasUserInfo) {
          await userStore.getUserInfo()
        }
      } catch (e) {
        // 先重置下之前的登陆信息
        await userStore.resetUser()
        next({
          name: 'login',
          query: null,
        })
        ElMessageBox.close()
        return false
      }
      // 获取应用
      await appStore.getAppList()
      // 获取用户菜单
      let menu = []
      try {
        const { data } = await getMenuList()
        menu = Array.isArray(data) ? data : []
      } catch (error) {
        console.log(error)
      }
      const { addRoutes } = routeStore.setRoutes(menu)

      if (addRoutes.length) {
        //生成路由
        const removeRoutes = []
        addRoutes.forEach((route) => {
          removeRoutes.push(router.addRoute(route))
        })
        routeStore.setCurrentRemoveRoutes(removeRoutes)
        // 当没有 / 时，重定向到第一个路由
        router.addRoute({
          path: '/',
          name: 'Index',
          redirect:
            userStore.userInfo.type !== 1 && !sessionStorage.getItem('appId')
              ? isMobile()
                ? addRoutes[0].path
                : '/my-apps'
              : addRoutes[0].path,
        })
      }

      // 国内外切换
      if (userStore.userInfo.supportVersion !== 3) {
        userStore.setLoginVersion(userStore.userInfo.supportVersion)
      }
      // 跳转对应地址去: 如只支持国内版，但是在海外版登陆，跳转国内版
      if (
        !(
          userStore.userInfo.supportVersion === 3 ||
          userStore.userInfo.currentVersion === userStore.userInfo.loginVersion
        )
      ) {
        location.replace(
          await generateVersionUrl(userStore.userInfo.loginVersion)
        )
        // 重置登陆信息
        // userStore.setLoginVersion()
        userStore.resetUser()
        return false
      }
      if (userStore.userInfo.type !== 1 && !sessionStorage.getItem('appId')) {
        if (isMobile()) {
          next({ ...to, replace: true })
        } else {
          next({ path: '/my-apps', replace: true })
        }
      } else {
        if (userStore.userInfo.type !== 1) {
          next({ ...to, replace: true })
        } else {
          next('/')
        }
      }
    }
  } else {
    if (!whiteList.includes(to.path)) {
      next({
        name: 'login',
        query: {
          redirect: to.fullPath !== '/' ? to.fullPath : undefined,
        },
      })
    } else {
      next()
    }
  }
})

router.afterEach((to, from) => {
  document.title = getPageTitle(to.meta.title)
  isLoading.value = false
  if (to.query.virtualAppId) {
    updateUrlParams({}, true, ['virtualAppId'])
  }
})
export default router
