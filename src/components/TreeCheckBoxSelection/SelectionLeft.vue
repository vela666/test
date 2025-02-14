<template>
  <div class="selection-left">
    <div>
      <slot name="leftTop"></slot>
    </div>
    <div class="selection-left-all">
      <div class="h32 flex-center">
        <span class="mr5">
          {{ $t('common.opt') }}
          <i class="c5473e8">{{ optionalList }}</i>
          {{ $t('common.pcs') }}
        </span>
      </div>
      <el-checkbox
        v-show="!!optionalList"
        :indeterminate="isIndeterminate"
        v-model="checkedVal"
        @change="emit('change', $event)">
        {{ $t('common.selectAll') }}
      </el-checkbox>
    </div>
    <CommonInput
      v-model="searchVal"
      :desc="$t('btn.search')"
      class="w100-percentage skip" />
    <div class="selection-exhibit">
      <slot></slot>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  optionalList: {
    type: Number,
    default: 0,
  },
  isIndeterminate: {
    type: Boolean,
    default: false,
  },
  checked: {
    type: Boolean,
    default: false,
  },
  search: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:checked', 'update:search', 'change'])

const checkedVal = computed({
  get() {
    return props.checked
  },
  set(val) {
    emit('update:checked', val)
  },
})
const searchVal = computed({
  get() {
    return props.search
  },
  set(val) {
    emit('update:search', val)
  },
})

defineOptions({
  name: 'SelectionLeft',
})
</script>

<style scoped lang="scss"></style>
