// import useUserStore from '@/store/modules/user.js'

import {
  getButtonAuthList,
  filterArraySpecifiedKey,
} from '@/utils/dataProcessing'
import { t } from '@/locales/i18n'

// const userStore = useUserStore()

// const operateType = ['addDash', 'addFile', 'addSpace', 'export', 'import']
const operateType = ['addDash', 'addFile', 'addSpace']

export const getButtonAuth = () => {
  const { authEnum, authEnumDesc } = getButtonAuthList('dashboard:')
  const operateAuth = Object.values(
    filterArraySpecifiedKey(authEnum, operateType)
  )
  return { authEnum, authEnumDesc, operateAuth }
}

export const conditionInItVal = () => {
  return {
    relation: 0,
    filters: [],
  }
}
// export  const kanbanSelectKey = `kanBanId-${userStore.userInfo.userId}`
export const kanbanSelectKey = 'kanBanId'

export const storageConditionKey = () => {
  return `kanBanCondition_${sessionStorage.getItem('appId')}`
}

// 看板数据唯一键
export const kanBanDataUniqueKey = 'businessId'

// 未分组文件夹ID -2= 我创建的里未分组   -1= 共享给我的里未分组
export const ungroupedFolders = ['-1', '-2']

export const kanbanType = {
  spaceModule: {
    id: 'spaceModule',
    businessId: 'spaceModule',
    name: t('dashboard.space'),
    mark: 3,
    siblingNode: ['ownerModule', 'shareModule'],
    icon: 'kanban-space1',
    type: 'kanban-spaces',
  },
  ownerModule: {
    name: t('dashboard.createdByMe'),
    id: 'ownerModule',
    mark: 1,
    businessId: 'ownerModule',
    siblingNode: ['spaceModule', 'shareModule'],
    icon: 'creator1',
    type: 'kanban-created',
  },
  shareModule: {
    id: 'shareModule',
    businessId: 'shareModule',
    name: t('dashboard.sharedWithMe'),
    mark: 2,
    siblingNode: ['ownerModule', 'spaceModule'],
    icon: 'kanban-share1',
    type: 'kanban-shared',
  },
}

export const topLevelIds = Object.keys(kanbanType).map(
  (item) => kanbanType[item].id
)
export const topLevelIdMap = Object.keys(kanbanType).reduce((p, c) => {
  p[c] = kanbanType[c].mark
  return p
}, {})

export const topLevelMarkMap = Object.keys(kanbanType).reduce((p, c) => {
  p[kanbanType[c].mark] = kanbanType[c].id
  return p
}, {})

export const displaySelectTypeList = [
  {
    label: t('dashboard.space'),
    type: 1,
  },
  {
    // 包含我的看板和共享给我的
    label: t('dashboard.my'),
    type: 2,
  },
  {
    label: t('common.favorite'),
    type: 3,
  },
]

// 1 小图，2中图，3大图
export const viewSize = {
  note: {
    minW: 12,
    maxW: 12,
    minH: 1,
    maxH: 1,
    w: 12,
    h: 1,
    newW: 12,
    newH: 1,
    noResize: true,
  },
  1: {
    minW: 3,
    maxW: 3,
    minH: 2,
    maxH: 2,
    w: 3,
    h: 2,
    newW: 3,
    newH: 2,
    noResize: true,
  },
  2: {
    minH: 4,
    minW: 6,
    maxH: 4,
    maxW: 6,
    w: 6,
    h: 4,
    newW: 6,
    newH: 4,
    noResize: true,
  },
  3: {
    minH: 4,
    minW: 12,
    maxH: 10,
    maxW: 12,
    w: 12,
    h: 4,
    newW: 12,
    newH: 4,
    noResize: false,
  },
}
// 中大图
export const mediumLargeEnum = [6, 12]

// 网格布局的列数
export const layoutColumn = 12

export const componentSettingTemp = {
  // 获取条件的请求参数
  conditionEventNames: '',
  // 获取分组的请求参数
  groupEventNames: '',
  // 用于删除条件分组如事件/用户属性等
  // 'src/enumeration/index.js的tableTypeArr里值如：['userField'],
  groupLimit: [],
  conditionLimit: [],
}

export const kanbanExploreKey = 'exploreData'
