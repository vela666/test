import Layout from '@/layouts/index.vue'
import MobileLayout from '@mobile/layouts/index.vue'
import { firstAndLastSlash } from '@/utils/regExp'
import {
  dynamicRoutesModules,
  dynamicMobileRoutesModules,
  defaultMobilePath,
  defaultPath,
} from './viewsProcessing.js'
import { isExternal } from '@/utils/index.js'
import { uniqBy } from 'lodash-es'
import { isMobile } from '@/utils/mobile.js'

//  str = /nested/menu1/menu1-1/index  最后一个/的内容(且过滤掉/index) /menu1-1
// bool = true creative-label  false === CreativeLabel
export function toPascalCase(str, bool = true) {
  const tmp = str.replace(/\/index$/, '').match(/\/([^/]+)\/?$/g)?.[0] || str
  // const words = tmp.replace('/', '').split('-');
  const words = tmp.replace(firstAndLastSlash, '').split('-')
  const capitalizedWords = words.map(
    (word) => word.charAt(0).toUpperCase() + word.slice(1)
  )
  // return capitalizedWords.join('-') || tmp; // creative-label === Creative-Label
  return capitalizedWords.join(bool ? '' : '-') || tmp // creative-label === CreativeLabel
}

// 完整路径
/*function fullPathSplicing(str) {
  const words = str
    .replace(/\/index$/, '')
    .split('/')
    .filter(Boolean)
  return words
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('')
}*/
// console.log(fullPathSplicing('/table/table1')); //  "TableTable1"
// console.log(fullPathSplicing('/table')); //  // "Table"
// console.log(fullPathSplicing('/table/a-b')); // TableA-b
// 适用name会重复的问题
// useHyphen true = /table/a-b-c => TableA-B-C false = TableABC
// /platform/kuaishou/advertising = PlatformKuaishouAdvertising
export function fullPathSplicing(str, useHyphen = false) {
  return str
    .replace(/\/index$/, '')
    .replace(/\/([a-z])|-(.)/g, function (match, p1, p2) {
      if (p1) {
        return p1.toUpperCase()
      } else if (useHyphen) {
        return '-' + p2.toUpperCase()
      } else {
        return p2.toUpperCase()
      }
    })
}

// 路径转换 /path/example => PathExample
/*function formatRouteName(str) {
  return str
    .replace('/', '')
    .split('/')
    .map(
      (item) =>
        `${item.substring(0, 1).toUpperCase()}${item
          .substring(1)
          .toLowerCase()}`,
    )
    .join('')
}*/

// 父级记录N层子级标识
export function getParentPath(parent, childrenPath, key = 'path') {
  parent?.children?.forEach((child) => {
    childrenPath.push(child[key])
    child?.children && getParentPath(child, childrenPath, key)
  })
}
/**
 * @description 映射动态路由(超过二级路由平铺为二级路由，解决keep-alive不缓存问题)
 * @param {Array} menus 后端接口返回的菜单列表
 * @param {Boolean} notFirstLevel 路由嵌套超过一级
 * @param {Boolean} needTiling  需不需平铺(false 不平铺 true 平铺 渲染左侧或顶部菜单不平铺，动态添加路由需要平铺)
 * @param {Array} parentPath  记录父级path
 */
// 如都不满足 自行修改映射逻辑
export function generateRoute(
  menus = [],
  notFirstLevel = false,
  needTiling = true,
  parentPath = []
) {
  const routes = []
  menus.forEach((item) => {
    const route = {
      path: item.path,
      name: fullPathSplicing(item.path),
      meta: {
        title: item.title,
        // noCache: !item.is_cache,
        id: item.menuId,
        icon: item.icon,
        // 添加父级记录所有子级 标识
        hasSubs: [],
        // affix: false,
        // 子级记录所有父级 标识
        hasParents: [...parentPath],
        sideHidden: item.sideHidden,
        parent: item.parent,
      },
      component: null,
      // 菜单是否隐藏
      hidden: item.hidden,
    }
    getParentPath(item, route.meta.hasSubs, 'path')
    route.meta.hasSubs = uniqBy([
      ...route.meta.hasSubs,
      ...(item.hasSubs || []),
    ])
    // 去除第一个 /  /home/test2/ = home/test2/
    // const comp = item.menu_path.replace(/\//, '')
    // 去除路径前面和后面的 /
    const comp = item.path.replace(firstAndLastSlash, '')
    if (item.children && item.children.length > 0) {
      // route.component =  Layout
      // 只有第一层应为Layout 防止 子级包含children 时 component 为 Layout
      if (isMobile()) {
        route.component = !notFirstLevel
          ? MobileLayout
          : dynamicMobileRoutesModules[`${defaultMobilePath}${comp}/index.vue`]
      } else {
        route.component = !notFirstLevel
          ? Layout
          : dynamicRoutesModules[`${defaultPath}${comp}/index.vue`]
      }

      route.redirect = item.children[0].path
      const parentMark = [...route.meta.hasParents, item.path]
      if (notFirstLevel && needTiling) {
        routes.push(
          ...generateRoute(item.children, true, needTiling, parentMark)
        )
      } else {
        route.children = generateRoute(
          item.children,
          true,
          needTiling,
          parentMark
        )
      }
    } else {
      // comp 路由文件目录位置
      // '../../views/b/index.vue'.match(/[^/]*\.vue$/) 获取文件名index.vue
      // dynamicRoutesModules适合文件路径正确的: /home/test2/index

      const external = isExternal(comp)

      if (isMobile()) {
        route.component =
          !notFirstLevel && !external
            ? MobileLayout
            : dynamicMobileRoutesModules[
                `${defaultMobilePath}${comp}/index.vue`
              ]
      } else {
        route.component =
          !notFirstLevel && !external
            ? Layout
            : dynamicRoutesModules[`${defaultPath}${comp}/index.vue`]
      }

      // 处理没有子路由的情况 例如看板
      if (!notFirstLevel && !external) {
        if (isMobile()) {
          route.children = [
            {
              ...route,
              name: `${route.name}Index`,
              meta: { ...route.meta, icon: '' },
              component:
                dynamicMobileRoutesModules[
                  `${defaultMobilePath}${comp}/index.vue`
                ],
              children: [],
            },
          ]
        } else {
          route.children = [
            {
              ...route,
              name: `${route.name}Index`,
              meta: { ...route.meta, icon: '' },
              component:
                dynamicRoutesModules[`${defaultPath}${comp}/index.vue`],
              children: [],
            },
          ]
        }
      }
    }

    routes.push(route)
  })
  return routes
}
