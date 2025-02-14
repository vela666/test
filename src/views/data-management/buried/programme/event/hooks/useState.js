import { reactive, ref, toRefs, watch } from 'vue'
import { delNullProperty } from '@/utils/dataProcessing'
import { debounce } from 'lodash-es'
import { ElMessage } from 'element-plus'
import { whitespaceRegex } from '@/utils/regExp'

import {
  asyncDelEvent,
  asyncSearchEventList,
} from '@/api/modules/programme/event.js'

import { useTipModal } from '@/components/TipDialog'

import { isObject } from '@/utils/types.js'
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

        exhibitLoading: false,

        // 页面数据总数
        pageTotal: 0,
      },
      filterConfig: {
        // 搜索事件名/显示名
        searchVal: '',
        // 分页器配置
        page: 1, // 当前页码
        size: 20, // 每页数量

        // 是否有配置属性
        configAttribute: '',
        // 排序方式:降序desc 升序asc
        sort: '',
        // 根据哪个字段排序
        sortFiled: '',
      },
    }
  }

  const state = reactive(initVal().state)
  const filterConfig = reactive(initVal().filterConfig)

  // 使用分页组件hooks

  const tableRef = ref(null)
  const customEventRef = ref(null)
  const viewEventAttrRef = ref(null)
  const viewConfigAttrRef = ref(null)
  const editCustomEventRef = ref(null)

  const editRow = (row) => {
    editCustomEventRef.value.open(row)
  }

  const delEvent = async (eventIds, cb) => {
    await asyncDelEvent({
      eventIds,
    }).finally((_) => {
      cb()
    })
    ElMessage.success(t('common.deleteSuccessfully'))
    getData()
  }

  const deleteRow = async (row) => {
    if (isObject(row)) {
      useTipModal({
        content: t('dataManagement.confirmDelete', [row.eventName]),
        iconType: 3,
        btnSwap: true,
        title: t('btn.delete'),
        // 传事件
        async onSubmit(cb) {
          delEvent([row.eventId], cb)
        },
      })
    } else {
      // row是函数 MetaData的batchDelFn方法
      delEvent(
        state.tableSelectedData.map((item) => item.eventId),
        row
      )
    }
  }

  const tableSortChange = ({ column, prop, order }) => {
    filterConfig.sort = order === 'ascending' ? 'asc' : !order ? '' : 'desc'
    filterConfig.sortFiled = order ? prop : ''
    getData()
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

  const getData = debounce(async (type) => {
    if (type && whitespaceRegex.test(filterConfig.searchVal)) return
    state.exhibitLoading = true
    const {
      data: { list, page },
    } = await asyncSearchEventList({
      ...delNullProperty(filterConfig),
    }).finally((_) => {
      state.exhibitLoading = false
    })
    state.pageTotal = page.totalCount
    state.pagedData = list
  }, 300)

  getData()

  const { searchVal, ...filterConfigArg } = toRefs(filterConfig)
  watch(
    () => filterConfigArg,
    (val) => {
      getData()
    },
    {
      deep: true,
    }
  )
  return {
    tableRef,
    customEventRef,
    viewEventAttrRef,
    viewConfigAttrRef,
    editCustomEventRef,
    state,
    filterConfig,
    editRow,
    deleteRow,
    getData,
    viewEventAttrFn,
    selectionChange,
    tableSortChange,
    viewConfigAttrFn,
  }
}
