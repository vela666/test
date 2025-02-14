import { getRetentionDaycolumns, getKeyDaysData, getKeyDay } from './util.js'
import { exportToExcel } from '@/utils/excel.js'
import { cloneDeep, isString, omit } from 'lodash-es'
import { recordBehavior } from '@/utils/record-behavior.js'
import { t } from '@/locales/i18n.js'

export default function (state, dataCache, qpCache, groupDataMap, props) {
  // 设置表格数据 (isExport: 是否是导出表格数据)
  const setTable = (isExport = false) => {
    const cacheData = cloneDeep(dataCache.value)
    let dayArr = getRetentionDaycolumns(state.showType, state.unitCycle)
    // 判断是否只展示关键日期
    let isKeyDays = false
    if (state.keyDays.apply === 2 && state.keyDays.days.length > 0) {
      isKeyDays = true
      dayArr = getKeyDay(dayArr, state.keyDays.days, state.showType)
    }
    let cols = [t('common.date')]
    const qpData = qpCache.value
    let eventData = []

    if (Array.isArray(qpData.events)) {
      eventData = qpData.events
    } else if (Array.isArray(qpData.retention)) {
      eventData = qpData.retention
    }

    const initTitle =
      eventData?.[0]?.eventDesc ??
      eventData?.[0]?.eventNameDisplay ??
      t('analysis.retention.initialEvent')

    cols = [...cols, initTitle, ...dayArr]
    const columns = []
    for (let k = 0; k < cols.length; k++) {
      columns.push({
        title: cols[k],
        prop: `col_${k}`,
        align: k >= 1 ? 'right' : 'center',
      })
    }
    const tableData = setTableDatas(cacheData, qpData, isKeyDays)
    if (isExport) {
      return { columns, tableData }
    } else {
      state.columnList = columns
      state.tableData = tableData
    }
  }

  const setTableDatas = (cacheData, qpData, isKeyDays) => {
    if (!Array.isArray(cacheData.items)) return []
    // 是否有同时展示
    const hasSameTime = cacheData.same_time_data === true
    // 是否是只看同时展示
    const onlyUserAction = state.onlyUserAction === true && hasSameTime
    // 是否有分组
    const hasGroup = cacheData?.group_column && isString(cacheData.group_column)
    const showType = state.showType
    const dataKey = showType === 1 ? 'return_visit_data' : 'lose_user_data'
    const showUsers = showType === 1 && hasSameTime && !onlyUserAction
    const showStageAvg = showType === 1 && !onlyUserAction

    const datas = []
    let stageData = {}
    for (const item of cacheData.items) {
      //只有展示留存数据时阶段均值数据
      if (item.on_date === '-' && !showStageAvg) continue
      const source_data = isNaN(item.source_data)
        ? item.source_data
        : parseFloat(item.source_data)

      // 同时展示数据
      let sameTimeData = Array.isArray(item.same_time_data)
        ? item.same_time_data
        : []
      let showSameTimeData = []
      if (showUsers) {
        showSameTimeData = sameTimeData
        //只展示关键日期处理
        if (isKeyDays) {
          showSameTimeData = getKeyDaysData(
            showSameTimeData,
            state.keyDays.days,
            showType
          )
        }
      }

      const isStageAvg = item.on_date === '-'
      let showDataSource =
        onlyUserAction && showType === 1 ? sameTimeData : item[dataKey]
      if (showType === 2) {
        showDataSource = showDataSource?.slice(1) ?? []
      }
      //只展示关键日期处理
      if (isKeyDays) {
        showDataSource = getKeyDaysData(
          showDataSource,
          state.keyDays.days,
          showType
        )
      }

      const vals = [
        isStageAvg ? t('analysis.retention.stageValue') : item.on_date,
        source_data,
        ...showDataSource,
      ]
      const users = [
        isStageAvg ? t('analysis.retention.stageValue') : item.on_date,
        0,
        ...showSameTimeData,
      ]
      const groupChildrenData = groupDataMap.value.get(item?.on_date)
      const temp = hasGroup
        ? {
            children:
              Array.isArray(groupChildrenData) && groupChildrenData.length > 0,
          }
        : {}
      for (let i = 0; i < vals.length; i++) {
        temp[`col_${i}`] = vals[i]
        if (i > 1 && !onlyUserAction) {
          if (temp[`col_${i}`] === '-') {
            temp[`col_${i}_per`] = '-'
          } else {
            temp[`col_${i}_per`] =
              source_data && !isNaN(source_data)
                ? Math.round((temp[`col_${i}`] / source_data) * 10000) / 100 +
                  '%'
                : '0%'
          }
          if (showUsers) {
            temp[`col_${i}_user`] = users[i] ?? null
          }
        }
      }
      if (!isStageAvg) {
        datas.push(temp)
      } else {
        stageData = temp
      }
    }

    // 阶段均值放在第一行
    if (showStageAvg) {
      datas.unshift(stageData)
    }
    return datas
  }

  //设置分组详情数据
  const setDetailTable = (data) => {
    const cacheData = cloneDeep(dataCache.value)
    const showType = state.showType
    let dayArr = getRetentionDaycolumns(showType, state.unitCycle)
    //判断是否只展示关键日期
    let isKeyDays = false
    if (state.keyDays.apply === 2 && state.keyDays.days.length > 0) {
      isKeyDays = true
      dayArr = getKeyDay(dayArr, state.keyDays.days, showType)
    }
    const groupColumns = isString(cacheData?.group_column)
      ? cacheData.group_column.split(',')
      : []
    state.flag = groupColumns.length
    let cols = [...groupColumns]
    const qpData = qpCache.value
    let eventData = []

    if (Array.isArray(qpData.events)) {
      eventData = qpData.events
    } else if (Array.isArray(qpData.retention)) {
      eventData = qpData.retention
    }

    const initTitle =
      eventData?.[0]?.eventDesc ??
      eventData?.[0]?.eventNameDisplay ??
      t('analysis.retention.initialEvent')
    cols = [...cols, initTitle, ...dayArr]
    const colums = []
    for (let k = 0; k < cols.length; k++) {
      colums.push({
        title: cols[k],
        prop: `col_${k}`,
        align: state.flag && k >= state.flag ? 'right' : 'center',
      })
    }
    const tableData = setDetailTableDatas(data, cacheData, qpData, isKeyDays)
    return { tableData, colums }
  }

  // 填充日期分组详情表格数据
  const setDetailTableDatas = (sourceData, cacheData, qpData, isKeyDays) => {
    if (!Array.isArray(sourceData)) return []
    // 是否有同时展示
    const hasSameTime = cacheData.same_time_data === true
    // 是否是只看同时展示
    const onlyUserAction = state.onlyUserAction === true && hasSameTime
    // 展示留存还是流失数据 1,留存; 2,流失
    const showType = state.showType
    //const dataKey = 'return_visit_data'
    const dataKey = showType === 1 ? 'return_visit_data' : 'lose_user_data'
    const showUsers = showType === 1 && hasSameTime && !onlyUserAction
    const offset = state.flag
    const datas = []
    for (const item of sourceData) {
      const groupColumns = item.group_column.split(',')
      const source_data = isNaN(item.source_data)
        ? item.source_data
        : parseFloat(item.source_data)

      // 同时展示数据
      let showSameTimeData = []
      let sameTimeData = Array.isArray(item.same_time_data)
        ? item.same_time_data
        : []
      if (showUsers) {
        showSameTimeData = [...sameTimeData]
        if (isKeyDays) {
          showSameTimeData = getKeyDaysData(
            showSameTimeData,
            state.keyDays.days,
            showType
          )
        }
      }

      let showDataSource =
        onlyUserAction && showType === 1 ? sameTimeData : item[dataKey]
      if (showType === 2) {
        showDataSource = showDataSource?.slice(1) ?? []
      }
      // 只展示关键日期处理
      if (isKeyDays) {
        showDataSource = getKeyDaysData(
          showDataSource,
          state.keyDays.days,
          showType
        )
      }
      const vals = [...groupColumns, source_data, ...showDataSource]
      const users = [...groupColumns, 0, ...showSameTimeData]
      const temp = {}
      for (let i = 0; i < vals.length; i++) {
        temp[`col_${i}`] = vals[i]
        if (i > offset && !onlyUserAction) {
          if (temp[`col_${i}`] === '-') {
            temp[`col_${i}_per`] = '-'
          } else {
            temp[`col_${i}_per`] =
              source_data && !isNaN(source_data)
                ? Math.round((temp[`col_${i}`] / source_data) * 10000) / 100 +
                  '%'
                : '0%'
          }
          if (showUsers) {
            temp[`col_${i}_user`] = users[i] ?? null
          }
        }
      }
      datas.push(temp)
    }
    return datas
  }

  // 导出表格数据
  const exportTableData = () => {
    recordBehavior({
      moduleName: '分析',
      submoduleName: '留存分析',
      operate: '导出报表数据',
      businessId: state.info?.businessId || props.reportInfo?.businessId,
    })
    const cacheData = cloneDeep(dataCache.value)
    if (!cacheData?.items?.length || !Array.isArray(cacheData?.items)) return
    // 是否有同时展示
    const hasSameTime = cacheData.same_time_data === true
    // 是否是只看同时展示
    const onlyUserAction = state.onlyUserAction === true && hasSameTime
    // 是否有分组
    const hasGroup = cacheData?.group_column && isString(cacheData.group_column)
    const showType = state.showType
    const dataKey = showType === 1 ? 'return_visit_data' : 'lose_user_data'
    const showUsers = showType === 1 && hasSameTime && !onlyUserAction
    const qpData = qpCache.value
    const dataSource = setTable(true)
    let title = '回访用户参与'
    if (onlyUserAction || showUsers) {
      if (qpData?.event.eventNameDisplay && qpData?.event.analysisDesc) {
        if (qpData?.event.propertyNameDisplay) {
          title = `${qpData?.event.eventNameDisplay}.${qpData?.event.propertyNameDisplay}.${qpData?.event.analysisDesc}`
        } else {
          title = `${qpData?.event.eventNameDisplay}.${qpData?.event.analysisDesc}`
        }
      }
    }
    let tHeader = []
    let data = []
    // 是否是分组
    if (hasGroup) {
      const resData = getGroupExportTableData({
        dataSource,
        cacheData,
        onlyUserAction,
        showUsers,
        title,
        showType,
        qpData,
      })
      tHeader = resData.columns
      data = resData.tableData
    } else {
      const { columns, tableData } = dataSource
      //生成表头
      columns.forEach((item, index) => {
        if (onlyUserAction) {
          if (index > 1) {
            tHeader.push(item.title + `(${title})`)
          } else {
            tHeader.push(item.title)
          }
        } else {
          tHeader.push(item.title)
          if (index > 1) {
            tHeader.push(
              item.title +
                `${showType === 1 ? t('analysis.retention.retentionRate') : t('analysis.retention.lossRate')}`
            )
            if (showUsers) {
              tHeader.push(item.title + `(${title})`)
            }
          }
        }
      })
      // 生成表格数据
      tableData.forEach((items) => {
        const temp = []
        for (const i of Object.values(items)) {
          temp.push(i ?? '-')
        }
        data.push(temp)
      })
    }
    // 导出excel
    exportToExcel({
      fileName: `留存分析_${onlyUserAction ? '只看同时展示' : showType === 1 ? '留存' : '流失'}_${new Date()
        .toLocaleDateString()
        .replace(/\//g, '_')}_${new Date().getTime()}`,
      sheets: {
        // sheetName: '工作表',
        sheetData: [tHeader, ...data],
      },
    })
  }

  const getGroupExportTableData = ({
    dataSource,
    cacheData,
    onlyUserAction,
    showUsers,
    title,
    showType,
    qpData,
  }) => {
    const groupColumns = isString(cacheData?.group_column)
      ? cacheData.group_column.split(',')
      : []
    state.flag = groupColumns.length
    let columns = []
    let tableData = []
    const tempHeader = []
    let dayArr = getRetentionDaycolumns(showType, state.unitCycle)
    //判断是否只展示关键日期
    let isKeyDays = false
    if (state.keyDays.apply === 2 && state.keyDays.days.length > 0) {
      isKeyDays = true
      dayArr = getKeyDay(dayArr, state.keyDays.days, showType)
    }
    //生成表头
    dataSource?.columns?.forEach((item, index) => {
      if (onlyUserAction) {
        if (index > 1) {
          tempHeader.push(item.title + `(${title})`)
        } else {
          tempHeader.push(item.title)
        }
      } else {
        tempHeader.push(item.title)
        if (index > 1) {
          tempHeader.push(
            item.title +
              `${showType === 1 ? t('analysis.retention.retentionRate') : t('analysis.retention.lossRate')}`
          )
          if (showUsers) {
            tempHeader.push(item.title + `(${title})`)
          }
        }
      }
    })
    columns = [
      t('common.date'),
      ...groupColumns,
      ...(tempHeader?.slice(1) ?? []),
    ]
    const tempObj = {}
    // 生成表格数据
    const totalNames = new Array(groupColumns.length).fill(
      t('analysis.retention.total')
    )
    dataSource?.tableData.forEach((items) => {
      const temp = []
      for (const source of Object.values(omit(items, ['children']))) {
        temp.push(source ?? '-')
      }
      tableData.push([temp[0], ...totalNames, ...(temp?.slice(1) ?? [])])
      const key =
        items?.col_0 === t('analysis.retention.stageValue') ? '-' : items?.col_0
      const showDetailData = cloneDeep(groupDataMap.value.get(key))
      if (Array.isArray(showDetailData)) {
        const datas = setDetailTableDatas(
          showDetailData,
          cacheData,
          qpData,
          isKeyDays
        )
        for (const childItem of datas) {
          tableData.push([
            temp[0],
            ...Object.values(childItem).map((el) => el ?? '-'),
          ])
        }
      }
    })
    return { columns, tableData }
  }

  return { setTable, setDetailTable, exportTableData }
}
