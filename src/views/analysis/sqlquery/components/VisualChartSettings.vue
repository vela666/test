<script setup>
import { debounce } from 'lodash-es'
import { ref, reactive, computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => {},
  },
})

const emit = defineEmits(['update:modelValue'])

const settings = computed({
  get: () => {
    return props.modelValue
  },
  set: (val) => {
    emit('update:modelValue', val)
  },
})

const inputDebounce = debounce(() => {
  const reg = /^\D*(\d*(?:\.\d{0,4})?).*$/g
  let valYMin = settings.value.y.min
  valYMin = String(valYMin)
    .replace(/^0{1,}/g, '0')
    .replace(/^\./g, '0.')
  valYMin = valYMin.replace(reg, '$1')
  if (valYMin === undefined || valYMin === null) {
    valYMin = 0
  }

  let valYMax = settings.value.y.max
  valYMax = String(valYMax)
    .replace(/^0{1,}/g, '0')
    .replace(/^\./g, '0.')
  valYMax = valYMax.replace(reg, '$1')
  if (valYMax <= 0) {
    valYMax = 1
  }

  let valRYMin = settings.value.ry.min
  valRYMin = String(valRYMin)
    .replace(/^0{1,}/g, '0')
    .replace(/^\./g, '0.')
  valRYMin = valRYMin.replace(reg, '$1')
  if (valRYMin === undefined || valRYMin === null) {
    valRYMin = 0
  }

  let valRYMax = settings.value.ry.max
  valRYMax = String(valRYMax)
    .replace(/^0{1,}/g, '0')
    .replace(/^\./g, '0.')
  valRYMax = valRYMax.replace(reg, '$1')
  if (valRYMax <= 0) {
    valRYMax = 1
  }
  settings.value.y.min = valYMin
  settings.value.y.max = valYMax
  settings.value.ry.min = valRYMin
  settings.value.ry.max = valRYMax
}, 500)

defineOptions({
  name: 'ChartSettings',
})
</script>
<template>
  <div class="chart-settings">
    <!-- Y轴 / 指标 -->
    <div class="chart-settings-header">
      {{ $t('analysis.sqlquery.yAxis') }} / {{ $t('analysis.indicators') }}
    </div>
    <div class="flex-center mb20">
      <div class="mr20">{{ $t('analysis.sqlquery.max') }}</div>
      <CommonInput
        v-model="settings.y.max"
        :prefixSlot="false"
        :maxlength="10"
        show-word-limit
        class="w180"
        :disabled="settings.y.maxAuto"
        @input="inputDebounce" />
      <el-checkbox v-model="settings.y.maxAuto" class="ml20">{{
        $t('analysis.sqlquery.auto')
      }}</el-checkbox>
    </div>
    <div class="flex-center mb20">
      <div class="mr20">{{ $t('analysis.sqlquery.min') }}</div>
      <CommonInput
        v-model="settings.y.min"
        :prefixSlot="false"
        :maxlength="10"
        show-word-limit
        class="w180"
        :disabled="settings.y.minAuto"
        @input="inputDebounce" />
      <el-checkbox v-model="settings.y.minAuto" class="ml20">{{
        $t('analysis.sqlquery.auto')
      }}</el-checkbox>
    </div>
    <div class="flex-center mb20">
      <div class="mr20">{{ $t('analysis.sqlquery.displayMode') }}</div>
      <el-radio-group v-model="settings.y.valueDisplaySelect" class="ml-4">
        <el-radio :value="1" size="large">{{
          $t('analysis.sqlquery.realDisplay')
        }}</el-radio>
        <el-radio :value="2" size="large">{{
          $t('analysis.sqlquery.percentageDisplay')
        }}</el-radio>
      </el-radio-group>
    </div>
    <!-- 次Y轴 / 指标 -->
    <div class="chart-settings-header mt40">
      {{ $t('analysis.sqlquery.secondaryYAxis') }} / {{ $t('analysis.indicators') }}
    </div>
    <div class="flex-center mb20">
      <div class="mr20">{{ $t('analysis.sqlquery.max') }}</div>
      <CommonInput
        v-model="settings.ry.max"
        :prefixSlot="false"
        :maxlength="10"
        show-word-limit
        class="w180"
        :disabled="settings.ry.maxAuto"
        @input="inputDebounce" />
      <el-checkbox v-model="settings.ry.maxAuto" class="ml20">
        {{ $t('analysis.sqlquery.auto') }}
      </el-checkbox>
    </div>
    <div class="flex-center mb20">
      <div class="mr20">{{ $t('analysis.sqlquery.min') }}</div>
      <CommonInput
        v-model="settings.ry.min"
        :prefixSlot="false"
        :maxlength="10"
        show-word-limit
        class="w180"
        :disabled="settings.ry.minAuto"
        @input="inputDebounce" />
      <el-checkbox v-model="settings.ry.minAuto" class="ml20">{{
        $t('analysis.sqlquery.auto')
      }}</el-checkbox>
    </div>
    <div class="flex-center mb20">
      <div class="mr20">{{ $t('analysis.sqlquery.displayMode') }}</div>
      <el-radio-group v-model="settings.ry.valueDisplaySelect" class="ml-4">
        <el-radio :value="1" size="large">{{
          $t('analysis.sqlquery.realDisplay')
        }}</el-radio>
        <el-radio :value="2" size="large">{{
          $t('analysis.sqlquery.percentageDisplay')
        }}</el-radio>
      </el-radio-group>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.chart-settings {
  font-size: 14px;
  width: 530px;
  padding: 0 20px;
  overflow: auto;
  &-header {
    height: 20px;
    line-height: 20px;
    margin-bottom: 10px;
    font-weight: bold;
    color: var(--eas-text-color-light);
  }
  .mt40 {
    margin-top: 40px;
  }
}
</style>
