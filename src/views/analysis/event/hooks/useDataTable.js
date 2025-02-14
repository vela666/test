import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { cloneDeep } from 'lodash-es'
import {
  delimiter,
  fillData,
  needPercentSign,
} from '@/views/analysis/hooks/utils.js'
import dayjs from 'dayjs'
import { t } from '@/locales/i18n'

export default function (state, dataCache, qpCache) {
  const route = useRoute()

  watch(
    () => state.versus,
    (value) => {
      // 0 是第一阶段
      state.selectedStageChartIndex = [
        0,
        ...value.map((item, index) => index + 1),
      ]
      state.selectedStageTableIndex =
        value.findIndex((item) => item.tableCurrentSelectionStage) + 1
    }
  )

  // 要展示的阶段下标 0 是第一阶段
  const showStageIndex = computed(() => {
    return [0, state.selectedStageTableIndex]
  })

  const xData = computed(() => {
    const xRes = state.versus.length
      ? fillData(
          dataCache.value?.x_compared_list?.filter((item, index) =>
            showStageIndex.value.includes(index)
          )
        )
      : dataCache.value?.x

    return Array.isArray(xRes) ? xRes : []
  })

  const isKanBan = computed(() => {
    return route.path === '/seePlate/see'
  })

  const isTotal = computed(() => state.particleType.particle === 'summary')

  const whichDateRange = computed(() => {
    return (
      state?.dateRange?.date ?? [
        dayjs(state.dateRange.startTime).format('YYYY-MM-DD'),
        dayjs(state.dateRange.endTime).format('YYYY-MM-DD'),
      ]
    )
  })

  const totalDate = computed(() => {
    let defaultDateTxt = `${whichDateRange.value[0]}${t('common.to')}${whichDateRange.value[1]}`
    if (state.versus.length) {
      let data = state.versus[state.selectedStageTableIndex - 1].date
      return `${defaultDateTxt}${delimiter}${data[0]}${t('common.to')}${data[1]}`
    }
    return defaultDateTxt
  })
  // 设置表格固定列
  const isFixedColumn = (alignKey, k) =>
    (alignKey > -1 && alignKey === k) || k < alignKey

  // 获取qp中的事件
  const getQpEvents = () =>
    Array.isArray(qpCache?.value?.events) ? qpCache.value.events : []

  //判断自定义指标是否可以创建用户结果分群
  const customIndexCluster = (qpItem, field = 'A01') => {
    if (
      Array.isArray(qpItem?.customIndex) &&
      qpItem.customIndex.length === 1 &&
      qpItem?.custom === '事件0' &&
      qpItem.customIndex?.[0]?.analysis === field
    ) {
      //判断自定义指标中是否只有一个事件并且 analysis 为 A01（触发用户数）
      return true
    }
    return false
  }

  // 判断普通指标是否可以创建用户结果分群
  const itemIndexCluster = (qpItem, field = 'A01') => {
    if (qpItem?.analysis === field) {
      //判断普通指标中 analysis 是否为 A01（触发用户数）
      return true
    }
    return false
  }

  // 表格数据按日期
  const tableByDate = () => {
    const res = cloneDeep(dataCache.value)
    let cols = []
    let groupColumn = []
    if (res?.groupColumn) {
      //有分组情况
      groupColumn = res.groupColumn.split(',')
      cols = [...groupColumn]
    }

    if (isTotal.value) {
      cols = [...cols, t('analysis.indicators'), totalDate.value]
    } else {
      cols = [...cols, t('analysis.indicators'), ...xData.value]
    }

    const alignKey = cols.indexOf(t('analysis.indicators'))
    state.columnList = cols.map((item, k) => ({
      //fixed: isFixedColumn(alignKey, k) ? 'left' : '',
      title: cols[k],
      prop: `col_${k}`,
      sortable: true,
      align: alignKey > -1 && k > alignKey ? 'right' : 'center',
      showDiff: k > alignKey,
    }))
    const qpEvents = getQpEvents()
    const tableData = []
    res?.y?.forEach((item, index) => {
      // 判断当前指标是否可以添加用户分群的标识
      const customIndexA01 = customIndexCluster(qpEvents?.[index])
      const itemIndexA01 = itemIndexCluster(qpEvents?.[index])
      item.item.forEach((childItem) => {
        let vals = []
        // 分组
        if (groupColumn.length) {
          const groupCols = childItem.groupCols
            ? childItem.groupCols.split(',')
            : []
          if (!groupCols.length) {
            groupCols.length = groupColumn.length
            groupCols.fill(null, 0, groupCols.length - 1)
          }
          for (let i = 0; i < groupCols.length; i++) {
            vals.push(
              typeof groupCols[i] === 'string'
                ? groupCols[i].replace(/~/g, ',')
                : groupCols[i]
            )
          }
        }
        const isRound2 = item.round === 2
        const tempChildValues = sameItemHandler(
          isRound2,
          childItem,
          customIndexA01
        )
        vals = [...vals, item.eventName, ...tempChildValues]
        const temp = {}
        for (let i = 0; i < vals.length; i++) {
          temp[`col_${i}`] = vals[i]
        }
        temp['offSetKey'] = alignKey
        // 用户分群
        if (itemIndexA01 || customIndexA01) {
          temp['showCluster'] = true
        }
        // 事件详情
        if (
          itemIndexCluster(qpEvents?.[index], 'A00') ||
          customIndexCluster(qpEvents?.[index], 'A00')
        ) {
          temp['showEventDetail'] = true
        }
        temp.eventIndex = index
        // 筛选分组项功能
        filterGroupData(tableData, temp, groupColumn, childItem.groupCols)
      })
    })
    state.tableData = tableData
  }

  const versusList = (data) => {
    return fillData(
      data.values_compared_list.filter((item, index) =>
        showStageIndex.value.includes(index)
      ),
      'comparedValue'
    )
  }
  // 数据格式化处理：保留对应小数位或增加 %
  const setDataFormatter = (round, values, clusters, clusterIndex) => {
    return round === 2
      ? state.versus.length
        ? values
            .split(delimiter)
            .map((v) => {
              return needPercentSign(v, clusters.includes(clusterIndex))
            })
            .join(delimiter)
        : clusters.includes(clusterIndex)
          ? values / 100
          : `${values}%`
      : values
  }
  // 表格数据按事件
  const tableByEvent = () => {
    const res = cloneDeep(dataCache.value)
    let cols = [t('common.date')]
    let groupColumn = []
    //有分组情况
    let hasGroup = false
    if (res?.groupColumn) {
      hasGroup = true
      groupColumn = res.groupColumn.split(',')
      cols = [...cols, ...groupColumn]
    }
    const alignKey = cols.length
    for (const item of res.y) {
      cols.push(item.eventName)
    }
    // 包含分群的下标
    const clusters = []
    const columns = []
    const eventDetails = []
    const qpEvents = getQpEvents()

    for (let k = 0; k < cols.length; k++) {
      columns.push({
        title: cols[k],
        prop: `col_${k}`,
        sortable: true,
        align: k >= alignKey ? 'right' : 'center',
        showDiff: k >= alignKey,
        eventIndex: k - alignKey,
      })
      if (k >= alignKey) {
        const qpItem = qpEvents[k - alignKey]
        if (customIndexCluster(qpItem) || itemIndexCluster(qpItem)) {
          clusters.push(k)
        }
        if (
          customIndexCluster(qpItem, 'A00') ||
          itemIndexCluster(qpItem, 'A00')
        ) {
          eventDetails.push(k)
        }
      }
    }
    state.columnList = columns
    const tablePageTable = []
    //判断是否有分组
    if (hasGroup) {
      const tempData = {}
      const eventArr = []
      // 处理分组
      res.y.forEach((dataItems, index) => {
        const customIndexA01 = customIndexCluster(qpEvents[index])
        tempData[dataItems.eventName] = {}
        tempData[dataItems.eventName].round = dataItems.round
        eventArr.push(dataItems.eventName)

        dataItems.item.forEach((childItem) => {
          const isRound2 = dataItems.round === 2
          const tempChildValues = sameItemHandler(
            isRound2,
            childItem,
            customIndexA01
          )
          // 以分组统计
          tempData[dataItems.eventName][childItem.groupCols] = tempChildValues
        })
      })
      // 全部分组  去重
      const groups = [...new Set(res.unionGroups)]
      //判断合计
      if (isTotal.value) {
        for (let idx = 0; idx < groups.length; idx++) {
          const obj = {
            valData: [totalDate.value],
            tablePageTable,
            groupColumn,
            groups: groups[idx],
            eventArr,
            tempData,
            index: 0,
            clusters,
            eventDetails,
            alignKey,
          }
          tableGroupDataHandler(obj)
        }
      } else {
        for (let i = 0; i < xData.value.length; i++) {
          for (let idx = 0; idx < groups.length; idx++) {
            const obj = {
              valData: [xData.value[i]],
              tablePageTable,
              groupColumn,
              groups: groups[idx],
              eventArr,
              tempData,
              index: i,
              clusters,
              eventDetails,
              alignKey,
            }
            tableGroupDataHandler(obj)
          }
        }
      }
    } else {
      // 判断是否是合计
      if (!isTotal.value) {
        for (let key = 0; key < xData.value.length; key++) {
          const vals = [xData.value[key]]
          for (let i = 0; i < res.y.length; i++) {
            const clusterIndex = vals.length
            const dataCacheY = res.y[i]
            const dataCacheYitem = dataCacheY.item[0]
            // 判断是否有对比
            let comparedList = state.versus.length
              ? versusList(dataCacheYitem)
              : dataCacheYitem.values
            // 数据格式化处理：保留对应小数位或增加 %
            const showVal = setDataFormatter(
              dataCacheY.round,
              comparedList[key],
              clusters,
              eventDetails,
              clusterIndex
            )
            vals.push(showVal)
          }
          const temp = {}
          for (let i = 0; i < vals.length; i++) {
            temp[`col_${i}`] = vals[i]
          }
          temp['offSetKey'] = alignKey - 1
          temp['clusters'] = clusters
          temp['eventDetails'] = eventDetails
          tablePageTable.push(temp)
        }
      } else {
        const vals = [totalDate.value]
        for (let i = 0; i < res.y.length; i++) {
          const clusterIndex = vals.length
          const dataCacheY = res.y[i]
          const dataCacheYitem = dataCacheY.item[0]
          // 判断是否有对比
          let comparedList = (
            state.versus.length
              ? versusList(dataCacheYitem)
              : dataCacheYitem.values
          )[0]
          const showVal = setDataFormatter(
            dataCacheY.round,
            comparedList,
            clusters,
            eventDetails,
            clusterIndex
          )
          vals.push(showVal)
        }
        const temp = {}
        for (let i = 0; i < vals.length; i++) {
          temp[`col_${i}`] = vals[i]
        }
        temp['offSetKey'] = alignKey - 1
        temp['clusters'] = clusters
        temp['eventDetails'] = eventDetails
        tablePageTable.push(temp)
      }
    }
    state.tableData = tablePageTable
  }

  // 表格数据按分组
  const tableByGroup = () => {
    const res = cloneDeep(dataCache.value)
    const groupColumn = res.groupColumn.split(',')
    const groupsArr = [...new Set(res.unionGroups)]
    const qpEvents = getQpEvents()
    // 是否可以创建用户结果分群
    const isCluster = (index) => {
      return (
        customIndexCluster(qpEvents?.[index]) ||
        itemIndexCluster(qpEvents?.[index])
      )
    }

    let groups = getFilterGroups(groupsArr, groupColumn)

    const cols = [t('analysis.indicators'), t('common.date')]
    for (let i = 0; i < groups.length; i++) {
      cols.push(
        typeof groups[i] === 'string' ? groups[i].replace(/~/g, ',') : groups[i]
      )
    }
    state.columnList = []
    for (let i = 0; i < cols.length; i++) {
      state.columnList.push({
        title: cols[i],
        prop: `col_${i}`,
        align: i >= 2 ? 'right' : 'center',
        sortable: true,
        showDiff: i >= 2,
      })
    }

    const tablePageTable = []
    const tempData = {}
    const eventArr = []
    if (groups.length) {
      // 先分组数据
      res.y.forEach((dataItems, index) => {
        tempData[dataItems.eventName] = {}
        tempData[dataItems.eventName].round = dataItems.round
        eventArr.push(dataItems.eventName)

        dataItems.item.forEach((childItem) => {
          const isRound2 = dataItems.round === 2
          const tempChildValues = sameItemHandler(
            isRound2,
            childItem,
            isCluster(index)
          )
          tempData[dataItems.eventName][childItem.groupCols] = tempChildValues
        })
      })

      const sameHandler = (vals, eventItem, index, m) => {
        for (let idx = 0; idx < groups.length; idx++) {
          let eventData = 0
          if (state.versus.length) {
            eventData = `-${delimiter}-`
          } else {
            eventData =
              tempData[eventItem].round === 2 ? (isCluster(m) ? 0 : '0%') : 0
          }

          if (
            tempData[eventItem][groups[idx]] &&
            tempData[eventItem][groups[idx]][index]
          ) {
            eventData = tempData[eventItem][groups[idx]][index]
          }
          vals.push(eventData)
        }
        const temp = {}
        for (let i = 0; i < vals.length; i++) {
          temp[`col_${i}`] = vals[i]
        }
        temp['offSetKey'] = 1
        temp['isCluster'] = isCluster(m)
        // 事件详情
        temp['showEventDetail'] =
          customIndexCluster(qpEvents?.[m], 'A00') ||
          itemIndexCluster(qpEvents?.[m], 'A00')
        temp['eventIndex'] = m

        tablePageTable.push(temp)
      }

      for (let m = 0; m < eventArr.length; m++) {
        const eventItem = eventArr[m]
        let vals = []
        // 不是合计
        if (!isTotal.value) {
          for (let key = 0; key < xData.value.length; key++) {
            vals = [eventItem, xData.value[key]]
            sameHandler(vals, eventItem, key, m)
          }
        } else {
          vals = [eventItem, totalDate.value]
          sameHandler(vals, eventItem, 0, m)
        }
      }
    }
    state.tableData = tablePageTable
  }

  //获取过滤后的分组值
  const getFilterGroups = (groupsData, groupColumn) => {
    const filterGroups = state.filterGroups
    const filterGroupsValue = state.filterGroupsValue.toLowerCase()
    const groupsArr = cloneDeep(groupsData)
    let groups = []
    // 筛选分组项功能
    if (!filterGroupsValue) {
      groups = groupsArr
    } else if (
      filterGroups === t('analysis.event.unlimited') &&
      filterGroupsValue
    ) {
      for (let n = 0; n < groupsArr.length; n++) {
        if (groupsArr[n].toLowerCase().includes(filterGroupsValue)) {
          groups.push(groupsArr[n])
        }
      }
    } else if (
      filterGroups !== t('analysis.event.unlimited') &&
      filterGroupsValue
    ) {
      for (let n = 0; n < groupsArr.length; n++) {
        const groupColsArr = groupsArr[n] ? groupsArr[n].split(',') : []
        const pos = groupColumn.indexOf(filterGroups)
        if (
          pos > -1 &&
          groupColsArr[pos] &&
          groupColsArr[pos].toLowerCase().includes(filterGroupsValue)
        ) {
          groups.push(groupsArr[n])
        }
      }
    }
    return groups
  }

  const sameItemHandler = (isRound2, childItem, bool) => {
    let data = []
    if (state.versus.length) {
      // 根据已选阶段渲染
      let comparedList = versusList(childItem)
      data = isRound2
        ? comparedList.map((v) => {
            let [num1, num2] = v.split(delimiter)
            num1 = needPercentSign(num1, bool)
            num2 = needPercentSign(num2, bool)
            return num1 + delimiter + num2
          })
        : comparedList
    } else {
      data = isRound2
        ? childItem.values.map((x) => (isNaN(x) ? x : bool ? x / 100 : `${x}%`))
        : childItem.values
    }
    return data
  }

  const tableGroupDataHandler = (params = {}) => {
    let {
      valData = [],
      tablePageTable = [],
      groupColumn = [],
      groups = '',
      eventArr = [],
      tempData = {},
      clusters = [],
      eventDetails = [],
      index,
      alignKey,
    } = params

    const tempGroups = groups.split(',')

    for (let i = 0; i < tempGroups.length; i++) {
      valData.push(
        typeof tempGroups[i] === 'string'
          ? tempGroups[i].replace(/~/g, ',')
          : tempGroups[i]
      )
    }

    // 添加指标对应数据
    for (const eventItem of eventArr) {
      const clusterIndex = valData.length

      let eventData = 0
      if (state.versus.length) {
        eventData = `-${delimiter}-`
      } else {
        eventData =
          tempData[eventItem].round === 2
            ? clusters.includes(clusterIndex)
              ? 0
              : '0%'
            : 0
      }

      if (tempData[eventItem][groups] && tempData[eventItem][groups][index]) {
        eventData = tempData[eventItem][groups][index]
      }
      valData.push(eventData)
    }

    const temp = {}
    for (let i = 0; i < valData.length; i++) {
      temp[`col_${i}`] = valData[i]
    }
    temp['offSetKey'] = alignKey - 1
    temp['clusters'] = clusters
    temp['eventDetails'] = eventDetails
    // 筛选分组项功能
    filterGroupData(tablePageTable, temp, groupColumn, groups)
  }

  // 通改过分组值筛选表格数据
  const filterGroupData = (tablePageTable, temp, groupColumn, groupCols) => {
    const filterGroups = state.filterGroups
    const filterGroupsValue = state.filterGroupsValue.toLowerCase()
    // 筛选分组项功能
    if (!filterGroupsValue) {
      tablePageTable.push(temp)
    } else if (
      filterGroups === t('analysis.event.unlimited') &&
      filterGroupsValue
    ) {
      if (groupCols.toLowerCase().includes(filterGroupsValue)) {
        tablePageTable.push(temp)
      }
    } else if (
      filterGroups !== t('analysis.event.unlimited') &&
      filterGroupsValue
    ) {
      const groupColsArr = groupCols ? groupCols.split(',') : []
      const pos = groupColumn.indexOf(filterGroups)
      if (
        pos > -1 &&
        groupColsArr[pos] &&
        groupColsArr[pos].toLowerCase().includes(filterGroupsValue)
      ) {
        tablePageTable.push(temp)
      }
    }
  }

  return {
    totalDate,
    tableByEvent,
    tableByGroup,
    tableByDate,
  }
}
