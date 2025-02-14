import { watch, markRaw, reactive, ref, toRefs } from 'vue'
import { useRouter } from 'vue-router'
import { delNullProperty } from '@/utils/dataProcessing'
import { debounce } from 'lodash-es'
import { ElMessage } from 'element-plus'
import { getUrlParams } from '@/utils'
import { paramKey } from '@/enumeration'
import { useTipModal } from '@/components/TipDialog'
import { asyncGetGroupList } from '@/api/modules/user-group'

export default function () {
  const router = useRouter()
  const initVal = () => {
    return {
      state: {
        pagedData: [],
        addOrEditDialog: false,

        exhibitLoading: false,
        defaultGroup: {},
        // 页面数据总数
        pageTotal: 0,
      },
      filterConfig: {
        // 搜索分群名、显示名、备注
        fuzzySearchKey: getUrlParams()?.[paramKey] ?? '',
        // 仅看我创建的
        viewOnlyMyCreate: false,
        // 更新方式 0为手动更新 1为自动更新 2不更新
        refreshType: '',
        // 创建类型 1表示条件分群 2 表示id分群 3表示结果分群  8 sql用户分群
        createType: '',
        // 排序字段名
        sortFieldList: [],
        // 排序类型，要和排序字段名一一对应，正序：asc , 逆序：desc
        sortTypeList: [],
        // 分页器配置
        page: 1, // 当前页码
        size: 20, // 每页数量
      },
    }
  }

  const state = reactive(initVal().state)
  const filterConfig = reactive(initVal().filterConfig)

  const tableRef = ref(null)
  const idGroupRef = ref(null)
  const sqlGroupRef = ref(null)
  const conditionGroupRef = ref(null)

  const goRoute = (row) => {
    router.push(
      `/user/group-data-detail?id=${row.id}&createType=${row.createType}`
    )
  }

  const tableSortChange = ({ column, prop, order }) => {
    filterConfig.sortTypeList = [
      order === 'ascending' ? 'asc' : !order ? '' : 'desc',
    ].filter(Boolean)
    filterConfig.sortFieldList = [order ? prop : ''].filter(Boolean)
    getList()
  }

  const searchDefault = () => {
    filterConfig.fuzzySearchKey = state.defaultGroup.displayName
    getList('search')
  }

  const getList = debounce(async (type) => {
    if (type && /^\s+$/.test(filterConfig.fuzzySearchKey)) return
    state.exhibitLoading = true
    const {
      data: { list, page, other },
    } = await asyncGetGroupList({
      ...delNullProperty(filterConfig),
    }).finally((_) => {
      state.exhibitLoading = false
    })
    state.pageTotal = page.totalCount
    state.defaultGroup = other || {}
    state.pagedData = list.map((item) => {
      return {
        ...item,
        // 操作更新时
        isRefresh: false,
      }
    })
  }, 300)

  getList()

  const { fuzzySearchKey, ...filterConfigArg } = toRefs(filterConfig)

  watch(
    () => filterConfigArg,
    (val) => {
      getList()
    },
    {
      deep: true,
    }
  )
  return {
    tableRef,
    state,
    filterConfig,
    goRoute,
    getList,
    searchDefault,
    tableSortChange,
  }
}
