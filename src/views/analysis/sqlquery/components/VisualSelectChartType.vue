<script setup>
import { computed, reactive, ref } from 'vue'
import { Select } from '@element-plus/icons-vue'
import { t } from '@/locales/i18n'

const props = defineProps({
  modelValue: {
    type: Number,
    default: 1,
  },
})

const state = reactive({
  options: [
    {
      value: 1,
      label: t('chart.trend'),
      icon: 'chart-trend',
    },
    {
      value: 3,
      label: t('chart.scatter'),
      icon: 'chart-distribution',
    },
  ],
})

const emit = defineEmits(['update:modelValue', 'change'])

const val = computed({
  get: () => {
    return props.modelValue
  },
  set: (val) => {
    emit('change', val)
    emit('update:modelValue', val)
  },
})

const icon = computed(() => {
  return state.options.filter((item) => item.value === val.value)[0].icon
})

const selectChartTypeRef = ref()

/**
 * @description 关闭dropdown框
 */
const handleClose = () => {
  selectChartTypeRef.value.handleClose()
}

/**
 * @description 关闭dropdown框
 */
const handleChangeValue = (value) => {
  val.value = value
  handleClose()
}

defineOptions({
  name: 'VisualSelectChartType',
})
</script>
<template>
  <CommonDropdown
    trigger="hover"
    placement="bottom-start"
    width="none"
    popper-class="visual-select-dropdown"
    ref="selectChartTypeRef">
    <template #content>
      <div class="c-pointer">
        <SvgIcon :name="icon" class="fz18"></SvgIcon>
      </div>
    </template>
    <template #default>
      <div class="select-chart-type w120">
        <div
          class="select-chart-type-body"
          v-for="(item, key) in state.options"
          :key="key">
          <div class="field-item-body c-pointer">
            <div
              class="field-item-body-col flex-center"
              :class="{
                active: item.value === val,
              }"
              @click="handleChangeValue(item.value)">
              <SvgIcon :name="item.icon" class="fz18 mr5"></SvgIcon>
              <div class="flex-center flex-between flex1">
                <div class="flex1">{{ item.label }}</div>
                <el-icon v-if="item.value === val"><Select /></el-icon>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </CommonDropdown>
</template>
<style lang="scss" scoped>
.visual-select-dropdown {
  .el-scrollbar {
    overflow: visible;
    .el-scrollbar__wrap {
      height: auto;
      overflow: visible;
    }
  }
  .el-scrollbar__bar {
    height: 0;
  }
  .el-popper__arrow {
    display: none;
  }
  .el-scrollbar__bar.is-vertical {
    right: 0px;
  }
}
.select-chart-type {
  font-size: 14px;
  padding: 4px 0 4px 4px;
  :deep(.el-cascader-menu) {
    min-width: auto;
  }
  &-body {
    .field-item-body {
      width: calc(100% - 4px);
      height: 40px;
      line-height: 40px;
      margin: 0 4px 4px 0;
      border-radius: 4px;
      position: relative;
      &-col {
        padding: 0 6px;
        flex: 1;
      }
      &:hover {
        background: var(--eas-color-primary-light-1);
      }
    }
    .field-item-children {
      display: none;
      position: absolute;
      bottom: -53px;
      left: 115px;
      padding-left: 4px;
      &-body {
        background: #fff;
        padding: 6px;
        border-radius: 2px;
        box-shadow: 0px 3px 10px 1px rgba(28, 32, 40, 0.18);
        &-item {
          width: 100%;
          height: 40px;
          line-height: 40px;
          padding: 6px;
          &:hover {
            background: var(--eas-color-primary-light-1);
          }
        }
      }
      &:hover {
        display: block;
      }
    }
    &:hover {
      .field-item-children,
      .field-item-children {
        display: block;
      }
    }
  }
  .default-active {
    background: var(--eas-color-primary-light-1);
  }
  .active {
    color: var(--eas-color-primary);
  }
}
.flex1 {
  flex: 1;
}
</style>
