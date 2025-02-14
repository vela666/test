<template>
  <el-popover
    v-model:visible="week_visible"
    trigger="click"
    :teleported="false"
    :width="300"
    :show-arrow="false"
    transition="el-zoom-in-center"
    placement="right"
    :offset="20">
    <template #reference>
      <svg-icon name="calendar1" class="fz16 c86919d" @click.stop />
    </template>
    <div class="custom-week-container" @click.stop>
      <header class="mb20">{{ $t('common.customWeek') }}</header>
      <div class="mb10">
        {{
          $t('periodTypeSelect.weekStartDay', {
            weekDay: selectedLabel,
          })
        }}
        <!-- 按周统计时，将 {{ selectedLabel }} 作为周起始日 -->
      </div>
      <div class="week-content">
        <div
          class="week-item"
          v-for="item in weekList"
          :key="item.type"
          :class="{ 'is-active': selectedValue === item.type }"
          @click="selectedValue = item.type">
          {{ item.label }}
        </div>
      </div>
      <div class="week-footer">
        <el-button @click="week_visible = false">
          {{ $t('btn.cancel') }}
        </el-button>
        <el-button type="primary" @click="handleSubmit">
          {{ $t('btn.confirm') }}
        </el-button>
      </div>
    </div>
  </el-popover>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { weekList } from '@/enumeration/date'

defineOptions({
  name: 'CustomWeek',
})

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: '',
  },
})

const emit = defineEmits(['update:modelValue', 'submit', 'change'])

const selectedValue = ref('')
const visible = defineModel('visible')
const week_visible = ref(false)

watch(
  week_visible,
  (val) => {
    if (val) selectedValue.value = props.modelValue
  },
  {
    immediate: true,
  }
)

const selectedLabel = computed(() => {
  return weekList.find((item) => item.type === selectedValue.value)?.label
})

const handleSubmit = () => {
  emit('update:modelValue', selectedValue.value)
  emit('submit')
  emit('change')
  visible.value = false
  week_visible.value = false
}
</script>

<style lang="scss" scoped>
.custom-week-container {
  color: var(--eas-text-color-primary);
}
.week-content {
  position: relative;
  display: flex;
  flex-wrap: wrap;
}
.week-item {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 30px;
  margin-top: 8px;
  margin-right: 8px;
  font-size: 14px;
  border: 1px solid #f0f0f0;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  &:nth-last-of-type(4n) {
    margin-right: 0px;
  }
  &:hover,
  &.is-active {
    border-color: var(--eas-color-primary);
  }
}
.week-footer {
  margin-top: 20px;
  text-align: right;
}
</style>
