import { reactive } from 'vue'
import useOperate from '@/components/PropsFilter/useOperate'
import { tableKeysArr, tableTypeArr } from '@/enumeration'
import { getTableType } from '@/utils/dataProcessing'
import { cloneDeep, omit, pick } from 'lodash-es'
import { getFieldList } from '@/api/modules/analysis/common.js'

const omitAttr = ['__fid', '__bid', '__did']
export default function (props = {}) {
  const state = reactive({
    conditionGroups: [], // 分组项
    globalFieldsData: {},
    disabledGroups: [],
    needOmitWatch: true,
  })

  const { getFilterItem } = useOperate()

  //获取筛选属性列表中的第一个属性 (分组中要剔除已经选择的属性)
  const getFirstField = (fieldsList, groups) => {
    let pVal = {}
    if (Object.keys(fieldsList)?.length) {
      for (const key of tableKeysArr) {
        const tempData = fieldsList?.[key]
        if (Array.isArray(groups)) {
          if (!Array.isArray(tempData)) continue
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
              }
            }
          }
        } else {
          if (Array.isArray(tempData) && tempData[0]) {
            pVal = {
              fEn: tempData[0]?.fEn,
              tableType: getTableType(key, tempData[0]),
              fType: tempData[0]?.fType,
              parentId: tempData[0]?.fieldId,
              name: tempData[0]?.fZh,
            }
            break
          }
        }
      }
    }

    return pVal
  }

  // 分组项中去掉 omitAttr 中包含的属性
  const groupFieldsData = (globalFieldsData) => {
    const temp = {}
    for (const key in globalFieldsData) {
      const data = globalFieldsData[key]
      temp[key] = tableKeysArr.includes(key)
        ? data.filter((el) =>
            props.omitAttr ? !omitAttr.includes(el.fEn) : el
          )
        : data
    }

    return temp
  }

  // 分组项属性列表
  const getGroupFieldsData = async (eventIds) => {
    let { data } = await getFieldList({ eventIds })
    data =
      props?.limit && props.limit?.length > 0
        ? cloneDeep(pick(data, ['config', ...props.limit]))
        : cloneDeep(data)

    // 用户分析 时间(时间戳) 时间(日期)类型去掉相对事件发生时刻
    if (props.reportType === 'attr') {
      filterAttrsProps(data)
    }

    // 没有事件属性去除相对于自定义表事件关联属性
    if (
      !props.limit?.includes('eventField') &&
      props.limit?.includes('customTableList')
    ) {
      filterCustomTableAttrsProps(data)
    }
    return groupFieldsData(data)
  }

  /**
   * @description: 用户分析 时间(时间戳) 时间(日期)类型去掉相对事件发生时刻
   * @return {*}
   */
  const filterAttrsProps = (data) => {
    const config = data.config
    const filterConfig = {}
    Object.keys(config).forEach((key) => {
      filterConfig[key] = ['timestamp', 'datetime'].includes(key)
        ? omit(config[key], ['C14'])
        : config[key]
    })

    Object.assign(data, { config: filterConfig })
  }

  /**
   * @description: 去除相对于自定义表事件关联属性
   * @return {*}
   */
  const filterCustomTableAttrsProps = (data) => {
    //relationTableType 关联表类型 0表示用户表 1表示事件表
    const customTableList = data.customTableList.filter(
      (item) => item.relationTableType === 0
    )
    Object.assign(data, { customTableList })
  }

  //处理分组 剔除当前属性列表不存在的值
  const omitGroups = (globalFieldsData, value) => {
    const newGroup = []
    for (const group of value) {
      const key = tableTypeArr[group.tableType]
      if (key === 'eventField') {
        const groupfields = globalFieldsData?.[key]
        if (Array.isArray(groupfields)) {
          if (groupfields.find((el) => el.fEn === group.fEn) !== undefined) {
            newGroup.push(group)
          }
        }
      } else {
        newGroup.push(group)
      }
    }
    return newGroup
  }

  // 在选择分组项中需要禁用掉的事件属性
  const disabledGroups = (value) => {
    const group = []
    for (const item of value) {
      if (
        group.findIndex(
          (el) =>
            el.fEn === item.fEn && el.customTableName === item.customTableName
        ) === -1
      ) {
        group.push({ ...item })
      }
    }
    return group
  }

  /**
   * @description: 格式化分组项
   * @return {*}
   * @param { Array } data
   */
  const parseGroupItem = (data) => {
    return data.map((item) => {
      return {
        ...getFilterItem(item, []),
        ftv: undefined,
        timeType: item.timeType,
        propertyRange: item.range?.propertyRange,
        propertyRangeType: item.range?.propertyRangeType,
      }
    })
  }

  return {
    omitGroups,
    groupFieldsData,
    disabledGroups,
    getFirstField,
    getGroupFieldsData,
    parseGroupItem,
  }
}
