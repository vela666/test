<template>
  <el-tree :data="dataList" ref="treeRef" :props="treeProps" v-bind="attrs">
    <template #default="{ data }">
      <el-checkbox
        @click.stop
        :indeterminate="data.indeterminate"
        v-model="data.checked"
        :disabled="data[treeProps.disabled]"
        @change="handlchange($event, data)" />
      <slot :data="data"></slot>
    </template>
  </el-tree>
</template>

<script setup>
import { computed, ref, useAttrs, watch } from 'vue'
import { ElTree } from 'element-plus'
// 适用于存在节点禁用的情况，目前element-plus自带的 节点禁用时 父级需要点两次才能选中

import useCustomCheckBox from './useCustomCheckBox'
import {
  flattenTree,
  findAllParentItems,
  findAllSubItems,
} from '@/utils/dataProcessing.js'

const props = defineProps({
  props: {
    type: Object,
    default() {
      return {}
    },
  },
  data: {
    type: Array,
    default() {
      return []
    },
  },
})
const emit = defineEmits(['checkBoxChange', 'updNode'])
const attrs = useAttrs()
const dataList = ref([])

const treeProps = computed(() => {
  return {
    ...ElTree.props.props.default(),
    ...props.props,
  }
})
const flatDataList = computed(() => {
  return flattenTree(dataList.value)
})
const treeRef = ref(null)
const handlchange = (checked, data) => {
  emit('checkBoxChange', checked, data)
  checkBoxChange(checked, data)
}
const uniqueKey = computed(() => {
  return attrs['node-key'] || attrs['nodeKey']
})
const {
  checkBoxChange,
  getCheckedNodes,
  getCheckedKeys,
  setCheckedKeys,
  setCheckedNodes,
  clearAllSelection,
} = useCustomCheckBox({
  config: treeProps.value,
  attrs,
  uniqueKey,
  dataList,
})

const filter = async (val) => {
  flatDataList.value.forEach((item) => {
    /* const subs = findAllSubItems(item, treeProps.value.children)
    subs.forEach((sub) => {
      sub.display = !val || false
    })*/
    if (
      val &&
      item[treeProps.value.label]
        .toLocaleLowerCase()
        .includes(val.toLocaleLowerCase())
    ) {
      item.display = true
    } else {
      item.display = !val || false
    }
  })

  flatDataList.value.forEach((item) => {
    const parents = findAllParentItems(
      dataList.value,
      item[uniqueKey.value],
      false,
      uniqueKey.value,
      treeProps.value.children
    )
    parents.forEach((parent) => {
      parent.display = parent.children.some((n) => n.display)
      const bool = parent.children
        .filter((n) => n.display)
        .every((n) => n[treeProps.value.disabled])
      parent[treeProps.value.disabled] = bool
      // src/components/TreeCheckBoxSelection/useOperation.js
      // defaultSelectedAndDisabledNode使用 skip跳过判断
      parent.skip = bool
    })
  })

  treeRef.value.filter(val)
  emit('updNode')
}

watch(
  () => props.data,
  (val) => {
    dataList.value = val
  },
  {
    immediate: true,
  }
)

defineExpose({
  treeRef,
  filter,
  getCheckedNodes,
  getCheckedKeys,
  setCheckedKeys,
  setCheckedNodes,
  clearAllSelection,
})

defineOptions({
  name: 'CustomElTreeCheckBox',
})
</script>
