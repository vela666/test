<template>
  <CommonDrawer
    @submit="submit"
    @close="close"
    :loading="state.operateLoading"
    v-model="state.showOperate"
    :title="$t('dataManagement.dimensionTable')"
    size="1000px"
    class="nd-dimensions">
    <div class="c545e6e fz14 flex-center gap20 mb20">
      <div>
        {{ $t('dataManagement.attributeName') }}：{{ state.rowData.fEn }}
      </div>
      <div>{{ $t('dataManagement.displayName') }}：{{ state.rowData.fZh }}</div>
    </div>
    <CommonUpload
      ref="commonUploadRef"
      :on-exceed="clearFiles"
      :show-file-list="false"
      @change="handelUploadFile">
      <template #desc>
        <div class="c86919d">
          {{ $t('dataManagement.supportFileExtensions') }}.xls / .xlsx
        </div>
        <div class="c86919d">
          {{ $t('dataManagement.clickDownloadTemplate')
          }}<a
            @click.stop
            target="_blank"
            class="c5473e8"
            :href="externalUrl.dimensionTable"
            >{{ $t('dataManagement.eventAttr.dimensionTableTemplate') }}</a
          >
          <a
            class="c5473e8 ml10"
            @click.stop
            :href="externalUrl.dimensionTableTip"
            target="_blank">
            {{ $t('dataManagement.operatingInstructions') }}
          </a>
        </div>
      </template>
    </CommonUpload>

    <template v-if="!!state.formData.dimensionList.length">
      <div class="flex-center flex-between mb10">
        <div>
          <span class="c545e6e flex-align-self-end fz14 txt-bold">
            {{ $t('dataManagement.tableStructure') }}
          </span>
          <Tooltip>
            <SvgIcon class="ml5 c545e6e" name="help2" />
            <template #content>
              {{ $t('dataManagement.eventAttr.filedRulesTips') }}
            </template>
          </Tooltip>
        </div>
        <div>
          <el-button @click="exportDimension" class="mt20 mb10">
            <SvgIcon class="mr5 fz16" name="download" />
            {{ $t('common.download') }}
          </el-button>
          <el-button @click="clearDimension" class="mt20 mb10">
            <SvgIcon class="mr5" name="delete1" />
            {{ $t('dataManagement.eventAttr.clearDimensionTable') }}
          </el-button>
        </div>
      </div>

      <el-form label-position="top" ref="formRef" :model="state.formData">
        <div class="flex gap10">
          <div class="nd-serial-number">
            <div
              v-for="item of state.formData.dimensionList.length"
              :key="item">
              <div class="nd-active-bg fz28">
                <span class="fz14 c545e6e">{{ item }}</span>
              </div>
            </div>
          </div>
          <div
            class="flex-column"
            v-for="column of columnMap"
            :key="column.prop">
            <el-form-item
              v-for="(item, index) of state.formData.dimensionList"
              :key="index"
              :label="!index ? column.label : ''"
              :prop="`dimensionList.${index}.${column.prop}`"
              :rules="[
                ...column.rules,
                column.validator
                  ? {
                      validator: (rule, value, callback) =>
                        column.validator(index, column.prop, value, callback),
                      trigger,
                    }
                  : {},
              ]"
              class="mt5">
              <component
                class="w270 mr10"
                :clearable="false"
                :prefixSlot="false"
                :trimAllSpace="column.prop !== 'fZh'"
                :disabled="index === 0"
                :maxlength="column.max"
                show-word-limit
                :index="index"
                @blur="tableStructureBlurOperation(column.prop, index)"
                :desc="$t('common.pleaseEnter')"
                v-model="item[column.prop]"
                :is="column.component || CommonInput" />
            </el-form-item>
          </div>
          <div
            class="nd-serial-number"
            v-if="state.formData.dimensionList.length > 2">
            <div
              v-for="(item, index) of state.formData.dimensionList.length"
              :key="item">
              <el-button
                text
                :disabled="index === 0"
                @click="deleteTableStructureRow(index)"
                class="nd-operate-btn-active fz28 p0">
                <SvgIcon
                  :class="['fz16', index !== 0 ? 'c86919d' : '']"
                  name="delete1" />
              </el-button>
            </div>
          </div>
        </div>
        <el-button
          @click="addTableStructureRow"
          class="mt10 mb20"
          type="primary"
          text
          >+
          {{ $t('dataManagement.eventAttr.addFields') }}
        </el-button>
        <div>
          <span style="align-self: flex-end" class="c545e6e fz14 txt-bold">
            <!-- 数据预览（系统已存数据量：{{ state.dataListCount }}，当前数据量：{{
              state.formData.dataList.length
            }}） -->

            {{
              $t('dataManagement.eventAttr.dataPreviewNum', [
                state.dataListCount,
                state.formData.dataList.length,
              ])
            }}
          </span>
          <vxe-table
            border
            ref="vxeTableRef"
            class="nd-vxe-table-custom skip"
            max-height="400"
            auto-resize
            show-header-overflow
            :row-config="{ isHover: true }"
            :column-config="{ resizable: true }"
            :data="state.formData.dataList"
            :scroll-y="{ enabled: true }"
            :scroll-x="{ enabled: true }">
            <vxe-column title=" " align="center" type="seq" width="55" />
            <vxe-column
              v-for="(column, index) of state.formData.dimensionList"
              :key="index"
              min-width="200">
              <template #header>
                <div v-showTips class="c1c2028">{{ column.fEn }}</div>
                <div v-showTips class="c86919d">{{ column.fZh }}</div>
              </template>
              <template #default="{ row, rowIndex }">
                <el-form-item
                  :prop="`dataList.${rowIndex}.${index}.val`"
                  :rules="[
                    {
                      validator: (rule, value, callback) =>
                        dataPreviewValidator(index, value, callback),
                      trigger,
                    },
                  ]"
                  class="mt5">
                  <CommonInput
                    v-if="row[index]"
                    class="mr10"
                    :prefixSlot="false"
                    trimAllSpace
                    :maxlength="
                      state.formData.dimensionList[index]?.fType === 'string'
                        ? 255
                        : 50
                    "
                    show-word-limit
                    :desc="$t('common.pleaseEnter')"
                    @blur="validateForm(dataPreviewValidateKeys(index))"
                    v-model="row[index].val" />
                </el-form-item>
              </template>
            </vxe-column>
            <vxe-column
              align="center"
              fixed="right"
              width="80"
              :title="$t('common.operate')">
              <template #default="{ rowIndex }">
                <div class="mt5">
                  <el-button
                    @click="deleteDataPreviewRow(rowIndex)"
                    style="height: 86px"
                    class="nd-operate-btn-active fz28"
                    text>
                    <SvgIcon name="delete1" class="fz16 c86919d" />
                  </el-button>
                </div>
              </template>
            </vxe-column>
          </vxe-table>
          <el-button
            @click="addDataPreviewRow"
            class="mt10 mb20"
            type="primary"
            text
            >+{{ $t('dataManagement.addRow') }}</el-button
          >
        </div>
      </el-form>
    </template>
  </CommonDrawer>
</template>

<script setup>
import { nextTick, markRaw, reactive, ref, h, computed } from 'vue'
import { ElMessage, ElSelect, ElOption } from 'element-plus'
import { analysisExcel, exportToExcel } from '@/utils/excel'
import { customDataSort } from '@/utils/dataProcessing.js'
import { alphanumericWithUnderscoreRegex } from '@/utils/regExp'
import {
  filterArraySpecifiedKey,
  differenceByIndex,
} from '@/utils/dataProcessing'
import { debounce, cloneDeep, isBoolean, isEmpty } from 'lodash-es'
import {
  dataTypeList,
  dataTypeObjMap,
  filterDimensionDataType,
  filterDimensionDataTypetMap,
} from '@/enumeration/data-management/event-attr'
import CommonInput from '@/components/CommonInput/index.vue'
import { externalUrl } from '@/enumeration'
import { asyncDimensionSave } from '@/api/modules/data-management/common'
import { useTipModal } from '@/components/TipDialog'
import { getSelectDimensionDataList } from '@/api/modules/data-management/event-attr.js'
import { t } from '@/locales/i18n'

const props = defineProps({
  // 1是事件属性 2是用户属性
  type: {
    type: String,
    default: '1',
  },
})

const initVal = () => {
  return {
    columns: [],
    rowData: {},
    operateLoading: false,
    showOperate: false,
    dataListCount: 0,
    formData: {
      dimensionList: [],
      dataList: [],
      // 事件属性表
      dimTableType: +props.type,
      // 操作类型 1 新增维度 2 编辑维度
      operateType: 1,
    },
  }
}

const trigger = ['blur', 'change']

const columnMap = [
  {
    label: t('dataManagement.fieldName'),
    prop: 'fEn',
    rules: [
      {
        required: true,
        message: t('dataManagement.eventAttr.fieldRules'),
        trigger,
      },
      {
        validator: (rule, value, callback) => {
          const val = value + ''
          if (val.length > 50) {
            callback(new Error(t('dataManagement.upToCharacters', [50])))
            return
          }
          if (!alphanumericWithUnderscoreRegex.test(val)) {
            callback(new Error(t('dataManagement.eventAttr.fieldRules')))
            return
          }
          const verifyPrefix = new RegExp(`^${state.rowData.fEn}__`)
          let bool =
            state.formData.dimensionList.filter(
              (item) =>
                val.replace(verifyPrefix, '').toLowerCase() ===
                item.fEn.replace(verifyPrefix, '').toLowerCase()
            ).length > 1

          if (bool) {
            callback(new Error(t('dataManagement.duplicateFieldVame')))
            return
          }
          callback()
        },
        trigger,
      },
      // { min: 1, max: 50, message: '最多50字符', trigger },
    ],
    validator: (index, prop, value, callback) => {
      if (index === 0 && value !== state.rowData.fEn) {
        callback(new Error(t('dataManagement.eventAttr.fieldWithAttrRules')))
        return
      }
      callback()
    },
    max: 50,
  },
  {
    label: t('dataManagement.displayName'),
    prop: 'fZh',
    rules: [
      {
        required: true,
        message: t('common.pleaseEnter'),
        trigger,
      },
      {
        validator: (rule, value, callback) => {
          const val = value + ''
          if (val.length > 50) {
            callback(new Error(t('dataManagement.upToCharacters', [50])))
            return
          }
          /* if (/\s/g.test(val)) {
            callback(new Error(`显示名不能包含空格`))
            return
          }*/
          let bool =
            state.formData.dimensionList.filter(
              (item) => val.toLowerCase() === item.fZh.toLowerCase()
            ).length > 1
          if (bool) {
            callback(new Error(t('dataManagement.duplicateDisplayVame')))
            return
          }
          callback()
        },
        trigger,
      },
      // { min: 1, max: 50, message: '最多50字符', trigger },
    ],
    max: 50,
  },
  {
    label: t('dataManagement.dataType'),
    prop: 'fType',
    rules: [
      {
        required: true,
        message: t('dataManagement.pleaseSelectDynamic', [
          t('dataManagement.dataType'),
        ]),
        trigger,
      },
    ],
    component: (props) => {
      const list = props.index === 0 ? dataTypeList : filterDimensionDataType
      return h(ElSelect, { ...props }, () =>
        list.map((item) => {
          return h(ElOption, { label: item.label, value: item.type })
        })
      )
    },
  },
  /*
  {
    label: '单位',
    prop: 'fUnit',
    rules: [
      {
        validator: (rule, value, callback) => {
          if ((value + '').trim().length > 20) {
            callback(new Error(`最多20字符`))
            return
          }
          callback()
        },
        trigger,
      },
      // { min: 0, max: 200, message: '最多200字符', trigger },
    ],
    max: 20,
  },
  {
    label: '描述',
    prop: 'fDesc',
    rules: [
      {
        validator: (rule, value, callback) => {
          if ((value + '').trim().length > 200) {
            callback(new Error(`最多200字符`))
            return
          }
          callback()
        },
        trigger,
      },
      // { min: 0, max: 200, message: '最多200字符', trigger },
    ],
    max: 200,
  },*/
]

const dataPreviewValidator = (index, value, callback) => {
  /*  if (index === 0) {
    // 只保留当前列的
    const bool =
      state.formData.dataList
        .map((sub) => sub.filter((item, subIndex) => subIndex === index))
        .filter((item) => {
          return item[0].val + '' === value + ''
        }).length > 1

    if (bool) {
      if (callback) {
        callback(new Error(t('dataManagement.eventAttr.contentDuplicate')))
        return
      } else {
        return t('dataManagement.eventAttr.contentDuplicate')
      }
    }
  }*/
  const type = state.formData.dimensionList[index].fType
  if ((value + '').trim()) {
    if (
      dataTypeObjMap[type]?.regExp &&
      !dataTypeObjMap[type].regExp.test(value)
    ) {
      if (callback) {
        return callback(new Error(t('dataManagement.eventAttr.dataError')))
      } else {
        return t('dataManagement.eventAttr.dataError')
      }
    }
    const len = type === 'string' ? 255 : 50
    if (value.length > len) {
      if (callback) {
        return callback(
          new Error(t('dataManagement.eventAttr.contentExceedLimit'))
        )
      } else {
        return t('dataManagement.eventAttr.contentExceedLimit')
      }
    }
  } else {
    if (callback) {
      if (index === 0) {
        return callback(new Error(t('common.pleaseEnter')))
      } else if (type === 'string') {
        callback()
      } else {
        return callback(new Error(t('common.pleaseEnter')))
      }
    } else {
      if (index === 0) {
        return t('dataManagement.eventAttr.contentEmpty')
      } else if (type === 'string') {
        return true
      } else {
        return t('dataManagement.eventAttr.contentEmpty')
      }
    }
  }
  if (callback) {
    callback()
  } else {
    return true
  }
}

const rowKeys = columnMap.map((item) => item.prop)

const emit = defineEmits(['getData'])
const state = reactive(initVal())
const formRef = ref(null)
const commonUploadRef = ref(null)
const vxeTableRef = ref(null)

const filterDataList = computed(() => {
  return filterArraySpecifiedKey(state.formData.dataList, ['_X_ROW_KEY'], true)
})

let requestIdleCallbackId = null
const mergeData = (data1, data2, key) => {
  const combinedSet = new Set()
  const result = []

  const addItem = (label, additionalProps = {}) => {
    combinedSet.add(label)
    result.push({
      fEn: label,
      fZh: '',
      fType: '',
      fLen: '',
      fUnit: '',
      fDesc: '',
      ...additionalProps,
    })
  }

  // 合并 data1
  data1.forEach((item) => {
    if (!combinedSet.has(item.label)) {
      addItem(item.label)
    }
  })

  // 合并 data2
  data2.forEach((item) => {
    if (!combinedSet.has(item[key])) {
      addItem(item[key], {
        fEn: item[key],
        fZh: item.col_1,
        fType: filterDimensionDataTypetMap[item.col_2] ? item.col_2 : '',
      })
    } else {
      // 如果已经存在，更新对应的 data
      const existingItem = result.find((v) => v.fEn === item[key])
      if (existingItem) {
        existingItem.fZh = item.col_1
        existingItem.fType = filterDimensionDataTypetMap[item.col_2]
          ? item.col_2
          : ''
      }
    }
  })

  return result
}

const handelUploadFile = async (file, fileList) => {
  state.operateLoading = true
  const [dimensionData, tableStructure = {}] = await analysisExcel(file, {
    format: true,
    multiple: true,
  }).finally((_) => {
    state.operateLoading = false
  })

  if (isEmpty(tableStructure) || tableStructure.excelColumns.length < 3) {
    ElMessage.error(t('dataManagement.uploadByTemplate'))
    return
  }
  // 使用示例
  const newData2 = customDataSort(
    // 去掉第一个
    // tableStructure.excelData.slice(1),
    tableStructure.excelData,
    dimensionData.excelColumns.map((item) => item.label),
    'col_0'
  )
  const result = mergeData(dimensionData.excelColumns, newData2, 'col_0')

  // 表结构
  state.formData.dimensionList = [...state.formData.dimensionList, ...result]
  if (state.formData.dimensionList.length) {
    state.formData.dimensionList[0].fEn = state.rowData.fEn
    state.formData.dimensionList[0].fZh = state.rowData.fZh
    state.formData.dimensionList[0].fType = state.rowData.fType
    state.formData.dimensionList[0].fLen = state.rowData.fLen
    state.formData.dimensionList[0].fUnit = state.rowData.fUnit
    state.formData.dimensionList[0].fDesc = state.rowData.fDesc
  }

  // 数据预览
  const dataList = dimensionData.excelData.map((item) => {
    const arr = []
    Object.keys(item).forEach((key) => {
      arr.push({
        val: item[key],
      })
    })
    return arr
  })

  if (!state.formData.dataList.length) {
    state.formData.dataList = dataList
  } else {
    state.formData.dataList.forEach((item, index) => {
      if (dataList[index]) {
        item.push(...dataList[index])
      } else {
        item.push(
          ...dataList[0].map((_) => ({
            val: '',
          }))
        )
      }
    })
    // 找差异
    let data = differenceByIndex(dataList, state.formData.dataList)
    if (data.length) {
      const length = state.formData.dataList[0].length - data[0].length
      const arr = Array.from({ length }, () => ({ val: '' }))
      state.formData.dataList.push(
        ...data.map((item) => [...cloneDeep(arr), ...item])
      )
    }
  }

  // 数据预览比表结构多时
  if (state.formData.dataList[0].length > state.formData.dimensionList.length) {
    let len =
      state.formData.dataList[0].length - state.formData.dimensionList.length
    for (let i = 0; i < len; i++) {
      state.formData.dimensionList.push(
        rowKeys.reduce((obj, key) => {
          obj[key] = ''
          return obj
        }, {})
      )
    }
  }

  // 表结构比数据预览多时
  if (state.formData.dimensionList.length > state.formData.dataList[0].length) {
    // 补齐 arr2 的长度到和 arr1 一致，每个新元素都包含 { "val": "" }
    state.formData.dataList.forEach((subArr) => {
      while (subArr.length !== state.formData.dimensionList.length) {
        subArr.push({ val: '' })
      }
    })
  }
  requestIdleCallbackId = requestIdleCallback(
    () => {
      validateForm([
        ...tableStructureValidateKeys(),
        ...dataPreviewValidateKeys(),
      ])
      cancelIdleCallback(requestIdleCallbackId)
    },
    {
      timeout: 300,
    }
  )
}

const tableStructureBlurOperation = (prop, index) => {
  validateForm([
    ...tableStructureValidateKeys(prop),
    ...(prop === 'fType' ? dataPreviewValidateKeys(index) : []),
  ])
}

const exportDimension = async () => {
  let dataValues = filterDataList.value.map(function (item) {
    return Object.values(item).map((sub) => sub.val)
  })

  exportToExcel({
    fileName: t('dataManagement.dimensionTable'),
    sheets: [
      {
        sheetName: '维度表数据',
        sheetData: [
          state.formData.dimensionList.map((item) => item.fEn),
          ...dataValues,
        ],
      },
      {
        sheetName: '表结构',
        sheetData: [
          columnMap.map((item) => item.label),
          ...state.formData.dimensionList.map((item) => [
            item.fEn,
            item.fZh,
            item.fType,
          ]),
        ],
      },
    ],
  })
}

const clearDimension = async () => {
  await useTipModal({
    content: t('dataManagement.eventAttr.confirmDeleteDimeions'),
    iconType: 3,
    needLoading: false,
    btnSwap: true,
    title: t('dataManagement.eventAttr.clearDimensionTable'),
  })
  state.formData.dimensionList = []
  state.formData.dataList = []
}

const addTableStructureRow = () => {
  state.formData.dimensionList.push(
    rowKeys.reduce((obj, key) => {
      obj[key] = ''
      return obj
    }, {})
  )

  // 数据预览新增列
  state.formData.dataList.forEach((item) => item.push({ val: '' }))
  requestIdleCallbackId = requestIdleCallback(
    () => {
      validateForm(tableStructureValidateKeys())
      cancelIdleCallback(requestIdleCallbackId)
    },
    {
      timeout: 300,
    }
  )
}

const deleteTableStructureRow = (index) => {
  state.formData.dimensionList.splice(index, 1)
  state.formData.dataList.forEach((item) => {
    item.splice(index, 1)
  })
  validateForm(tableStructureValidateKeys())
}

const addDataPreviewRow = () => {
  state.formData.dataList.push(
    state.formData.dimensionList.map((_) => ({
      val: '',
    }))
  )

  requestIdleCallbackId = requestIdleCallback(
    () => {
      vxeTableRef.value.scrollToRow(
        state.formData.dataList[state.formData.dataList.length - 1]
      )
      validateForm(dataPreviewValidateKeys())
      cancelIdleCallback(requestIdleCallbackId)
    },
    {
      timeout: 300,
    }
  )
}

const deleteDataPreviewRow = (index) => {
  state.formData.dataList.splice(index, 1)
  validateForm(dataPreviewValidateKeys())
}

const tableStructureValidateKeys = (key) => {
  return state.formData.dimensionList.reduce((p, item, i) => {
    if (key) {
      p.push(`dimensionList.${i}.${key}`)
    } else {
      Object.keys(item).forEach((k) => {
        p.push(`dimensionList.${i}.${k}`)
      })
    }
    return p
  }, [])
}

const dataPreviewValidateKeys = (key) => {
  if (Number.isInteger(key)) {
    return filterDataList.value.reduce((p, item, i) => {
      p.push(`dataList.${i}.${key}.val`)
      return p
    }, [])
  }
  return state.formData.dimensionList.reduce((p, item, i) => {
    filterDataList.value.forEach((val, subIndex) => {
      p.push(`dataList.${subIndex}.${i}.val`)
    })
    return p
  }, [])
}

// 对某些字段校验
const validateForm = debounce((type) => {
  nextTick(async () => {
    await formRef.value.validateField(type).catch((e) => e)
  })
}, 300)

const clearFiles = (files) => {
  commonUploadRef.value.clearFiles(files)
}

const close = () => {
  Object.assign(state, initVal())
}

const findDuplicateMessages = (arr) => {
  const valMap = arr
    .map((subArray, index) => ({
      val: subArray[0]?.val,
      row: index + 1,
      col: 1, // 因为我们只检查第0下标，即第1列
    }))
    .filter((item) => item.val) // 排除空值
    .reduce((map, item) => {
      if (!map[item.val]) {
        map[item.val] = []
      }
      map[item.val].push(item)
      return map
    }, {})

  return Object.values(valMap)
    .filter((items) => items.length > 1) // 只保留重复的val
    .flatMap((items) =>
      items.map((item) =>
        t('dataManagement.eventAttr.positionLabel', {
          row: item.row,
          col: item.col,
        })
      )
    )
}

const submit = async () => {
  const error = state.formData.dataList.reduce((p, parent, parentIndex) => {
    parent.forEach((item, subIndex) => {
      const mark = dataPreviewValidator(subIndex, item.val)
      if (!isBoolean(mark)) {
        const key = t('dataManagement.eventAttr.rowLabel', [parentIndex + 1])
        if (!p[key]) p[key] = []
        p[key].push(
          t('dataManagement.eventAttr.columnLabel', {
            column: subIndex + 1,
            mark,
          })
        )
      }
    })
    return p
  }, {})
  ElMessage.closeAll?.()

  if (Object.keys(error).length) {
    let messageHtml = `<div class="title c-ff9f24">${t('dataManagement.eventAttr.previewError')}</div><div class="content" style="gap:5px;">`
    Object.keys(error).forEach((item, index) => {
      messageHtml += `<div class="content-item">${item}-${error[item].join('，')}`
      messageHtml += '</div>'
    })
    await formRef.value.validate().catch((e) => false)
    ElMessage({
      type: 'warning',
      duration: 0,
      showClose: true,
      dangerouslyUseHTMLString: true,
      message: messageHtml,
      customClass: 'nd-warning-message-600-or-601',
    })
    return
  }

  if (formRef.value) {
    const data = await formRef.value.validate().catch((e) => {
      return false
    })
    if (!data) {
      ElMessage.error(t('dataManagement.eventAttr.checkTableStructure'))
      return
    }
  }

  // 调用函数并输出结果
  const duplicateMessages = findDuplicateMessages(state.formData.dataList)

  if (duplicateMessages.length) {
    await useTipModal({
      content: duplicateMessages.map((item) => `<div>${item}</div>`).join(''),
      iconType: 3,
      needLoading: false,
      subTxt: t('dataManagement.eventAttr.continueSubmit'),
      title: t('dataManagement.eventAttr.contentDuplicate'),
    })
  }

  const verifyPrefix = new RegExp(`^${state.rowData.fEn}__.+`)
  state.operateLoading = true

  const { code } = await asyncDimensionSave({
    ...state.formData,
    dimensionList: state.formData.dimensionList.map((item, index) => {
      const [fType, fLen = ''] = item.fType.split('_')
      // 拼接前缀
      const fEn =
        verifyPrefix.test(item.fEn) || index === 0
          ? item.fEn
          : `${state.rowData.fEn}__${item.fEn}`
      return {
        ...item,
        fType,
        fLen,
        fEn,
      }
    }),
    propertyId: state.rowData.fId,
    propertyName: state.rowData.fEn,
  }).finally((_) => {
    state.operateLoading = false
  })
  emit('getData')
  code === 200 && ElMessage.success(t('common.operationSuccessfully'))
  state.showOperate = false
}

const open = async (data) => {
  state.showOperate = true
  const tmp = cloneDeep(data)
  tmp.fType = tmp.newFtype
  tmp.children = tmp.children.map((item) => {
    const obj = {
      ...item,
      fType: item.newFtype,
    }
    // 有维度数据时 要比对数据类型有没有 没有则重置 filterDimensionDataType
    if (!filterDimensionDataTypetMap[obj.fType]) obj.fType = ''
    return obj
  })
  state.rowData = markRaw(tmp)
  // 有就是编辑
  if (tmp.children.length) {
    state.formData.operateType = 2
    state.formData.dimensionList = [
      {
        fEn: tmp.fEn,
        fZh: tmp.fZh,
        fType: tmp.fType,
        fLen: tmp.fLen,
        fUnit: tmp.fUnit,
        fDesc: tmp.fDesc,
      },
      ...tmp.children,
    ]
    state.operateLoading = true
    const { data } = await getSelectDimensionDataList({
      dimTableType: +props.type,
      fId: tmp.fId,
    }).finally((_) => {
      state.operateLoading = false
    })
    state.formData.dataList = data
    state.dataListCount = data.length
  }
}

defineExpose({
  open,
})
defineOptions({
  name: 'ConfigDimension',
})
</script>
