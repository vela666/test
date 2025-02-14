// groupBy 以某个key分组
import { cloneDeep, groupBy, intersection } from 'lodash-es'
import { tableTypeBase } from '@/enumeration'
import { isObject } from '@/utils/types'
import useRouteStore from '@/store/modules/route'
import dayjs from 'dayjs'

/**
 * @desc 转换2024-08-20当周、2024年08月20日等为有效日期格式,
 * @param dates {Array|String}  [
 *   '2024-08-20',
 *   '2024-08',
 *   '2024-08-20当周',
 *   '2024年08月',
 *   '2024年08月20日',
 *   '2024年08月330日',
 * ] | '2024-08-20当周'
 * @return {Array|String}
 */
/**
 * @desc 转换2024-08-20当周、2024年08月20日等为有效日期格式
 * @param dates {Array|String}  [
 *   '2024-08-20',
 *   '2024-08',
 *   '2024-08-20当周',
 *   '2024年08月',
 *   '2024年08月20日',
 *   '2024年08月330日',
 * ] | '2024-08-20当周'
 * @return {Array|String}
 */
export function processDates(dates) {
  const processSingleDate = (dateStr) => {
    let standardizedDateStr

    // 尝试识别 "YYYY年MM月DD日", "YYYY年MM月", "YYYY-MM-DD", "YYYY-MM" 格式
    if (/^\d{4}年\d{2}月\d{2}日$/.test(dateStr)) {
      standardizedDateStr = dayjs(dateStr, 'YYYY年MM月DD日').format(
        'YYYY-MM-DD'
      )
    } else if (/^\d{4}年\d{2}月$/.test(dateStr)) {
      standardizedDateStr =
        dayjs(dateStr, 'YYYY年MM月').format('YYYY-MM') + '-01'
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      standardizedDateStr = dayjs(dateStr, 'YYYY-MM-DD').format('YYYY-MM-DD')
    } else if (/^\d{4}-\d{2}$/.test(dateStr)) {
      standardizedDateStr = dayjs(dateStr, 'YYYY-MM').format('YYYY-MM') + '-01'
    } else if (/^\d{4}-\d{2}-\d{2}.*$/.test(dateStr)) {
      standardizedDateStr = dayjs(dateStr.slice(0, 10), 'YYYY-MM-DD').format(
        'YYYY-MM-DD'
      )
    } else {
      return '日期格式无效: ' + dateStr
    }

    // 检查日期是否有效
    if (dayjs(standardizedDateStr).isValid()) {
      return standardizedDateStr
    } else {
      return '日期格式无效: ' + dateStr
    }
  }

  if (Array.isArray(dates)) {
    return dates.map(processSingleDate)
  } else if (typeof dates === 'string') {
    return processSingleDate(dates)
  } else {
    return '输入无效：必须是字符串或字符串数组'
  }
}
/**
 * @description 处理本地保存的表格自定义列
 * @param data {Array} [
 *     "__fid",
 *     "__did",
 * ]
 * @return {Array}
 */
export function handleCustomColumn(data) {
  const customTableColumn = JSON.parse(
    localStorage.getItem('customTableColumn') || '[]'
  )
  if (customTableColumn.length) {
    return intersection(data, customTableColumn)
  }
  return data
}

/**
 * @description 获取tableType
 * @param {string} key  'eventField', 'userField', 'userCluster', 'userLabel' 之一
 * @param {Object} data getFieldList请求数据里如eventField里一项属性数据 { ..., fEn:xxx, filedType:xxx, ...}
 */
export function getTableType(key, data) {
  let tableType = tableTypeBase[key]
  if ([0, 1].includes(tableType)) {
    //filedType: 3,维度表; 4,虚拟属性
    if (data.filedType === 3) {
      tableType = tableType === 0 ? 2 : 3
    } else if (data.filedType === 4) {
      tableType = tableType === 0 ? 7 : 6
    }
  }
  return tableType
}

// 前端分页时用到的数据处理 可配合 computed 一起用
export function slicePagingData(data, page, size) {
  // 只需动态更改page即可
  let index = (page - 1) * size
  return data.slice(index, page * size)
}

/**
 * @description 映射枚举对象
 * @param data {Array} 枚举数据
 * [
 *   {
 *     type: 0,
 *     label: '正常',
 *     class: 'success-status',
 *   },
 *   {
 *     type: 1,
 *     label: '禁用',
 *   }
 * ]
 * @param valueKey {String} 对象键
 * @param labelKey {String} 对象值
 * @param needObjValue {Boolean}
 * @returns {Object}
 * objValue false
 * {
 *     "0": "正常",
 *     "1": "禁用",
 * }
 * objValue true
 * {
 *     "0": {
 *         "type": 0,
 *         "label": "正常",
 *         "class": "success-status"
 *     },
 *     "1": {
 *         "type": 1,
 *         "label": "禁用"
 *     },
 * }
 */
export function getEnum({
  data = [],
  valueKey = 'type',
  labelKey = 'label',
  needObjValue = false,
}) {
  return data.reduce((acc, cur) => {
    acc[cur[valueKey]] = needObjValue ? cur : cur[labelKey]
    return acc
  }, {})
}

/**
 * @description 把getEnum映射的数据转为原格式
 * @param data
 * @param valueKey
 * @param labelKey
 * @param needObjValue
 * @returns {*}
 */
export function restoreGetEnum({
  data = [],
  valueKey = 'type',
  labelKey = 'label',
  needObjValue = false,
}) {
  if (needObjValue) {
    return Object.keys(data).map((key) => {
      return data[key]
    })
  }
  return Object.entries(data).map(([key, value]) => ({
    [valueKey]: key,
    [labelKey]: value,
  }))
}

// 如角色和部门管理  菜单和按钮权限分配 el-tree 的数据结构处理
// menus === 请求菜单的那份数据
// disabledBtnList === 禁用按钮列表
export function mapMenuPermissionData(menus, disabledBtnList = []) {
  if (!menus) return []
  return menus.map((menu) => {
    return {
      ...menu,
      id: menu.menuId,
      /*authChildren: (menu.menuButtonInfoList || []).map((button) => ({
                                id: button.code,
                                title: button.name,
                                ...button,
                              })),*/
      children: [
        ...mapMenuPermissionData(menu.children, disabledBtnList),
        ...(menu.menuButtonInfoList || []).map((button) => {
          return {
            id: button.code,
            disabled: disabledBtnList.includes(button.code),
            menuType: menu.menuType,
            // id: `${button.menuId}-${button.code}`,
            ...button,
          }
        }),
      ],
    }
  })
}

/**
 * 扁平化树结构
 * @param {Object|Array} options - 扁平化树的选项对象或扁平的数组
 * @param {Array} options.data - 要处理的树状数据
 * @param {string} [options.uniqueKey='id'] - 树节点的唯一键名
 * @param {string} [options.subKey='children'] - 子节点数组的键名，用于递归处理子树
 * @param {boolean} [options.keyValFormat=false] - 是否以键值对格式输出
 * @param {boolean} [options.combinedFormat=false] - 是否输出数组和键值对格式
 * @returns {Array|Object} - 扁平化后的数组或对象或组合，取决于 options.keyValFormat或combinedFormat
 */
export function flattenTree(options) {
  const {
    data,
    uniqueKey = 'id',
    subKey = 'children',
    keyValFormat = false,
    combinedFormat = false,
  } = isObject(options) ? options : { data: options }

  let result =
    combinedFormat || keyValFormat
      ? {
          ...(combinedFormat && {
            keyVal: {},
            list: [],
          }),
        }
      : []

  function flatten(node) {
    if (combinedFormat) {
      // ;(result.keyVal || (result.keyVal = {}))[node[uniqueKey]] = node
      result.keyVal[node[uniqueKey]] = node
      // ;(result.list || (result.list = [])).push(node)
      result.list.push(node)
    } else if (keyValFormat) {
      result[node[uniqueKey]] = node
    } else {
      result.push(node)
    }
    if (node?.[subKey]?.length) {
      node[subKey].forEach(flatten)
    }
  }

  data.forEach(flatten)
  return result
}

// 获取没有子级的数据 且扁平化
export function mapWithoutChildren(data) {
  let temp = []
  data.forEach((route) => {
    temp.push(route)
    if (route?.children?.length) {
      temp = [...temp, ...mapWithoutChildren(route.children)]
    }
  })
  return temp.filter((item) => !item?.children?.length)
}

/*
// 和groupBy  一样功能
export function groupItemsByMenuId(data) {
  const groupedData = {}

  data.forEach((item) => {
    const { menuId, ...rest } = item
    if (!groupedData[menuId]) {
      groupedData[menuId] = []
    }
    groupedData[menuId].push(rest)
  })

  return groupedData
}
*/
/**
 * @description 处理提交时的权限数据结构 如角色管理、部门管理
 * @param data {Dictionary<*[]> | Dictionary<Array<Array[keyof Array]>>}
 * @param key {string} 转换的key
 *  [
 *       ...treeRef.value.getCheckedNodes(),
 *       ...treeRef.value.getHalfCheckedNodes(),
 *  ]
 *  或
 *  treeRef.value.getCheckedNodes(false, true)
 * @returns {Array}
 */
export function mapSubmitPermissionData(data, key = 'menuId') {
  data = groupBy(data, key)
  return Object.keys(data).reduce((p, c) => {
    const temp = {
      menuId: '',
      // 按钮权限，如：role:select#查看, role:select#删除
      authOperationIdentityList: [],
    }
    data[c].forEach((item) => {
      // 有code的是按钮权限
      if (item.code) {
        temp.authOperationIdentityList.push(`${item.code}#${item.title}`)
      } else {
        temp.menuId = item.id
      }
    })
    p.push(temp)
    return p
  }, [])
}

/*export function flattenMenuButtonPermissions(menuItems, result = {}) {
  for (const menuItem of menuItems) {
    const menuButtonInfoList = menuItem.menuButtonInfoList || []
    for (const buttonInfo of menuButtonInfoList) {
      result[buttonInfo.code] = buttonInfo
    }
    if (menuItem?.children?.length) {
      flattenMenuButtonPermissions(menuItem.children, result)
    }
  }

  return result
}*/

// 扁平菜单里所有按钮权限为对象存储  {code: {当前键所在对象}}
export function flattenMenuButtonPermissions(menuItems) {
  const result = {}
  const stack = [...menuItems]
  while (stack.length > 0) {
    const menuItem = stack.pop()
    const menuButtonInfoList = menuItem.menuButtonInfoList || []

    for (const buttonInfo of menuButtonInfoList) {
      result[buttonInfo.code] = buttonInfo
    }

    if (menuItem.children && menuItem.children.length > 0) {
      stack.push(...menuItem.children)
    }
  }

  return result
}

/**
 * @description 只返回或删除keys中的键
 * @param data {Array, Object} [
 *   {
 *     a:1,
 *     b:2,
 *     c:3
 *   },
 *   {
 *     a:4,
 *     b:5,
 *     c:6
 *   },
 * ],
 *  {
 *     a:4,
 *     b:5,
 *     c:6
 *   },
 * @param keys {Array} ['c']
 * @param delSpecifiedKey {Boolean} 是否删除指定的keys
 * @returns {Array} [
 *     {
 *         --delSpecifiedKey为false的结果
 *         "c": 3
 *         --delSpecifiedKey为true的结果
 *         a:4,
 *         b:5,
 *     },
 *     {
 *         "c": 6
 *     }
 * ]
 */
export function filterArraySpecifiedKey(
  data = [],
  keys,
  delSpecifiedKey = false
) {
  if (isObject(data)) {
    const result = delSpecifiedKey ? { ...data } : {}

    Object.keys(data).forEach((key) => {
      if (keys.includes(key)) {
        delSpecifiedKey
          ? Reflect.deleteProperty(result, key)
          : (result[key] = data[key])
      }
    })

    return result
  }

  return data.map((item) => {
    const obj = delSpecifiedKey ? { ...item } : {}
    keys.forEach((key) => {
      delSpecifiedKey
        ? Reflect.deleteProperty(obj, key)
        : (obj[key] = item[key])
    })
    return obj
  })
}

/**
 * @description 过滤对象中的空数据除了数组
 * @param {Object } obj
 * @param {Boolean} mark 要不要过滤空对象和空字符串
 * @returns {{}}
 */
export function delNullProperty(obj = {}, mark = true) {
  if (obj === null || typeof obj !== 'object') {
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.filter((item) => {
      return item !== null
    })
  }

  const filteredObj = {}
  Object.keys(obj).forEach((key) => {
    const value = delNullProperty(obj[key], mark)
    const bool1 = value !== null && value !== undefined
    const bool2 =
      bool1 &&
      !(Object.keys(value).length === 0 && value.constructor === Object) &&
      value !== ''
    if (mark ? bool2 : bool1) {
      filteredObj[key] = value
    }
  })

  return filteredObj
}

/**
 * @description 千分位处理
 * @param val {number} 数字
 * @param convert {boolean} 是否转换为千分位
 */
export function thousandQuantileProcessing(val, convert = true) {
  // return val?.toLocaleString()
  /*const match = String(val).match(/([+-]?)(\d+)((\.\d+)?%?)/)
      if (match === null) return val

      match[2] = match[2].replace(/(?!^)(?=(\d{3})+$)/g, ',')
      return `${match[1]}${match[2]}${match[3]}`*/
  if (convert && !isNaN(val + ''))
    return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  else return val
}

/**
 * @description 找到两个二维数组的差集（即 第一个数组中下标"1"数组有值，但第二个数组同样取值时没值）
 * @param  arr1 {Array} [[1],[2],[3]]
 * @param  arr2 {Array} [[4]]
 * @returns {Array}
 * [
 *     [
 *         2
 *     ],
 *     [
 *         3
 *     ]
 * ]
 */
export function differenceByIndex(arr1, arr2) {
  const indexSet = new Set()

  // 将第二个数组的下标存入集合
  arr2.forEach((_, index) => {
    indexSet.add(index)
  })

  const result = []

  // 遍历第一个数组，如果下标不在集合中存在，则将对应的子数组加入结果数组
  arr1.forEach((subArray, index) => {
    if (!indexSet.has(index)) {
      result.push(subArray)
    }
  })

  return result
}

/**
 * @description 过滤树结构
 * @param {Object|Array} options - 选项对象或要过滤的数组
 * @param {Array} options.data - 要过滤的数组
 * @param {boolean} [options.hasTopLevel=false] - 是否保留顶层
 * @param {string} [options.subKey='children'] - 子节点的键名，用于递归处理
 * @param {boolean} [options.removeEmptySubKey=false] - 是否删除空的子节点键
 * @param {Function} cb - 过滤回调函数，用于判断是否保留节点 返回布尔  (必传)
 * @returns {Array} 过滤后的树
 */
export function filterTree(options, cb = () => true) {
  const {
    data,
    hasTopLevel = false,
    subKey = 'children',
    removeEmptySubKey = false,
    parent = {},
  } = isObject(options) ? options : { data: options }

  return data.flatMap((item) => {
    const newItem = { ...item }
    // 过滤子节点
    if (newItem?.[subKey]?.length) {
      newItem[subKey] = filterTree(
        {
          data: newItem[subKey],
          // 不是顶层不需要保留
          hasTopLevel: false,
          subKey,
          removeEmptySubKey,
          // 将当前节点作为父级传递给子节点
          parent: newItem,
        },
        cb
      )
    }

    // 删除没有子节点的 children 字段
    if (removeEmptySubKey && !newItem[subKey].length) {
      Reflect.deleteProperty(newItem, subKey)
    }

    // 如果节点有子节点，保留父节点
    if (newItem?.[subKey]?.length) {
      return newItem
    }

    // 判断当前节点是否符合条件或为顶层节点
    if (hasTopLevel || cb(newItem, parent)) {
      return newItem
    }

    // 如果不符合条件且不是顶层节点，则移除该节点
    return []
  })
  // flatMap不需要filter return []
  // .filter(Boolean)
}
/**
 * @description 遍历树结构，增删改属性
 * @param {Object|Array} options - 选项对象或要过滤的数组
 * @param {Array} options.data - 要过滤的数组
 * @param {string} [options.subKey='children'] - 子节点的键名，用于递归处理
 * @param {boolean} [options.removeEmptySubKey=false] - 是否删除空的子节点键
 * @param {Function} cb - 回调函数 (必传)
 * @returns {Array} 过滤后的树
 */
export function traverseTree(options, cb = () => {}) {
  const {
    data,
    subKey = 'children',
    removeEmptySubKey = false,
    parent = null,
    subIndex = null,
  } = isObject(options) ? options : { data: options }

  return data.flatMap((node, index) => {
    const newNode = { ...node }
    cb(newNode, parent, index, subIndex)

    // 递归处理子节点
    if (newNode?.[subKey]?.length) {
      newNode[subKey] = traverseTree(
        {
          data: newNode[subKey],
          subKey,
          removeEmptySubKey,
          // 将当前节点作为父级传递给子节点
          parent: newNode,
          subIndex: index,
        },
        cb
      )
    }

    // 删除没有子节点的 children 字段
    if (removeEmptySubKey && !newNode?.[subKey]?.length) {
      Reflect.deleteProperty(newNode, subKey)
    }

    return newNode
  })
}

// VxeButton-> vxe-button
export function humpToKebabCase(str) {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
}

// 根据n个标识获取n条数据(完整对象)
// id = 要查找的数据 支持数组格式
export function recursionFindData(data, id, key = 'id') {
  const ids = new Set(Array.isArray(id) ? id : [id])

  function fn(data, key, result) {
    for (const item of data) {
      if (ids.has(item[key])) {
        result.push(item)
      }
      if (item.children && item.children.length) {
        fn(item.children, key, result)
      }
    }
  }

  const result = []
  fn(data, key, result)

  return result.length > 1 ? result : result[0]
}

/**
 * @description 获取父级数据
 * @param data 树结构数据
 * @param id 要查找的唯一键
 * @param uniqueKey 唯一键
 * @param subKey 子级键
 * @returns {{length}|*|null}
 */
export function findParentData(
  data,
  id,
  uniqueKey = 'id',
  subKey = 'children'
) {
  const filterData = (item, targetId) => {
    if (item?.[subKey]?.length) {
      for (const child of item[subKey]) {
        if (child[uniqueKey] === targetId) return item // 找到父级
        const parent = filterData(child, targetId)
        if (parent) return parent
      }
    }
    return null
  }

  for (const item of data) {
    const parent = filterData(item, id)
    if (parent) return parent
  }

  // 如果给定的ID在数据中不存在
  return null
}

// 获取最顶级父级 findTopLevelParent(树结构数据, 188)
export function findTopLevelParent(data, id, key = 'id') {
  const filterData = (item, parentId) => {
    if (item[key] === parentId) return item
    if (item?.children?.length) {
      for (const child of item.children) {
        const parent = filterData(child, parentId)
        if (parent) return parent
      }
    }
    return null
  }
  for (const item of data) {
    const parent = filterData(item, id)
    if (parent) return item
  }
  // 如果给定的ID在数据中不存在
  return null
}

/**
 * @description  根据id查找所有父级
 * @param tree 树结构数据
 * @param targetId 要查找的id
 * @param includeSelf 是否包含自身
 * @param uniqueKey 唯一键
 * @param subKey 子级键
 * @param parents 父级集合
 * @returns {[*]|*|[]|*[]}
 */
export function findAllParentItems(
  tree,
  targetId,
  includeSelf = false,
  uniqueKey = 'id',
  subKey = 'children',
  parents = []
) {
  for (const node of tree) {
    if (node[uniqueKey] === targetId) {
      // 找到目标节点，返回其所有父级
      return includeSelf ? [...parents, node] : parents
    }

    if (node?.[subKey]?.length) {
      const result = findAllParentItems(
        node[subKey],
        targetId,
        includeSelf,
        uniqueKey,
        subKey,
        [...parents, node]
      )
      if (result.length) {
        // 如果在子节点中找到目标节点，返回结果
        return result
      }
    }
  }

  // 未找到目标节点
  return []
}

/**
 * @description 获取所有子级
 * @param data {Array} 树结构数据
 * @param key {String} 子级键
 * @returns {*[]}
 */
export function findAllSubItems(data, key = 'children') {
  let childrenPath = []

  data?.[key]?.forEach((child) => {
    childrenPath.push(child)
    if (child?.[key]?.length) {
      childrenPath = [...childrenPath, ...findAllSubItems(child, key)]
    }
  })

  return childrenPath
}

/**
 * @description 获取对应前缀按钮权限列表
 * @param prefix 如看板按钮权限前缀dashboard: 按钮
 * @returns {Object}
 * {
 *     "view": "dashboard:view",
 *     ...
 * }
 */
export function getButtonAuthList(prefix) {
  const routeStore = useRouteStore()
  return Object.keys(routeStore.buttonPermissionsMap)
    .filter((key) => key.startsWith(prefix))
    .reduce(
      (p, c) => {
        const [, b] = c.split(':')
        // p[c.split(':')[1]] = routeStore.buttonPermissionsMap[c]
        p.authEnum[b] = c
        p.authEnumDesc[b] = routeStore.buttonPermissionsMap[c].title
        return p
      },
      { authEnum: {}, authEnumDesc: {} }
    )
}

/**
 * @description 自定义数组数据顺序，支持数组对象
 * @param {array} data 数据
 * [
 *   {id: 0},
 *   {id: -20},
 *   {id: -30}
 * ]
 * @param {array} targetIds 以该数据排序 [-20, -30]
 * @param {string} uniqueKey 唯一键 id
 * @returns {array} [
 *     {
 *         "id": -20
 *     },
 *     {
 *         "id": -30
 *     },
 *     {
 *         "id": 0
 *     }
 * ]
 */
export function customDataSort(data, targetIds, uniqueKey = '') {
  return cloneDeep(data).sort((a, b) => {
    const indexOfA = targetIds.indexOf(uniqueKey ? a[uniqueKey] : a)
    const indexOfB = targetIds.indexOf(uniqueKey ? b[uniqueKey] : b)

    if (indexOfA !== -1 && indexOfB === -1) {
      return -1 // 'a' comes before 'b' (a has a specified id, b does not)
    } else if (indexOfA === -1 && indexOfB !== -1) {
      return 1 // 'b' comes before 'a' (b has a specified id, a does not)
    } else {
      // Sort based on the order in targetIds array
      return indexOfA - indexOfB
    }
  })
}

/**
 * @description 为树形结构的每个节点添加额外属性，记录其父节点和子节点的标识。
 * @param {Object[]} treeArray - 树形结构的数组，每个元素代表一个节点。
 * @param {string} [key='id'] - 用于标识每个节点的唯一键的名称。
 * @param {Array} [parentIds=[]] - 父级标识符的数组，用于在递归过程中追踪。
 * @returns {Object[]} 返回新的树形数组，其中每个节点都添加了父级和子级标识记录字段。
 */
export function treeRecordParentSubIds(treeArray, key = 'id', parentIds = []) {
  // const topLevelId = parentIds.length === 0 && treeArray.length ? treeArray[0][key] : null;
  return treeArray.map((node) => {
    let parentId = null
    let topLevelId = null
    if (parentIds.length) {
      parentId = parentIds[parentIds.length - 1]
      topLevelId = parentIds[0]
    }
    // 创建新节点，复制原始节点数据
    const newNode = {
      ...node,
      parentIds: [...parentIds],
      topLevelId,
      // 是不是顶层
      topLevel: topLevelId === null,
      parentId,
      // subId: '',
      subIds: [],
    }

    // 如果有子节点，递归处理子节点
    if (node?.children?.length) {
      newNode.children = treeRecordParentSubIds(node.children, key, [
        ...parentIds,
        node[key],
      ])
      // newNode.subId = newNode.children[0][key]; // 设置第一个子节点的ID

      // 更新当前节点的subIds
      newNode.children.forEach((child) => {
        newNode.subIds.push(child[key], ...child.subIds)
      })
    }

    return newNode
  })
}

export function convertToSeconds({ time, type }) {
  switch (type) {
    case 'day':
      return time * 24 * 60 * 60 // 1 day = 24 hours * 60 minutes * 60 seconds
    case 'hour':
      return time * 60 * 60 // 1 hour = 60 minutes * 60 seconds
    case 'minute':
      return time * 60 // 1 minute = 60 seconds
    default:
      return 1 // 如果type不是day、hour、minute，返回1
  }
}
