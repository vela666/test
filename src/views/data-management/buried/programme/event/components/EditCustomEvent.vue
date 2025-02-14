<template>
  <CommonDrawer
    @submit="submit"
    @close="close"
    size="600px"
    :loading="state.operateLoading"
    v-model="state.showOperate"
    :title="$t('btn.edit')">
    <el-form
      :rules="formRules"
      label-position="top"
      ref="formRef"
      :model="state.formData">
      <el-form-item :label="$t('dataManagement.eventName')" prop="eventName">
        <CommonInput
          trimAllSpace
          maxlength="50"
          show-word-limit
          :prefixSlot="false"
          v-model="state.formData.eventName" />
      </el-form-item>
      <el-form-item
        prop="eventNameZh"
        :label="$t('dataManagement.displayName')">
        <CommonInput
          :prefixSlot="false"
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
import { asyncUpdateEvent } from '@/api/modules/programme/event'
import { validIdentifierRegex } from '@/utils/validate'
import { t } from '@/locales/i18n'

const initVal = () => {
  return {
    operateLoading: false,
    showOperate: false,
    formData: {
      eventId: '',
      eventName: '',
      eventNameZh: '',
      eventDesc: '',
    },
  }
}
const trigger = ['blur', 'change']
const formRules = {
  eventName: [
    {
      required: true,
      message: t('dataManagement.eventNameRules'),
      trigger,
    },
    {
      validator: (rule, value, callback) => {
        const val = value + ''
        if (val.length > 50) {
          callback(new Error(t('dataManagement.upToCharacters', [50])))
          return
        }
        if (!validIdentifierRegex(val)) {
          callback(new Error(t('dataManagement.eventNameRules')))
          return
        }
        callback()
      },
      trigger,
    },
    // { min: 1, max: 50, message: '最多50字符', trigger },
  ],
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
    await asyncUpdateEvent(state.formData).finally((_) => {
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
