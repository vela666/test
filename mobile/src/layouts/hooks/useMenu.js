import { ref } from 'vue'
import path from 'path-browserify'
import { isExternal } from '@/utils/index.js'

export default function () {
  const onlyOneChild = ref(null)

  function hasOneShowingChild(
    children = [],
    parent,
    onlyChild = true,
    hiddenNotSkip = true
  ) {
    const showingChildren = children.filter((item) => {
      if (item.hidden && hiddenNotSkip) {
        return false
      } else {
        // 临时设置（如果只有一个显示的子级将被使用）
        onlyOneChild.value = item
        return true
      }
    })

    /*if (showingChildren.length === 1) {
      return true
    }*/
    // 当只有一个子路由器时，默认显示子路由器，子路由的path和父级不一致时要开启
    if (showingChildren.length === 1 && onlyChild) {
      // 如 数据看板这种的
      return onlyOneChild.value.path === parent.path
    }
    // 如果没有要显示的子路由器，则显示父级
    if (!showingChildren.length) {
      onlyOneChild.value = { ...parent, path: '', noShowingChildren: true }
      return true
    }
    return false
  }

  function resolvePath(basePath, routePath) {
    if (isExternal(routePath)) {
      return routePath
    }

    if (isExternal(basePath)) {
      return basePath
    }
    return path.resolve(basePath, routePath)
  }
  return {
    onlyOneChild,
    resolvePath,
    hasOneShowingChild,
  }
}
