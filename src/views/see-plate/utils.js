// authority 1 查看者 2 协作者 3 管理者
import {
  filterArraySpecifiedKey,
  treeRecordParentSubIds,
} from '@/utils/dataProcessing'
import { tableTypeArr } from '@/enumeration'
import { omit } from 'lodash-es'
import { kanbanType } from './enum'
import { t } from '@/locales/i18n.js'

/**
 * @description 映射看板数据
 * @param {Object|Array} options - 选项对象或要过滤的数组
 * @param {Array} options.data - 看板数据
 * @param {Array} [options.delKey=[]] - 要删除的key
 * @param {string} [options.userId=''] - 当前登陆用户标识
 * @returns {Array} 过滤后的树
 */
// parentAuthority 用于判断拖动节点的限制
export function mapKanBanList(options) {
  let { data, delKey = [] } = options.delKey ? options : { data: options }
  data = filterArraySpecifiedKey(
    data,
    // 过滤收藏和是否默认展开导航字段
    ['navigationExpand', 'collectModule', ...delKey],
    true
  )
  // manageDisabled 数据看板左侧和管理用的
  const newData = Object.keys(data).reduce((p, k) => {
    let val = {}
    const item = data[k]
    if (k === 'spaceModule') {
      let children = item.reduce((p, c) => {
        const spacesItem = {
          icon: 'kanban-space1',
          disabled: false,
          children: [],
          type: 'space',
          ...c,
        }
        c.dataList.forEach((v) => {
          if (v.folderOrNot) {
            const obj = {
              disabled: !v.folderInfo.dashboardInfoList.length,
              icon: 'kanban-folder1',
              type: 'folder',
              parentAuthority: c.authority,
              ...v,
              ...v.folderInfo,
              children: v.folderInfo.dashboardInfoList.map((item) => {
                return {
                  // 用于文件夹拖拽时的判断 防止文件夹拖到文件夹里
                  parentType: 'folder',
                  parentAuthority: v.folderInfo.authority,
                  type: 'dashboard',
                  // manageDisabled: item.createUserId !== userId && authority === 1,
                  // manageDisabled: item.createUserId !== userId,
                  manageDisabled: item.authority === 1,
                  ...item,
                }
              }),
            }

            obj.manageDisabled =
              obj.disabled || obj.children.every((item) => item.manageDisabled)

            spacesItem.children.push(obj)
          } else {
            spacesItem.children.push({
              type: 'dashboard',
              parentAuthority: c.authority,
              // manageDisabled: v.dashboardInfo.createUserId !== userId,
              manageDisabled: v.dashboardInfo.authority === 1,
              /* manageDisabled:
              v.dashboard.userId !== userId && authority === 1,*/
              ...v,
              ...v.dashboardInfo,
            })
          }
        })

        if (!c.dataList.length) {
          spacesItem.disabled = true
          // 全是文件夹时
        } else if (
          spacesItem.children.every((item) => item.type === 'folder')
        ) {
          let hasChildren = spacesItem.children.some(
            (sub) => !!sub.children.length
          )
          spacesItem.disabled = !hasChildren
        }

        spacesItem.manageDisabled =
          spacesItem.disabled ||
          spacesItem.children.every((sub) => sub.manageDisabled)

        p.push(spacesItem)
        return p
      }, [])

      const disabled =
        !children.length || children.every((item) => item.disabled)
      val = {
        ...kanbanType[k],
        disabled,
        manageDisabled: disabled || children.every((sub) => sub.manageDisabled),
        children,
      }
    } else {
      let children = item.reduce((p, c) => {
        const disabled = !c.dashboardInfoList.length
        const obj = {
          disabled,
          manageDisabled: disabled,
          icon: 'kanban-folder1',
          // manageDisabled: k === 'created' ? false : true,
          ...c,
          type: 'folder',
          children: c.dashboardInfoList.map((item) => {
            return {
              type: 'dashboard',
              // manageDisabled: k === 'created' ? false : true,
              ...item,
            }
          }),
        }
        p.push(obj)
        return p
      }, [])

      const disabled =
        !children.length || children.every((item) => item.disabled)

      val = {
        ...kanbanType[k],
        children,
        disabled,
        manageDisabled: disabled,
      }
    }
    p.push(val)
    return p
  }, [])

  return treeRecordParentSubIds(newData, 'businessId')
}

/**
 * @description 过滤条件数据
 * @param data {Object} {
 *   relation: 0,
 *   filters: [
 *     {
 *       id: 'e9b715cb-3274-4bfd-b660-466270363b1f',
 *       equation: 'C00',
 *       timeRelation: '',
 *       timeUnit: '',
 *       singleValue: '',
 *       before: 0,
 *       after: 1,
 *       selected: '',
 *       selectedList: [0],
 *       datetimeVal: '',
 *       datetimerangeval: [],
 *       fEn: '__activite_days',
 *       tableType: 0,
 *       fType: 'int',
 *       parentId: null,
 *       name: '活跃天数(用户)',
 *     },
 *     {
 *       id: '6cd46289-7dfa-4fa7-9332-26822f82d1fc',
 *       relation: 0,
 *       filters: [
 *         {
 *           id: '61fc7bd7-b31a-4475-a6df-4dd247bc6084',
 *           equation: 'C00',
 *           timeRelation: '',
 *           timeUnit: '',
 *           singleValue: '',
 *           before: 0,
 *           after: 1,
 *           selected: '',
 *           selectedList: ['开曼群岛(KY)'],
 *           datetimeVal: '',
 *           datetimerangeval: [],
 *           fEn: '__reg',
 *           tableType: 1,
 *           fType: 'string',
 *           parentId: null,
 *           name: '地区',
 *         },
 *         {
 *           id: '7f76ecbc-9a28-42d5-bb4a-e71ed312644c',
 *           equation: 'C15',
 *           timeRelation: '',
 *           timeUnit: '',
 *           singleValue: '',
 *           before: 0,
 *           after: 1,
 *           selected: '',
 *           selectedList: [],
 *           datetimeVal: '',
 *           datetimerangeval: [],
 *           fEn: 'cyl3app2',
 *           tableType: 4,
 *           fType: 'group',
 *           name: '分群_20240117_141628',
 *         },
 *       ],
 *     },
 *   ],
 * }
 * @param {Array} [type=['eventField'] ] -  过滤 eventField 的数据
 * @returns {*&{filters: *[]}}
 */
export function filterCondition(data, type = ['eventField']) {
  const newFilters = []
  for (const fs of data.filters) {
    if (Array.isArray(fs.filters)) {
      const newFilts = []
      for (const item of fs.filters) {
        const fKey = tableTypeArr[item.tableType]
        if (!type.includes(fKey)) {
          newFilts.push(item)
        }
      }
      if (newFilts.length > 1) {
        newFilters.push({ ...omit(fs, ['filters']), filters: newFilts })
      } else if (newFilts.length === 1) {
        newFilters.push({ ...newFilts[0] })
      }
    } else {
      const key = tableTypeArr[fs.tableType]
      if (!type.includes(key)) {
        newFilters.push(fs)
      }
    }
  }
  return {
    ...data,
    filters: newFilters,
  }
}

export function convertProjectMembersData(data) {
  return Object.keys(data)
    .reduce(
      (acc, k) => {
        if (k === 'projectList') {
          acc[0].children = data[k].map((item) => {
            return {
              ...item,
              newId: `${item.id}-${item.dataType}`,
              // 权限1表示仅查看，2表示可编辑，3表示管理员
              authority: 1,
            }
          })
        } else {
          acc[1].children = data[k].map((item) => {
            return {
              ...item,
              newId: `${item.id}-${item.dataType}`,
              // 权限1表示仅查看，2表示可编辑，3表示管理员
              authority: 1,
            }
          })
        }
        return acc
      },
      [
        {
          topLevel: true,
          name: t('system.projectTeams.projectTeam'),
          children: [],
        },
        {
          topLevel: true,
          name: t('system.members.member'),
          children: [],
        },
      ]
    )
    .map((item) => ({
      ...item,
      disabled: !item.children.length,
    }))
}
