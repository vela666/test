<template>
  <CommonDialog
    v-model="state.show"
    :title="$t('dataManagement.eventAttr.presetValue')"
    @submit="submit"
    @close="close"
    alignCenter
    :loading="state.operateLoading">
    <!--    <div class="c545e6e fz14 flex-center gap20 mb20">
      <div>属性名：{{ state.rowData.fEn }}</div>
      <div>显示名：{{ state.rowData.fZh }}</div>
    </div>-->
    <div class="c545e6e fz14">
      {{ $t('dataManagement.eventAttr.presetValue') }}
    </div>

    <CommonInput
      v-model="state.presetValueText"
      type="textarea"
      resize="none"
      :rows="6"
      :desc="$t('dataManagement.eventAttr.presetPlaceholder')" />
    <el-checkbox
      :true-value="1"
      :false-value="0"
      v-model="state.showPreset"
      class="mt10">
      <span style="white-space: pre-wrap">{{
        $t('dataManagement.eventAttr.presetCheckbox')
      }}</span>
    </el-checkbox>
  </CommonDialog>
</template>

<script setup>
import { computed, watch, reactive, ref, onActivated, markRaw } from 'vue'
import { ElMessage } from 'element-plus'
import { asyncSavePresetValue } from '@/api/modules/data-management/event-attr'
import { t } from '@/locales/i18n'

const emit = defineEmits(['getData'])
const initVal = () => {
  return {
    show: false,
    operateLoading: false,
    rowData: {},
    presetValueText: '',
    // 预设值显示： 0 都显示 1 只显示预设值
    showPreset: 0,
  }
}

const state = reactive(initVal())

const close = () => {
  Object.assign(state, initVal())
}

const submit = async () => {
  const presetValueText = state.presetValueText
  let valueArr = presetValueText
    .trim()
    .split('\n')
    .map((el) => el.trim())
    .filter((el) => Boolean)
  valueArr = [...new Set(valueArr)]
  if (valueArr.length > 100) {
    ElMessage.warning(t('dataManagement.eventAttr.presetMax'))
    return
  }

  state.operateLoading = true
  await asyncSavePresetValue({
    fId: state.rowData.fId,
    dataType: state.rowData.fType,
    presetValue: valueArr.join('::'),
    showPreset: state.showPreset,
  }).finally((_) => {
    state.operateLoading = false
  })
  ElMessage.success(t('common.addedSuccessfully'))
  state.show = false
  emit('getData')
}

const open = (data) => {
  state.show = true
  state.showPreset = data.showPreset
  state.presetValueText = (data.presetValue || '').split('::').join('\n')
  state.rowData = markRaw(data)
}

defineExpose({
  open,
})

defineOptions({
  name: 'PresetValue',
})
</script>

<style scoped lang="scss"></style>
