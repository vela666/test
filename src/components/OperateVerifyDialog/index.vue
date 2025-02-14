<template>
  <TipDialog
    :loading="state.loading"
    @submit="submit"
    v-model="state.show"
    @close="close"
    v-bind="attrs"
    :btnSwap="btnSwap">
    <template #header>
      {{ state.title }}
    </template>
    <div class="mb10" v-if="!html">{{ state.content }}</div>
    <div class="mb10" v-html="state.content" v-else></div>
    <el-form
      :rules="formRules"
      label-position="top"
      label-width="100px"
      :model="state.formData"
      ref="formRef">
      <el-form-item prop="content">
        <template #label>
          <span>
            {{ t('common.pleaseEnter') }} “<i class="cff7d00">{{
              state.verifyText
            }}</i
            >” ，{{ t('common.completeVerification') }}
          </span>
        </template>
        <CommonInput :prefixSlot="false" v-model="state.formData.content" />
      </el-form-item>
    </el-form>
  </TipDialog>
</template>

<script setup>
import { reactive, ref, useAttrs } from 'vue'
import { useI18n } from 'vue-i18n'
// 二次输入验证确认操作对话框
/*
 使用
 inputValidationDialogRef.value.open({
  title: `标题`,
  verifyText: '啦啦啦',
  content: `提示`,
  close() {},
  async submit() {
    console.log('确认')
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve()
      }, 3000)
    })
  },
})*/
const attrs = useAttrs()
const props = defineProps({
  btnSwap: {
    type: Boolean,
    default: true,
  },
  html: {
    type: Boolean,
    default: false,
  },
})

const { t } = useI18n()

const validateText = (rule, value, callback) => {
  if (value !== state.verifyText) {
    callback(new Error(t('rules.validationFailed')))
    return
  }
  callback()
}

const formRules = {
  content: [
    { required: true, trigger: ['blur', 'change'], validator: validateText },
  ],
}

const formRef = ref(null)

const initVal = () => {
  return {
    show: false,
    title: '',
    content: '',
    verifyText: '',
    loading: false,
    submit() {},
    close() {},
    formData: {
      content: '',
    },
  }
}
const state = reactive(initVal())

const close = () => {
  state.close()
  Object.assign(state, initVal())
}

const open = (val) => {
  Object.assign(state, val)
  state.show = true
}

const submit = () => {
  formRef.value.validate(async (valid) => {
    if (!valid) return
    state.loading = true
    await state.submit()?.finally(() => {
      state.loading = false
    })
    state.show = false
  })
}
defineExpose({
  open,
})

defineOptions({
  name: 'OperateVerifyDialog',
})
</script>
