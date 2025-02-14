import { reactive, computed, onMounted, watch } from 'vue'
import useOperate from '@/components/PropsFilter/useOperate'
import { tableKeysArr, tableTypeArr } from '@/enumeration'
import { getTableType } from '@/utils/dataProcessing'
import { v4 as uuidv4 } from 'uuid'
import { cloneDeep, pick, omit, isObject } from 'lodash-es'
import { getFieldList } from '@/api/modules/analysis/common.js'
import { ElMessage } from 'element-plus'
import { t } from '@/locales/i18n'

const omitAttr = ['__fid', '__bid', '__did']
export function useAnalysisHooks(props = {}) {
  const state = reactive({
    conditionFilters: {
      relation: 0,
      filters: [],
    }, // 全局筛选
    conditionGroups: [], // 分组项
    globalFieldsData: {},
    disabledGroups: [],
    needOmitWatch: true,
  })

  const {
    handleDelConditionData,
    handleAddConditionData,
    getFilterItem,
    omitFiltersHandler,
  } = useOperate()

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

  onMounted(() => {
    if (!props.eventIds) getGlobalFieldsData()
  })

  /**
   * @description: 获取全局筛选、分组项属性列表
   * @return {*}
   */
  const getGlobalFieldsData = (val) => {
    if (!val && props.eventIds) return
    const eventIds = val

    getFieldList({ eventIds }).then((res) => {
      state.globalFieldsData =
        props?.limit && props.limit?.length > 0
          ? cloneDeep(pick(res.data, ['config', ...props.limit]))
          : cloneDeep(res.data)

      // 用户分析 时间(时间戳) 时间(日期)类型去掉相对事件发生时刻
      if (props.reportType === 'attr') {
        filterAttrsProps()
      }

      // 没有事件属性去除相对于自定义表事件关联属性
      if (
        !props.limit?.includes('eventField') &&
        props.limit?.includes('customTableList')
      ) {
        filterCustomTableAttrsProps()
      }
    })
  }

  /**
   * @description: 用户分析 时间(时间戳) 时间(日期)类型去掉相对事件发生时刻
   * @return {*}
   */
  const filterAttrsProps = () => {
    const config = state.globalFieldsData.config
    const filterConfig = {}
    Object.keys(config).forEach((key) => {
      filterConfig[key] = ['timestamp', 'datetime'].includes(key)
        ? omit(config[key], ['C14'])
        : config[key]
    })

    Object.assign(state.globalFieldsData, { config: filterConfig })
  }

  /**
   * @description: 去除相对于自定义表事件关联属性
   * @return {*}
   */
  const filterCustomTableAttrsProps = () => {
    //relationTableType 关联表类型 0表示用户表 1表示事件表
    const customTableList = state.globalFieldsData.customTableList.filter(
      (item) => item.relationTableType === 0
    )
    Object.assign(state.globalFieldsData, { customTableList })
  }

  watch(
    () => state.globalFieldsData,
    (val) => {
      if (props.eventIds) {
        if (state.needOmitWatch) {
          // 处理全局筛选 剔除当前属性列表不存在的值
          omitFilters(val)
          // 处理分组项 剔除当前属性列表不存在的值
          omitGroups(val)
        } else {
          state.needOmitWatch = true
        }
      }
    },
    {
      deep: true,
    }
  )

  // 处理筛选列表中在数据源中不存在的筛选属性
  const omitFilters = (data) => {
    let temp = state.conditionFilters?.filters

    if (!Array.isArray(temp) || temp.length === 0) return
    const newFilters = omitFiltersHandler(data, temp)

    state.conditionFilters.filters = newFilters
  }

  //处理分组 剔除当前属性列表不存在的值
  const omitGroups = (data) => {
    const newGroup = []
    for (const group of state.conditionGroups) {
      const key = tableTypeArr[group.tableType]
      if (key === 'eventField') {
        const groupfields = data?.[key]
        if (Array.isArray(groupfields)) {
          if (groupfields.find((el) => el.fEn === group.fEn) !== undefined) {
            newGroup.push(group)
          }
        }
      } else {
        newGroup.push(group)
      }
    }
    state.conditionGroups = newGroup
  }

  // 分组项中去掉 omitAttr 中包含的属性
  const groupFieldsData = computed(() => {
    const temp = {}
    for (const key in state.globalFieldsData) {
      const data = state.globalFieldsData[key]
      temp[key] = tableKeysArr.includes(key)
        ? data.filter((el) =>
            props.omitAttr ? !omitAttr.includes(el.fEn) : el
          )
        : data
    }

    return temp
  })

  /**
   * @description: 添加筛选条件
   * @return {*}
   */
  const addGlobalFilter = (index) => {
    let limit = props.limit
    if (!props.limit || props.limit?.length === 0)
      limit = Object.keys(state.globalFieldsData)

    state.conditionFilters = handleAddConditionData({
      condition: state.conditionFilters,
      noLimit: limit,
      conditionList: state.globalFieldsData,
      index,
    })
  }

  /**
   * @description: 删除筛选条件
   * @return {*}
   */
  const removeGlobalFilter = (index, subIndex) => {
    state.conditionFilters = handleDelConditionData({
      condition: state.conditionFilters,
      index,
      subIndex,
    })
  }

  // 在选择分组项中需要禁用掉的事件属性
  const disabledGroups = computed(() => {
    const group = []
    for (const item of state.conditionGroups) {
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
  })

  /**
   * @description: 添加分组项
   * @return {*}
   */
  const addGroupIterm = () => {
    if (Object.keys(groupFieldsData.value).length === 0) {
      ElMessage.warning(t('analysis.ltv.noGroupAdd'))
      return
    }
    const firstField = getFirstField(
      groupFieldsData.value,
      disabledGroups.value
    )
    state.conditionGroups.push({
      id: uuidv4(),
      ...firstField,
      timeType: ['timestamp', 'datetime'].includes(firstField.fType)
        ? 'day'
        : '',
      range: {
        propertyRange: [],
        propertyRangeType: 1,
      },
    })
  }

  /**
   * @description: 删除分组项
   * @return {*}
   * @param {number} index
   */
  const removeGroupItem = (index) => {
    state.conditionGroups.splice(index, 1)
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

  /**
   * @description: 回显分组项
   * @return {*}
   * @param { Array } data
   */
  const echoGroupItem = (data = [], Lists) => {
    const list = []
    data.forEach((item) => {
      if (isObject(Lists)) {
        Lists[tableTypeArr[item.tableType]].forEach((e) => {
          if (e.fEn === item.propertyName) {
            item.propertyNameDisplay = e.fZh
          }
        })
      }
      const obj = {
        id: uuidv4(),
        fEn: item.propertyName,
        name: item.propertyNameDisplay || item.columnDesc, // columnDesc兼容1.0字段
        fType: item.propertyType,
        tableType: item.tableType,
        parentId: item.parentId,
        timeType: item.timeType,
        range: {
          propertyRange: item.propertyRange,
          propertyRangeType:
            item.propertyRangeType === 1 ? 2 : item.propertyRangeType,
        },
        customTableName: item?.customTableName,
        customTableId: item?.customTableId,
      }
      list.push(obj)
    })
    return list
  }

  /**
   * @description: 拖拽的属性
   * @return {*}
   */
  const dragOptions = {
    forceFallback: 'true',
    group: { name: 'rules', pull: false, put: false },
    animation: '500',
    handle: '.tag-drag',
    fallbackTolerance: '10',
    itemKey: 'id',
    componentData: {
      name: 'fade',
      type: 'transtion-group',
    },
  }

  return {
    state,
    dragOptions,
    groupFieldsData,
    disabledGroups,
    getGlobalFieldsData,
    addGlobalFilter,
    removeGlobalFilter,
    addGroupIterm,
    removeGroupItem,
    parseGroupItem,
    echoGroupItem,
  }
}
