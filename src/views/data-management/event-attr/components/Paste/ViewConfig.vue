<template>
  <CommonDialog
    v-model="state.show"
    :title="$t('user.viewConfig')"
    @submit="submit"
    width="960px">
    <div
      class="c1c2028 fz12 p10 mb10 w100-percentage line-h-1-dot-5"
      style="background-color: var(--eas-color-primary-light-1)"
      v-html="
        $t('dataManagement.eventAttr.sqlContentTips').replace(/\n/g, '<br />')
      "></div>
    <!-- <p>SQL表达式中必须以:</p>
      <p>event.xxx 表示事件表，users.xxx表示用户表</p>
      <p>
        dim1_属性名.xxx表示事件属性维度表，dim2_属性名.xxx表示用户属性维度表
      </p> -->
    <AceEditor
      type="2"
      @change="editorChange"
      v-model="state.rowData.sql"
      @validateSQL="validateSQL"
      :loading="state.sqlLoading"
      toolbar
      :verifyBtnDisabled="!(state.rowData.sql && state.rowData.fType)"
      ref="aceEditorRef" />
  </CommonDialog>
</template>

<script setup>
import { computed, watch, reactive, ref, onActivated } from 'vue'
import { asyncVerifySql } from '@/api/modules/data-management/common'
import { ElMessage } from 'element-plus'
import { t } from '@/locales/i18n'

const emit = defineEmits(['updSql'])

const props = defineProps({
  // 1是事件属性 2是用户属性
  type: {
    type: String,
    default: '1',
  },
})

const state = reactive({
  show: false,
  sqlLoading: false,
  rowData: {},
})
const editorChange = () => {
  state.rowData.referField = ''
}

const validateSQL = async () => {
  state.rowData.referField = ''
  state.sqlLoading = true
  const { data } = await asyncVerifySql({
    sql: state.rowData.sql,
    tableType: +props.type,
    type: state.rowData.fType,
  }).finally((_) => {
    state.sqlLoading = false
  })
  ElMessage.success(t('user.SqlVerificationSuccessful'))
  state.rowData.referField = data
}

const submit = () => {
  if (!state.rowData.referField) {
    ElMessage.warning(t('dataManagement.validSql'))
    return
  }
  emit('updSql', state.rowData)
  state.show = false
}

const open = (val) => {
  state.rowData = val
  state.show = true
}

defineExpose({
  open,
})
defineOptions({
  name: 'ViewConfig',
})
</script>

<style scoped lang="scss"></style>
