<template>
  <CommonDrawer
    @submit="submit"
    @close="close"
    size="600px"
    :loading="state.operateLoading"
    v-model="state.showOperate"
    :title="$t('dataManagement.event.editCustomEvents')">
    <el-form
      :rules="formRules"
      label-position="top"
      ref="formRef"
      :model="state.formData">
      <el-form-item :label="$t('dataManagement.eventType')">
        <el-select v-model="state.formData.eventType" disabled>
          <el-option
            v-for="item of Object.keys(eventTypeListMap)"
            :key="item"
            :value="+item"
            :label="eventTypeListMap[item]" />
        </el-select>
      </el-form-item>
      <el-form-item :label="$t('dataManagement.eventName')">
        <CommonInput
          :prefixSlot="false"
          disabled
          v-model="state.formData.eventName" />
      </el-form-item>
      <el-form-item
        prop="eventNameZh"
        :label="$t('dataManagement.displayName')">
        <CommonInput
          :prefixSlot="false"
          trimAllSpace
          show-word-limit
          :desc="$t('common.pleaseEnter')"
          maxlength="50"
          v-model="state.formData.eventNameZh" />
      </el-form-item>
      <el-form-item :label="$t('common.description')">
        <CommonInput
          :prefixSlot="false"
          maxlength="200"
          show-word-limit
          :desc="$t('common.pleaseEnter')"
          :rows="7"
          type="textarea"
          resize="none"
          v-model="state.formData.eventDesc" />
      </el-form-item>
    </el-form>
  </CommonDrawer>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { eventTypeListMap } from '@/enumeration/data-management/event'
import { asyncEditCustomEvent } from '@/api/modules/data-management/event'
import { t } from '@/locales/i18n'

const initVal = () => {
  return {
    columns: [],
    operateLoading: false,
    showOperate: false,
    formData: {
      eventId: '',
      eventType: '',
      eventName: '',
      eventNameZh: '',
      eventDesc: '',
    },
  }
}
const trigger = ['blur', 'change']
const formRules = {
  eventNameZh: [
    {
      required: true,
      message: t('common.pleaseEnter'),
      trigger,
    },
  ],
}

const emit = defineEmits(['getData'])
const state = reactive(initVal())
const formRef = ref(null)

const close = () => {
  Object.assign(state, initVal())
}

const submit = () => {
  formRef.value.validate(async (valid) => {
    if (!valid) return
    state.operateLoading = true
    await asyncEditCustomEvent(state.formData).finally((_) => {
      state.operateLoading = false
    })
    state.showOperate = false
    ElMessage.success(t('common.editedSuccessfully'))
    emit('getData')
  })
}

const open = (data) => {
  state.showOperate = true
  Object.keys(state.formData).forEach((k) => {
    state.formData[k] = data[k]
  })
}

defineExpose({
  open,
})
defineOptions({
  name: 'EditCustomEvent',
})
</script>
