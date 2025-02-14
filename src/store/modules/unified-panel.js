import { defineStore } from 'pinia'
import { computed, markRaw, reactive, toRefs } from 'vue'
import { getReportLabelName } from '@/api/modules/analysis/report.js'
import { asyncGetLeftKanBanInfo } from '@/api/modules/unified-panel'
import { asyncGetKanBanReportList } from '@/api/modules/see-plate/dashboard'

import {
  asyncGetDashBoardInfo,
  asyncGetShareMemberList,
  asyncGetSelectableApp,
} from '@/api/modules/unified-panel'
import { asyncGetKanBanNoteList } from '@/api/modules/unified-panel/note.js'
import { viewSize, mediumLargeEnum } from '@/views/see-plate/enum.js'
import { useRoute } from 'vue-router'

import { genereatePlaneArr, newPos, getSortNum } from '@/utils/getLayoutPos'
import { getFieldList } from '@/api/modules/analysis/common.js'
import { tableTypeArr } from '@/enumeration/index.js'

// mark 用于区分拖拽元素 对话框和外面展示的
export default defineStore('unifiedPanel', () => {
  const route = useRoute()
  const initVal = () => {
    return {
      leftCompleteData: {},
      loading: false,
      selectAppId: '',
      appList: [],
      shareList: [],
      labelList: [],
      reportList: [],
      noteList: [],
      selectedInfo: {
        name: '',
        authority: 1,
      },
      // 默认展示的
      selectedReportNoteList: [],
      // 添加窗口使用的
      addSelectedReporNoteList: [],
    }
  }
  const state = reactive(initVal())
  const reportAndNoteList = computed(() => {
    return [...state.reportList, ...state.noteList]
  })
  const getLeftKanBanInfo = async () => {
    const { data } = await asyncGetLeftKanBanInfo()
    state.leftCompleteData = data
  }

  // 查询标签列表
  const asyncGetTagList = async () => {
    if (!state.selectAppId) return
    const { data } = await getReportLabelName({
      appId: state.selectAppId,
    })
    state.labelList = data
  }

  // w：3小图 6/12 中/大图

  // 查询便签列表
  const asyncGetNoteList = async () => {
    state.noteList = []
    const { data } = await asyncGetKanBanNoteList({
      dashboardId: state.selectedInfo.id,
    })
    state.noteList = data.map((item) => {
      // 设置默认宽高 最终取new开头的值 因为在 添加已有报表窗口中 缩小了倍数
      return {
        ...item,
        type: 1,
        reportName: item.noteTitle,
        mark: `grid-item-${item.businessId}-add`,
        ...viewSize.note,
      }
    })
  }

  // 查询报表列表
  const asyncGetReportList = async (params = {}) => {
    state.reportList = []
    const dashboardBusinessId = route.query.kanBanId
    const {
      data: { list },
    } = await asyncGetKanBanReportList({
      ...params,
      appId: state.selectAppId,
      dashboardBusinessId,
      size: -1,
    })
    state.reportList = list.map((item) => {
      // 设置默认宽高 最终取new开头的值 因为在 添加已有报表窗口中 缩小了倍数
      // 默认中图
      return {
        ...item,
        type: 2,
        mark: `grid-item-${item.businessId}-add`,
        ...viewSize['2'],
        h: 2,
        minH: 2,
        maxH: 2,
      }
    })
  }

  const resetSelectedInfo = () => {
    state.selectedReportNoteList = []
    state.selectedInfo = initVal().selectedInfo
  }

  let layoutMap = []
  // 获取已选的报表和便签列表和坐标信息等 notAdd 不是添加已有报表窗口为true
  const getReportNoteDetails = async (notAdd = true) => {
    const whichKey = notAdd
      ? 'selectedReportNoteList'
      : 'addSelectedReporNoteList'
    try {
      const kanBanId = route.query.kanBanId
      state[whichKey] = []
      if (!kanBanId) {
        state.selectedInfo = initVal().selectedInfo
        return
      }
      state.loading = true
      const { data } = await asyncGetDashBoardInfo(kanBanId)
      try {
        if (data.reportAndNoteInfoList && data.reportAndNoteInfoList.length) {
          // 更新 分组项 属性的（多语言）显示名
          const res2 = await getFieldList({ eventIds: null })
          data.reportAndNoteInfoList.forEach((reportItem) => {
            const qp = JSON.parse(reportItem.qp)
            if (qp.groupBy && qp.groupBy.length) {
              qp.groupBy.forEach((item, index) => {
                const label = tableTypeArr[item.tableType]
                const data = res2.data[label]
                if (Array.isArray(data)) {
                  let temp = null
                  if (label === 'customTableList') {
                    const customRes = data.find(
                      (e) => e.fEn === item.customTableName
                    )
                    temp = (
                      Array.isArray(customRes?.fieldInfoList)
                        ? customRes.fieldInfoList
                        : []
                    ).find((e) => e.fEn === item.propertyName)
                  } else {
                    temp = data.find((e) => e.fEn === item.propertyName)
                  }
                  if (temp) {
                    qp.groupBy[index].propertyNameDisplay = temp.fZh
                  }
                }
              })
            }
            reportItem.qp = JSON.stringify(qp)
          })
        }
      } catch (error) {}
      state.selectedInfo = data
      const coordinate = JSON.parse(data.viewConfig || '[]')
      layoutMap = genereatePlaneArr(coordinate)
      // console.log({ coordinate, data }, 'data')
      // 重新排序数据 要不然视图位置不对
      state[whichKey] = data.reportAndNoteInfoList
        .reduce((p, val) => {
          const node = coordinate.find(
            (item) => item.mark === val.businessId || item.id === val.reportId
          )
          // 便签
          const isNote = +val.type === 1
          if (node) {
            // 小图或便签
            const smallOrNote = node.w === 3 || isNote
            const hLessThan4 = node.h < 4
            // 中大图
            const isMediumLarge = mediumLargeEnum.includes(node.w)

            let h = node.h
            if (notAdd) {
              if (!isNote && isMediumLarge && hLessThan4) {
                h = 4
              }
            } else {
              h = smallOrNote ? 1 : 2
            }

            p.push({
              ...val,
              ...node,
              // id: val.businessId,
              // w：3/6/12 小/中/大图
              h,
              // 设置默认宽高  因为在 添加已有报表窗口中 缩小了倍数 最终取new开头的值
              // newH: node.h,
              newH: !isNote && isMediumLarge && hLessThan4 ? 4 : node.h,
              newW: node.w,
            })
          } else {
            let node = {
              ...val,
              // w：3/6/12 小/中/大图
              w: isNote ? 12 : 6,
              h: isNote ? 1 : notAdd ? 4 : 2,
              // x: 0,
              // h: 4,
              // 设置默认宽高  因为在 添加已有报表窗口中 缩小了倍数 最终取new开头的值
              newH: isNote ? 1 : notAdd ? 4 : 2,
              newW: isNote ? 12 : 6,
            }
            p.push(newPos(node, layoutMap))
          }
          return p
        }, [])
        .map((item) => {
          // 是报表且是大图或便签
          const largeOrNote =
            (item.type === 2 && item.w === 12) || item.type === 1
          return {
            // noMove: true,
            ...item,
            // 重新定义mark字段
            mark: `grid-item-${item.businessId}${notAdd ? '' : '-add'}`,
            // 限制最大/小的高和宽
            minW: item.newW,
            maxW: item.newW,
            // 便签 回显用
            ...(item.type === 1 && {
              noteTitle: item.reportName,
              noteContent: item.reportDesc,
              noteId: item.reportId,
              // 要渲染的动态组件
              reportType: 'Note',
            }),
            minH: notAdd ? item.newH : item.h,
            maxH: notAdd ? item.newH : item.h,
            ...(notAdd && {
              // 不允许改变大小
              noResize: !largeOrNote,
              h: item.newH,
              ...(largeOrNote && {
                minH: item.type === 1 ? 1 : 4,
                maxH: 10,
              }),
            }),
          }
        })
        .sort((a, b) => {
          const ax = getSortNum(coordinate, a.businessId)
          const bx = getSortNum(coordinate, b.businessId)
          const ay = getSortNum(coordinate, a.businessId, 'y')
          const by = getSortNum(coordinate, b.businessId, 'y')
          return by - ay || ax - bx
        })
      console.log(state[whichKey], whichKey)
    } catch (e) {
      state[whichKey] = []
      state.selectedInfo = initVal().selectedInfo
    }
    state.loading = false
  }

  const getShareMemberList = async () => {
    const kanBanId = route.query.kanBanId
    if (!kanBanId) return
    const { data } = await asyncGetShareMemberList(kanBanId)
    state.shareList = markRaw(data)
  }

  const getSelectableApp = async () => {
    const { data } = await asyncGetSelectableApp()
    state.appList = data
    state.selectAppId = state.appList[0]?.appId
  }

  const reset = () => {
    Object.assign(state, initVal())
  }
  return {
    ...toRefs(state),
    reportAndNoteList,
    reset,
    getSelectableApp,
    getShareMemberList,
    getLeftKanBanInfo,
    resetSelectedInfo,
    asyncGetTagList,
    asyncGetNoteList,
    asyncGetReportList,
    getReportNoteDetails,
  }
})
