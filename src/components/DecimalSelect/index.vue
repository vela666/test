<script setup>
import { ref, computed } from 'vue'
import { t } from '@/locales/i18n'
defineOptions({
  name: 'DecimalSelect',
})
const emit = defineEmits(['update:modelValue', 'change'])
const props = defineProps({
  modelValue: {
    type: [Number, String],
    default: 0,
  },
  placement: {
    type: String,
    default: 'bottom-start',
  },
  list: {
    type: Array,
    default: () => [
      { label: t('analysis.round'), value: 0 },
      { label: t('analysis.decimals', [2]), value: 1 },
      { label: t('analysis.decimals', [4]), value: 3 },
      { label: t('analysis.decimals', [6]), value: 4 },
      { label: t('analysis.percentage'), value: 2 },
    ],
  },
  showBorder: {
    type: Boolean,
    default: true,
  },
  popperClass: {
    type: String,
    default: '',
  },
})
const decimalDrop = ref(null)
const decimalValue = computed({
  get() {
    return props.modelValue
  },
  set(val) {
    emit('update:modelValue', val)
  },
})

const showText = computed(() => {
  const find = props.list.find((el) => el.value === decimalValue.value)
  return find?.label ?? ''
})

const showMenu = ref(false)
const visibleChange = (val) => {
  showMenu.value = val
}

const selectItem = (item) => {
  if (decimalValue.value !== item.value) {
    decimalValue.value = item.value
    emit('change', item.value)
  }
  decimalDrop.value?.handleClose()
}
</script>

<template>
  <div class="decimal-select">
    <el-dropdown
      @visible-change="visibleChange"
      :popper-class="['decimal-select__dropdown', popperClass].join(' ')"
      trigger="click"
      :placement="placement"
      ref="decimalDrop">
      <div
        :class="[
          'eas-drop-box',
          'txt-center',
          { 'is-unfold': showMenu },
          { 'no-border': !showBorder },
        ]">
        {{ showText }}
      </div>
      <template #dropdown>
        <div class="decimal-select_list">
          <div
            :class="[
              'decimal-select_list__item',
              { 'is-cur': decimalValue === item.value },
            ]"
            v-for="item in list"
            :key="`decimal-select_item_${item.value}`"
            @click="selectItem(item)">
            {{ item.label }}
          </div>
        </div>
      </template>
    </el-dropdown>
  </div>
</template>

<style scoped lang="scss">
.decimal-select {
  display: inline-flex;
}
.is-unfold {
  color: var(--eas-color-primary) !important;
  border-color: var(--eas-color-primary) !important;
  background-color: #fff !important;
}
.txt-center {
  text-align: center;
  font-size: var(--eas-font-size-base);
  min-width: 32px;
}
.no-border {
  border: none !important;
}
.decimal-select_list {
  height: 100%;
  width: 100%;
  padding: 4px;
  &__item {
    width: 117px;
    height: 40px;
    display: flex;
    align-items: center;
    padding-left: 6px;
    cursor: pointer;
    font-size: var(--eas-font-size-base);
    color: var(--eas-text-color-primary);
    &:hover {
      background-color: var(--eas-hover-color);
    }
    &.is-cur {
      color: var(--eas-color-primary);
    }
  }
}
</style>
<style lang="scss">
.el-dropdown__popper.decimal-select__dropdown {
  min-width: 32px;
  background: #fff;
  box-shadow: 0px 3px 10px 1px rgba(28, 32, 40, 0.18);
  border-radius: var(--eas-border-radius-4);
  margin-top: -10px;
  .el-popper__arrow {
    display: none;
  }
  .el-dropdown__list {
    height: 100%;
    width: 100%;
  }
}
</style>
