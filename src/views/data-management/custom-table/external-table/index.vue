<template>
  <CommonDrawer
    v-model="state.drawerShow"
    ref="commonDrawerRef"
    :title="`${formData.id ? $t('dataManagement.customTable.editExternalTable') : $t('dataManagement.customTable.addExternalTable')}`"
    @close="close"
    @submit="handleSubmit"
    :loading="state.submitLoading">
    <el-form
      :ref="(ref) => (state.formRef = ref)"
      :model="formData"
      :rules="formRules"
      label-position="top"
      label-width="100px">
      <el-form-item :label="$t('common.name')" prop="name">
        <CommonInput
          clearable
          maxlength="50"
          show-word-limit
          :placeholder="$t('common.pleaseEnter')"
          v-model="formData.name"
          :prefixSlot="false" />
      </el-form-item>
      <el-form-item :label="$t('common.description')" prop="description">
        <CommonInput
          v-model="formData.description"
          type="textarea"
          maxlength="255"
          show-word-limit
          :placeholder="$t('common.pleaseEnter')"
          :rows="4"
          resize="none" />
      </el-form-item>
      <el-form-item
        :key="state.fileFormDisabled"
        :prop="state.fileFormDisabled ? '' : 'file'">
        <CommonUpload
          @change="handelUploadFile"
          :on-remove="handleRemove"
          v-model:file-list="formData.file">
          <template #help>
            <div>
              <el-link
                type="primary"
                :underline="false"
                @click.stop
                href="https://yifants.feishu.cn/wiki/Ih01w39NkiDoyDkW8hKcXptWnxg#share-E2PRdBZxHoBF3yxBFLpccArgnKh"
                target="_blank">
                {{ $t('dataManagement.customTable.viewInstructions') }}
              </el-link>
            </div>
          </template>
        </CommonUpload>
      </el-form-item>
      <div
        class="file-preview__content mt10 mb10"
        v-if="state.fileTableList.data.length > 0">
        <div
          class="file-preview__title flex-center flex-between"
          style="margin-top: 50px">
          <span>{{ $t('dataManagement.tableStructure') }}</span>
          <el-button v-if="formData.id" @click="exportData">
            <SvgIcon class="mr5 fz16" name="download" />
            {{ $t('dataManagement.exportTableStructure') }}
          </el-button>
        </div>

        <el-form
          :model="state.fileTableList"
          inline-message
          class="external-table-form"
          :ref="(ref) => (state.fileFormRef = ref)">
          <el-table
            :data="state.fileTableList.data"
            class="nd-table-custom skip"
            border
            row-key="column"
            :ref="(ref) => (state.fileTableRef = ref)">
            <el-table-column
              width="60"
              type="selection"
              :selectable="selectable" />
            <el-table-column
              :label="$t('dataManagement.fieldName')"
              width="200">
              <template #default="scope">
                <el-form-item
                  :prop="`data.${scope.$index}.column`"
                  :rules="fileFormRules.column">
                  {{ scope.row.column }}
                </el-form-item>
              </template>
            </el-table-column>
            <el-table-column :label="$t('dataManagement.displayName')">
              <template #header>
                <span class="table-header-required">
                  {{ $t('dataManagement.displayName') }}
                </span>
              </template>
              <template #default="scope">
                <el-form-item
                  :prop="`data.${scope.$index}.columnDisplay`"
                  :rules="fileFormRules.columnDisplay">
                  <el-input
                    v-model.trim="scope.row.columnDisplay"
                    style="width: 200px"
                    maxlength="30"
                    :disabled="state.fileFormDisabled" />
                </el-form-item>
              </template>
            </el-table-column>
            <el-table-column
              :label="$t('dataManagement.customTable.columnDataType')">
              <template #default="scope">
                <el-form-item
                  :rules="fileFormRules.columnType"
                  :prop="`data.${scope.$index}.columnType`">
                  <el-select
                    v-model="scope.row.columnType"
                    style="width: 200px"
                    :disabled="state.fileFormDisabled">
                    <el-option
                      v-for="item in columnTypeList"
                      :value="item.value"
                      :label="item.label"
                      :key="item.value"></el-option>
                  </el-select>
                </el-form-item>
              </template>
            </el-table-column>
            <el-table-column :label="$t('common.operate')" width="80">
              <template #default="scope">
                <el-button
                  text
                  :title="$t('btn.delete')"
                  :icon="Delete"
                  type="primary"
                  :disabled="
                    state.fileFormDisabled ||
                    state.fileTableList.data.length <= 1
                  "
                  @click="handleDelFileForm(scope)" />
              </template>
            </el-table-column>
          </el-table>
        </el-form>
      </div>
      <el-button
        text
        @click="handlePreview"
        type="primary"
        v-if="state.fileTableList.data.length > 0 && !state.fileFormDisabled">
        {{ $t('dataManagement.customTable.confirmStructurePreview') }}
      </el-button>
      <el-form-item
        :label="$t('dataManagement.customTable.primaryKeyConflict')"
        style="margin-top: 20px"
        v-if="state.fileTableRef?.getSelectionRows().length > 0">
        <template #label>
          <span>
            {{ $t('dataManagement.customTable.primaryKeyConflict') }}
            <el-tooltip>
              <template #content>
                <div
                  v-html="
                    $t(
                      'dataManagement.customTable.primaryKeyConflictTip'
                    ).replace(/\n/g, '<br />')
                  "></div>
                <!-- <div>
                  <div>
                    添加数据时，如果新上传的主键数据与原有的主键数据相同时，视为主键冲突
                  </div>
                  <div>
                    1.替换（整行更新）时，新数据覆盖旧数据，整行所有列全部覆盖，没有上传的列会强制写NULL
                  </div>
                  <div>2.忽略模式时，忽略新数据，原数据继续保留</div>
                </div> -->
              </template>
              <svg-icon name="help2" />
            </el-tooltip>
          </span>
        </template>
        <el-radio-group v-model="formData.conflictMode">
          <el-radio :value="1">
            {{ $t('dataManagement.customTable.replaceEntireLine') }}
          </el-radio>
          <el-radio :value="2">
            {{ $t('dataManagement.customTable.ignoreNewData') }}
          </el-radio>
        </el-radio-group>
      </el-form-item>
      <div
        class="file-preview__content mt10 mb10"
        v-if="state.previewData.length > 0">
        <div class="file-preview__title">
          {{ $t('dataManagement.customTable.previewData') }}
        </div>
        <el-table
          :data="state.previewData"
          class="nd-table-custom skip"
          border
          max-height="300px">
          <el-table-column
            :label="$t('common.orderNumber')"
            type="index"
            width="60" />
          <el-table-column
            v-for="(item, index) in state.previewColumns"
            :key="item.prop"
            :label="item.label"
            :prop="item.prop"
            :min-width="120">
            <template #default="{ row }">
              <span>{{ row[index].val }}</span>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <el-form-item
        v-if="formData.id && state.fileTableList.data.length"
        :label="$t('dataManagement.customTable.keepOriginalData')"
        class="mt10">
        <el-switch v-model="formData.keepHistoryData" />
      </el-form-item>
    </el-form>
  </CommonDrawer>
</template>

<script setup>
import { ElMessage } from 'element-plus'
import { nextTick, reactive } from 'vue'
import { Delete } from '@element-plus/icons-vue'
import {
  validateDisplayName,
  validateFieldName,
  validateName,
} from '../validate'
import { columnTypeList, columnTypeListMap } from '@/enumeration'
import { mutateCustomTable } from '@/api/modules/custom-table'
import { analysisExcel, exportToExcel } from '@/utils/excel'
import dayjs from 'dayjs'
import { useTipModal } from '@/components/TipDialog'
import { t } from '@/locales/i18n'
import { isEmpty } from 'lodash-es'
import { customDataSort } from '@/utils/dataProcessing.js'

const emit = defineEmits(['getList'])

const state = reactive({
  drawerShow: false,
  formRef: null,
  fileFormRef: null,
  fileTableList: {
    data: [],
  },
  previewData: [],
  previewColumns: [],
  fileResults: [],
  fileTableRef: null,
  submitLoading: false,
  fileFormDisabled: false,
})

const fileFormRules = {
  column: [{ required: true, validator: validateFieldName }],
  columnDisplay: [{ required: true, validator: validateDisplayName }],
  columnType: [{ required: true, message: t('common.pleaseSelect') }],
}

const initFormData = () => ({
  name: '',
  description: '',
  file: [],
  primaryKey: '',
  id: undefined,
  conflictMode: 0,
  type: 1,
  csvFile: null,
  keepHistoryData: false,
})

const formData = reactive(initFormData())

const formRules = reactive({
  name: [{ required: true, validator: validateName }],
  file: [
    {
      required: true,
      message: t('user.userGroup.uploadFilePlease'),
      trigger: 'change',
    },
  ],
})

/**
 * @description: 文件错误，清空处理
 * @return {*}
 */
const clearUploadFile = () => {
  formData.file = []
  formData.csvFile = null
}

const mergeData = (data1, data2, key) => {
  const combinedSet = new Set()
  const result = []

  const addItem = (label, additionalProps = {}) => {
    combinedSet.add(label)
    result.push({
      column: label,
      columnDisplay: label,
      columnType: 'text',
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
        column: item[key],
        columnDisplay: item.col_1 || item[key],
        columnType: columnTypeListMap[item.col_2] ? item.col_2 : 'text',
      })
    } else {
      // 如果已经存在，更新对应的 data
      const existingItem = result.find((v) => v.column === item[key])
      if (existingItem) {
        existingItem.columnDisplay = item.col_1 || item[key]
        existingItem.columnType = columnTypeListMap[item.col_2]
          ? item.col_2
          : 'text'
      }
    }
  })

  return result
}

/**
 * @description: 文件上传
 * @return {*}
 * @param { File } file
 */
const handelUploadFile = async (file, fileList) => {
  formData.file = [file]
  if (!state.fileFormDisabled) state.formRef.validateField('file')

  const [tableData = {}, tableStructure = {}] = await analysisExcel(file, {
    format: true,
    multiple: true,
  }).catch(() => {
    clearUploadFile()
  })

  if (isEmpty(tableStructure) || tableStructure.excelColumns.length < 3) {
    ElMessage.error(t('dataManagement.uploadByTemplate'))
    clearUploadFile()
    return
  }
  state.fileFormDisabled = false
  formData.conflictMode = 1

  // 使用示例
  const newData2 = customDataSort(
    tableStructure.excelData,
    tableData.excelColumns.map((item) => item.label),
    'col_0'
  )
  const result = mergeData(tableData.excelColumns, newData2, 'col_0')
  // 表结构
  state.fileTableList.data = result

  // 数据预览
  const dataList = tableData.excelData.map((item) => {
    const arr = []
    Object.keys(item).forEach((key) => {
      arr.push({
        val: item[key],
      })
    })
    return arr
  })
  formData.csvFile = tableData.csvBlob
  state.fileResults = dataList.slice(0, 10)
  // 表结构比数据预览多时
  if (state.fileTableList.data.length > state.fileResults[0].length) {
    // 补齐 arr2 的长度到和 arr1 一致，每个新元素都包含 { "val": "" }
    state.fileResults.forEach((subArr) => {
      while (subArr.length !== state.fileTableList.data.length) {
        subArr.push({ val: '' })
      }
    })
  }
}

/**
 * @description: 显示预览数据
 * @return {*}
 */
const handlePreview = () => {
  const columns = []
  const fieldMap = new Map()

  state.fileTableList.data.forEach((item, index) => {
    columns.push({
      label: item.column,
      prop: 'val',
    })
    fieldMap.set(index, item.columnType)
  })
  state.previewColumns = columns
  const newArr = []
  state.fileResults.forEach((item) => {
    newArr.push(
      item.map((v, index) => {
        return { val: formatFieldValue(v.val, fieldMap.get(index)) }
      })
    )
  })
  state.previewData = newArr
}

/**
 * @description: 格式化上传文件中字段值
 * @return {*}
 */
const formatFieldValue = (val, type) => {
  let new_val = ''
  if (type === 'int4') {
    if (!isNaN(Number(val))) new_val = parseInt(val)
  } else if (type.includes('numeric')) {
    const len = type.slice(type.length - 2, type.length - 1)
    if (!isNaN(Number(val))) new_val = Number(val).toFixed(len)
  } else if (type === 'timestamp') {
    if (
      (val instanceof Date && val.getTime()) ||
      dayjs(val, 'YYYY-MM-DD', true).isValid() ||
      dayjs(val, 'YYYY-MM-DD HH:mm:ss', true).isValid()
    ) {
      new_val = dayjs(val).format('YYYY-MM-DD HH:mm:ss')
    }
  } else {
    new_val = val
  }

  return new_val
}

/**
 * @description: 文件删除
 * @return {*}
 */
const handleRemove = (file, fileList) => {
  clearUploadFile()
  state.previewData = []
  state.previewColumns = []
  state.fileTableList.data = []
  if (fileList && fileList.length === 0) state.formRef.validateField('file')
}

/**
 * @description: 主键是否可勾选
 * @return {*}
 */
const selectable = (row) => {
  if (state.fileFormDisabled) return false

  let flag = true
  const selectRows = state.fileTableRef.getSelectionRows()
  if (selectRows.length > 0) {
    flag = row.column === selectRows[0].column
  }
  return flag
}

/**
 * @description: 删除表格的数据
 * @return {*}
 * @param {number} index
 */
const handleDelFileForm = (scope) => {
  const index = scope.$index
  state.fileTableList.data.splice(index, 1)

  // 判断是否删除的是主键列
  if (state.fileTableRef.getSelectionRows().length > 0) {
    let flag = state.fileTableRef
      .getSelectionRows()
      .some((item) => item.column === scope.row.column)
    if (flag) state.fileTableRef.clearSelection()
  }
}

/**
 * @description: 编辑外部表
 * @return {*}
 * @param {object} info
 */
const handleEdit = (info) => {
  state.drawerShow = true
  const editFormData = {}
  Object.keys(initFormData()).forEach((key) => {
    editFormData[key] = info[key]
    editFormData.keepHistoryData = Boolean(editFormData.keepHistoryData)
  })

  state.fileTableList.data = info.columns
  state.fileFormDisabled = true

  // 设置主键
  if (info.primaryKey) {
    nextTick(() => {
      state.fileTableRef.toggleRowSelection(
        state.fileTableList.data.filter(
          (item) => item.column === info.primaryKey
        )[0],
        true
      )
    })
  }
  Object.assign(formData, editFormData)
}

/**
 * @description: 保存
 * @return {*}
 */
const handleSubmit = () => {
  state.formRef.validate((valid) => {
    if (valid) {
      state.fileFormRef?.validate(async (success) => {
        if (success) {
          try {
            if (formData.csvFile && !formData.keepHistoryData && formData.id) {
              await useTipModal({
                title: t('common.tip'),
                content: t('dataManagement.customTable.confirmOverwrite'),
                btnSwap: true,
                needLoading: false,
              })
            }
            handleSave()
          } catch (error) {
            console.log(error)
          }
        }
      })
    }
  })
}

/**
 * @description: 保存
 * @return {*}
 */
const handleSave = () => {
  const params = {
    ...formData,
    file: undefined,
    columns: state.fileTableList.data,
    appId: sessionStorage.getItem('appId'),
    csvFile: undefined,
    primaryKey:
      state.fileTableRef?.getSelectionRows().length > 0
        ? state.fileTableRef?.getSelectionRows()[0].column
        : '',
  }

  params.conflictMode = params.primaryKey ? formData.conflictMode : 0

  const fileData = new FormData()
  fileData.append('custom', JSON.stringify(params))
  if (formData.csvFile) fileData.append('file', formData.csvFile) // 文件对象
  state.submitLoading = true
  mutateCustomTable(fileData)
    .then((_) => {
      const message = formData.id
        ? t('common.editedSuccessfully')
        : t('common.addedSuccessfully')
      ElMessage.success(message)
      state.drawerShow = false

      emit('getList')
    })
    .catch((_) => {
      state.submitLoading = false
    })
    .finally((_) => {
      state.submitLoading = false
    })
}

const open = () => {
  state.drawerShow = true
}

const close = () => {
  Object.assign(formData, initFormData())
  handleRemove()
}

const exportData = async () => {
  exportToExcel({
    fileName: t('dataManagement.externalTableTemplate'),
    sheets: [
      {
        sheetName: '数据',
        sheetData: [state.fileTableList.data.map((item) => item.column)],
      },
      {
        sheetName: '表结构',
        sheetData: [
          [
            t('dataManagement.fieldName'),
            t('dataManagement.displayName'),
            t('dataManagement.customTable.columnDataType'),
          ],
          ...state.fileTableList.data.map((item) => [
            item.column,
            item.columnDisplay,
            item.columnType,
          ]),
        ],
      },
      {
        sheetName: '数据类型',
        sheetData: columnTypeList.map((item) => [item.value, item.label]),
      },
    ],
  })
}

defineExpose({
  open,
  handleEdit,
})
</script>

<style lang="scss" scoped>
:deep() {
  .external-table-form {
    .el-form-item {
      margin-bottom: 0;
    }

    .el-table .el-table__header .el-table-column--selection .cell:before {
      content: '主键';
    }

    .el-table .el-table__header .el-table-column--selection .el-checkbox {
      display: none;
    }
  }
}

.file-preview {
  &__title {
    margin-bottom: 6px;
  }
}

.table-header-required {
  &::before {
    content: '*';
    color: var(--el-color-danger);
    margin-right: 4px;
  }
}
</style>
