<template>
  <el-popover
    v-model:visible="visible"
    :width="width"
    popper-class="cus-popover--pd0"
    trigger="click"
    :placement="placement"
    transition="el-zoom-in-top">
    <template #reference>
      <div :class="['cus-popover--btn', visible && 'is-active', $attrs.class]">
        {{ label || $t('common.customColumn') }}({{ checkedValue.length }})
        <el-icon class="arrow-icon" :class="{ 'is-rotate': visible }">
          <arrow-down />
        </el-icon>
      </div>
    </template>
    <div class="cus-popover--main">
      <header class="cus-popover--header bb_e7e7ea">
        <CommonInput
          :placeholder="placeholder || $t('btn.search')"
          class="no-border-input"
          v-model="searchValue" />
      </header>
      <div class="mb5 mt5 pl5 bb_e7e7ea">
        <template v-if="searchData.length > 0">
          <el-checkbox
            class="checkbox--item flex-center pl5"
            v-model="checkAll"
            :indeterminate="isIndeterminate"
            @change="handleCheckAllChange"
            style="margin-right: 5px">
            {{ $t('common.selectAll') }}
          </el-checkbox>
          <el-scrollbar height="280px" class="cus-popover--body">
            <section>
              <el-checkbox-group v-model="checkedValue" class="pr5">
                <el-row
                  class="checkbox--item flex-center"
                  v-for="item in searchData"
                  :key="item[defaultProps.value]">
                  <el-checkbox
                    :label="item[defaultProps.value]"
                    :value="item[defaultProps.value]"
                    :disabled="item.disabled"
                    class="checkbox-unset-color-disabled pl5">
                    <el-text
                      truncated
                      :title="item[defaultProps.label]"
                      style="color: unset">
                      {{ item[defaultProps.label] }}
                    </el-text>
                  </el-checkbox>
                </el-row>
              </el-checkbox-group>
            </section>
          </el-scrollbar>
        </template>
        <template v-else>
          <empty class="mb20 mt20" />
        </template>
      </div>

      <footer class="cus-popover--footer pr10">
        <span v-if="$slots.footer">
          <slot name="footer" />
        </span>
        <span v-else>
          <el-button @click="visible = false">{{ $t('btn.cancel') }}</el-button>
          <el-button type="primary" @click="handleSubmit">
            {{ $t('btn.confirm') }}
          </el-button>
        </span>
      </footer>
    </div>
  </el-popover>
</template>

<script setup>
import { ArrowDown } from '@element-plus/icons-vue'
import { computed, nextTick, ref, watch, watchEffect } from 'vue'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => [],
  },
  width: {
    type: [Number, String],
    default: 240,
  },
  placeholder: {
    type: String,
    default: '',
  },
  /**
   * @description: 默认勾选/ 不可取消 { value: xxxx, label: 'xxx', disabled: true },
   * @return {*}
   */
  data: {
    type: Array,
    default: () => [],
  },
  valueKey: {
    type: Boolean,
    default: false,
  },
  defaultProps: {
    type: Object,
    default: () => ({
      value: 'value',
      label: 'label',
    }),
  },
  label: {
    type: [String, Number],
    default: '',
  },
  placement: {
    type: String,
    default: 'bottom',
  },
})

const emit = defineEmits(['update:modelValue', 'submit'])

const visible = ref(false)
const checkAll = ref(false)
const isIndeterminate = ref(false)
const checkedValue = ref([])
const searchValue = ref('')

const searchData = computed(() => {
  return props.data.filter((item) =>
    item[props.defaultProps.label]
      ?.toLowerCase()
      .includes(searchValue.value.toLowerCase())
  )
})

/**
 * @description: 全选
 * @return {*}
 * @param {boolean} val
 */
const handleCheckAllChange = (val) => {
  let checkedList = []
  if (val) {
    checkedList = searchData.value.map((item) => item[props.defaultProps.value])
    checkedValue.value = [...new Set([...checkedValue.value, ...checkedList])]
  } else {
    checkedList = searchData.value
      .filter((item) => !item.disabled)
      .map((item) => item[props.defaultProps.value])

    checkedValue.value = checkedValue.value.filter(
      (item) => !checkedList.includes(item)
    )
  }
}

watchEffect(() => {
  const checkedCount = searchData.value.filter((item) =>
    checkedValue.value.includes(item[props.defaultProps.value])
  ).length

  checkAll.value = checkedCount > 0 && checkedCount === searchData.value.length
  isIndeterminate.value =
    checkedCount > 0 && checkedCount < searchData.value.length
})

watch(
  visible,
  (val) => {
    if (!val) {
      searchValue.value = ''
      checkedValue.value = [...props.modelValue]
    }
  },
  {
    immediate: true,
  }
)

watch(
  () => props.modelValue,
  () => {
    checkedValue.value = [...props.modelValue]
  },
  {
    immediate: true,
  }
)

const handleSubmit = () => {
  visible.value = false
  emit('update:modelValue', checkedValue.value)

  const submitValue = props.valueKey
    ? props.data.filter((item) =>
        checkedValue.value.includes(item[props.defaultProps.value])
      )
    : checkedValue.value
  emit('submit', submitValue)
}

defineOptions({
  name: 'CustomField',
})
</script>

<style lang="scss" scoped>
.cus-popover {
  &--btn {
    //width: 130px;
    height: 32px;
    border-radius: var(--eas-border-radius-4);
    border: 1px solid #cbd0d6;
    color: var(--eas-text-color-primary);
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 10px;
    cursor: pointer;
    transition: all 0.2s ease-in-out;
    &.is-active,
    &:hover {
      border-color: var(--eas-color-primary);
    }
  }
  &--header {
    height: 42px;
    line-height: 42px;
  }
  &--footer {
    height: 64px;
    line-height: 64px;
    text-align: right;
  }
}

.bb_e7e7ea {
  border-bottom: 1px solid #e7e7ea;
}
.checkbox--item {
  height: 40px;
  &:hover {
    background: var(--eas-hover-color);
    border-radius: var(--eas-border-radius);
  }
}
:deep() {
  .no-border-input {
    .el-input__wrapper {
      box-shadow: unset;
    }
  }
  .checkbox-unset-color-disabled {
    width: 100%;
    .el-checkbox__input.is-disabled .el-checkbox__inner {
      background-color: var(--el-checkbox-bg-color);
      border: var(--el-checkbox-input-border);
    }
    .el-checkbox__input.is-checked .el-checkbox__inner {
      background-color: var(--el-checkbox-checked-bg-color);
      border-color: var(--el-checkbox-checked-input-border-color);
    }
    .el-checkbox__input.is-disabled.is-checked .el-checkbox__inner::after {
      border-color: var(--el-checkbox-checked-icon-color);
    }
    .el-checkbox__input.is-disabled + span.el-checkbox__label {
      color: inherit;
    }
    .el-checkbox__input.is-disabled.is-checked + span.el-checkbox__label {
      color: var(--el-checkbox-checked-text-color);
    }
    .el-checkbox__label {
      flex: 1;
      overflow: hidden;
      height: 40px;
      line-height: 40px;
    }
  }
}
</style>

<style lang="scss">
.cus-popover--pd0 {
  padding: 0 !important;
  box-shadow: 0px 3px 10px 1px rgba(28, 32, 40, 0.18) !important;
}
</style>
