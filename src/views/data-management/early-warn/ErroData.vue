<template>
  <CommonDrawer
    @submit="submit"
    @close="close"
    size="600px"
    :loading="state.loading"
    v-model="state.visible"
    :title="$t('dataManagement.earlyWarn.editEarlyWarning')">
    <el-form
      :rules="formRules"
      label-position="top"
      ref="formRef"
      :model="state.formData"
      @submit.prevent>
      <el-form-item
        :label="$t('dataManagement.earlyWarn.taskName')"
        prop="warnName">
        <CommonInput
          v-model="state.formData.warnName"
          disabled
          :prefixSlot="false" />
      </el-form-item>
      <el-form-item
        :label="$t('dataManagement.earlyWarn.thresholdSetting')"
        prop="timeZone"
        required>
        <div class="flex-center flex-warp">
          {{ $t('dataManagement.earlyWarn.thresholdSettingTip') }}
          <el-input
            @change="(v) => numInput(v)"
            v-model="state.formData.param.warnRate"
            class="w50 ml3 mr3" />
          {{ $t('dataManagement.earlyWarn.thresholdSettingByHour') }}
        </div>
      </el-form-item>
      <el-form-item
        :label="$t('dataManagement.earlyWarn.reminderMethod')"
        prop="sendSet">
        <el-checkbox v-model="state.sendSet" disabled>
          {{ $t('dataManagement.earlyWarn.systemMessage') }}
        </el-checkbox>
      </el-form-item>
    </el-form>
  </CommonDrawer>
</template>

<script setup>
import { nextTick, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { asyncEditErrorTestData } from '@/api/modules/data-management/early'
import { numberInputProcessing } from '@/utils/index.js'
import { t } from '@/locales/i18n'

const emit = defineEmits(['getList'])
const initVal = () => {
  return {
    visible: false,
    loading: false,
    sendSet: true,
    formData: {
      warnName: '',
      param: { warnRate: 1, warnRateUnit: 'hour', warnThreshold: 5001 },
      earlyWarnSendSetList: [],
    },
  }
}
const state = reactive(initVal())

const formRef = ref()

const formRules = {
  warnName: [
    {
      required: true,
      max: 50,
      message: t('dataManagement.earlyWarn.enterTaskName'),
      trigger: 'blur',
    },
  ],
}

const numInput = (v) => {
  let val = numberInputProcessing({ v, decimal: 0, initial: 1 })
  state.formData.param.warnRate = Math.max(1, Math.min(val, 24))
}

const submit = () => {
  formRef.value.validate(async (valid) => {
    if (!valid) return
    state.loading = true
    await asyncEditErrorTestData({
      ...state.formData,
      // 目前固定
      earlyWarnSendSetList: [
        {
          ...state.formData.earlyWarnSendSetList[0],
          sendType: 5,
          sendValue: 'system',
        },
      ],
      value: state.formData.param.warnThreshold,
      param: JSON.stringify(state.formData.param),
    }).finally((_) => {
      state.loading = false
    })
    emit('getList')
    state.visible = false
    ElMessage.success(t('dataManagement.earlyWarn.successfullySaved'))
  })
}

const close = () => {
  Object.assign(state, initVal())
}

const open = (data) => {
  state.visible = true
  Object.assign(state.formData, data)
  state.formData.param = JSON.parse(data.param)
}

defineExpose({ open })

defineOptions({
  name: 'ErroData',
})
</script>

<style lang="scss" scoped></style>
