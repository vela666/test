<template>
  <CommonDialog
    v-model="state.show"
    :title="t('common.scheduledUpdate')"
    :loading="state.operatLoading"
    @submit="submit"
    @close="close">
    <div class="flex-column gap10">
      <el-switch
        v-model="state.formData.switchStatus"
        :active-value="1"
        :inactive-value="2"
        :active-text="t('dashboard.enableScheduledUpdate')" />
      <p>{{ t('dashboard.cacheExpiry') }}</p>
      <template v-if="state.formData.switchStatus === 1">
        <div>{{ t('dashboard.selectUpdateTime') }}</div>
        <div class="flex-center gap10">
          <el-select
            v-model="state.formData.cycle"
            :placeholder="t('common.pleaseSelect')">
            <el-option
              v-for="item of cycleList"
              :key="item.value"
              :label="item.label"
              :value="item.value" />
          </el-select>
          <!--          <el-select
            v-if="state.formData.cycle === 2"
            v-model="state.formData.cycleTime"
            placeholder="请选择">
            <el-option
              v-for="item of weekList"
              :key="item.value"
              :label="item.label"
              :value="item.value" />
          </el-select>
          <el-select
            v-if="state.formData.cycle === 3"
            v-model="state.formData.cycleTime"
            placeholder="请选择">
            <el-option
              v-for="item of dayList"
              :key="item.value"
              :label="item.label"
              :value="item.value" />
          </el-select>-->
          <el-select
            v-model="state.formData.hour"
            :placeholder="t('common.pleaseSelect')">
            <el-option
              v-for="item of hourList"
              :key="item.value"
              :label="item.label"
              :value="item.value" />
          </el-select>
        </div>
      </template>
    </div>
  </CommonDialog>
</template>

<script setup>
import { reactive } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  asyncScheduleJob,
  asyncScheduleJobInfo,
} from '@/api/modules/see-plate/dashboard'
import { useI18n } from 'vue-i18n'
import CommonDialog from '@/components/CommonDialog/index.vue'

const route = useRoute()

const { t } = useI18n()

const initVal = () => {
  return {
    operatLoading: false,
    formData: {
      cycle: 1,
      // cycleTime: '',
      hour: '07:00',
      switchStatus: 2,
      // businessId: route.query.kanBanId,
      dataType: 1,
      jobId: '',
      // moduleType: route.query.moduleType,
    },
    show: false,
  }
}
const cycleList = [
  { value: 1, label: t('common.byDay') },
  /* { value: 2, label: '按周' },
  { value: 3, label: '按月' } */
]
const hourList = [
  { value: '07:00', label: '07:00-09:00' },
  { value: '12:00', label: '12:00-14:00' },
]
/*

const weekList = [
  { value: 1, label: '周一' },
  { value: 2, label: '周二' },
  { value: 3, label: '周三' },
  { value: 4, label: '周四' },
  { value: 5, label: '周五' },
  { value: 6, label: '周六' },
  { value: 7, label: '周日' },
]

const dayList = [
  { value: '1', label: '1日' },
  { value: '5', label: '5日' },
  { value: '10', label: '10日' },
  { value: '15', label: '15日' },
  { value: '20', label: '20日' },
  { value: '25', label: '25日' },
  { value: 'L', label: '每月最后一天' },
]
*/

const state = reactive(initVal())

const close = () => {
  Object.assign(state, initVal())
}

const submit = async () => {
  state.operatLoading = true
  await asyncScheduleJob({
    ...state.formData,
    businessId: route.query.kanBanId,
    moduleType: route.query.moduleType,
    executeTimeRange: hourList.find(
      (item) => item.value === state.formData.hour
    ).label,
  }).finally((_) => {
    state.operatLoading = false
  })
  ElMessage.success(t('common.operationSuccessfully'))
  state.show = false
}

const open = async () => {
  state.show = true
  state.operatLoading = true
  const { data } = await asyncScheduleJobInfo(route.query.kanBanId).finally(
    (_) => {
      state.operatLoading = false
    }
  )
  if (data) Object.assign(state.formData, data)
}

defineExpose({
  open,
})
defineOptions({
  name: 'UpdateRegularly',
})
</script>

<style scoped lang="scss"></style>
