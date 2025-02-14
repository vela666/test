import { watch, markRaw, reactive, ref, toRefs } from 'vue'
import { delNullProperty } from '@/utils/dataProcessing'
import { debounce } from 'lodash-es'
import { ElMessage } from 'element-plus'
import { whitespaceRegex } from '@/utils/regExp'
import { getUrlParams } from '@/utils'
import { paramKey } from '@/enumeration'
import {
  asyncGetUserAttrList,
  asyncDeleteAttr,
  asyncPublishUserAttr,
  asyncUpdateDisplay,
} from '@/api/modules/data-management/user'
import { useTipModal } from '@/components/TipDialog'
import { filteNotDisplayrDataTypeMap } from '@/enumeration/data-management/event-attr'
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
        otherParam: {
          // 是否显示用户归因按钮 true 显示 false 隐藏
          attributionButton: false,
          // 已添加属性数量/用户属性数上限
          attributeNum: '',
        },
      },
      filterConfig: {
        // 搜索属性名/显示名
        key: getUrlParams()?.[paramKey] ?? '',
        // 属性类型 1:预置属性 2:自定义属性 3:维度属性 4:虚拟属性
        eventType: '',
        // 是否有配置属性
        configAttribute: '',
        // 分页器配置
        page: 1, // 当前页码
        size: 20, // 每页数量
        // 发布状态，0未发布，1已发布，2不需要发布（维度属性和虚拟属性)
        fSync: '',
        // 数据类型 string 文本 double 数值 datetime 时间（日期）timestamp 时间（时间戳）boolean 布尔 array 数组
        fType: '',
        // 属性类型 1:预置属性 2:自定义属性 3:维度属性 4:虚拟属性
        type: '',
        // 是否有维度表，1：有，0：没有
        hasDimension: '',
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
    attribution(params) {
      attributionAttrRef.value.open()
    },
  }
  const state = reactive(initVal().state)
  const filterConfig = reactive(initVal().filterConfig)

  const tableRef = ref(null)
  const pasteRef = ref(null)
  const customAttrRef = ref(null)
  const publishAttrRef = ref(null)
  const virtualAttrRef = ref(null)
  const editCustomAttrRef = ref(null)
  const configDimensionRef = ref(null)
  const attributionAttrRef = ref(null)
  const operateVerifyDialogRef = ref(null)
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
    if (row.type === 2 && row.fSync === 1) {
      //已发布自定义属性
      operateVerifyDialogRef.value.open({
        title: t('dataManagement.deleteAttr'),
        verifyText: t('dataManagement.userAttr.sureDeleteAttr', [row.fEn]),
        content: t('dataManagement.userAttr.confirmDelPublihedAttr', [row.fEn]),
        async submit() {
          await asyncDeleteAttr({
            fidList: [row.fId],
          })
          getUserList()
          ElMessage.success(t('common.deleteSuccessfully'))
        },
      })
    } else {
      useTipModal({
        content: t('dataManagement.userAttr.confirmDeleteAttr', [row.fEn]),
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
          getUserList()
          ElMessage.success(t('common.deleteSuccessfully'))
        },
      })
    }
  }

  const switchChange = async (val, row) => {
    try {
      if (val === 1) {
        // 维度属性父级状态关闭是否包含子级
        const bool = !!row.dimensions?.length

        const content = bool
          ? t('dataManagement.confirmHideAttr1', [row.fEn])
          : t('dataManagement.confirmHideAttr2')

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
      getUserList()
    } catch (e) {
      row.hidden = val ? 0 : 1
    }
  }

  const tableSortChange = ({ column, prop, order }) => {
    filterConfig.sort = order === 'ascending' ? 'asc' : !order ? '' : 'desc'
    filterConfig.sortFiled = order ? prop : ''
    getUserList()
  }

  const selectionChange = (val) => {
    state.tableSelectedData = val
  }

  const publish = async (row) => {
    if (row) {
      if (!filteNotDisplayrDataTypeMap[row.newFtype]) {
        ElMessage.error('数据类型为空请更新后再发布！')
        return
      }
      useTipModal({
        content: `发布【${row.fEn}】属性后，不能编辑属性名、数据类型，确定发布吗？`,
        iconType: 3,
        btnSwap: true,
        title: '发布属性',
        // 传事件
        async onSubmit(cb) {
          await asyncPublishUserAttr({
            unpublishedUserPropertyList: [row],
          }).finally((_) => {
            cb()
          })
          getUserList()
          ElMessage.success('发布成功')
        },
      })
    } else {
      publishAttrRef.value.open()
    }
  }

  const configDimension = async (row) => {
    configDimensionRef.value.open(row)
  }

  const getUserList = debounce(async (type) => {
    if (type && whitespaceRegex.test(filterConfig.key)) return
    state.exhibitLoading = true
    const {
      data: {
        pageInfo: { list, page },
        ...reset
      },
    } = await asyncGetUserAttrList({
      ...delNullProperty(filterConfig),
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

  getUserList()

  const { key, ...filterConfigArg } = toRefs(filterConfig)

  watch(
    () => filterConfigArg,
    (val) => {
      getUserList()
    },
    {
      deep: true,
    }
  )
  return {
    // ...toRefs(state),
    pasteRef,
    tableRef,
    customAttrRef,
    publishAttrRef,
    virtualAttrRef,
    editCustomAttrRef,
    attributionAttrRef,
    configDimensionRef,
    operateVerifyDialogRef,
    state,
    filterConfig,
    buttonMethods,
    editRow,
    publish,
    deleteRow,
    showPaste,
    getUserList,
    switchChange,
    configDimension,
    selectionChange,
    // handleTableData,
    tableSortChange,
  }
}
