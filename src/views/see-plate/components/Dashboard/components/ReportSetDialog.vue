<template>
  <CommonDialog
    @submit="submit"
    v-model="state.show"
    :title="t('dashboard.reportSettings')"
    @close="close">
    <template #default>
      <OperateTip class="mb15">
        {{ t('dashboard.settingsAffectSharedMembers') }}
      </OperateTip>
      <div class="flex-center mb15 gap10">
        <div class="nd-title">{{ t('dashboard.editReportSettings') }}</div>
        <span class="c545e6e">{{ t('dashboard.reportUpdateOnEdit') }}</span>
      </div>
      <el-form
        :rules="formRules"
        label-position="top"
        label-width="100px"
        :model="state.formData"
        ref="formRef">
        <el-form-item prop="reportName" :label="t('dashboard.reportName')">
          <CommonInput
            :prefixSlot="false"
            maxlength="50"
            show-word-limit
            v-model="state.formData.reportName" />
        </el-form-item>
        <el-form-item prop="reportDesc" :label="t('common.remark')">
          <CommonInput
            :prefixSlot="false"
            :rows="6"
            maxlength="80"
            show-word-limit
            resize="none"
            type="textarea"
            v-model="state.formData.reportDesc" />
        </el-form-item>
        <div class="flex-center mb15 gap10">
          <div class="nd-title">{{ t('dashboard.editChartSettings') }}</div>
          <span class="c545e6e">{{ t('dashboard.chartStyleUpdate') }}</span>
        </div>

        <el-form-item
          :label="t('dashboard.chartType')"
          prop="graphType"
          class="nd-report-size">
          <ChartType
            :data="state.formData.chartTypeList"
            v-model="state.formData.graphType" />
        </el-form-item>
        <el-form-item :label="t('dashboard.windowSize')" prop="viewSizeType">
          <el-radio-group v-model="state.formData.viewSizeType">
            <!-- reportType 事件/用户分析 -->
            <el-radio
              v-if="
                (state.formData.reportType === 1 ||
                  state.formData.reportType === 4) &&
                state.formData.isMini
              "
              :value="1"
              >{{ t('dashboard.smallChart') }}
            </el-radio>
            <el-radio :value="2">{{ t('dashboard.mediumChart') }}</el-radio>
            <el-radio :value="3">{{ t('dashboard.largeChart') }}</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
    </template>
  </CommonDialog>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { asyncReportSetting } from '@/api/modules/see-plate/index.js'
import ChartType from '@/views/analysis/components/AnalysisMain/ChartType.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const emit = defineEmits(['close', 'updReport'])

const trigger = ['blur', 'change']
const formRules = {
  reportName: [
    { required: true, trigger, message: t('common.pleaseEnter') },
    { min: 1, max: 50, message: t('rules.length1To50', [t('common.name')]) },
  ],
  // reportDesc: [{ required: true, trigger, message: '请输入' }],
}

const initVal = () => {
  return {
    show: false,
    loading: false,
    formData: {
      reportName: '',
      reportDesc: '',
      graphType: '',
      // 1 小图，2中图，3大图
      viewSizeType: '',
      isMini: false,
    },
  }
}

const formRef = ref(null)

const state = reactive(initVal())

const close = () => {
  Object.assign(state, initVal())
}

const submit = () => {
  formRef.value.validate(async (valid) => {
    if (!valid) return
    state.loading = true
    const params = {
      businessId: state.formData.businessId,
      dashboardBusinessId: state.formData.dashboardBusinessId,
      dataType: 1,
      graphType: state.formData.graphType,
      moduleType: state.formData.moduleType,
      name: state.formData.reportName,
      reportDesc: state.formData.reportDesc,
      viewSize: state.formData.viewSizeType,
    }
    const { data } = await asyncReportSetting(params).finally((_) => {
      state.loading = false
    })
    ElMessage.success(t('common.operationSuccessfully'))
    // 更新本地的数据
    emit('updReport', {
      businessId: state.formData.businessId,
      graphType: state.formData.graphType,
      reportDesc: state.formData.reportDesc,
      reportName: data,
      viewSizeType: state.formData.viewSizeType,
    })
    state.show = false
  })
}
const open = (params) => {
  Object.assign(state.formData, params)
  dashboardResetChartType(params)
  state.formData.viewSizeType =
    params.newW === 3 ? 1 : params.newW === 6 ? 2 : 3
  // state.formData.viewSizeType = params.viewSizeType
  state.show = true
}

// 如果报表中保存的图表类型不在当前的图表类型列表中，就取图表类型列表值中的第一个
const dashboardResetChartType = (params = {}) => {
  console.log(params, 'dashboardResetChartType')
  const { chartTypeList = [], graphType } = params
  const find = chartTypeList?.find(
    (el) => el.value == graphType && el.disabled != true
  )
  if (!find) {
    state.formData.graphType =
      chartTypeList?.filter((el) => el.disabled != true)?.[0]?.value ??
      graphType
  }
}

defineExpose({
  open,
})
defineOptions({
  name: 'ReportSetDialog',
})
</script>
<style lang="scss" scoped></style>
