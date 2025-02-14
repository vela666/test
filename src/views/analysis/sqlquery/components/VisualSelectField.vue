<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { ArrowLeft, ArrowRight, Select } from '@element-plus/icons-vue'
import VisualSelectChartType from './VisualSelectChartType.vue'
import { t } from '@/locales/i18n'

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => {},
  },
  type: {
    type: String,
    default: 'X', // X  ChildX  Y  RY
  },
  bgColor: {
    type: String,
    default: 'var(--eas-color-primary)',
  },
  index: {
    type: Number,
    default: null,
  },
  graphType: {
    type: Number,
    default: null,
  },
})

const emit = defineEmits(['change', 'update:modelValue', 'delete'])

const datas = computed({
  get: () => {
    return props.modelValue
  },
  set: (val) => {
    emit('update:modelValue', val)
  },
})

const state = reactive({
  sort: [
    {
      value: 'ascend',
      label: t('analysis.sqlquery.ascend'),
    },
    {
      value: 'descend',
      label: t('analysis.sqlquery.descend'),
    },
    {
      value: 'cancel',
      label: t('analysis.sqlquery.cancelSorting'),
    },
  ],
  optionsEchart: [
    {
      value: 1,
      label: t('chart.trend'),
      icon: 'trend',
    },
    {
      value: 3,
      label: t('chart.scatter'),
      icon: 'barchart',
    },
  ],
  optionsX: [],
  optionsY: [
    {
      value: 'count',
      label: t('analysis.sqlquery.count'),
    },
    {
      value: 'removalCount',
      label: t('analysis.sqlquery.distinctCount'),
    },
  ],
  optionsNumY: [
    {
      value: 'sum',
      label: t('analysis.sqlquery.sum'),
    },
    {
      value: 'average',
      label: t('analysis.sqlquery.average'),
    },
    {
      value: 'count',
      label: t('analysis.sqlquery.count'),
    },
    {
      value: 'removalCount',
      label: t('analysis.sqlquery.distinctCount'),
    },
    {
      value: 'max',
      label: t('analysis.sqlquery.max'),
    },
    {
      value: 'min',
      label: t('analysis.sqlquery.min'),
    },
  ],
  options: [
    { label: t('analysis.sqlquery.sort'), value: 'sort' },
    { label: t('analysis.sqlquery.removeField'), value: 'delete' },
  ],
  props: {
    expandTrigger: 'hover',
  },
})

watch(
  () => datas.value,
  (newVal) => {
    let newName = ''
    try {
      newName = `${newVal.name}(${state.optionsNumY.filter((e) => e.value === newVal.value[0])[0].label})`
    } catch (error) {
      newName = newVal.name
    }
    datas.value.newName = newName
  },
  { deep: true, immediate: true }
)

const selectFieldRef = ref()

const cascaderProps = {
  expandTrigger: 'hover',
}

/**
 * @description 关闭dropdown框
 */
const handleClose = () => {
  selectFieldRef.value.handleClose()
}

/**
 * @description 关闭dropdown框
 */
const handleChangeValue = (key, value, label) => {
  if (key === 'delete' || value) {
    if (value) {
      datas.value[key].splice(0, datas.value[key].length)
      datas.value[key].push(value)
      if (key !== 'sort') {
        datas.value.newName = `${datas.value.name}(${label})`
      }
      emit('change', props.type, props.index)
    } else if (key === 'delete') {
      emit('delete', props.type, props.index)
    }
    handleClose()
  }
}

defineOptions({
  name: 'VisualSelectField',
})
</script>
<template>
  <div class="visual-select flex-center">
    <div class="visual-select-left"></div>
    <div class="visual-select-right flex-center flex-between">
      <div class="visual-select-right-content flex-center flex-between flex1">
        <div class="flex-center w100-percentage flex1">
          <VisualSelectChartType
            class="ml5"
            v-if="props.graphType === 20 && ['Y', 'RY'].includes(type)"
            v-model="datas.graphType"></VisualSelectChartType>
          <div
            class="ml10 select-content flex1"
            :title="['Y', 'RY'].includes(type) ? datas?.newName : datas?.name">
            {{ ['Y', 'RY'].includes(type) ? datas?.newName : datas?.name }}
          </div>
        </div>
        <SvgIcon
          v-if="datas.sort[0] !== 'cancel'"
          class="fz14 ml5 mr5"
          :name="datas.sort[0]" />
      </div>
      <CommonDropdown
        trigger="hover"
        placement="right-start"
        width="none"
        popper-class="visual-select-dropdown"
        ref="selectFieldRef">
        <template #content>
          <div class="btn-icon flex-center flex-level-center c-pointer">
            <el-icon class="fz18">
              <ArrowLeft />
            </el-icon>
          </div>
        </template>
        <template #default>
          <div class="field-1 w140">
            <div v-if="type !== 'X' && type !== 'ChildX'">
              <div
                class="field-1-item"
                v-for="(item, key) in datas?.numStatus
                  ? state.optionsNumY
                  : state.optionsY"
                :key="key">
                <div class="field-item-body c-pointer">
                  <div
                    class="field-item-body-col flex-center flex-between"
                    :class="{
                      active: item.value === datas?.value[0],
                    }"
                    @click="handleChangeValue('value', item.value, item.label)">
                    <div>{{ item.label }}</div>
                    <el-icon v-if="item.value === datas?.value[0]"
                      ><Select
                    /></el-icon>
                  </div>
                </div>
              </div>
              <div class="field-1-split"></div>
            </div>
            <div
              class="field-1-item"
              v-for="(item, key) in state.options"
              :key="key"
              @click.stop="handleChangeValue(item.value)">
              <div class="field-item-body c-pointer">
                <div
                  class="field-item-body-col flex-center flex-between"
                  :class="{ 'default-active': key === 0 }">
                  <div>{{ item.label }}</div>
                  <el-icon v-if="key === 0" class="fz18">
                    <ArrowRight />
                  </el-icon>
                  <div v-if="key === 0" class="field-item-children">
                    <div class="field-item-children-body w140">
                      <div
                        v-for="(childItem, childKey) in state.sort"
                        :key="childKey"
                        class="field-item-children-body-item flex-center flex-between c-pointer"
                        :class="{
                          active: childItem.value === datas?.sort[0],
                        }"
                        @click.stop="
                          handleChangeValue('sort', childItem.value)
                        ">
                        <div class="p6">{{ childItem.label }}</div>
                        <el-icon v-if="childItem.value === datas?.sort[0]">
                          <Select />
                        </el-icon>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </CommonDropdown>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.visual-select {
  font-size: 14px;
  &-left {
    width: 4px;
    height: 18px;
    border-radius: 1px 1px 1px 1px;
    background: v-bind(bgColor);
  }
  &-right {
    width: 216px;
    height: 32px;
    background: #ffffff;
    border-radius: 4px;
    border: 1px solid var(--eas-border-color);
    cursor: move;
    &-content {
      .select-content {
        text-overflow: ellipsis;
      }
    }
    .btn-icon {
      width: 32px;
      height: 32px;
      border-radius: 0 0 4px 4px;
      transform: rotate(270deg);
      &:hover {
        border-top: 1px solid var(--eas-color-primary);
        background: var(--eas-color-primary-light-1);
      }
    }
  }
  &:hover {
    .visual-select-right {
      border: 1px solid var(--eas-color-primary);
      .btn-icon {
        border-top: 1px solid var(--eas-color-primary);
        border-left: 1px solid var(--eas-color-primary);
        border-right: 1px solid var(--eas-color-primary);
        color: var(--eas-color-primary);
      }
    }
  }
  :deep(.svg-icon) {
    color: var(--eas-color-primary);
  }
}
.flex1 {
  flex: 1;
  overflow: hidden;
}
.field-1 {
  font-size: 14px;
  padding: 4px 0 4px 4px;
  :deep(.el-cascader-menu) {
    min-width: auto;
  }
  &-item {
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
      left: 135px;
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
  &-split {
    width: 112px;
    height: 0px;
    opacity: 1;
    border: 1px solid var(--eas-border-color);
    margin: 4px 0;
  }
  .default-active {
    background: var(--eas-color-primary-light-1);
  }
  .active {
    color: var(--eas-color-primary);
  }
}
</style>
<style lang="scss">
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
</style>
