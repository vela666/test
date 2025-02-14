import { reactive, onMounted } from 'vue'
import useOperate from '@/components/PropsFilter/useOperate'
import { cloneDeep } from 'lodash-es'
import { v4 as uuidv4 } from 'uuid'
import { loadUserProps } from '@/api/modules/analysis/attr.js'
import { ElMessage } from 'element-plus'
import { useRoute } from 'vue-router'
import useTimeZoneStore from '@/store/modules/time-zone.js'
import { t } from '@/locales/i18n'

export function useAttrsHooks(state, isCrowd, props) {
  const analysis = reactive({
    crowdEvents: [],
    metric: [{}],
    userFieldsData: {},
    crowdIndex: 0,
  })

  const {
    parseFilterData,
    handleDelConditionData,
    handleAddConditionData,
    getFilterItem,
  } = useOperate()

  const route = useRoute()
  const timeZoneStore = useTimeZoneStore()

  onMounted(() => {
    loadUserProps().then((res) => {
      const list = cloneDeep(res.data)
      Object.assign(list, {
        common: { A01: t('analysis.numberOfUsers') },
      })

      analysis.userFieldsData = list
      if (route.query.id) return

      analysis.metric[0].eventFields = getInitEventField(list)
      userFieldsChange(0)
    })
  })

  const getInitEventField = (data) => {
    let res = {}
    if (data?.common) {
      for (const key in data.common) {
        res = {
          analysis: key,
          analysisDesc: data.common[key],
        }
        break
      }
    }
    return res
  }

  const getLimit = () => {
    let limit = props.limit
    if (!limit || limit?.length === 0)
      limit = Object.keys(state.globalFieldsData)

    return limit
  }

  /**
   * @description: 添加分群条件
   * @return {*}
   */
  const addEventFilter = (index, i) => {
    analysis.crowdEvents[i] = handleAddConditionData({
      condition: analysis.crowdEvents[i],
      noLimit: getLimit(),
      conditionList: state.globalFieldsData,
      index,
    })
  }

  /**
   * @description: 删除分群条件
   * @return {*}
   */
  const removeEventFilter = (index, subIndex, i) => {
    analysis.crowdEvents[i] = handleDelConditionData({
      condition: analysis.crowdEvents[i],
      index,
      subIndex,
    })
  }

  /**
   * @description: 新增分群
   * @return {*}
   */
  const createEvent = () => {
    const obj = {
      relation: 0,
      filters: [],
    }

    const item = handleAddConditionData({
      condition: obj,
      noLimit: getLimit(),
      conditionList: state.globalFieldsData,
    })

    analysis.crowdEvents.push({
      alias: `${t('analysis.attr.crowd')}${++analysis.crowdIndex}`,
      aliasRename: `${t('analysis.attr.crowd')}${analysis.crowdIndex}`,
      id: uuidv4(),
      ...item,
    })
  }

  /**
   * @description: 复制分群
   * @return {*}
   */
  const copyEvent = (i) => {
    if (analysis.crowdEvents.length >= 10) {
      ElMessage.warning(t('analysis.attr.crowdsUpperLimit'))
      return
    }
    analysis.crowdEvents.splice(i, 0, {
      ...cloneDeep(analysis.crowdEvents[i]),
      id: uuidv4(),
    })
  }

  /**
   * @description: 删除分群
   * @return {*}
   */
  const removeEvent = (i) => {
    analysis.crowdEvents.splice(i, 1)
  }

  /**
   * @description: 设置用户属性别名
   * @return {*}
   */
  const userFieldsChange = (i) => {
    const item = analysis.metric[i].eventFields
    const alias = item.propertyNameDisplay
      ? `${item.propertyNameDisplay}.${item.analysisDesc}`
      : item.analysisDesc
    analysis.metric[i].alias = alias
  }

  /**
   * @description: 校验筛选条件是否符合
   * @return {*}
   */
  const validateConditions = () => {
    if (isCrowd.value) {
      const crowdName = analysis.crowdEvents.some((item) => !item.aliasRename)
      if (crowdName) {
        ElMessage.warning(t('analysis.attr.checkCrowdName'))
        return false
      }

      const crowdNameList = new Set(
        analysis.crowdEvents.map((item) => item.aliasRename)
      )

      if (analysis.crowdEvents.length !== crowdNameList.size) {
        ElMessage.warning(t('analysis.attr.checkCrowdNameRepeat'))
        return false
      }

      let flag = analysis.crowdEvents.every((item) => parseFilterData(item))
      if (!flag) ElMessage.warning(t('common.filterConditionErr'))

      return flag
    } else {
      // 用户ID或访客ID暂不支持与其他分组项连用
      if (
        state.conditionGroups.length >= 2 &&
        state.conditionGroups.some((item) =>
          ['__fid', '__did'].includes(item.fEn)
        )
      ) {
        ElMessage.warning(t('analysis.attr.checkFidDid'))
        return false
      }
      // 全局筛选
      if (!parseFilterData(state.conditionFilters)) {
        ElMessage.warning(t('common.filterConditionErr'))
        return false
      }
    }

    return true
  }

  /**
   * @description: 格式化QP
   * @return {*}
   */
  const getParams = () => {
    if (!validateConditions()) {
      return false
    }

    // 人群对比
    const userCrowds = analysis.crowdEvents.map((item) => {
      return {
        ...parseFilterData(item),
        crowdName: item.aliasRename,
      }
    })

    const metric = analysis.metric[0]

    return {
      events: {
        analysis: metric.eventFields.analysis,
        analysisName: metric.eventFields.analysisDesc,
        analysisDesc: metric.aliasRename || metric.alias,
        propertyName: metric.eventFields.propertyName,
        propertyNameDisplay: metric.eventFields.propertyNameDisplay,
        parentId: metric.eventFields.parentId || '',
        relation: state.conditionFilters.relation,
        filts: isCrowd.value
          ? []
          : parseFilterData(state.conditionFilters).filts,
      },
      groupBy: isCrowd.value ? [] : parseGroupItem(state.conditionGroups),
      userCrowds: isCrowd.value ? userCrowds : [],
      timeZone: timeZoneStore.timeZone ?? '8',
      sortArr: props.sortArr,
      sortType: props.sortType,
    }
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
        propertyRange:
          item.range?.propertyRangeType === 0 ? [] : item.range?.propertyRange,
        propertyRangeType: item.range?.propertyRangeType,
      }
    })
  }

  return {
    analysis,
    addEventFilter,
    removeEventFilter,
    createEvent,
    copyEvent,
    removeEvent,
    userFieldsChange,
    getParams,
  }
}
