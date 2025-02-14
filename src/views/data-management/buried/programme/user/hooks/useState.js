import { watch, reactive, ref, toRefs } from 'vue'
import { delNullProperty } from '@/utils/dataProcessing'
import { debounce } from 'lodash-es'
import { ElMessage } from 'element-plus'
import { whitespaceRegex } from '@/utils/regExp'
import { useTipModal } from '@/components/TipDialog'
import { isObject } from '@/utils/types.js'
import { asyncDelField } from '@/api/modules/programme/common.js'
import { asyncSearchUserFieldList } from '@/api/modules/programme/user.js'
import { t } from '@/locales/i18n'

export default function () {
  const initVal = () => {
    return {
      state: {
        pagedData: [],
        // 复选框选中的数据
        tableSelectedData: [],
        exhibitLoading: false,
        // 页面数据总数
        pageTotal: 0,
      },
      filterConfig: {
        // 搜索属性名/显示名
        searchVal: '',
        // 是否有配置属性
        // configAttribute: '',
        // 分页器配置
        page: 1, // 当前页码
        size: 20, // 每页数量
        /*  // 数据类型 string 文本 double 数值 datetime 时间（日期）timestamp 时间（时间戳）boolean 布尔 array 数组
        fType: '',
        // 属性类型 1:预置属性 2:自定义属性 3:维度属性 4:虚拟属性
        type: '',
        // 排序方式:降序desc 升序asc
        sort: '',
        // 根据哪个字段排序
        sortFiled: '',*/
      },
    }
  }

  const state = reactive(initVal().state)
  const filterConfig = reactive(initVal().filterConfig)

  const tableRef = ref(null)
  const customAttrRef = ref(null)
  const editCustomAttrRef = ref(null)

  const editRow = (row) => {
    editCustomAttrRef.value.open(row)
  }
  const delEvent = async (fieldIds, cb) => {
    await asyncDelField({
      fieldIds,
    }).finally((_) => {
      cb()
    })
    getData()
    ElMessage.success(t('common.deleteSuccessfully'))
  }
  const deleteRow = (row) => {
    if (isObject(row)) {
      useTipModal({
        content: t('dataManagement.confirmDelete', [row.fEn]),
        iconType: 3,
        btnSwap: true,
        title: t('btn.delete'),
        // 传事件
        async onSubmit(cb) {
          delEvent([row.fId], cb)
        },
      })
    } else {
      delEvent(
        state.tableSelectedData.map((item) => item.fId),
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

  const getData = debounce(async (type) => {
    if (type && whitespaceRegex.test(filterConfig.searchVal)) return
    state.exhibitLoading = true
    const {
      data: { list, page },
    } = await asyncSearchUserFieldList({
      ...delNullProperty(filterConfig),
    }).finally((_) => {
      state.exhibitLoading = false
    })

    state.pageTotal = page.totalCount
    state.pagedData = list.map((item) => {
      return {
        ...item,
        newFtype:
          item.fType === 'double' && item.fLen
            ? `${item.fType}_${item.fLen}`
            : item.fType,
      }
    })
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
    customAttrRef,
    editCustomAttrRef,
    state,
    filterConfig,
    editRow,
    deleteRow,
    getData,
    selectionChange,
    tableSortChange,
  }
}
