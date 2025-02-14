import { defineStore } from 'pinia'
import { reactive, ref, markRaw } from 'vue'
// import { constantRoutes } from '@/router/routes'
import { generateRoute, getParentPath } from '@/utils/routeProcessing'
import { flattenMenuButtonPermissions } from '@/utils/dataProcessing'
import { cloneDeep, uniqueId, isEmpty } from 'lodash-es'
import { t } from '@/locales/i18n'
import { isMobile } from '@/utils/mobile.js'

// 需要添加的页面 name、path必须唯一 数据和后端返回的数据字段相同
// sideHidden: 侧边要展示所有的菜单,这些添加的则不需要展示
// 修改  uniqueId('menuId_')的前缀时
// 该页面也要改 src/views/system/role-manage/hooks/useState.js的treeData
const pageMap = {
  '/data-management/buried/data': [
    {
      children: [],
      hidden: true,
      sideHidden: true,
      icon: '',
      menuId: uniqueId('menuId_'),
      path: '/data-management/buried/data-detail',
      title: '埋点数据明细',
    },
  ],
  '/user/user-group': [
    {
      children: [],
      hidden: true,
      sideHidden: true,
      icon: '',
      menuId: uniqueId('menuId_'),
      path: '/user/group-data-detail',
      title: '数据详情',
    },
  ],
  '/user/user-tag': [
    {
      children: [],
      hidden: true,
      sideHidden: true,
      icon: '',
      menuId: uniqueId('menuId_'),
      path: '/user/tag-data-detail',
      title: '数据详情',
    },
  ],
  '/data-management/early-warn': [
    {
      children: [],
      hidden: true,
      sideHidden: true,
      icon: '',
      menuId: uniqueId('menuId_'),
      path: '/data-management/early-warn-detail',
      title: '数据详情',
    },
  ],
  custom: [
    {
      children: [],
      hidden: true,
      sideHidden: true,
      icon: '',
      menuId: uniqueId('menuId_'),
      path: '/my-apps',
      title: t('layouts.navbar.myApps'),
    },
    import.meta.env.DEV
      ? {
          children: [
            {
              hidden: false,
              sideHidden: false,
              icon: '',
              menuId: uniqueId('menuId_'),
              path: '/component-preview/date',
              title: '日期组件和VS',
            },
            {
              hidden: false,
              sideHidden: false,
              icon: '',
              menuId: uniqueId('menuId_'),
              path: '/component-preview/rules',
              title: '条件规则',
            },
            {
              hidden: false,
              sideHidden: false,
              icon: '',
              menuId: uniqueId('menuId_'),
              path: '/component-preview/tree',
              title: '树选择组件',
            },
          ],
          hidden: false,
          sideHidden: true,
          icon: '',
          menuId: uniqueId('menuId_'),
          path: '/component-preview',
          title: '前端组件预览',
        }
      : {},
  ],
}

// 添加自定义的菜单
const addPage = (list) => {
  list.forEach((item) => {
    const page = pageMap[item.path]
    // 记录子标识
    item.hasSubs = []
    if (page) {
      // item.children
      list.push(
        ...page.map((sub) => {
          // ;(item.hasSubs || (item.hasSubs = [])).push(sub.path)
          item.hasSubs.push(sub.path)
          return {
            ...sub,
            parent: item,
          }
        })
      )
    }
    if (item?.children?.length) {
      addPage(item.children)
    }
    getParentPath(item, item.hasSubs, 'path')
  })
}

/*
const addPage = (data, notSkip = true) => {
  const newData = cloneDeep(data)
  const fn = (list) => {
    list.forEach((item) => {
      // 记录子标识
      item.hasSubs = []
      if (notSkip) {
        const page = pageMap[item.path]
        console.log(page)
        if (page) {
          // item.children
          list.push(
              ...page.map((sub) => {
                // ;(item.hasSubs || (item.hasSubs = [])).push(sub.path)
                item.hasSubs.push(sub.path)
                return {
                  ...sub,
                  parent: item,
                }
              })
          )
        }
      }
      if (item?.children?.length) {
        fn(item.children)
      }
      getParentPath(item, item.hasSubs, 'path')
    })
  }
  fn(newData)
  return newData
}
*/

const useRouteStore = defineStore('route', () => {
  const routes = reactive({
    rawData: [],
    // allRoutes: [],
    addRoutes: [],
  })
  // 保存菜单里所有按钮权限 平铺后数据
  const buttonPermissionsMap = ref([])
  const isGenerate = ref(false)
  const currentRemoveRoutes = ref([])
  // 设置路由
  function setRoutes(
    menus = [],
    isOneLevel = false,
    needTiling = true,
    parentPath = []
  ) {
    let newMenus = cloneDeep(menus)

    if (isMobile()) {
      newMenus = newMenus.filter((item) =>
        ['/unified-panel', '/see-plate'].includes(item.path)
      )
    } else {
      addPage(newMenus)
      const result = pageMap.custom.filter((item) => !isEmpty(item))
      newMenus = [...newMenus, ...result]
    }

    buttonPermissionsMap.value = markRaw(flattenMenuButtonPermissions(menus))
    //console.log(buttonPermissionsMap.value, 'buttonPermissionsMap')
    routes.rawData = markRaw(newMenus)
    const addRoutes = generateRoute(
      newMenus,
      isOneLevel,
      needTiling,
      parentPath
    )
    // const allRoutes = routes.addRoutes.concat(constantRoutes)
    // routes.allRoutes = cloneDeep(allRoutes)
    routes.addRoutes = cloneDeep(addRoutes)
    isGenerate.value = true
    return {
      addRoutes,
      // allRoutes
    }
  }
  // 记录 已添加的异步（后端返回）的路由，用于登出时删除路由
  function setCurrentRemoveRoutes(routes) {
    currentRemoveRoutes.value = routes
  }
  // 清空动态路由
  function removeRoutes() {
    isGenerate.value = false
    routes.addRoutes = []
    // routes.allRoutes = []
    currentRemoveRoutes.value.forEach((removeRoute) => {
      removeRoute()
    })
    currentRemoveRoutes.value = []
  }
  return {
    routes,
    buttonPermissionsMap,
    isGenerate,
    setRoutes,
    setCurrentRemoveRoutes,
    removeRoutes,
  }
})
export default useRouteStore
