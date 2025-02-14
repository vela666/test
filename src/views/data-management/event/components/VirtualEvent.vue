<template>
  <CommonDrawer
    @submit="submit"
    @close="close"
    size="900px"
    :loading="state.operateLoading"
    v-model="state.showOperate"
    :title="
      state.formData.eventId
        ? $t('dataManagement.event.editVirtualEvent')
        : $t('dataManagement.event.addVirtualEvent')
    ">
    <el-form
      :rules="formRules"
      label-position="top"
      ref="formRef"
      :model="state.formData">
      <el-form-item
        prop="eventName"
        :label="$t('dataManagement.eventName')">
        <CommonInput
          :prefixSlot="false"
          trimAllSpace
          show-word-limit
          :desc="$t('common.pleaseEnter')"
          maxlength="50"
          :disabled="!!state.formData.eventId"
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
      <Condition
        :groupDefine="state.formData.virtualEventParam"
        ref="conditionRef" />
    </el-form>
  </CommonDrawer>
</template>

<script setup>
import { reactive, ref } from 'vue'
import Condition from './Condition/index.vue'
import { validIdentifierRegex } from '@/utils/validate'
import {
  asyncAddVirtual,
  asyncEditVirtualEvent,
} from '@/api/modules/data-management/event'
import { ElMessage } from 'element-plus'
import { recordBehavior } from '@/utils/record-behavior.js'
import { t } from '@/locales/i18n'

const initVal = () => {
  return {
    operateLoading: false,
    showOperate: false,
    formData: {
      virtualEventParam: '',
      eventId: '',
      eventName: '',
      eventNameZh: '',
      eventDesc: '',
      // 事件类型（1自定义事件，2预定义事件，3虚拟事件）
      eventType: 3,
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
        if (!validIdentifierRegex(val)) {
          callback(new Error(t('dataManagement.eventNameRules')))
          return
        }
        callback()
      },
      trigger,
    },
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
const conditionRef = ref(null)

const close = () => {
  Object.assign(state, initVal())
}

const submit = () => {
  formRef.value.validate(async (valid) => {
    if (!valid) return
    try {
      const params = {
        ...state.formData,
      }
      try {
        const val = await conditionRef.value.getResult()
        params.virtualEventParam = JSON.stringify(val)
      } catch (err) {
        ElMessage.warning(err)
        return
      }

      const bool = Number.isInteger(params.eventId)
      if (!bool) {
        recordBehavior({
          moduleName: '数据管理',
          submoduleName: '事件管理',
          operate: '新增虚拟事件',
        })
      }
      state.operateLoading = true
      const fn = bool ? asyncEditVirtualEvent : asyncAddVirtual
      await fn(params)
      state.showOperate = false
      ElMessage.success(
        bool ? t('common.editedSuccessfully') : t('common.newSuccessfullyAdded')
      )
      emit('getData')
    } catch (e) {
      console.log(e)
    }
    state.operateLoading = false
  })
}

const open = (data) => {
  if (data) {
    Object.keys(data).forEach((k) => {
      if (Reflect.has(state.formData, k)) {
        state.formData[k] = data[k]
      }
    })
  }
  state.showOperate = true
}

defineExpose({
  open,
})
defineOptions({
  name: 'VirtualEvent',
})
</script>
