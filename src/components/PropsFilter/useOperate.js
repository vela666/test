import { omit, cloneDeep } from 'lodash-es'
import { v4 as uuidv4 } from 'uuid'
import { getTableType } from '@/utils/dataProcessing'
import { tableKeysArr, tableTypeArr } from '@/enumeration'
import { ElMessage } from 'element-plus'
import { isBoolean, isObject } from '@/utils/types'
import { t } from '@/locales/i18n'
// conditionList的接口数据
// import { getFieldList } from '@/api/modules/analysis/common'

export default function () {
  /**
   * @description 获取筛选属性列表中的第一个属性
   * @param {Object} options - 参数
   * @param {Array} options.conditionList - getFieldList的接口数据
   * @param {Array} [options.noLimit= tableKeysArr] - 要循环的key 不过滤的
   * @param {Array} [options.groups= 示例 [
   *     {
   *       "fEn": "__reg",
   *       "tableType": 1
   *     },
   *     {
   *       "fEn": "__platform",
   *       "tableType": 1
   *     }
   *   ]
   * ] - (分组项 添加分组中要剔除已经选择的属性)
   * @returns {Object} 第一个属性
   */
  // src/views/analysis/hooks/useAanlysisUtils.js getFirstField
  const getFirsCondition = (options) => {
    const { conditionList = {}, noLimit = tableKeysArr, groups } = options
    let pVal = {}
    if (Object.keys(conditionList)?.length) {
      for (const key of tableKeysArr) {
        // 不包含的跳过
        if (!noLimit.includes(key)) continue
        let tempData = conditionList?.[key]
        if (!Array.isArray(tempData)) continue
        tempData = tempData.filter((item) => item.permissionStatus !== false)
        if (Array.isArray(groups)) {
          for (const item of tempData) {
            const tableType = getTableType(key, item)
            const find = groups.find(
              (el) => item.fEn === el.fEn && tableType === el.tableType
            )
            if (!find) {
              return {
                fEn: item?.fEn,
                tableType,
                fType: item?.fType,
                parentId: item?.fieldId,
                name: item?.fZh,
                customTableName: item?.customTableName,
                customTableId: item?.customTableId,
              }
            }
          }
        } else {
          // if (Array.isArray(tempData) && tempData?.[0]) {
          if (tempData?.[0]) {
            pVal = {
              fEn: tempData[0]?.fEn,
              tableType: getTableType(key, tempData[0]),
              fType: tempData[0]?.fType,
              parentId: tempData[0]?.fieldId,
              name: tempData[0]?.fZh,
              customTableName: tempData[0]?.customTableName,
              customTableId: tempData[0]?.customTableId,
            }
            break
          }
        }
      }
    }
    return pVal
  }

  /**
   * @description 添加条件
   * @param {Object} options - 参数
   * @param {Object} options.condition -  {
   *       relation: 0,
   *       filters: [],
   * }
   * @param {Array} [options.noLimit= []] -tableKeysArr中的某个值 不过滤的
   * @param {Array} options.conditionList - getFieldList的接口数据
   * @param {Number} options.index - 当前下标
   * @returns {Object} 处理好后的条件数据
   */
  const handleAddConditionData = (options) => {
    const {
      condition,
      noLimit = tableKeysArr,
      conditionList = {},
      index,
    } = options
    if (!Object.keys(conditionList).length) {
      ElMessage.warning(t('analysis.noConditionsAdd'))
      return condition
    }
    const data = cloneDeep(condition)
    if (Number.isInteger(index)) {
      if (Array.isArray(data?.filters[index]?.filters)) {
        data?.filters[index]?.filters.push({
          id: uuidv4(),
          ...getFirsCondition({ conditionList, noLimit }),
        })
      } else {
        const oldItem = cloneDeep(data.filters[index])
        data.filters[index] = {
          id: oldItem.id,
          relation: 0,
          filters: [
            { ...oldItem, id: uuidv4() },
            { id: uuidv4(), ...getFirsCondition({ conditionList, noLimit }) },
          ],
        }
      }
    } else {
      data.filters.push({
        id: uuidv4(),
        ...getFirsCondition({ conditionList, noLimit }),
      })
    }
    return data
  }

  /**
   * @description 删除条件
   * @param {Object} options - 参数
   * @param {Object} options.condition -  {
   *       relation: 0,
   *       filters: [],
   * }
   * @param {Array} options.index - 当前数据下标
   * @param {Number} options.subIndex - 当前数据子下标
   * @returns {Object} 处理好后的条件数据
   */
  const handleDelConditionData = (options) => {
    const { condition, index, subIndex } = options
    const data = cloneDeep(condition)
    if (Number.isInteger(subIndex)) {
      data.filters[index]?.filters?.splice(subIndex, 1)
      const len = data.filters[index]?.filters?.length
      if (len === 1) {
        const temp = omit(data.filters[index]?.filters?.[len - 1], ['id'])
        const tempScreen = omit(data?.filters?.[index], ['filters', 'relation'])
        data.filters[index] = { ...temp, ...tempScreen }
      }
    } else {
      data.filters.splice(index, 1)
    }
    return data
  }

  /**
   * @description 检测筛选项获取比较值
   * @param {Object} data 筛选项
   */
  const validateFilterItem = (data) => {
    // 筛选项嵌套跳出
    if (data.filters && data.filters.length > 1) {
      return []
    }
    if (!data.equation || !data.fType || !data.fEn) return false
    let ftv = []
    let validated = true
    if (
      ['int', 'double', 'enum', 'string'].includes(data.fType) &&
      ['C00', 'C01'].includes(data.equation)
    ) {
      // 等于和不等于
      if (Array.isArray(data.selectedList) && data.selectedList.length > 0) {
        ftv = [...data.selectedList]
      } else {
        validated = false
      }
    } else if (
      ['int', 'double'].includes(data.fType) &&
      ['C02', 'C03', 'C19', 'C20'].includes(data.equation)
    ) {
      // 数值的大于和小于-等于
      if (isNaN(data.singleValue) || !data.singleValue) {
        return false
      } else {
        ftv = [data.singleValue]
      }
    } else if (
      ['int', 'double'].includes(data.fType) &&
      ['C06'].includes(data.equation)
    ) {
      // 数值的区间 在a与b之间
      if (
        data.before === '' ||
        data.after === '' ||
        isNaN(data.before) ||
        isNaN(data.after)
      ) {
        validated = false
      } else {
        ftv = [data.before, data.after]
      }
    } else if (
      ['string'].includes(data.fType) &&
      ['C07', 'C08'].includes(data.equation)
    ) {
      // 文本包括与不包括
      if (!data.selected) {
        validated = false
      } else {
        ftv = [data.selected]
      }
    } else if (
      ['datetime', 'timestamp'].includes(data.fType) &&
      ['C02', 'C03'].includes(data.equation)
    ) {
      // 日期时间大于和小于
      if (data.datetimeVal) {
        ftv = [data.datetimeVal]
      } else {
        validated = false
      }
    } else if (
      ['datetime', 'timestamp'].includes(data.fType) &&
      ['C09'].includes(data.equation)
    ) {
      // 日期时间绝对时间
      if (
        Array.isArray(data.datetimerangeval) &&
        data.datetimerangeval.length > 1
      ) {
        ftv = [data.datetimerangeval[0], data.datetimerangeval[1]]
      } else {
        validated = false
      }
    } else if (
      ['datetime', 'timestamp'].includes(data.fType) &&
      ['C13', 'C14'].includes(data.equation)
    ) {
      // 日期时间相对当前日期 或者 日期时间相对事件发生时刻
      if (data.timeRelation === 'before') {
        //过去几天前
        if (data.before === '' || isNaN(data.before)) {
          validated = false
        } else {
          ftv = [data.before]
        }
      } else if (data.timeRelation === 'between') {
        //相对当前日期区间a到b天 或者 相对事件发生时刻在区间a到b 天/小时/分
        if (
          data.before === '' ||
          data.after === '' ||
          isNaN(data.before) ||
          isNaN(data.after)
        ) {
          validated = false
        } else {
          ftv = [data.before, data.after]
        }
      }
    }

    return validated ? ftv : false
  }

  /**
   * @description 将筛选项转化成发送请求所需的形式
   * @param {Object} data
   * @param {(Array | boolean)} ftv
   * @returns {(Object | boolean)}
   */
  const getFilterItem = (data, ftv) => {
    let filter = {}
    if (Array.isArray(data.filters) && data.filters.length > 1) {
      filter = {
        filterType: 1,
        filts: [],
        relation: data.relation,
      }
      for (const fs of data.filters) {
        const subFtv = validateFilterItem(fs)
        if (subFtv === false) {
          return false
        }
        filter.filts.push({
          propertyName: fs.fEn,
          propertyNameDisplay: fs.name,
          propertyType: fs.fType,
          calcuSymbol: fs.equation,
          ftv: [...subFtv],
          timeRelative: fs.timeRelation,
          timeUnit: fs.timeUnit,
          tableType: fs.tableType,
          parentId: fs.parentId ?? fs.fieldId ?? '',
          filterType: 0,
          customTableName: fs?.customTableName,
          customTableId: fs?.customTableId,
        })
      }
    } else {
      filter = {
        propertyName: data.fEn,
        propertyNameDisplay: data.name,
        propertyType: data.fType,
        calcuSymbol: data.equation,
        ftv: [...ftv],
        timeRelative: data.timeRelation,
        timeUnit: data.timeUnit,
        tableType: data.tableType,
        parentId: data.parentId ?? data.fieldId ?? '',
        filterType: 0,
        customTableName: data?.customTableName,
        customTableId: data?.customTableId,
      }
    }
    return filter
  }

  /**
   * @description 解析筛选数据
   * @param {Object} data 筛选数据
   * @returns {(Object | boolean)}
   */
  const parseFilterData = (data) => {
    const resData = {
      relation: data.relation,
      filts: [],
    }
    if (Array.isArray(data.filters)) {
      for (const item of data.filters) {
        const ftv = validateFilterItem(item)
        if (ftv === false) {
          return false
        }
        const tempItem = getFilterItem(item, ftv)
        if (tempItem === false) {
          return false
        }
        resData.filts.push(tempItem)
      }
    }
    return resData
  }

  /**
   * @description 将保存的数据转为组件所需数据
   * @param {Array} filters 后端保存的筛选数据
   * @param {Number} relation 0且 1或
   * @param {Object} attrList getFieldList 接口返回的数据
   */

  /**
   * @description 将保存的数据转为组件所需数据
   * @param {Object} options - 3个选项或直接是options.condition
   * @param {Array} [options.filts] - 后端保存的筛选数据
   *  [
   *       {
   *         propertyName: '__reg',
   *         propertyNameDisplay: '地区',
   *         propertyType: 'string',
   *         calcuSymbol: 'C00',
   *         ftv: ['印度尼西亚(ID)'],
   *         timeRelative: '',
   *         timeUnit: '',
   *         tableType: 1,
   *         parentId: '',
   *         filterType: 0,
   *       },
   *       ...
   * ]
   * @param {number} [options.relation] - 0且 1或
   * @returns {Object} 处理好后的条件数据
   */
  const parseFiltersFromRes = (options) => {
    const { filts, relation } = options
    const res = {
      relation: relation || 0,
      filters: [],
    }
    if (!Array.isArray(filts)) return { ...options, ...res }
    for (const item of filts) {
      res.filters.push(setFilterItem(item))
    }
    return res
  }
  /**
   * @description 设置筛选数据中的每一项
   * @param {Object} item 每一项筛选数据
   */
  const setFilterItem = (item) => {
    //判断是否是嵌套
    let data = {}
    if (item.filts) {
      data = {
        filters: [],
        id: uuidv4(),
        relation: item.relation,
      }
      for (const fs of item.filts) {
        data.filters.push(filterItemAssignment(fs))
      }
    } else {
      data = filterItemAssignment(item)
    }
    return data
  }

  // 每一项筛选项赋值
  const filterItemAssignment = (item) => {
    return {
      id: uuidv4(),
      name: item.propertyNameDisplay,
      equation: item.calcuSymbol,
      fType: item.propertyType,
      fEn: item.propertyName,
      tableType: item.tableType,
      before:
        ['C06', 'C13'].includes(item.calcuSymbol) ||
        (item.calcuSymbol === 'C14' && item.timeRelative === 'between')
          ? +item.ftv[0]
          : '',
      after:
        item.calcuSymbol === 'C06' ||
        (['C13', 'C14'].includes(item.calcuSymbol) &&
          item.timeRelative === 'between')
          ? +item.ftv[1]
          : '',
      selected:
        ['string'].includes(item.propertyType) &&
        ['C07', 'C08'].includes(item.calcuSymbol)
          ? item.ftv[0]
          : '',
      singleValue:
        ['int', 'double'].includes(item.propertyType) &&
        ['C02', 'C03', 'C19', 'C20'].includes(item.calcuSymbol)
          ? item.ftv[0]
          : '',
      selectedList:
        item.calcuSymbol === 'C00' || item.calcuSymbol === 'C01'
          ? item.ftv
          : [],
      timeRelation: item.timeRelative,
      timeUnit: item.timeUnit,
      datetimerangeval: item.calcuSymbol === 'C09' ? item.ftv : [],
      datetimeVal:
        ['datetime', 'timestamp'].includes(item.propertyType) &&
        ['C02', 'C03'].includes(item.calcuSymbol)
          ? item.ftv[0]
          : '',
      parentId: item.parentId ? item.parentId : '',
      customTableName: item?.customTableName,
      customTableId: item?.customTableId,
    }
  }

  /**
   * @description 分析中切换事件时，处理筛选条件中不是当前事件的事件属性的数据
   * @param {Object} data /api/v2/quotas/selectFilterQuotas 接口返回的数据
   * @param {Array} filterData {relation: 0,filters: [],} 中的 filters
   * @returns
   */
  const omitFiltersHandler = (data, filterData) => {
    const newFilters = []
    for (const fs of filterData) {
      if (Array.isArray(fs?.filters)) {
        const newFilts = []
        for (const item of fs.filters) {
          // const fKey = tableTypeArr[item.tableType]
          // if (fKey === 'eventField') {
          //   const subFields = data?.[fKey]
          //   if (Array.isArray(subFields)) {
          //     if (subFields.find((el) => el.fEn === item.fEn) !== undefined) {
          //       newFilts.push(item)
          //     }
          //   }
          // } else {
          //   newFilts.push(item)
          // }
          const newFiltsItem = pushFilterItem(item, data)
          if (isObject(newFiltsItem)) {
            newFilts.push({ ...newFiltsItem })
          }
        }
        if (newFilts.length > 1) {
          newFilters.push({ ...omit(fs, ['filters']), filters: newFilts })
        } else if (newFilts.length === 1) {
          newFilters.push({ ...newFilts[0] })
        }
      } else {
        // const key = tableTypeArr[fs.tableType]
        // if (key === 'eventField') {
        //   const groupfields = data?.[key]
        //   if (Array.isArray(groupfields)) {
        //     if (groupfields.find((el) => el.fEn === fs.fEn) !== undefined) {
        //       newFilters.push(fs)
        //     }
        //   }
        // } else {
        //   newFilters.push(fs)
        // }
        const filterItem = pushFilterItem(fs, data)
        if (isObject(filterItem)) {
          newFilters.push({ ...filterItem })
        }
      }
    }
    return newFilters
  }

  /**
   * @description 查找当前筛选项是否在data数据中存在
   * @param {Object} item {relation: 0,filters: [],} 中的 filters中的每一项
   * @param {Object} data  /api/v2/quotas/selectFilterQuotas 接口返回的数据
   * @returns {Object | undefined}
   */
  const pushFilterItem = (item, data) => {
    const fKey = tableTypeArr[item.tableType]
    if (['eventField', 'customTableList'].includes(fKey)) {
      const subFields = data?.[fKey]
      const callBack =
        fKey === 'customTableList'
          ? (el) => el.fEn === item.customTableName
          : (el) => el.fEn === item.fEn
      if (Array.isArray(subFields)) {
        if (subFields.find(callBack) !== undefined) {
          return item
        }
      }
    } else {
      return item
    }
  }

  /**
   * @description 映射后端需要的参数 如事件分析的全局筛选/数据看板筛选条件形式时可用
   * @param {Object|Array} options - 3个选项或直接是options.condition
   * @param {Object} options.condition -  {
   *       relation: 0,
   *       filters: [],
   * }
   * @param {string} [options.filtsKey= 'filts'] - 记录条件key
   * @param {string} [options.relationKey= 'relation'] - 记录条件的且或关系key 0或/1且
   * @returns {Object} 处理好后的条件数据
   */
  const getConditionResult = (options) => {
    const {
      condition,
      filtsKey = 'filts',
      relationKey = 'relation',
      noPromise = false,
    } = options
    const result = {
      [filtsKey]: [],
      [relationKey]: 0,
    }
    if (noPromise) {
      const params = parseFilterData(condition)
      result[filtsKey] = params?.filts || []
      result[relationKey] = params?.relation || 0
      return result
    }
    return new Promise((resolve, reject) => {
      const params = parseFilterData(condition)
      if (isBoolean(params)) {
        reject(t('common.filterConditionErr'))
        return
      }
      result[filtsKey] = params.filts
      result[relationKey] = params.relation
      resolve(result)
    })
  }

  return {
    setFilterItem,
    getFilterItem,
    parseFilterData,
    getFirsCondition,
    getConditionResult,
    validateFilterItem,
    parseFiltersFromRes,
    filterItemAssignment,
    handleAddConditionData,
    handleDelConditionData,
    omitFiltersHandler,
  }
}
