<template>
  <CommonDrawer
    v-model="state.drawerShow"
    :title="`${formData.id ? $t('dataManagement.customTable.editIntermediateTable') : $t('dataManagement.customTable.addIntermediateTable')}`"
    @close="close"
    :showBtn="false"
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
      <el-form-item :label="$t('common.SqlInputBox')" prop="sql">
        <AceEditor
          v-model.trim="formData.sql"
          @validateSQL="validateSQL"
          :loading="state.sqlLoading"
          toolbar
          :ref="(ref) => (state.aceEditorRef = ref)" />
      </el-form-item>
      <div v-if="state.previewData.length > 0" class="preview-table mt20 mb20">
        <div class="table-title">
          {{ $t('dataManagement.customTable.previewData') }}
        </div>
        <div class="mt10">
          <el-table
            ref="table"
            size="small"
            border
            max-height="200px"
            :data="state.previewData">
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
      <el-form-item
        :label="$t('dataManagement.customTable.updateMethod')"
        prop="refreshType">
        <div>
          <el-radio-group v-model="formData.refreshType">
            <el-radio-button :label="0" :value="0">
              {{ $t('dataManagement.customTable.manualUpdate') }}
            </el-radio-button>
            <el-radio-button :label="1" :value="1">
              {{ $t('dataManagement.customTable.automaticUpdate') }}
            </el-radio-button>
          </el-radio-group>
          <div class="mt10">
            <el-radio-group
              v-model="formData.changeType"
              @change="dataChangeType">
              <el-radio :value="0">
                {{ $t('dataManagement.customTable.cover') }}
              </el-radio>
              <el-radio :value="1">
                {{ $t('dataManagement.customTable.increment') }}
              </el-radio>
            </el-radio-group>
          </div>
          <div class="mt10">
            <el-alert
              v-if="formData.refreshType === 0"
              style="width: 400px; background-color: #f5f7fe"
              type="info"
              :closable="false">
              <template #title>
                <div>{{ $t('dataManagement.customTable.coverTips1') }}</div>
                <div class="mt10">
                  {{ $t('dataManagement.customTable.coverTips2') }}
                </div>
              </template>
            </el-alert>
            <el-alert
              v-else
              style="width: 400px; background-color: #f5f7fe"
              type="info"
              :closable="false">
              <template #title>
                <div>
                  {{ $t('dataManagement.customTable.incrementTips1') }}
                </div>
                <div class="mt10">
                  {{ $t('dataManagement.customTable.incrementTips2') }}
                </div>
              </template>
            </el-alert>
          </div>
        </div>
      </el-form-item>

      <el-form-item prop="keepHistoryData" v-if="formData.id">
        <template #label>
          {{ $t('dataManagement.customTable.keepOriginalData') }}
          <el-tooltip
            effect="dark"
            :content="$t('dataManagement.customTable.incrementUpdateMethod')"
            placement="top">
            <svg-icon name="help2" />
          </el-tooltip>
        </template>
        <el-switch
          v-model="formData.keepHistoryData"
          :disabled="formData.changeType === 0" />
      </el-form-item>
    </el-form>
    <template #footer-r>
      <el-button class="skip" @click="state.drawerShow = false">
        {{ $t('btn.cancel') }}
      </el-button>
      <el-button
        type="primary"
        :disabled="!state.sqlValidated"
        @click="handleSubmit"
        :loading="state.submitLoading">
        {{ $t('btn.confirm') }}
        <el-tooltip
          v-if="!state.sqlValidated"
          effect="dark"
          :content="$t('dataManagement.validSql')"
          placement="top">
          <svg-icon name="help2" style="margin-left: 4px" />
        </el-tooltip>
      </el-button>
    </template>
    <TipDialog
      iconType="3"
      btnSwap
      v-model="state.tipDialog"
      :title="$t('common.tip')"
      @submit="handleSave">
      {{ $t('dataManagement.customTable.confirmSqlChange') }}
    </TipDialog>
  </CommonDrawer>
</template>

<script setup>
import { reactive, watch } from 'vue'
import { validateName } from '../validate'
import { checkCustomSql, mutateCustomTable } from '@/api/modules/custom-table'
import { ElMessage } from 'element-plus'
import { t } from '@/locales/i18n'

const emit = defineEmits(['getList'])

const state = reactive({
  drawerShow: false,
  loading: false,
  checkSqlLoading: false,
  previewColumns: [],
  previewData: [],
  formRef: null,
  aceEditorRef: null,
  sqlValidated: false,
  sqlLoading: false,
  submitLoading: false,
  editInfo: {},
  tipDialog: false,
})

const initFormData = () => ({
  name: '',
  description: '',
  sql: '',
  refreshType: 0,
  changeType: 0,
  id: undefined,
  type: 0,
  keepHistoryData: false,
})

const formData = reactive(initFormData())
const formRules = reactive({
  name: [{ required: true, validator: validateName }],
  sql: [
    { required: true, message: t('dataManagement.customTable.pleaseEnterSQL') },
  ],
  refreshType: [{ required: true }],
})

/**
 * @description: 编辑中间表
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
  Object.assign(formData, editFormData)
  state.sqlValidated = true
  state.editInfo = info
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
      ElMessage.success(t('dataManagement.verificationSuccessfully'))
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
const resetSQLvalidate = (newVal, preVal, type) => {
  let flag = true
  const newSql = state.aceEditorRef?.getFormatSQL(newVal)
  const preSql = state.aceEditorRef?.getFormatSQL(preVal)
  if (newSql !== preSql) {
    if (!type) state.sqlValidated = false
    flag = false
  }

  return flag
}
/**
 * @description: 保存
 * @return {*}
 */
const handleSubmit = () => {
  state.formRef.validate((valid) => {
    if (valid) {
      // 编辑(保留原有数据： 0 && sql已经改变时)
      if (
        formData.id &&
        !resetSQLvalidate(formData.sql, state.editInfo.sql, 'edit') &&
        !formData.keepHistoryData
      ) {
        state.tipDialog = true
        return
      }
      handleSave()
    }
  })
}

/**
 * @description: 提交保存数据
 * @return {*}
 */
const handleSave = () => {
  if (!state.sqlValidated) {
    ElMessage.warning(t('dataManagement.validSql'))
    return
  }
  state.submitLoading = true
  const form_data = new FormData()
  const params = {
    ...formData,
    appId: sessionStorage.getItem('appId'),
  }
  form_data.append('custom', JSON.stringify(params))
  state.tipDialog = false
  mutateCustomTable(form_data)
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

const dataChangeType = (val) => {
  if (!val) formData.keepHistoryData = false
}

const open = () => {
  state.drawerShow = true
}

const close = () => {
  state.previewData = []
  state.previewColumns = []
  Object.assign(formData, initFormData())
}

defineExpose({
  open,
  handleEdit,
})
</script>

<style lang="scss" scoped>
.preview-table {
  .table-title {
    margin-bottom: 6px;
  }
}
</style>
