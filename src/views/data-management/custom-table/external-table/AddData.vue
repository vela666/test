<template>
  <CommonDrawer
    v-model="state.drawerShow"
    :title="$t('dataManagement.customTable.addData')"
    @close="close"
    @submit="handleSubmit"
    :loading="state.submitLoading">
    <el-form
      :ref="(ref) => (state.formRef = ref)"
      :model="formData"
      :rules="formRules"
      label-position="top"
      label-width="100px">
      <el-form-item
        prop="changeType"
        :label="$t('dataManagement.customTable.addMethod')">
        <el-radio-group v-model="formData.changeType">
          <el-radio-button :label="0" :value="0">
            {{ $t('dataManagement.customTable.addOverlay') }}
            <el-tooltip
              effect="dark"
              :content="$t('dataManagement.customTable.addOverlayTip')"
              placement="top">
              <svg-icon name="help2" />
            </el-tooltip>
          </el-radio-button>
          <el-radio-button :label="1" :value="1">
            {{ $t('dataManagement.customTable.addIncremental') }}
            <el-tooltip
              effect="dark"
              :content="$t('dataManagement.customTable.addIncrementalTip')"
              placement="top">
              <svg-icon name="help2" />
            </el-tooltip>
          </el-radio-button>
        </el-radio-group>
      </el-form-item>
      <el-form-item prop="file">
        <CommonUpload
          @change="handelUploadFile"
          :on-remove="handleRemove"
          v-model:file-list="formData.file">
          <template #help>
            <el-link
              type="primary"
              :underline="false"
              @click.stop
              href="https://yifants.feishu.cn/wiki/Ih01w39NkiDoyDkW8hKcXptWnxg"
              target="_blank"
              style="justify-content: flex-start">
              {{ $t('dataManagement.customTable.viewInstructions') }}
            </el-link>
          </template>
        </CommonUpload>
      </el-form-item>
      <div class="file-preview__content">
        <div class="file-preview__title" style="margin-top: 50px">
          {{ $t('dataManagement.tableStructure') }}
        </div>
        <el-table
          :data="state.extraTableData"
          class="nd-table-custom skip extra-table"
          border
          row-key="name"
          :ref="(ref) => (state.fileTableRef = ref)">
          <el-table-column
            width="60"
            type="selection"
            :selectable="() => false">
          </el-table-column>
          <el-table-column :label="$t('dataManagement.fieldName')" width="200">
            <template #default="scope">
              {{ scope.row.column }}
            </template>
          </el-table-column>
          <el-table-column :label="$t('dataManagement.displayName')">
            <template #header>
              <span class="table-header-required">{{
                $t('dataManagement.displayName')
              }}</span>
            </template>
            <template #default="scope">
              <el-input
                v-model="scope.row.columnDisplay"
                style="width: 200px"
                maxlength="30"
                disabled />
            </template>
          </el-table-column>
          <el-table-column
            :label="$t('dataManagement.customTable.columnDataType')">
            <template #default="scope">
              <el-select v-model="scope.row.columnType" disabled>
                <el-option
                  v-for="item in columnTypeList"
                  :value="item.value"
                  :label="item.label"
                  :key="item.value"></el-option>
              </el-select>
            </template>
          </el-table-column>
        </el-table>
      </div>
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
                    添加数据时，如果新上传的主键数据与原有的主键数据相同时，视为主键冲突
                  </div>
                  <div>
                    1.替换（整行更新）时，新数据覆盖旧数据，整行所有列全部覆盖，没有上传的列会强制写NULL
                  </div>
                  <div>2.忽略模式时，忽略新数据，原数据继续保留</div> -->
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
      <div class="file-preview__content" v-if="state.previewData.length > 0">
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
            v-for="item in state.previewColumns"
            :key="item.prop"
            :label="item.label"
            :prop="item.prop"
            :min-width="120">
            <template #default="scope">
              <span>{{ scope.row[item.prop] }}</span>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-form>
  </CommonDrawer>
</template>

<script setup>
import { nextTick, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { importExternalData } from '@/api/modules/custom-table'
import { columnTypeList } from '@/enumeration'
import { analysisExcel } from '@/utils/excel'
import dayjs from 'dayjs'
import { t } from '@/locales/i18n'

const emit = defineEmits(['getList'])

const state = reactive({
  drawerShow: false,
  loading: false,
  formRef: null,
  fileTableRef: null,
  previewData: [],
  previewColumns: [],
  fileResults: [],
  extraTableData: [],
  submitLoading: false,
})

const initFormData = () => ({
  changeType: 0,
  file: [],
  primaryKey: 0,
  csvFile: null,
  id: '',
  conflictMode: 0,
})

const formData = reactive(initFormData())
const formRules = reactive({
  changeType: [{ required: true }],
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

/**
 * @description: 校验上传文件是否符合
 * @return {*}
 * @param { array } results
 */
const validateFile = (results) => {
  const excel_header = Object.keys(results[0])

  // 校验excel表头与表结构是否一致
  const extra_table_header = Array.from(
    new Set(state.extraTableData.map((item) => item.column))
  )

  if (excel_header.length < extra_table_header.length) {
    ElMessage.warning(t('dataManagement.customTable.uploadFieldsRules'))
    return false
  }
  for (const header of extra_table_header) {
    if (!excel_header.includes(header)) {
      ElMessage.warning(t('dataManagement.customTable.uploadFieldsRules'))
      return false
    }
  }

  if (excel_header.length > extra_table_header.length) {
    const rest = excel_header.reduce((pre, next) => {
      if (!extra_table_header.includes(next)) pre.push(next)
      return pre
    }, [])
    ElMessage.warning(
      t('dataManagement.customTable.uploadFieledsIgnore', [rest.join('、')])
    )
  }

  return true
}

/**
 * @description: 文件上传
 * @return {*}
 * @param { File } file
 */
const handelUploadFile = (file, fileList) => {
  formData.file = [file]
  state.formRef.validateField('file')

  analysisExcel(file)
    .then(({ results, csvBlob }) => {
      // 校验上传文件是否符合
      if (!validateFile(results)) {
        return Promise.reject()
      }
      state.fileResults = results.slice(0, 10)
      // 预览数据
      handlePreview(results[0])

      //生成csv文件
      formData.csvFile = csvBlob
    })
    .catch((err) => {
      clearUploadFile()
    })
}

/**
 * @description: 显示预览数据
 * @return {*}
 */
const handlePreview = (header) => {
  const columns = []
  const extra_table_header = Array.from(
    new Set(state.extraTableData.map((item) => item.column))
  )
  const fieldMap = new Map()
  state.extraTableData.forEach((item) => {
    fieldMap.set(item.column, item.columnType)
  })

  Object.keys(header).forEach((key) => {
    if (extra_table_header.includes(key)) {
      columns.push({
        label: key,
        prop: key,
      })
    }
  })
  state.previewColumns = columns

  const newArr = []
  state.fileResults.forEach((item) => {
    const obj = {}
    for (const key in item) {
      obj[key] = fieldMap.get(key)
        ? formatFieldValue(item[key], fieldMap.get(key))
        : undefined
    }
    newArr.push(obj)
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

  if (fileList && fileList.length === 0) state.formRef.validateField('file')
}

/**
 * @description: 保存
 * @return {*}
 */
const handleSubmit = () => {
  state.formRef.validate((valid) => {
    if (valid) {
      handleSave()
    }
  })
}

/**
 * @description: 保存
 * @return {*}
 */
const handleSave = () => {
  state.submitLoading = true
  const fileData = new FormData()
  fileData.append('id', formData.id)
  fileData.append('changeType', formData.changeType)
  fileData.append('conflictMode', formData.conflictMode)
  fileData.append('file', formData.csvFile)
  importExternalData(fileData)
    .then((_) => {
      ElMessage.success(t('dataManagement.customTable.addDataSuccessfully'))
      state.drawerShow = false
      emit('getList')
    })
    .finally((_) => {
      state.submitLoading = false
    })
}

/**
 * @description: 添加数据
 * @return {*}
 * @param {object} row
 */
const open = (row) => {
  state.drawerShow = true
  formData.id = row.id
  formData.conflictMode = row.conflictMode
  state.extraTableData = row.columns
  if (row.primaryKey) {
    nextTick(() => {
      state.fileTableRef.toggleRowSelection(
        state.extraTableData.filter(
          (item) => item.column === row.primaryKey
        )[0],
        true
      )
    })
  }
}

const close = () => {
  Object.assign(formData, initFormData())
  handleRemove()
}

defineExpose({
  open,
})
</script>

<style lang="scss" scoped>
:deep() {
  .extra-table {
    &.el-table .el-table__header .el-table-column--selection .cell:before {
      content: '主键';
    }
    &.el-table .el-table__header .el-table-column--selection .el-checkbox {
      display: none;
    }
  }
}
.file-preview {
  &__content {
    margin: 10px 0;
  }
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
