<script setup>
import { ref } from 'vue'
defineOptions({
  name: 'ShowChartLabel',
})
const emit = defineEmits(['update:modelValue', 'updChart'])
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  showBorder: {
    type: Boolean,
    default: true,
  },
  show: {
    type: Boolean,
    default: true,
  },
})
const switchShowVal = () => {
  emit('update:modelValue', !props.modelValue)
  emit('updChart', !props.modelValue, 'showChartLabel')
}
</script>

<template>
  <el-tooltip
    effect="dark"
    :content="`${modelValue ? $t('analysis.sqlquery.hideNumerical') : $t('analysis.sqlquery.displayNumerical')}`"
    :hide-after="0"
    placement="top"
    v-if="show">
    <div :class="['chart-label-panel', { 'no-border': !showBorder }]">
      <svg-icon
        :name="modelValue ? 'view' : 'hide'"
        class="chart-label__icon"
        @click="switchShowVal"></svg-icon>
    </div>
  </el-tooltip>
</template>

<style scoped lang="scss">
.chart-label-panel {
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--eas-text-color-light);
  border-radius: var(--eas-border-radius-4);
  border: 1px solid var(--eas-text-color-light-1);
  &.no-border {
    border: none;
  }
}
.chart-label__icon {
  width: 18px;
  height: 18px;
}
</style>
