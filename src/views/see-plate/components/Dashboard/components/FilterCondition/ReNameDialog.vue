<template>
  <CommonDialog
    v-model="state.show"
    :title="t('btn.rename')"
    :loading="state.operatLoading"
    @submit="submit"
    @close="close">
    <el-form
      :rules="formRules"
      label-position="top"
      label-width="100px"
      :model="state.formData"
      ref="formRef">
      <el-form-item prop="name" :label="t('common.name')">
        <CommonInput
          show-word-limit
          maxlength="50"
          :prefixSlot="false"
          v-model="state.formData.name" />
      </el-form-item>
    </el-form>
  </CommonDialog>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { asyncEditFavorite } from '@/api/modules/see-plate/filter-favorite.js'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const initVal = () => {
  return {
    show: false,
    operatLoading: false,
    formData: {
      name: '',
    },
  }
}

const emit = defineEmits(['getData'])
const formRef = ref(null)
const state = reactive(initVal())
const formRules = {
  name: [
    { required: true, message: t('common.pleaseEnter') },
    { min: 1, max: 50, message: t('rules.length1To50', [t('common.name')]) },
  ],
}

const close = () => {
  Object.assign(state, initVal())
}
const submit = () => {
  formRef.value.validate(async (valid) => {
    if (!valid) return
    state.operatLoading = true
    await asyncEditFavorite({
      businessId: state.formData.businessId,
      favoriteId: state.formData.id,
      filter: state.formData.filter,
      name: state.formData.name,
    }).finally((_) => {
      state.operatLoading = false
    })
    ElMessage.success(t('common.operationSuccessfully'))
    state.show = false
    emit('getData')
  })
}
const open = (data) => {
  state.show = true
  Object.assign(state.formData, data)
}

defineExpose({
  open,
})
defineOptions({
  name: 'ReNameDialog',
})
</script>

<style scoped lang="scss"></style>
