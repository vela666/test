<script setup>
import { computed } from 'vue'
import { getActualWidthOfChars } from '@/utils'
defineOptions({
  name: 'TableComparativeSelect',
})
const props = defineProps({
  showBorder: {
    type: Boolean,
    default: true,
  },
  versus: {
    type: Array,
    default: () => [],
  },
  modelValue: {
    type: [String, Number],
    default: 1,
  },
})

const emit = defineEmits(['update:modelValue', 'change', 'update:versus'])

const selectedStageTableIndex = computed({
  get: () => props.modelValue,
  set: (val) => {
    emit('update:modelValue', val)
    emit(
      'update:versus',
      props.versus.map((item, index) => {
        return {
          ...item,
          tableCurrentSelectionStage: index === val - 1,
        }
      })
    )
  },
})
</script>

<template>
  <el-select
    :class="{ 'no-border': !showBorder }"
    :style="`width:${
      versus[selectedStageTableIndex - 1] &&
      getActualWidthOfChars(
        `${$t('dateRangeSelect.stage')}：${versus[selectedStageTableIndex - 1].mainName}`,
        { size: 14 }
      ) +
        35 +
        15
    }px`"
    @change="(val) => emit('change', val)"
    v-model="selectedStageTableIndex"
    :placeholder="$t('common.pleaseSelect')">
    <el-option
      v-for="(item, index) of versus"
      :key="`versus` + index"
      :label="`${$t('dateRangeSelect.stage')}：${item.mainName}`"
      :value="index + 1">
      <span>
        {{ item.mainName }}
      </span>
    </el-option>
  </el-select>
</template>

<style scoped lang="scss">
:deep(.el-input__inner) {
  border: none;
}
.el-select {
  &.no-border {
    :deep(.el-select__wrapper) {
      box-shadow: none;
    }
  }
}
</style>
