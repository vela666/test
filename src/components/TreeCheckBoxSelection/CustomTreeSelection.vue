<template>
  <div
    :class="{
      'optional-data-tree-selection-hide-operate': hide,
    }"
    :style="`height:${height}`"
    class="optional-data-tree-selection">
    <SelectionLeft
      :optionalList="state.optionalList.length"
      :isIndeterminate="state.isIndeterminate"
      v-model:checked="state.checked"
      v-model:search="state.search"
      @change="checkedAll">
      <template #leftTop v-if="$slots.leftTop">
        <slot name="leftTop"></slot>
      </template>
      <CustomElTreeCheckBox
        default-expand-all
        v-bind="attrs"
        ref="treeRef"
        :props="treeProps"
        @checkBoxChange="checkBoxChange"
        :node-key="nodeKey"
        :filter-node-method="filterMethod"
        @updNode="updNode"
        :data="state.cloneOptionalData">
        <template #default="{ data }">
          <div class="flex w100-percentage overflow-hidden">
            <span
              class="mr10"
              :class="{ 'txt-bold': data.topLevel }"
              v-showTips>
              {{ data[treeProps.label] }}
            </span>
          </div>
        </template>
      </CustomElTreeCheckBox>
    </SelectionLeft>

    <SelectionRight
      :rightShowParent="rightShowParent"
      :selectLists="selectLists.length"
      :defaultSelectedAndDisabledNode="defaultSelectedAndDisabledNode.length"
      :mapSelectLists="mapSelectLists"
      @delData="delData"
      :treeProps="treeProps">
      <template #rightCustom v-if="$slots.rightCustom">
        <slot
          :mapSelectLists="mapSelectLists"
          :selectLists="selectLists"
          :delData="delData"
          name="rightCustom"></slot>
      </template>
      <template #rightTop v-if="$slots.rightTop">
        <slot name="rightTop"></slot>
      </template>
      <template #rightOperate="{ data }" v-if="$slots.rightOperate">
        <slot name="rightOperate" :data="data" :delData="delData"> </slot>
      </template>
    </SelectionRight>
  </div>
</template>

<script setup>
import { useAttrs } from 'vue'
// 适用于有禁用节点的存在，element-plus目前自带的有bug
// 目前有两种回显方式
// 1： 处理data的数据 src/views/see-plate/components/SideKanBan/components/AddOrEditSpace/index.vue
// 2： 传入已选列表
import useOperation from './useOperation'
import SelectionLeft from './SelectionLeft.vue'
import SelectionRight from './SelectionRight.vue'

const attrs = useAttrs()
const props = defineProps({
  props: {
    type: Object,
    default() {
      return {}
    },
  },
  nodeKey: {
    type: String,
    default: 'id',
  },
  height: {
    type: String,
    default: '700px',
  },
  data: {
    type: Array,
    default() {
      return []
    },
  },
  hide: {
    type: Boolean,
    default: false,
  },
  /*
   数据回显
   [
       {
         // 要和 nodeKey一致
         id: 124,
         name: 'chenys',
         // 不传 默认为true
         selected: true,
         // 和treeProps.value里的 disabled字段值一致
         disabled: true,
         // notShow 为true 过滤节点
         notShow: false,
       },
       ...
   ]*/
  selectedList: {
    type: Array,
    default() {
      return []
    },
  },
  // 右侧显示父级
  rightShowParent: {
    type: Boolean,
    default: true,
  },
})
// change事件里返回对应的树结构层级
const emit = defineEmits(['change'])
const selected = defineModel({
  type: Array,
  default() {
    return []
  },
})

const {
  state,
  treeRef,
  treeProps,
  selectLists,
  mapSelectLists,
  defaultSelectedAndDisabledNode,
  delData,
  updNode,
  checkedAll,
  filterMethod,
  checkBoxChange,
} = useOperation({
  props,
  emit,
  selected,
})

defineExpose({
  treeRef,
  optionalList: () => state.optionalList,
})
defineOptions({
  name: 'CustomTreeSelection',
})
</script>
