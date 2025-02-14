<template>
  <CommonDrawer
    v-model="state.drawerShow"
    :title="$t('dataManagement.customTable.addData')"
    @close="close"
    :showBtn="false"
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
      <el-form-item :label="$t('common.SqlInputBox')" prop="sql">
        <AceEditor
          v-model.trim="formData.sql"
          @validateSQL="validateSQL"
          :loading="state.sqlLoading"
          toolbar
          :ref="(ref) => (state.aceEditorRef = ref)" />
      </el-form-item>
      <div v-if="state.previewData.length > 0" class="preview-table">
        <div class="table-title">
          {{ $t('dataManagement.customTable.previewData') }}
        </div>
        <div class="mt10">
          <el-table ref="table" size="small" border :data="state.previewData">
            <el-table-column
              :label="$t('common.orderNumber')"
              type="index"
              width="50" />
            <el-table-column
              v-for="(item, i) in state.previewColumns"
              :key="i"
              :align="item.align"
              :label="item.label"
              :prop="item.prop"
              :min-width="120">
              <template v-slot="scope">
                <span>{{ scope.row[item.prop] }}</span>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </el-form>
    <template #footer-r>
      <el-button class="skip" @click="state.drawerShow = false">
        {{ $t('btn.cancel') }}
      </el-button>
      <el-button
        type="primary"
        :disabled="!state.sqlValidated"
        @click="handleSubmit">
        {{ $t('btn.confirm') }}
        <el-tooltip
          effect="dark"
          :content="$t('dataManagement.validSql')"
          placement="top"
          v-if="!state.sqlValidated">
          <svg-icon name="help2" style="margin-left: 4px" />
        </el-tooltip>
      </el-button>
    </template>
  </CommonDrawer>
</template>

<script setup>
import { reactive, watch } from 'vue'
import { checkCustomSql, importMiddleData } from '@/api/modules/custom-table'
import { ElMessage } from 'element-plus'
import { t } from '@/locales/i18n'

const emit = defineEmits(['getList'])

const state = reactive({
  drawerShow: false,
  loading: false,
  formRef: null,
  aceEditorRef: null,
  sqlValidated: false,
  sqlLoading: false,
  previewData: [],
  previewColumns: [],
  submitLoading: false,
})

const initFormData = () => ({
  changeType: 0,
  sql: '',
  id: '',
})
const formData = reactive(initFormData())
const formRules = reactive({
  changeType: [{ required: true }],
  sql: [
    { required: true, message: t('dataManagement.customTable.pleaseEnterSQL') },
  ],
})

watch(
  () => formData.sql,
  (newVal, preVal) => {
    resetSQLvalidate(newVal, preVal)
  }
)

/**
 * @description: 重置SQL校验状态
 * @return {*}
 */
const resetSQLvalidate = (newVal, preVal) => {
  const newSql = state.aceEditorRef?.getFormatSQL(newVal)
  const preSql = state.aceEditorRef?.getFormatSQL(preVal)
  if (newSql !== preSql) {
    state.sqlValidated = false
  }
}

/**
 * @description: 校验SQL
 * @return {*}
 */
const validateSQL = () => {
  state.sqlLoading = true
  checkCustomSql({ sql: formData.sql })
    .then((res) => {
      state.sqlValidated = true
      showPreviewData(res.data)
      ElMessage.success(
        t('dataManagement.customTable.verificationSuccessfully')
      )
    })
    .catch(() => {
      state.sqlValidated = false
      state.sqlLoading = false
    })
    .finally((_) => {
      state.sqlLoading = false
    })
}

/**
 * @description: 预览数据
 * @return {*}
 * @param {array} data
 */
const showPreviewData = (data) => {
  if (Array.isArray(data) && data.length > 0) {
    const columns = []
    state.previewData = data.slice(0, 10)
    Object.keys(data[0]).forEach((item) => {
      columns.push({
        label: item,
        prop: item,
        align: typeof data[0][item] === 'number' ? 'right' : 'center',
      })
    })
    state.previewColumns = columns
  }
}

/**
 * @description: 提交数据
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
 * @description: 保存数据
 * @return {*}
 */
const handleSave = () => {
  state.submitLoading = true
  importMiddleData(formData)
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
}

const close = () => {
  state.previewData = []
  state.previewColumns = []
  state.sqlValidated = false
  Object.assign(formData, initFormData())
}

defineExpose({
  open,
})
</script>
