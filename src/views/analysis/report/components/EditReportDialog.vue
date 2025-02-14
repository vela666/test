<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { reportBaseEdit } from '@/api/modules/analysis/report'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  row: {
    type: Object,
    default: () => {},
  },
})

const state = reactive({
  formData: {
    businessId: null,
    name: '',
    remark: '',
  },
  loading: false,
})

const formRef = ref()

const emit = defineEmits(['update:modelValue', 'close'])

const dialogVisible = computed({
  get() {
    return props.modelValue
  },
  set(val) {
    emit('update:modelValue', val)
  },
})

watch(
  () => props.row,
  (newVal) => {
    if (JSON.stringify(newVal) !== '{}') {
      const { businessId, reportName, reportDesc } = newVal
      state.formData.businessId = businessId
      state.formData.name = reportName
      state.formData.remark = reportDesc
    }
  },
  {
    deep: true,
  }
)

/**
 * @description 关闭弹框
 */
const handleDialogClose = (type) => {
  formRef.value.resetFields()
  dialogVisible.value = false
  emit('close', type)
}

/**
 * @description 弹框提交表单
 */
const handleDialogSubmit = () => {
  formRef.value.validate((valid) => {
    if (valid) {
      state.loading = true
      const params = {
        businessId: state.formData.businessId,
        name: state.formData.name,
        remark: state.formData.remark,
      }
      reportBaseEdit(params)
        .then((res) => {
          if (res && res.code === 200) {
            handleDialogClose()
          }
        })
        .finally(() => {
          state.loading = false
        })
    }
  })
}

defineOptions({
  name: 'EditReportDialog',
})
</script>
<template>
  <CommonDialog
    v-model="dialogVisible"
    width="550px"
    :title="$t('analysis.report.editReport')"
    :show-close="true"
    :need-footer="true"
    :loading="state.loading"
    @close="handleDialogClose('close')"
    @submit="handleDialogSubmit">
    <template #default>
      <el-form
        ref="formRef"
        :model="state.formData"
        label-width="auto"
        label-position="top"
        size="default">
        <el-form-item
          :label="$t('dashboard.reportName')"
          prop="name"
          :rules="[
            {
              required: true,
              message: $t('rules.enterReportName'),
              trigger: 'blur',
            },
          ]">
          <CommonInput
            v-model="state.formData.name"
            :desc="$t('common.pleaseEnter')"
            notTrimSpace
            :prefixSlot="false"
            maxlength="50"
            show-word-limit />
        </el-form-item>
        <el-form-item :label="$t('common.remark')">
          <CommonInput
            v-model="state.formData.remark"
            :desc="$t('common.pleaseEnter')"
            notTrimSpace
            :prefixSlot="false"
            maxlength="80"
            show-word-limit
            type="textarea"
            resize="none"
            :rows="5" />
        </el-form-item>
      </el-form>
    </template>
  </CommonDialog>
</template>
<style lang="scss" scoped></style>
