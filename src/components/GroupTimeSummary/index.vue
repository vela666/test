<script setup>
import { computed, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps({
  placement: {
    type: String,
    default: 'bottom-start',
  },
  modelValue: {
    type: String,
    default: 'day',
  },
})
const emit = defineEmits(['update:modelValue'])

const timeType = computed({
  get: () => props.modelValue,
  set: (val) => {
    emit('update:modelValue', val)
  },
})

if (!props.modelValue) {
  timeType.value = 'day'
}

const groupTimeOptions = [
  { label: t('common.byDay'), value: 'day' },
  { label: t('common.byHour'), value: 'hour' },
  { label: t('common.byMonth'), value: 'month' },
]

onBeforeUnmount(() => {
  timeType.value = ''
})

defineOptions({
  name: 'GroupTimeSummary',
})
</script>

<template>
  <div class="group-time-summary">
    <el-popover trigger="click" :width="170" :placement="placement">
      <template #reference>
        <div class="group-summary">
          <svg-icon name="setting"></svg-icon>
        </div>
      </template>
      <div class="group-summary-box">
        <div class="mr5">{{ $t('analysis.summaryGranularity') }}:</div>
        <el-select v-model="timeType" style="width: 140px">
          <el-option
            v-for="op in groupTimeOptions"
            :key="op.value"
            :label="op.label"
            :value="op.value" />
        </el-select>
      </div>
    </el-popover>
  </div>
</template>

<style scoped lang="scss">
.group-time-summary {
  display: inline-flex;
}
.group-summary-box {
  display: flex;
  flex-direction: column;
}
</style>
