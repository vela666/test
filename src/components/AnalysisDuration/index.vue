<template>
  <div class="analysis-duration mt20 ml10 mr10 eas-block-container">
    <div class="analysis-duration__title mb5 ml10">
      {{ title }}
      <el-tooltip :content="tip" placement="right" v-if="tip">
        <svg-icon name="warning2" class="c86919d" />
      </el-tooltip>
    </div>
    <div
      class="analysis-duration__input analysis-hover__bg pl10 eas-filter-container flex-center">
      <slot name="left"></slot>
      <el-input-number
        @change="numberChange"
        v-model="selected.time"
        :min="1"
        :max="max"
        :controls="false"
        :precision="precision"
        :value-on-clear="1" />
      <DropSelectorSingle
        v-model="selected.type"
        :data="data"
        type="custom"
        width="70"
        @change="handleChange">
        <template #default="{ label }">
          <div class="eas-drop-box">{{ label }}</div>
        </template>
      </DropSelectorSingle>
      <slot name="right"></slot>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { t } from '@/locales/i18n'

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => {},
  },
  title: {
    type: [String, Number],
    default: '',
  },
  layout: {
    type: String,
    default: 'day,hour,minute',
  },
  maxDay: {
    type: Number,
    default: 180,
  },
  maxHour: {
    type: Number,
    default: 24,
  },
  maxMinute: {
    type: Number,
    default: 60,
  },
  maxSecond: {
    type: Number,
    default: 999,
  },
  precision: {
    type: Number,
    default: 0,
  },
  tip: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:modelValue', 'change'])

const layoutEnum = {
  day: t('dateRangeSelect.day'),
  hour: t('dateRangeSelect.hour'),
  minute: t('dateRangeSelect.minute'),
  second: t('dateRangeSelect.second'),
}
const data = computed(() => {
  const layoutList = props.layout.split(',')
  const list = []
  layoutList.forEach((item) => {
    list.push({
      value: item,
      label: layoutEnum[item],
    })
  })
  return list
})

const selected = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

const max = computed(() => {
  let maxItem = getMaxItem()
  return maxItem
})

const getMaxItem = () => {
  let maxItem = ''
  switch (selected.value.type) {
    case 'day':
      maxItem = props.maxDay
      break
    case 'hour':
      maxItem = props.maxHour
      break
    case 'minute':
      maxItem = props.maxMinute
      break
    case 'second':
      maxItem = props.maxSecond
      break
  }
  return maxItem
}

const numberChange = () => {
  emit('change')
}

const handleChange = (val) => {
  selected.value.type = val
  initMax()
  emit('change')
}

const initMax = () => {
  selected.value.time =
    selected.value.time > max.value ? max.value : selected.value.time
}

defineOptions({
  name: 'AnalysisDuration',
})
</script>

<style lang="scss" scoped>
.analysis-duration {
  &__title {
    font-weight: bold;
  }
  &__input {
    padding-top: 10px;
    padding-bottom: 10px;
    .el-input-number {
      width: 44px;
      height: 28px;
      margin-right: 8px;
    }
    :deep() {
      .el-input__wrapper {
        padding: 0 8px;
        border-radius: var(--eas-border-radius);
      }
      .el-input-number .el-input__inner {
        text-align: left;
      }
    }
  }
}
:deep(.el-dropdown-menu__item) {
  &.active {
    color: var(--eas-color-primary);
  }
}
</style>
