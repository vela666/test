import { cloneDeep, isString } from 'lodash-es'
import { exportToExcel } from '@/utils/excel.js'
import { getLtvDaycolumns, getKeyDaysData, getKeyDay } from './util.js'
import { recordBehavior } from '@/utils/record-behavior.js'
import { t } from '@/locales/i18n.js'

export default function (state, dataCache, qpCache, groupDataMap, props) {
  // 表格数据处理
  const setTable = () => {
    const cacheData = cloneDeep(dataCache.value)
    let dayArr = getLtvDaycolumns(state.unitCycle)
    // 判断是否只展示关键日期
    let isKeyDays = false
    if (state.keyDays.apply === 2 && state.keyDays.days.length > 0) {
      isKeyDays = true
      dayArr = getKeyDay(dayArr, state.keyDays.days)
    }
    let cols = [t('common.date')]
    const qpData = qpCache.value
    const initUsers = qpData.events.find((el) =>
      ['source_event', 'source_user'].includes(el.type)
    )
    // 初始用户标题设置（拼接指标显示名）
    const initUsersTitle =
      initUsers.type === 'source_user'
        ? `${initUsers.propertyNameDisplay}`
        : initUsers.eventNameDisplay
    // 初始日期指标标题设置（拼接指标显示名）
    if (cacheData.on_init_data === true) {
      let initDateTitle = ''
      const initDate = qpData.events.find((el) => ['on_init'].includes(el.type))
      if (initDate && initDate.eventNameDisplay) {
        initDateTitle = initDate.propertyNameDisplay
          ? `${initDate.eventNameDisplay}.${initDate.propertyNameDisplay}.${initDate.analysisDesc}`
          : `${initDate.eventNameDisplay}.${initDate.analysisDesc}`
      } else {
        initDateTitle = initDate.alias
      }
      cols.push(initDateTitle)
    }
    cols = [...cols, initUsersTitle, ...dayArr]
    const colums = []
    for (let k = 0; k < cols.length; k++) {
      colums.push({
        title: cols[k],
        prop: `col_${k}`,
        align: k >= 1 ? 'right' : 'center',
      })
    }
    state.columnList = colums
    state.tableData = setTableDatas(cacheData, qpData, isKeyDays)
  }

  // 填充表格数据 cacheData: 数据源, isKeyDays: 是否只展示关键日期
  const setTableDatas = (cacheData, qpData, isKeyDays) => {
    if (!Array.isArray(cacheData.items)) return []
    // 是否有初始日期指标
    const hasInit = cacheData.on_init_data === true
    let initDatePercent = false
    if (hasInit) {
      const initDate = qpData.events.find((el) => ['on_init'].includes(el.type))
      if (initDate && initDate.round === 2) {
        initDatePercent = true
      }
    }
    // 是否有同时展示
    const hasSameTime = cacheData.same_time_data === true
    // 是否有分组
    const hasGroup =
      cacheData?.group_column && typeof cacheData.group_column === 'string'

    // 是否是只看同时展示
    const onlyUserAction = state.onlyUserAction === true && hasSameTime
    // 是展示回访指标数据还是同时展示的数据
    const showDataKey = onlyUserAction ? 'same_time_data' : 'return_visit_data'
    // 判断回访用户指标是否为百分比
    let returnVisitPercent = false
    if (showDataKey === 'return_visit_data') {
      const returnVisit = qpData.events.find((el) =>
        ['return_visit'].includes(el.type)
      )
      if (returnVisit && returnVisit.round === 2) {
        returnVisitPercent = true
      }
    }
    // 判断同时展示为指标计算为百分比时
    let showPercent = false
    if (hasSameTime) {
      const sameTimeArithmetic = qpData.events.find((el) =>
        ['same_time_arithmetic', 'same_time'].includes(el.type)
      )
      if (sameTimeArithmetic && sameTimeArithmetic.round === 2) {
        showPercent = true
      }
    }
    const datas = []
    for (const item of cacheData.items) {
      let on_init_data = isNaN(item.on_init_data)
        ? item.on_init_data
        : parseFloat(item.on_init_data)
      const source_data = isNaN(item.source_data)
        ? item.source_data
        : parseFloat(item.source_data)
      if (initDatePercent && on_init_data && !isNaN(on_init_data)) {
        on_init_data = `${parseFloat((on_init_data * 100).toFixed(2))}%`
      }
      // 同时展示数据
      let sameTimeData = []
      if (hasSameTime) {
        sameTimeData = Array.isArray(item.same_time_data)
          ? item.same_time_data
          : []
        if (showPercent) {
          sameTimeData = sameTimeData.map((el) => {
            if (el && !isNaN(el)) {
              return `${parseFloat((el * 100).toFixed(2))}%`
            }
            return el
          })
        }
      }
      let showData = item[showDataKey]
      if (
        (showPercent && showDataKey === 'same_time_data') ||
        returnVisitPercent
      ) {
        showData = showData.map((el) => {
          if (el && !isNaN(el)) {
            return `${parseFloat((el * 100).toFixed(2))}%`
          }
          return el
        })
      }
      if (isKeyDays) {
        const keydays = state.keyDays.days
        sameTimeData = getKeyDaysData(sameTimeData, keydays)
        showData = getKeyDaysData(showData, keydays)
      }
      const vals = hasInit
        ? [item.on_date, on_init_data, source_data, ...showData]
        : [item.on_date, source_data, ...showData]
      const groupChildrenData = groupDataMap.value.get(item?.on_date)
      const temp = hasGroup
        ? {
            children:
              Array.isArray(groupChildrenData) && groupChildrenData.length > 0,
          }
        : {}
      for (let i = 0; i < vals.length; i++) {
        temp[`col_${i}`] = vals[i]
        if (hasSameTime && !onlyUserAction) {
          if (hasInit) {
            if (i > 2) {
              temp[`col_${i}_user`] = sameTimeData[i - 3]
            }
          } else {
            if (i > 1) {
              temp[`col_${i}_user`] = sameTimeData[i - 2]
            }
          }
        }
      }
      datas.push(temp)
    }
    return datas
  }

  // 填充日期分组详情表格数据
  const setDetailTableDatas = (sourceData, cacheData, qpData, isKeyDays) => {
    if (!Array.isArray(sourceData)) return []
    // 是否有初始日期指标
    const hasInit = cacheData.on_init_data === true
    let initDatePercent = false
    if (hasInit) {
      const initDate = qpData.events.find((el) => ['on_init'].includes(el.type))
      if (initDate && initDate.round === 2) {
        initDatePercent = true
      }
    }
    // 是否有同时展示
    const hasSameTime = cacheData.same_time_data === true
    // 是否是只看同时展示
    const onlyUserAction = state.onlyUserAction === true && hasSameTime
    // 是展示回访指标数据还是同时展示的数据
    const showDataKey = onlyUserAction ? 'same_time_data' : 'return_visit_data'
    // 判断回访用户指标是否为百分比
    let returnVisitPercent = false
    if (showDataKey === 'return_visit_data') {
      const returnVisit = qpData.events.find((el) =>
        ['return_visit'].includes(el.type)
      )
      if (returnVisit && returnVisit.round === 2) {
        returnVisitPercent = true
      }
    }
    // 判断同时展示为指标计算为百分比时
    let showPercent = false
    if (hasSameTime) {
      const sameTimeArithmetic = qpData.events.find((el) =>
        ['same_time_arithmetic', 'same_time'].includes(el.type)
      )
      if (sameTimeArithmetic && sameTimeArithmetic.round === 2) {
        showPercent = true
      }
    }
    const datas = []
    const offset = state.flag
    for (const item of sourceData) {
      const groupColumns = item.group_column.split(',')
      let on_init_data = isNaN(item.on_init_data)
        ? item.on_init_data
        : parseFloat(item.on_init_data)
      const source_data = isNaN(item.source_data)
        ? item.source_data
        : parseFloat(item.source_data)
      if (initDatePercent && on_init_data && !isNaN(on_init_data)) {
        on_init_data = `${parseFloat((on_init_data * 100).toFixed(2))}%`
      }
      // 同时展示数据
      let sameTimeData = []
      if (hasSameTime) {
        sameTimeData = Array.isArray(item.same_time_data)
          ? item.same_time_data
          : []
        if (showPercent) {
          sameTimeData = sameTimeData.map((el) => {
            if (el && !isNaN(el)) {
              return `${parseFloat((el * 100).toFixed(2))}%`
            }
            return el
          })
        }
      }
      // 只看同时展示处理
      let showData = item[showDataKey]
      if (
        (showPercent && showDataKey === 'same_time_data') ||
        returnVisitPercent
      ) {
        showData = showData.map((el) => {
          if (el && !isNaN(el)) {
            return `${parseFloat((el * 100).toFixed(2))}%`
          }
          return el
        })
      }
      if (isKeyDays) {
        const keydays = state.keyDays.days
        sameTimeData = getKeyDaysData(sameTimeData, keydays)
        showData = getKeyDaysData(showData, keydays)
      }
      const vals = hasInit
        ? [...groupColumns, on_init_data, source_data, ...showData]
        : [...groupColumns, source_data, ...showData]
      const temp = {}
      for (let i = 0; i < vals.length; i++) {
        temp[`col_${i}`] = vals[i]
        if (hasSameTime && !onlyUserAction) {
          if (hasInit) {
            if (i > offset + 1) {
              temp[`col_${i}_user`] = sameTimeData[i - offset - 2]
            }
          } else {
            if (i > offset) {
              temp[`col_${i}_user`] = sameTimeData[i - offset - 1]
            }
          }
        }
      }
      datas.push(temp)
    }
    return datas
  }

  // 日期分组详情数据展示
  const setDetailTable = (data) => {
    const cacheData = cloneDeep(dataCache.value)
    let dayArr = getLtvDaycolumns(state.unitCycle)
    // 判断是否只展示关键日期
    let isKeyDays = false
    if (state.keyDays.apply === 2 && state.keyDays.days.length > 0) {
      isKeyDays = true
      dayArr = getKeyDay(dayArr, state.keyDays.days)
    }
    const groupColumns = isString(cacheData?.group_column)
      ? cacheData.group_column.split(',')
      : []
    state.flag = groupColumns.length
    let cols = [...groupColumns]
    const qpData = qpCache.value
    const initUsers = qpData.events.find((el) =>
      ['source_event', 'source_user'].includes(el.type)
    )
    // 初始用户标题设置（拼接指标显示名）
    const initUsersTitle =
      initUsers.type === 'source_user'
        ? `${initUsers.propertyNameDisplay}`
        : initUsers.eventNameDisplay
    if (cacheData.on_init_data === true) {
      // 初始日期指标标题设置（拼接指标显示名）
      let initDateTitle = ''
      const initDate = qpData.events.find((el) => ['on_init'].includes(el.type))
      if (initDate.eventNameDisplay) {
        initDateTitle = initDate.propertyNameDisplay
          ? `${initDate.eventNameDisplay}.${initDate.propertyNameDisplay}.${initDate.analysisDesc}`
          : `${initDate.eventNameDisplay}.${initDate.analysisDesc}`
      } else {
        initDateTitle = initDate.alias
      }
      cols.push(initDateTitle)
    }
    cols = [...cols, initUsersTitle, ...dayArr]
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

  // 表格数据导出
  const exportTableData = () => {
    recordBehavior({
      moduleName: '分析',
      submoduleName: 'LTV分析',
      operate: '导出报表数据',
      businessId: state.info?.businessId || props.reportInfo?.businessId,
    })
    const cacheData = cloneDeep(dataCache.value)
    const qpData = qpCache.value
    if (!Array.isArray(cacheData.items)) return []
    // 是否有初始日期指标
    const hasInit = cacheData.on_init_data === true
    // 是否有同时展示
    const hasSameTime = cacheData.same_time_data === true
    // 是否有分组
    const hasGroup = cacheData.group_column && isString(cacheData?.group_column)
    // 是否是只看同时展示
    const onlyUserAction = state.onlyUserAction === true && hasSameTime
    // 是展示回访指标数据还是同时展示的数据
    const showDataKey = onlyUserAction ? 'same_time_data' : 'return_visit_data'
    // 判断回访用户指标是否为百分比
    let returnVisitPercent = false
    if (showDataKey === 'return_visit_data') {
      const returnVisit = qpData.events.find((el) =>
        ['return_visit'].includes(el.type)
      )
      if (returnVisit && returnVisit.round === 2) {
        returnVisitPercent = true
      }
    }
    let dayArr = getLtvDaycolumns(state.unitCycle)
    // 判断是否只展示关键日期
    let isKeyDays = false
    const keyDays = state.keyDays.days
    if (state.keyDays.apply === 2 && keyDays.length > 0) {
      isKeyDays = true
      dayArr = getKeyDay(dayArr, keyDays)
    }
    let tHeader = [t('common.date')]
    const data = []
    const initUsers = qpData.events.find((el) =>
      ['source_event', 'source_user'].includes(el.type)
    )
    // 初始用户标题设置（拼接指标显示名）
    const initUsersTitle =
      initUsers.type === 'source_user'
        ? `${initUsers.propertyNameDisplay}`
        : initUsers.eventNameDisplay
    // 初始日期指标标题设置（拼接指标显示名）
    let initDatePercent = false
    let initDateTitle = ''
    if (hasInit) {
      const initDate = qpData.events.find((el) => ['on_init'].includes(el.type))
      if (initDate.eventNameDisplay) {
        initDateTitle = initDate.propertyNameDisplay
          ? `${initDate.eventNameDisplay}.${initDate.propertyNameDisplay}.${initDate.analysisDesc}`
          : `${initDate.eventNameDisplay}.${initDate.analysisDesc}`
      } else {
        initDateTitle = initDate.alias
      }
      if (initDate && initDate.round === 2) {
        initDatePercent = true
      }
    }
    // 判断同时展示为指标计算且数据为百分比时
    let showPercent = false
    if (hasSameTime) {
      const sameTimeArithmetic = qpData.events.find((el) =>
        ['same_time_arithmetic', 'same_time'].includes(el.type)
      )
      if (sameTimeArithmetic && sameTimeArithmetic.round === 2) {
        showPercent = true
      }
    }
    if (hasSameTime && !onlyUserAction) {
      const newDayArr = []
      for (const item of dayArr) {
        newDayArr.push(
          item,
          `${item}(${t('analysis.ltv.returnVisitParticipation')})`
        )
      }
      dayArr = newDayArr
    }

    if (hasGroup) {
      const groupCols = isString(cacheData?.group_column)
        ? cacheData.group_column.split(',')
        : []
      tHeader = [...tHeader, ...groupCols]
      if (hasInit) {
        tHeader = [...tHeader, initDateTitle, initUsersTitle, ...dayArr]
      } else {
        tHeader = [...tHeader, initUsersTitle, ...dayArr]
      }
      // 拼装数据
      cacheData.items.forEach((item) => {
        let sameTimeData = []
        if (hasSameTime) {
          sameTimeData = Array.isArray(item.same_time_data)
            ? item.same_time_data
            : []
        }
        let showData = item[showDataKey]
        if (
          (showPercent && showDataKey === 'same_time_data') ||
          returnVisitPercent
        ) {
          showData = showData.map((el) => {
            if (el && !isNaN(el)) {
              return `${parseFloat((el * 100).toFixed(2))}%`
            }
            return el
          })
        }
        if (isKeyDays) {
          sameTimeData = getKeyDaysData(sameTimeData, keyDays)
          showData = getKeyDaysData(showData, keyDays)
        }
        // 同时展示回访用户指标数据和回访用户参与的数据
        if (hasSameTime && !onlyUserAction) {
          if (showPercent) {
            sameTimeData = sameTimeData.map((el) => {
              if (el && !isNaN(el)) {
                return `${parseFloat((el * 100).toFixed(2))}%`
              }
              return el
            })
          }
          const newShowData = []
          const showLen = showData.length
          for (let i = 0; i < showLen; i++) {
            newShowData.push(showData[i], sameTimeData[i])
          }
          showData = newShowData
        }
        let on_init_data = isNaN(item.on_init_data)
          ? item.on_init_data
          : parseFloat(item.on_init_data)
        const source_data = isNaN(item.source_data)
          ? item.source_data
          : parseFloat(item.source_data)
        if (initDatePercent && on_init_data && !isNaN(on_init_data)) {
          on_init_data = `${parseFloat((on_init_data * 100).toFixed(2))}%`
        }
        const vals = hasInit
          ? [
              item.on_date,
              ...new Array(groupCols.length).fill(t('analysis.ltv.total')),
              on_init_data,
              source_data,
              ...showData,
            ]
          : [
              item.on_date,
              ...new Array(groupCols.length).fill(t('analysis.ltv.total')),
              source_data,
              ...showData,
            ]
        data.push(vals)
        const groupData = cloneDeep(groupDataMap.value.get(item?.on_date) ?? [])
        // 拼装分组数据
        for (let i = 0, len = groupData.length; i < len; i++) {
          const tmp = groupData[i]
          let sameTimeData = []
          if (hasSameTime) {
            sameTimeData = Array.isArray(tmp.same_time_data)
              ? tmp.same_time_data
              : []
          }
          const group_column =
            typeof tmp.group_column === 'string'
              ? tmp.group_column.split(',')
              : []
          let groupShowData = tmp[showDataKey]
          if (
            (showPercent && showDataKey === 'same_time_data') ||
            returnVisitPercent
          ) {
            groupShowData = groupShowData.map((el) => {
              if (el && !isNaN(el)) {
                return `${parseFloat((el * 100).toFixed(2))}%`
              }
              return el
            })
          }
          if (isKeyDays) {
            sameTimeData = getKeyDaysData(sameTimeData, keyDays)
            groupShowData = getKeyDaysData(groupShowData, keyDays)
          }
          // 同时展示回访用户指标数据和回访用户参与的数据
          if (hasSameTime && !onlyUserAction) {
            if (showPercent) {
              sameTimeData = sameTimeData.map((el) => {
                if (el && !isNaN(el)) {
                  return `${parseFloat((el * 100).toFixed(2))}%`
                }
                return el
              })
            }
            const newShowData = []
            const showLen = groupShowData.length
            for (let i = 0; i < showLen; i++) {
              newShowData.push(groupShowData[i], sameTimeData[i])
            }
            groupShowData = newShowData
          }
          let on_init_data_group = isNaN(tmp.on_init_data)
            ? tmp.on_init_data
            : parseFloat(tmp.on_init_data)
          const source_data_group = isNaN(tmp.source_data)
            ? tmp.source_data
            : parseFloat(tmp.source_data)
          if (
            initDatePercent &&
            on_init_data_group &&
            !isNaN(on_init_data_group)
          ) {
            on_init_data_group = `${parseFloat(
              (on_init_data_group * 100).toFixed(2)
            )}%`
          }
          const tempVals = hasInit
            ? [
                item.on_date,
                ...group_column,
                on_init_data_group,
                source_data_group,
                ...groupShowData,
              ]
            : [
                item.on_date,
                ...group_column,
                source_data_group,
                ...groupShowData,
              ]
          data.push(tempVals)
        }
      })
    } else {
      tHeader = hasInit
        ? [...tHeader, initDateTitle, initUsersTitle, ...dayArr]
        : [...tHeader, initUsersTitle, ...dayArr]
      // 拼装数据
      cacheData.items.forEach((item) => {
        let sameTimeData = []
        if (hasSameTime) {
          sameTimeData = Array.isArray(item.same_time_data)
            ? item.same_time_data
            : []
        }
        let showData = item[showDataKey]
        if (
          (showPercent && showDataKey === 'same_time_data') ||
          returnVisitPercent
        ) {
          showData = showData.map((el) => {
            if (el && !isNaN(el)) {
              return `${parseFloat((el * 100).toFixed(2))}%`
            }
            return el
          })
        }
        if (isKeyDays) {
          sameTimeData = getKeyDaysData(sameTimeData, keyDays)
          showData = getKeyDaysData(showData, keyDays)
        }
        // 同时展示回访用户指标数据和回访用户参与的数据
        if (hasSameTime && !onlyUserAction) {
          if (showPercent) {
            sameTimeData = sameTimeData.map((el) => {
              if (el && !isNaN(el)) {
                return `${parseFloat((el * 100).toFixed(2))}%`
              }
              return el
            })
          }
          const newShowData = []
          const showLen = showData.length
          for (let i = 0; i < showLen; i++) {
            newShowData.push(showData[i], sameTimeData[i])
          }
          showData = newShowData
        }
        let on_init_data = isNaN(item.on_init_data)
          ? item.on_init_data
          : parseFloat(item.on_init_data)
        const source_data = isNaN(item.source_data)
          ? item.source_data
          : parseFloat(item.source_data)
        if (initDatePercent && on_init_data && !isNaN(on_init_data)) {
          on_init_data = `${parseFloat((on_init_data * 100).toFixed(2))}%`
        }
        const vals = hasInit
          ? [item.on_date, on_init_data, source_data, ...showData]
          : [item.on_date, source_data, ...showData]
        data.push(vals)
      })
    }
    exportToExcel({
      fileName: `LTV分析${new Date()
        .toLocaleDateString()
        .replace(/\//g, '_')}_${new Date().getTime()}`,
      sheets: {
        // sheetName: '工作表',
        sheetData: [tHeader, ...data],
      },
    })
  }
  return { setTable, setDetailTable, exportTableData }
}
