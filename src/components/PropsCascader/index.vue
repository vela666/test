<script setup>
import { ref, computed, toRef, watch, nextTick } from 'vue'
import { ArrowRightBold } from '@element-plus/icons-vue'
import { cloneDeep, omit, isObject } from 'lodash-es'
import { getHideFieldInfo } from '@/api/modules/analysis/common.js'
import { t } from '@/locales/i18n'
defineOptions({
  name: 'PropsCascader',
})
const props = defineProps({
  modelValue: {
    type: Object,
    require: true,
  },
  list: {
    type: Object,
    require: true,
  },
  onlyProps: {
    type: Boolean,
    default: false,
  },
  isAttrAnalysis: {
    // 是否是用户分析
    type: Boolean,
    default: false,
  },
  placement: {
    type: String,
    default: 'bottom-start',
  },
})
const valuePropsNames = [
  'propertyName',
  'propertyNameDisplay',
  'propertyType',
  'parentId',
  'permissionStatus',
  'analysis',
  'analysisDesc',
]
const emit = defineEmits(['change', 'update:modelValue'])
const propCascader = ref(null)
const mValue = toRef(props, 'modelValue')
const selectedTemp = ref(null)
const isManual = ref(false)
// 初始化cascader绑定值
const data = ref({ ...mValue.value })
// options 源数据组合
const options = computed(() => {
  const newOptions = []
  const searchVal = search.value.toLowerCase()
  if (activeName.value === 0 || search.value != '') {
    for (const str in props.list?.common) {
      if (
        str.toLowerCase().includes(searchVal) ||
        props.list.common[str].toLowerCase().includes(searchVal)
      ) {
        newOptions.push({
          value: str,
          label: props.list.common[str],
        })
      }
    }
  }

  if (Array.isArray(props.list?.field)) {
    const fieldData = props.list.field.filter((el) => {
      if (search.value != '') {
        return (
          el.fZh.toLowerCase().includes(searchVal) ||
          el.fEn.toLowerCase().includes(searchVal)
        )
      } else {
        if ([2, 3, 4].includes(activeName.value)) {
          return el.filedType === activeName.value
        }
        return true
      }
    })
    fieldData.forEach((item) => {
      const temdata = {
        value: item.fEn,
        label: item.fZh,
        type: item.fType,
        parentId: item.fieldId || '',
        disabled: item.permissionStatus === false,
        permissionStatus: item.permissionStatus,
      }
      if (props.list.config) {
        temdata['children'] = []
        for (const str in props.list.config[item.fType]) {
          temdata.children.push({
            value: str,
            label: props.list.config[item.fType][str],
          })
        }
      }
      newOptions.push(temdata)
    })
  }

  return newOptions
})
// 显示名
const displayName = computed(() => {
  if (!data.value?.propertyName) {
    for (const str in props.list?.common) {
      if (data.value?.analysis === str) {
        return `${props.list?.common?.[str] ?? ''}`
      }
    }
  } else {
    if (Array.isArray(props.list?.field)) {
      for (const item of props.list.field) {
        if (data.value?.propertyName === item.fEn) {
          const configList = props.list?.config?.[item.fType]
          if (configList) {
            for (const key in configList) {
              if (data.value?.analysis === key) {
                return `${item.fZh}.${configList[key]}`
              }
            }
          }
          return `${item?.fZh ?? ''}`
        }
      }
    }
  }
  return ''
})
// 选择属性
const handleChange = (val) => {
  let temp = omit(cloneDeep(props.modelValue), valuePropsNames)
  temp = { ...temp, ...val }
  isManual.value = true
  emit('update:modelValue', temp)
  emit('change', temp)
  propCascader.value?.handleClose()
}
const showMenu = ref(false)
const visibleChange = (val) => {
  showMenu.value = val
  if (val) {
    activeName.value = 0
    selectedTemp.value = null
    getSelectedTemp()
    // 打开下拉面板滚动到选中的属性
    nextTick(() => {
      const ele = document.querySelector(
        '.yf-cascader-content .options-list-item.is-checked'
      )
      const container = document.querySelector(
        '.yf-cascader-content>.options-list'
      )
      const top = ele?.offsetTop ? ele.offsetTop - container.offsetTop : 0
      container.scrollTo({ top })
    })
  } else {
    search.value = ''
  }
}

// 面板打开时给selectedTemp赋值
const getSelectedTemp = () => {
  if (!data.value?.propertyName) {
    for (const str in props.list?.common) {
      if (data.value?.analysis === str) {
        selectedTemp.value = {
          value: str,
          label: props.list.common[str],
        }
      }
    }
  } else {
    if (Array.isArray(props.list?.field)) {
      const item = props.list.field.find(
        (el) => el.fEn === data.value.propertyName
      )
      if (item) {
        const temdata = {
          value: item.fEn,
          label: item.fZh,
          type: item.fType,
          parentId: item.fieldId || '',
          disabled: item.permissionStatus === false,
          permissionStatus: item.permissionStatus,
        }
        if (props.list.config) {
          temdata['children'] = []
          for (const str in props.list.config[item.fType]) {
            temdata.children.push({
              value: str,
              label: props.list.config[item.fType][str],
            })
          }
        }
        selectedTemp.value = { ...temdata }
      }
    }
  }
}

watch(
  () => props.modelValue,
  (newval) => {
    data.value = { ...newval }
  },
  { deep: true }
)

const search = ref('')
const activeName = ref(0)

const tabs = [
  { label: t('common.all'), value: 0 },
  { label: t('dataManagement.customAttributes'), value: 2 },
  { label: t('dataManagement.dimensionAttributes'), value: 3 },
  { label: t('dataManagement.virtualAttributes'), value: 4 },
]
// 选择属性（区分是否有子级，若有子级，选中子级后值才改变）
const selectedProps = (item) => {
  if (item.permissionStatus === false) return
  selectedTemp.value = { ...item }
  if (props.onlyProps) {
    data.value = getPropsData(item)
    handleChange(data.value)
  } else {
    if (!(Array.isArray(item.children) && item.children.length > 0)) {
      data.value = { analysis: item.value, analysisDesc: item.label }
      handleChange(data.value)
    }
  }
}
//选择属性 (有子级，选中子级)
const selectedChild = (parent, child) => {
  data.value = {
    ...getPropsData(parent),
    analysis: child?.value,
    analysisDesc: child?.label,
  }
  handleChange(data.value)
}

const getPropsData = (props = {}) => ({
  propertyName: props?.value,
  propertyNameDisplay: props?.label,
  propertyType: props?.type,
  parentId: props?.parentId,
  permissionStatus: props?.permissionStatus,
})

// 控制是否展示最右边的面板
const showChildren = computed(
  () =>
    selectedTemp?.value &&
    Array.isArray(selectedTemp?.value?.children) &&
    selectedTemp?.value?.children?.length > 0 &&
    options.value.findIndex((el) => el.value === selectedTemp?.value?.value) >
      -1
)

watch(showChildren, (val) => {
  if (val) {
    propCascader.value?.popperRef?.updatePopper?.()
  }
})

const checkedListItem = (val) => {
  return (
    (data.value?.analysis == val && !data.value?.propertyName) ||
    selectedTemp?.value?.value == val ||
    (props.onlyProps && data.value?.propertyName == val)
  )
}

const showCheckedIcon = (item) => {
  return (
    data.value?.analysis === item.value ||
    (props.onlyProps && data.value?.propertyName == item.value)
  )
}

// 属性被删除、隐藏、删除时显示
const getDisplay = computed(() => {
  const mData = props.modelValue
  return mData?.propertyName
    ? `${mData?.propertyNameDisplay}.${mData?.analysisDesc}`
    : `${mData?.analysisDesc ?? ''}`
})

//查找属性，判断属性是否被隐藏、删除、禁用等
async function searchPropStatus(val) {
  if (val?.propertyName) {
    const find = props.list?.field?.find((el) => el.fEn === val.propertyName)
    if (!find) {
      //查找不存在的属性
      try {
        const res = await getHideFieldInfo([
          {
            appId: sessionStorage.getItem('appId'),
            field: val.propertyName,
            type: props.isAttrAnalysis ? 2 : 1,
          },
        ])
        if (res.code === 200 && res.data) {
          const resData = res.data?.[0]
          const valData = {
            ...val,
            propertyNameDisplay:
              resData?.fieldDisplayName || val.propertyNameDisplay,
            permissionStatus: resData.status === 0,
          }

          isManual.value = true
          emit('update:modelValue', valData)
        }
      } catch (error) {
        console.log(error)
      }
      return false
    } else if (find?.permissionStatus === false) {
      isManual.value = true
      emit('update:modelValue', {
        ...val,
        permissionStatus: find.permissionStatus,
      })

      return false
    }
  }
  return true
}

watch(
  () => props.modelValue,
  async (val) => {
    if (isObject(val) && Object.keys(val).length > 0) {
      if (!isManual.value) {
        const status = await searchPropStatus(val)
        if (!status) return
      }
      isManual.value = false
    }
  },
  { deep: true, immediate: true }
)
</script>

<template>
  <div class="props-cascader">
    <el-dropdown
      trigger="click"
      :placement="placement"
      popper-class="eas-cascader-popper"
      @visible-change="visibleChange"
      ref="propCascader">
      <div
        :class="[
          'eas-drop-box',
          { 'active-border': showMenu },
          { 'no-permission': modelValue?.permissionStatus === false },
        ]">
        {{ displayName || getDisplay }}
      </div>
      <template #dropdown>
        <div class="yf-cascader-panel">
          <div class="yf-cascader-panel__left">
            <CommonInput
              v-model="search"
              class="cascader-search"
              :desc="$t('common.search')" />
            <div class="yf-cascader-content" v-if="showMenu">
              <el-tabs v-model="activeName" v-if="search == ''">
                <el-tab-pane
                  v-for="item in tabs"
                  :label="item.label"
                  :name="item.value"
                  :key="`cascader_tab_${item.value}`"></el-tab-pane>
              </el-tabs>
              <div :class="['options-list', { 'is-search': search != '' }]">
                <div
                  :class="[
                    'options-list-item',
                    {
                      'is-checked': checkedListItem(item.value),
                    },
                    {
                      'no-permission': item.permissionStatus === false,
                    },
                  ]"
                  v-for="item in options"
                  :key="`options-list-item_${item.value}`"
                  @click="selectedProps(item)">
                  <div class="options-list-item__title" v-showTips>
                    {{ item.label }}
                  </div>
                  <div class="options-list-item__icon">
                    <template
                      v-if="
                        Array.isArray(item?.children) &&
                        item?.children.length > 0
                      ">
                      <el-icon><ArrowRightBold /></el-icon>
                    </template>
                    <template v-else>
                      <svg-icon
                        v-if="showCheckedIcon(item)"
                        name="select1"
                        class="is-checked" />
                    </template>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="yf-cascader-panel__right" v-if="showChildren">
            <div
              :class="[
                'props-child-item',
                {
                  'is-checked':
                    data?.propertyName === selectedTemp.value &&
                    data?.analysis === item.value,
                },
              ]"
              v-for="item in selectedTemp?.children"
              :key="`props-child__${item.value}`"
              @click="selectedChild(selectedTemp, item)">
              <div>
                {{ item.label }}
              </div>
              <div
                class="options-list-item__icon"
                v-if="
                  data?.propertyName === selectedTemp.value &&
                  data?.analysis === item.value
                ">
                <svg-icon name="select1" class="is-checked" />
              </div>
            </div>
          </div>
        </div>
      </template>
    </el-dropdown>
  </div>
</template>

<style scoped lang="scss">
.props-cascader {
  display: inline-block;
  .active-border {
    border-color: var(--eas-color-primary);
  }
}
.yf-cascader-panel {
  min-width: 302px;
  height: 363px;
  display: flex;
  &__left {
    width: 302px;
    height: 100%;
    .cascader-search {
      height: 42px;
      :deep(.el-input__wrapper) {
        box-shadow: none;
      }
    }
  }
  &__right {
    min-width: 121px;
    padding: 3px 4px;
    height: 100%;
    border-left: 1px solid var(--eas-split-line-color);
  }
}
.yf-cascader-content {
  border-top: 1px solid var(--eas-split-line-color);
  height: calc(100% - 42px);
  :deep() {
    .el-tabs {
      height: 37px;
    }
    .el-tabs__item {
      height: 37px;
      padding: 0px;
      font-weight: bold;
      &:not(.is-active) {
        color: var(--eas-text-color-light);
      }
      &:not(:last-child) {
        margin-right: 20px;
      }
    }
    .el-tabs__header {
      margin: 0px;
    }
    .el-tabs__nav-wrap {
      padding: 0px 10px;
      &::after {
        background-color: transparent;
        height: 4px;
      }
    }
    .el-tabs__active-bar {
      height: 4px;
      border-radius: var(--eas-border-radius);
    }
  }
}
.options-list {
  height: calc(100% - 45px);
  padding: 0px 4px;
  margin: 4px 0px;
  overflow-y: auto;
  &.is-search {
    height: calc(100% - 8px);
  }
  &-item {
    width: 100%;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 10px 11px 6px;
    cursor: pointer;
    &:hover {
      background-color: var(--eas-hover-color);
    }
    &.is-checked {
      .options-list-item__title,
      .options-list-item__icon {
        color: var(--eas-color-primary);
      }
    }
    &.no-permission {
      cursor: not-allowed;
      .options-list-item__title,
      .options-list-item__icon {
        color: var(--eas-text-color-light-1);
      }
    }
  }
}
.options-list-item__title {
  width: 247px;
  color: var(--eas-text-color-primary);
  font-size: var(--eas-font-size-base);
}
.options-list-item__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--eas-text-color-light);
}
.is-checked {
  color: var(--eas-color-primary);
}
.props-child-item {
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 10px 11px 6px;
  color: var(--eas-text-color-primary);
  font-size: var(--eas-font-size-base);
  cursor: pointer;
  &:hover {
    background-color: var(--eas-hover-color);
  }
  &.is-checked {
    color: var(--eas-color-primary);
  }
}
</style>
<style lang="scss">
.el-popper.eas-cascader-popper {
  margin-top: -10px;
  background: var(--eas-white-bg-color);
  box-shadow: 0px 3px 6px 1px rgba(42, 51, 84, 0.09);
  border-radius: var(--eas-border-radius-4);
  .el-popper__arrow {
    display: none;
  }
  .el-cascader-panel {
    border: none !important;
    border-radius: 0px;
  }
}
</style>
