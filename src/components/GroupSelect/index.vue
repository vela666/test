<script setup>
import { ref, computed, watch } from 'vue'
import { ArrowDown } from '@element-plus/icons-vue'
import { cloneDeep } from 'lodash-es'
import { useVirtualList } from '@vueuse/core'
import { t } from '@/locales/i18n'
defineOptions({
  name: 'GroupSelect',
})
const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({
      customNum: 5,
      defaultGroupNum: 5,
      groupCheckAll: false,
      groupCheckList: [],
    }),
  },
  placement: {
    type: String,
    default: 'bottom-end',
  },
  data: {
    type: Array,
    default: () => [],
  },
  title: {
    type: String,
    default: '',
  },
  showBorder: {
    type: Boolean,
    default: true,
  },
})
const customNumList = [
  { label: t('analysis.few'), value: 5 },
  { label: t('analysis.medium'), value: 10 },
  { label: t('analysis.many'), value: 15 },
  { label: t('dataManagement.custom'), value: 'more' },
]

const search = ref('')
const showList = computed(() => {
  return props.data.filter((el) =>
    el?.toLowerCase()?.includes(search.value?.toLowerCase())
  )
})

const { list, containerProps, wrapperProps } = useVirtualList(showList, {
  itemHeight: 40,
  overscan: 6,
})

const emit = defineEmits(['update:modelValue', 'change'])
const configs = computed({
  get: () => props.modelValue,
  set: (val) => {
    emit('update:modelValue', val)
  },
})

const showMenu = ref(false)
const visibleChange = (val) => {
  showMenu.value = val
  showConfig.value = false
  if (!val) {
    search.value = ''
  }
}

const showConfig = ref(false)

const defaultGroupNum = ref(5)
const customNum = ref(1)

const radionGroupChange = (val) => {
  if (val === 'more') {
    customNum.value = 1
  } else {
    customNum.value = val
  }
}
// 设置选中分组
const setGroupCheckList = () => {
  configs.value.groupCheckList = props.data.slice(0, configs.value.customNum)
  emit('change', cloneDeep(configs.value.groupCheckList))
}

// 确认按钮
const confirm = () => {
  configs.value.defaultGroupNum = defaultGroupNum.value
  configs.value.customNum = customNum.value
  showConfig.value = false
  setGroupCheckList()
  configs.value.groupCheckAll = true
}

// 取消按钮
const closeConfig = () => {
  showConfig.value = false
}

watch(showConfig, (val) => {
  if (val) {
    defaultGroupNum.value = configs.value.defaultGroupNum
    customNum.value = configs.value.customNum
  }
})

//默认选中/取消
const checkDefaultChange = (val) => {
  if (val) {
    setGroupCheckList()
  } else {
    configs.value.groupCheckList = []
    emit('change', [])
  }
}

//选中、取消选中分组触发
const handleGroupListChange = (val) => {
  configs.value.groupCheckAll = false
  emit('change', cloneDeep(val))
}

const blurHandle = (e, cb) => {
  if (!e.target.value) {
    cb()
  }
}
</script>

<template>
  <el-dropdown
    ref="groupSelector"
    trigger="click"
    popper-class="group-selector"
    :placement="placement"
    @visible-change="visibleChange">
    <div
      :class="[
        'group-drop-box',
        { 'is-unfold': showMenu },
        { 'no-border': !showBorder },
      ]">
      <div class="group-drop-box__text">
        <template v-if="!Object.keys($slots).includes('default')">
          {{ title || $t('analysis.group') }}{{ !showBorder ? '(' : ''
          }}{{ configs.groupCheckList.length }}/{{ data.length
          }}{{ !showBorder ? ')' : '' }}
        </template>
        <slot></slot>
      </div>
      <el-icon
        v-if="showBorder"
        :class="['arrow-icon', { 'is-rotate': showMenu }]">
        <ArrowDown />
      </el-icon>
    </div>
    <template #dropdown>
      <div class="drop_group_list">
        <CommonInput v-model="search" :desc="$t('common.search')" />
        <div v-bind="containerProps" class="group-list-wrapper">
          <el-checkbox-group
            v-bind="wrapperProps"
            v-model="configs.groupCheckList"
            class="group-list-content"
            @change="handleGroupListChange">
            <el-checkbox
              class="content-item"
              v-for="(item, index) in list"
              :key="`group_content-item_${index}`"
              :value="item.data"
              :label="item.data">
              <div class="content-item__label" v-showTips>{{ item.data }}</div>
            </el-checkbox>
          </el-checkbox-group>
        </div>
        <div class="group_list_op">
          <el-checkbox
            v-model="configs.groupCheckAll"
            @change="checkDefaultChange">
            {{ $t('analysis.default') }}
          </el-checkbox>
          <svg-icon
            name="event-group-manage"
            :class="['setting-btn', { 'show-config': showConfig }]"
            @click="showConfig = !showConfig"></svg-icon>
        </div>
      </div>
      <div
        :class="[
          'group-config',
          { 'bottom-start': ['bottom-start', 'bottom'].includes(placement) },
        ]"
        v-if="showConfig">
        <div class="group-config__title">
          {{ $t('analysis.groupConfiguration') }}
        </div>
        <el-radio-group
          v-model="defaultGroupNum"
          class="defalut-num"
          @change="radionGroupChange">
          <el-radio
            :value="item.value"
            v-for="item in customNumList"
            class="defalut-num__item"
            :key="`defalut-num__item_${item.value}`">
            <span>{{ item.label }}</span>
            <span v-if="item.value !== 'more'">{{ item.value }}</span>
            <span v-else>
              <span v-if="defaultGroupNum !== 'more'">{{ customNum }}</span>
              <el-input-number
                v-else
                class="custom-input"
                v-model.number="customNum"
                :min="1"
                :max="100"
                :value-on-clear="1"
                step-strictly
                controls-position="right"
                @blur="(e) => blurHandle(e, () => (customNum = 1))" />
            </span>
          </el-radio>
        </el-radio-group>
        <div class="group-config__tips">
          <div class="config__tips_item">
            <div class="tip_dot"></div>
            <div class="tip_text">
              {{ $t('analysis.defaultSelectGroup', [customNum]) }}
            </div>
          </div>
          <div class="config__tips_item">
            <div class="tip_dot"></div>
            <div class="tip_text">
              {{ $t('analysis.groupItemsMsg') }}
            </div>
          </div>
        </div>
        <div class="group-config__footer">
          <el-button @click="closeConfig">
            {{ $t('btn.cancel') }}
          </el-button>
          <el-button type="primary" @click="confirm">
            {{ $t('btn.confirm') }}
          </el-button>
        </div>
      </div>
    </template>
  </el-dropdown>
</template>

<style scoped lang="scss">
.group-drop-box {
  &.no-border {
    border: none !important;
    padding: 0;
    margin: 0;
    align-items: center;
    min-width: 28px !important;
    &.is-unfold {
      color: var(--eas-color-primary);
    }
  }
}
.box-style {
  background: #fff;
  box-shadow: 3px 3px 10px 1px rgba(28, 32, 40, 0.18);
  border-radius: var(--eas-border-radius-4);
}
.drop_group_list {
  height: 369px;
  min-width: 240px;
  @extend .box-style;
  :deep() {
    .el-input__wrapper {
      height: 42px;
      box-shadow: none;
      border-bottom: 1px solid var(--eas-border-color);
    }
    .el-checkbox__label {
      padding-left: 5px;
      font-size: var(--eas-font-size-base);
    }
    .el-checkbox {
      --el-checkbox-text-color: var(--eas-text-color-primary);
    }
  }
}
.group_list_op {
  width: 100%;
  padding: 0px 14px 0px 10px;
  height: 39px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1px solid var(--eas-border-color);
}
.setting-btn {
  font-size: var(--eas-font-size-medium);
  color: var(--eas-text-color-primary);
  cursor: pointer;
  &:hover {
    color: var(--eas-color-primary);
  }
  &.show-config {
    color: var(--eas-color-primary);
  }
}
.group-list-wrapper {
  width: 100%;
  height: calc(100% - 82px);
}
.group-list-content {
  width: 100%;
  padding: 0px 4px;
  height: 100%;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  .content-item {
    display: flex;
    align-items: center;
    width: 100%;
    height: 40px;
    padding: 10px 6px;
    margin: 0px;
    border-radius: var(--eas-border-radius);
    &:hover {
      background-color: var(--eas-hover-color);
    }
    &__label {
      max-width: 200px;
    }
  }
}
.group-config {
  position: absolute;
  top: 0;
  left: -245px;
  width: 240px;
  height: 369px;
  @extend .box-style;
  &.bottom-start {
    left: calc(100% + 5px);
  }
  :deep() {
    .el-radio {
      --el-radio-font-size: var(--eas-font-size-base);
      --el-radio-text-color: var(--eas-text-color-primary);
      --el-radio-font-weight: 400;
    }
    .el-radio__label {
      width: calc(100% - 14px);
      padding-left: 5px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
  }
}
.group-config__title {
  width: 100%;
  height: 43px;
  padding: 14px 0px 10px 10px;
  font-size: var(--eas-font-size-base);
  color: var(--eas-text-color-primary);
}
.defalut-num {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px 4px;
  &__item {
    width: 100%;
    height: 40px;
    margin: 0px;
    padding: 12px 10px 12px 6px;
    border-radius: var(--eas-border-radius);
    background-color: var(--eas-hover-color);
    &:not(:last-child) {
      margin-bottom: 10px;
    }
  }
}
.group-config__tips {
  width: 100%;
  height: 72px;
  padding: 15px 10px;
}
.config__tips_item {
  height: 16px;
  display: flex;
  align-items: center;
  &:not(:last-child) {
    margin-bottom: 10px;
  }
}
.tip_dot {
  width: 6px;
  height: 6px;
  background-color: var(--eas-color-primary);
  border-radius: 100%;
}
.tip_text {
  height: 16px;
  line-height: 16px;
  margin-left: 5px;
  font-size: var(--eas-font-size-small);
  color: var(--eas-text-color-primary);
}
.group-config__footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  width: 100%;
  height: calc(100% - 305px);
  padding-right: 10px;
  border-top: 1px solid var(--eas-border-color);
}
.custom-input {
  width: 60px;
  &.el-input-number {
    :deep() {
      .el-input-number__decrease,
      .el-input-number__increase {
        display: none;
      }
      .el-input {
        --el-input-height: 28px;
      }
      .el-input__wrapper {
        padding: 0px 5px;
        border-radius: var(--eas-border-radius);
      }
    }
  }
}
</style>
<style lang="scss">
.el-dropdown__popper.group-selector {
  margin-top: -9px;
  border: none;
  background: #fff;
  box-shadow: 3px 3px 10px 1px rgba(28, 32, 40, 0.18);
  border-radius: var(--eas-border-radius-4);
  .el-popper__arrow {
    display: none;
  }
  .el-dropdown__list {
    height: 100%;
    width: 100%;
  }
  .el-cascader-panel {
    border: none !important;
    border-radius: 0px;
  }
  .el-scrollbar {
    overflow: visible !important;
  }
}
</style>
