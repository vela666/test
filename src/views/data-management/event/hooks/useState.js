import { watch, markRaw, reactive, ref, toRefs, computed } from 'vue'
import { delNullProperty } from '@/utils/dataProcessing'
import { debounce } from 'lodash-es'
import { ElMessage } from 'element-plus'
import { whitespaceRegex } from '@/utils/regExp'
import { getUrlParams } from '@/utils'
import { paramKey } from '@/enumeration'
import useEventStore from '@/store/modules/event.js'

import {
  asyncDeleteEvent,
  asyncGetEventList,
  asyncUpdateEventState,
} from '@/api/modules/data-management/event'

import { useTipModal } from '@/components/TipDialog'
import { t } from '@/locales/i18n'

export default function () {
  const initVal = () => {
    return {
      state: {
        pagedData: [],
        tableAllData: [],
        // 复选框选中的数据
        tableSelectedData: [],
        addOrEditDialog: false,
        viewMembersDialog: false,
        formData: {
          roleId: '',
          roleName: '',
          autoJoinSwitch: false,
          description: '',
          authMenuList: [],
        },

        exhibitLoading: false,

        // 页面数据总数
        pageTotal: 0,
        otherParam: {
          // 是否显示广告事件按钮 true 显示 false 隐藏
          adButton: false,
          // 是否显示内购事件按钮 true 显示 false 隐藏
          iapButton: false,
        },
      },
      filterConfig: {
        // 搜索事件名/显示名
        key: getUrlParams()?.[paramKey] ?? '',
        // 事件类型(1自定义事件，2预置事件, 3虚拟事件)
        eventType: '',
        // 0显示 1隐藏
        eventState: '',
        // 是否有配置属性
        configAttribute: '',
        // 分页器配置
        page: 1, // 当前页码
        size: 20, // 每页数量

        // 排序方式:降序desc 升序asc
        sort: '',
        // 根据哪个字段排序
        sortFiled: '',
      },
    }
  }

  const buttonMethods = {
    custom() {
      customEventRef.value.open()
    },
    virtual(params) {
      virtualEventRef.value.open(params)
    },
    InsourcingAndAd(params) {
      insourcingAndAdRef.value.open(params)
    },
  }
  const state = reactive(initVal().state)
  const filterConfig = reactive(initVal().filterConfig)

  // 使用分页组件hooks

  const tableRef = ref(null)
  const pasteRef = ref(null)
  const customEventRef = ref(null)
  const virtualEventRef = ref(null)
  const viewEventAttrRef = ref(null)
  const viewConfigAttrRef = ref(null)
  const editCustomEventRef = ref(null)
  const insourcingAndAdRef = ref(null)

  const eventStore = useEventStore()

  const showPaste = (data) => {
    pasteRef.value.open(data)
  }

  const editRow = (row) => {
    if (row.eventType === 3) {
      buttonMethods.virtual(row)
    } else {
      editCustomEventRef.value.open(row)
    }
  }

  const fectchEventData = async () => {
    getEventList()
    await eventStore.getEventsAbout(sessionStorage.getItem('appId'))
  }

  const deleteRow = (row) => {
    const content =
      row.eventType === 3
        ? t('dataManagement.event.confirmDeleteVirtual', [row.eventName])
        : t('dataManagement.event.confirmDeleteEvent', [row.eventName])
    useTipModal({
      content,
      iconType: 3,
      btnSwap: true,
      title: t('dataManagement.event.deleteEvent'),
      // 传事件
      async onSubmit(cb) {
        await asyncDeleteEvent({
          eventIdList: [row.eventId],
        }).finally((_) => {
          cb()
        })
        fectchEventData()
        ElMessage.success(t('common.deleteSuccessfully'))
      },
    })
  }

  const switchChange = async (row) => {
    try {
      if (row.eventState === 1) {
        const content = t('dataManagement.event.confirmHideEvent', [
          row.eventName,
        ])
        await useTipModal({
          content,
          iconType: 3,
          needLoading: false,
          btnSwap: true,
          title: t('dataManagement.hiddenEvents'),
        })
      }

      await asyncUpdateEventState({
        eventId: row.eventId,
        eventState: row.eventState,
      })
      ElMessage.success(
        `${row.eventState === 0 ? t('dataManagement.displaySuccessfully') : t('dataManagement.hideSuccessfully')}`
      )
      fectchEventData()
    } catch (e) {
      row.eventState = row.eventState === 0 ? 1 : 0
    }
  }

  const tableSortChange = ({ column, prop, order }) => {
    filterConfig.sort = order === 'ascending' ? 'asc' : !order ? '' : 'desc'
    filterConfig.sortFiled = order ? prop : ''
    getEventList()
  }

  const selectionChange = (val) => {
    state.tableSelectedData = val
  }

  // 打开当前事件的属性列表
  const viewEventAttrFn = (row) => {
    viewEventAttrRef.value.open(row)
  }

  const viewConfigAttrFn = (row) => {
    viewConfigAttrRef.value.open(row)
  }

  /*  const handleTableData = () => {
    const eventStatusHasVal = !Number.isInteger(filterConfig.eventState)
    const eventTypeHasVal = !Number.isInteger(filterConfig.eventType)
    const configAttrHasVal = !Number.isInteger(filterConfig.configAttribute)
    const eventName = filterConfig.key.toLocaleLowerCase()

    const data = state.tableAllData.filter((item) => {
      const search = (item.eventName + '' + item.eventNameZh)
        .toLocaleLowerCase()
        .includes(eventName)

      const isEventStatus =
        eventStatusHasVal || item.eventState === filterConfig.eventState

      const isEventType =
        eventTypeHasVal || item.eventType === filterConfig.eventType

      let isConfigAttr = configAttrHasVal
      if (!configAttrHasVal) {
        // 过滤未配置
        if (filterConfig.configAttribute === 2 && item.fieldCount === 0) {
          isConfigAttr = true
        }
        // 过滤已配置且或虚拟
        if (
          filterConfig.configAttribute === 1 &&
          (item.fieldCount !== 0 || item.eventType === 3)
        ) {
          isConfigAttr = true
        }
      }
      return search && isEventStatus && isEventType && isConfigAttr
    })

    state.pageTotal = data.length
    state.pagedData = markRaw(
      slicePagingData(data, filterConfig.page, filterConfig.pageSize)
    )

    if (state.orderBy && state.orderType) {
      nextTick(() => {
        tableRef.value?.sort(state.orderBy, state.orderType)
      })
    }
  }*/

  const getEventList = debounce(async (type) => {
    if (type && whitespaceRegex.test(filterConfig.key)) return
    state.exhibitLoading = true
    const {
      data: {
        pageInfo: { list, page },
        ...reset
      },
    } = await asyncGetEventList({
      ...delNullProperty(filterConfig),
    }).finally((_) => {
      state.exhibitLoading = false
    })
    state.otherParam = markRaw(reset)
    state.pageTotal = page.totalCount
    state.pagedData = list
    /*  state.tableAllData = list
    handleTableData()*/
  }, 300)

  getEventList()

  const { key, ...filterConfigArg } = toRefs(filterConfig)
  watch(
    () => filterConfigArg,
    (val) => {
      getEventList()
    },
    {
      deep: true,
    }
  )
  return {
    // ...toRefs(state),
    pasteRef,
    tableRef,
    customEventRef,
    virtualEventRef,
    viewEventAttrRef,
    viewConfigAttrRef,
    insourcingAndAdRef,
    editCustomEventRef,
    state,
    filterConfig,
    buttonMethods,
    editRow,
    deleteRow,
    showPaste,
    getEventList,
    switchChange,
    viewEventAttrFn,
    selectionChange,
    // handleTableData,
    tableSortChange,
    viewConfigAttrFn,
    fectchEventData,
  }
}
