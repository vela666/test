import { t } from '@/locales/i18n'
import { getEnum } from '@/utils/dataProcessing'

export const attrTypeList = [
  { type: '1', label: t('dataManagement.presetAttributes'), notDisplay: true },
  {
    type: '2',
    label: t('dataManagement.customAttributes'), // 对应执行方法名
    mark: 'custom',
  },
  {
    type: '3',
    label: t('dataManagement.dimensionAttributes'),
    notDisplay: true,
  },
  { type: '4', label: t('dataManagement.virtualAttributes'), mark: 'virtual' },
]

export const attrTypeListMap = getEnum({
  data: attrTypeList,
})

// 事件管理 下面的virtualTypeList字段截取前5个
export const dataTypeList = [
  { type: 'string', label: t('common.text'), dimension: true, virtual: true },
  {
    type: 'datetime',
    label: t('common.timeDate'),
    virtual: true,
    regExp: /^(\d{4})-(\d{2})-(\d{2})$/,
  },
  {
    type: 'timestamp',
    label: t('dataManagement.timeTimestamp'),
    virtual: true,
    regExp: /^\d{10}$/,
  },
  { type: 'boolean', virtual: true, label: t('dataManagement.boolean') },
  { type: 'array', label: t('dataManagement.array') },
  // 支持整数或小数
  // { type: 'double', virtual: true, label: '数值', regExp: /^\d+(\.\d+)?$/ },
  {
    type: 'double',
    virtual: true,
    label: t('dataManagement.numeral'),
    // 整数15位，包含小数点16位
    regExp: {
      test(value) {
        // 计算输入字符串的长度
        const length = value.length
        // 统一验证条件
        if (/^\d{1,15}(\.\d{1,15})?$/.test(value)) {
          // 如果输入是整数或小数，且长度在允许范围内
          return length <= 15 || length <= 16
        }
      },
    },

    // regExp: /^(?:\d{1,15}|\d{1,14}\.\d{1,1})$/,
  },
  // {type: 'numeric', label: '数值（小数）'},
  {
    type: 'int',
    label: t('dataManagement.numeralInteger'),
    notShow: true,
    dimension: true,
    regExp: /^\d+$/,
  },
  {
    type: 'double_0',
    label: t('dataManagement.numeralInteger'),
    regExp: /^\d+$/,
    notShow: true,
    notDisplay: true,
  },
  {
    type: 'double_1',
    label: t('dataManagement.numeralDecimal', [1]),
    notShow: true,
    dimension: true,
    regExp: /^\d+(\.\d{1})?$/,
  },
  {
    type: 'double_2',
    label: t('dataManagement.numeralDecimal', [2]),
    notShow: true,
    dimension: true,
    regExp: /^\d+(\.\d{1,2})?$/,
  },
  {
    type: 'double_3',
    label: t('dataManagement.numeralDecimal', [3]),
    notShow: true,
    dimension: true,
    regExp: /^\d+(\.\d{1,3})?$/,
  },
  {
    type: 'double_4',
    label: t('dataManagement.numeralDecimal', [4]),
    notShow: true,
    dimension: true,
    regExp: /^\d+(\.\d{1,4})?$/,
  },
  {
    type: 'double_5',
    label: t('dataManagement.numeralDecimal', [5]),
    notShow: true,
    dimension: true,
    regExp: /^\d+(\.\d{1,5})?$/,
  },
  {
    type: 'double_6',
    label: t('dataManagement.numeralDecimal', [6]),
    notShow: true,
    dimension: true,
    regExp: /^\d+(\.\d{1,6})?$/,
  },
]

export const virtualTypeList = dataTypeList.filter((item) => item.virtual)

export const filterDimensionDataType = dataTypeList.filter(
  (item) => item.dimension
)

export const dataTypeListMap = getEnum({
  data: dataTypeList,
})

export const filteNotDisplayrDataTypeMap = getEnum({
  data: dataTypeList.filter((item) => !item.notDisplay),
})

export const filterDimensionDataTypetMap = getEnum({
  data: filterDimensionDataType,
  needObjValue: true,
})

export const dataTypeObjMap = getEnum({
  data: dataTypeList,
  needObjValue: true,
})
