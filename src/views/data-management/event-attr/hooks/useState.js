import { watch, markRaw, reactive, ref, toRefs } from 'vue'
import { delNullProperty } from '@/utils/dataProcessing'
import { debounce } from 'lodash-es'
import { ElMessage } from 'element-plus'
import { whitespaceRegex } from '@/utils/regExp'
import { getUrlParams } from '@/utils'
import { paramKey } from '@/enumeration'
import {
  asyncDeleteAttr,
  asyncGetEventAttrList,
  asyncPublishEventAttr,
  asyncUpdateDisplay,
} from '@/api/modules/data-management/event-attr'

import { useTipModal } from '@/components/TipDialog'
import { filteNotDisplayrDataTypeMap } from '@/enumeration/data-management/event-attr'
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
          // 已添加属性数量/事件数上限
          attributeNum: '',
        },
      },
      filterConfig: {
        // 搜索属性名/显示名
        key: getUrlParams()?.[paramKey] ?? '',
        // 属性类型 1:预置属性 2:自定义属性 3:维度属性 4:虚拟属性
        type: '',
        // 是否有配置属性
        configAttribute: '',
        // 分页器配置
        page: 1, // 当前页码
        size: 20, // 每页数量
        // 发布状态，0未发布，1已发布，2不需要发布（维度属性和虚拟属性)
        fSync: '',
        // 数据类型 string 文本 double 数值 datetime 时间（日期）timestamp 时间（时间戳）boolean 布尔 array 数组
        fType: '',
        // 事件属性是否绑定了所有的事件(全局事件属性) true 是 false 否
        bindEvent: false,
        // 事件属性是否自动关联新事件 true 是 false 否
        relevance: false,
        // 是否有配置事件，1：已配置，2：未配置
        hasConfigEvent: '',
        // 是否有维度表，1：有，0：没有
        hasDimension: '',
        // 是否有预设值，1：有，0：没有
        hasPresetValue: '',
        // 显示状态（0 显示，1 隐藏 ）
        hidden: '',
        // 排序方式:降序desc 升序asc
        sort: '',
        // 根据哪个字段排序
        sortFiled: '',
      },
    }
  }

  const buttonMethods = {
    custom() {
      customAttrRef.value.open()
    },
    virtual(params) {
      virtualAttrRef.value.open(params)
    },
  }
  const state = reactive(initVal().state)
  const filterConfig = reactive(initVal().filterConfig)

  const tableRef = ref(null)
  const pasteRef = ref(null)
  const ViewEventRef = ref(null)
  const customAttrRef = ref(null)
  const publishAttrRef = ref(null)
  const presetValueRef = ref(null)
  const virtualAttrRef = ref(null)
  const editCustomAttrRef = ref(null)
  const viewConfigEventRef = ref(null)
  const configDimensionRef = ref(null)

  const showPaste = (data) => {
    pasteRef.value.open(data)
  }

  const editRow = (row) => {
    if (row.type === 4) {
      buttonMethods.virtual(row)
    } else {
      editCustomAttrRef.value.open(row)
    }
  }

  const deleteRow = (row) => {
    useTipModal({
      content: t('dataManagement.eventAttr.confirmDeleteAttr', [row.fEn]),
      iconType: 3,
      btnSwap: true,
      title: t('dataManagement.deleteAttr'),
      // 传事件
      async onSubmit(cb) {
        await asyncDeleteAttr({
          fidList: [row.fId],
        }).finally((_) => {
          cb()
        })
        getEventList()
        ElMessage.success(t('common.deleteSuccessfully'))
      },
    })
  }

  const switchChange = async (val, row) => {
    try {
      if (val === 1) {
        // 维度属性父级状态关闭是否包含子级
        const bool = !!row.dimensionList?.length

        const content = bool
          ? t('dataManagement.confirmHideAttr1', [row.fEn])
          : t('dataManagement.confirmHideAttr2')
        // `隐藏【${
        //   row.fEn
        // }】属性会导致分析模型中使用了此属性的报表展示异常，${
        //   bool ? '且与此属性关联的子属性将会失效，' : ''
        // }确定隐藏吗？`

        await useTipModal({
          content,
          iconType: 3,
          needLoading: false,
          btnSwap: true,
          title: t('dataManagement.hideAttributes'),
        })
      }

      await asyncUpdateDisplay({
        fId: row.fId,
        hiddenStatus: val,
      })
      ElMessage.success(
        `${val === 0 ? t('dataManagement.displaySuccessfully') : t('dataManagement.hideSuccessfully')}`
      )
      getEventList()
    } catch (e) {
      row.hidden = val ? 0 : 1
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

  const publish = async (row) => {
    if (row) {
      if (!filteNotDisplayrDataTypeMap[row.newFtype]) {
        ElMessage.error(t('dataManagement.eventAttr.confirmDataTypePublish'))
        return
      }
      useTipModal({
        content: t('dataManagement.confirmPublishAttr', [row.fEn]),
        iconType: 3,
        btnSwap: true,
        title: t('dataManagement.eventAttr.publishAttributes'),
        // 传事件
        async onSubmit(cb) {
          await asyncPublishEventAttr({
            unpublishedEventPropertyList: [row],
          }).finally((_) => {
            cb()
          })
          getEventList()
          ElMessage.success(t('dataManagement.publishedSuccessfully'))
        },
      })
    } else {
      publishAttrRef.value.open()
    }
  }

  // 打开当前属性名的列表
  const viewEventFn = (row) => {
    ViewEventRef.value.open(row)
  }

  const viewConfigEventFn = (row) => {
    viewConfigEventRef.value.open(row)
  }

  const configDimension = async (row) => {
    configDimensionRef.value.open(row)
  }

  const configPresetValue = async (row) => {
    presetValueRef.value.open(row)
  }

  const getEventList = debounce(async (type) => {
    if (type && whitespaceRegex.test(filterConfig.key)) return
    state.exhibitLoading = true
    const {
      data: {
        pageInfo: { list, page },
        ...reset
      },
    } = await asyncGetEventAttrList({
      ...delNullProperty(filterConfig),
      relevance: filterConfig.relevance ? 1 : 0,
    }).finally((_) => {
      state.exhibitLoading = false
    })
    state.otherParam = markRaw(reset)
    state.pageTotal = page.totalCount
    state.pagedData = list.map((item) => {
      const children = item.dimensionList.map((sub) => {
        return {
          ...sub,
          newFtype:
            sub.fType === 'double' && sub.fLen
              ? `${sub.fType}_${sub.fLen}`
              : sub.fType,
        }
      })
      return {
        ...item,
        children,
        newFtype:
          item.fType === 'double' && item.fLen
            ? `${item.fType}_${item.fLen}`
            : item.fType,
      }
    })
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
    ViewEventRef,
    customAttrRef,
    publishAttrRef,
    presetValueRef,
    virtualAttrRef,
    editCustomAttrRef,
    viewConfigEventRef,
    configDimensionRef,
    state,
    filterConfig,
    buttonMethods,
    editRow,
    publish,
    deleteRow,
    showPaste,
    viewEventFn,
    getEventList,
    switchChange,
    configDimension,
    selectionChange,
    // handleTableData,
    tableSortChange,
    configPresetValue,
    viewConfigEventFn,
  }
}
