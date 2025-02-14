<template>
  <CommonDialog
    width="700px"
    v-model="state.show"
    :loading="state.operatLoading"
    @submit="submit"
    @close="close">
    <template #header>
      {{ t('dashboard.setAsDefaultFilter') }}
      <Tooltip>
        <SvgIcon name="help2" class="c86919d" />
        <template #content>
          {{ t('dashboard.setAsDefaultFilterTip') }}</template
        >
      </Tooltip>
    </template>

    <el-radio-group class="mb20" v-model="state.formData.type">
      <el-radio :value="2">{{ t('dashboard.setAsPersonalDefault') }} </el-radio>
      <el-radio :value="1">
        {{ t('dashboard.setAsGlobalDefault') }}
      </el-radio>
    </el-radio-group>
    <OperateTip>
      {{ t('dashboard.defaultFilterReplaceWarning') }}
    </OperateTip>
  </CommonDialog>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { asyncDefaultSetFilter } from '@/api/modules/see-plate/filter-favorite.js'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const initVal = () => {
  return {
    show: false,
    operatLoading: false,
    formData: {
      type: 2,
    },
  }
}
const emit = defineEmits(['getData'])
const formRef = ref(null)
const state = reactive(initVal())

const close = () => {
  Object.assign(state, initVal())
}
const submit = async () => {
  state.operatLoading = true
  await asyncDefaultSetFilter({
    businessId: state.formData.businessId,
    defaultSet: true,
    favoriteId: state.formData.id,
    type: state.formData.type,
  }).finally((_) => {
    state.operatLoading = false
  })
  ElMessage.success(
    t('dashboard.defaultSettingSuccess', [
      t(`dashboard.${state.formData.type === 1 ? 'global' : 'personal'}`),
    ])
  )
  state.show = false
  emit('getData')
}
const open = (data) => {
  state.show = true
  Object.assign(state.formData, data)
}

defineExpose({
  open,
})
defineOptions({
  name: 'SetAsDefaultDialog',
})
</script>

<style scoped lang="scss"></style>
