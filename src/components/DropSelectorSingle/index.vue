<template>
  <el-popover
    :popper-class="[
      'custom-popover-selector',
      { 'show-children-popover': !hidden },
      popperClass,
    ]"
    :placement="placement"
    trigger="click"
    v-model:visible="visible"
    :show-arrow="showArrow"
    v-bind="attrs"
    :width="fitInputWidth ? computedWidth : width"
    :offset="showArrow ? 0 : 2"
    transition="el-zoom-in-top">
    <template #reference>
      <div
        :class="[
          'group-drop-box',
          'flex-center',
          { 'is-unfold': visible, 'no-border': !showBorder },
          className,
        ]"
        v-if="type === 'select'"
        ref="labelRef">
        <div class="group-drop-box__text">
          <div v-if="!$slots.default">{{ selectLabel }}</div>
          <slot :label="selectLabel" v-else></slot>
        </div>
        <el-icon
          v-if="showBorder"
          :class="['arrow-icon', { 'is-rotate': visible }]">
          <ArrowDown />
        </el-icon>
      </div>
      <div v-else class="flex-center" ref="labelRef">
        <div v-if="!$slots.default">
          <el-button>{{ selectLabel }}</el-button>
        </div>
        <slot :label="selectLabel" v-else></slot>
      </div>
    </template>

    <template v-if="data.length > 0">
      <el-scrollbar :max-height="280">
        <div
          class="custom-content-item fz14"
          v-for="item in data"
          :key="item[defaultProps.value]"
          @click="handleSelect(item)"
          :class="{
            'is-active': valueKey
              ? selectValue[defaultProps.value] === item[defaultProps.value]
              : selectValue === item[defaultProps.value],
            'is-disabled':
              disabledData.includes(item[defaultProps.value]) &&
              item[defaultProps.value] !== selectValue,
          }">
          <Tooltip :showTips="!!item.tip">
            <template #content>{{ item.tip }} </template>
            <template v-if="!$slots.content">
              <div class="w100-percentage" v-showTips>
                {{ item[defaultProps.label] }}
              </div>
            </template>
            <slot v-else name="content" :item="item"></slot>
          </Tooltip>
        </div>
      </el-scrollbar>
    </template>
    <template v-else>
      <div class="custom-seletor__empty">{{ $t('common.noData') }}</div>
    </template>
  </el-popover>
</template>

<script setup>
import { computed, nextTick, ref, watch, useAttrs } from 'vue'
import { ArrowDown } from '@element-plus/icons-vue'

defineOptions({
  name: 'DropSelectorSingle',
})

const emit = defineEmits(['change'])

const attrs = useAttrs()
const props = defineProps({
  placement: {
    type: String,
    default: 'bottom',
  },
  className: {
    type: String,
    default: '',
  },
  showArrow: {
    type: Boolean,
    default: false,
  },
  width: {
    type: [String, Number],
    default: 120,
  },
  data: {
    type: [Object, Array],
    default: () => [],
  },
  // 展示的类型  select：下拉框样式  custom: 自定义样式
  type: {
    type: String,
    default: 'select',
  },
  defaultProps: {
    type: Object,
    default: () => ({
      label: 'label',
      value: 'value',
    }),
  },
  // 是否对象形式
  valueKey: {
    type: Boolean,
    default: false,
  },
  // el-popover宽度与内容宽度是否一致
  fitInputWidth: {
    type: Boolean,
    default: false,
  },
  disabledData: {
    type: Array,
    default: () => [],
  },
  // 是否默认el-scrollbar overflow:hidden 解决嵌套的el-popover无法正常显示
  hidden: {
    type: Boolean,
    default: true,
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

const visible = defineModel('visible')
const selectValue = defineModel({
  type: [Object, String, Number],
  default: '',
})
const selectLabel = computed(() => {
  if (props.valueKey) {
    return props.data.find(
      (item) =>
        item[props.defaultProps.value] ===
        selectValue.value[props.defaultProps.value]
    )?.[props.defaultProps.label]
  }

  return props.data.find(
    (item) => item[props.defaultProps.value] === selectValue.value
  )?.[props.defaultProps.label]
})

/**
 * @description: 选中触发的方法
 * @return {*}
 * @param {*} item
 */
const handleSelect = (item) => {
  // disabled
  if (props.disabledData.includes(item[props.defaultProps.value])) {
    return
  }

  if (props.valueKey) {
    if (
      item[props.defaultProps.value] ===
      selectValue.value[props.defaultProps.value]
    )
      return
  } else {
    if (item[props.defaultProps.value] === selectValue.value) return
  }

  visible.value = false
  if (props.valueKey) {
    for (const [key, value] of Object.entries(props.defaultProps)) {
      selectValue.value[value] = item[value]
    }
  } else {
    selectValue.value = item[props.defaultProps.value]
  }

  nextTick(() => {
    emit('change', selectValue.value)
  })
}

watch(visible, (val) => {
  if (val && props.fitInputWidth) setFitInputWidth()
})

const labelRef = ref(null)
const computedWidth = ref(0)
/**
 * @description: 设置el-popover宽度与内容宽度一致
 * @return {*}
 */
function setFitInputWidth() {
  computedWidth.value = labelRef.value.getBoundingClientRect()?.width || 120
}
</script>

<style scoped lang="scss">
.group-drop-box {
  margin: 0;
  &:hover {
    border-color: var(--eas-color-primary);
  }

  &.no-border {
    padding: 0;
    min-width: auto;
    border: none;
  }
  &.no-bg {
    background-color: transparent;
  }
}
.custom-content-item {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  // width: 100%;
  height: 40px;
  padding: 10px 6px;
  margin: 0px;
  margin-right: 4px;
  border-radius: 2px;
  border-radius: var(--eas-border-radius);
  color: var(--eas-text-color-primary);
  cursor: pointer;
  &:hover {
    background-color: var(--eas-hover-color);
  }
  &.is-active {
    color: var(--eas-color-primary);
  }
  &.is-disabled {
    cursor: not-allowed;
    color: var(--el-text-color-disabled);
  }
}
.flex-center {
  display: inline-flex;
  align-items: center;
}
.custom-seletor__empty {
  padding: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-secondary);
}
</style>
<style lang="scss">
.el-popover.custom-popover-selector {
  border: none;
  background: #fff;
  box-shadow: 3px 3px 10px 1px rgba(28, 32, 40, 0.18);
  border-radius: var(--eas-border-radius-4);
  min-width: 0 !important;
  padding: 4px 0px 4px 4px;
  // margin-right: 4px;
  &.show-children-popover {
    .el-scrollbar {
      overflow: unset;
    }
  }
  .el-scrollbar__wrap {
    overflow: visible;
  }
}
</style>
