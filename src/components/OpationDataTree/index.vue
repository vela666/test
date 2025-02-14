<template>
  <div class="optional-data-selection" :style="`height: ${height}`">
    <div class="selection-left">
      <div class="selection-left-all">
        <div>
          <span class="mr5">
            {{ $t('common.opt') }}
            <i class="c5473e8"> {{ state.flatDataList.length }} </i> 个
          </span>
        </div>
        <el-checkbox
          v-show="!!state.flatDataList.length"
          :indeterminate="state.isIndeterminate"
          v-model="state.checked"
          @change="checkedAll">
          {{ $t('common.selectAll') }}
        </el-checkbox>
      </div>

      <CommonInput
        v-model="state.search"
        :placeholder="searchPlaceholder || $t('common.pleaseEnter')"
        class="w100-percentage not-required"
        @input="onQueryChanged"
        :validate-event="false" />

      <div class="selection-exhibit">
        <el-tree-v2
          :data="data"
          :props="defaultProps"
          show-checkbox
          :ref="(ref) => (state.treeRef = ref)"
          :filter-method="filterMethod"
          :height="state.elTreeV2_height"
          @check="checkChange" />
      </div>
    </div>
    <div class="selection-right">
      <div class="flex-center flex-between">
        <span>
          {{ $t('common.selected') }}
          <i class="c5473e8"> {{ state.selectDataList.length }}</i>
          {{ $t('common.pcs') }}
        </span>
        <el-button
          v-show="!!state.selectDataList.length"
          text
          @click="handleClearAll()"
          type="primary">
          {{ $t('btn.clearAction') }}
        </el-button>
      </div>
      <div class="selection-exhibit" style="margin: 0">
        <template v-if="selectedType === 'custom'">
          <div
            v-for="(item, i) of state.selectDataList"
            :key="item[props.defaultProps.value]"
            class="selected">
            <div class="flex-center flex-between">
              <span class="w100-percentage ellipsis c616161">
                {{ item[props.defaultProps.label] }}
              </span>
              <SvgIcon
                @click="handleDelete(i)"
                class="c-pointer ml10 c8a8a8a"
                name="close1" />
            </div>
          </div>
        </template>
        <template v-else-if="selectedType === 'table'">
          <div style="height: 100%; padding: 0 10px">
            <el-table
              style="height: 100%"
              :data="state.selectDataList"
              :header-cell-style="{ background: '#f0f2f5' }"
              size="small">
              <el-table-column
                v-for="item in props.columns"
                :key="item.prop"
                :label="item.label"
                :prop="item.prop"
                show-overflow-tooltip
                v-bind="{ ...item }">
                <template #default="scope">
                  <template v-if="item.prop === 'operation'">
                    <el-button
                      text
                      type="primary"
                      size="small"
                      @click="handleDelete(scope.$index)">
                      {{ $t('btn.delete') }}
                    </el-button>
                  </template>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </template>
        <template v-else>
          <slot name="selected" />
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, watch, onMounted, nextTick } from 'vue'
import { cloneDeep } from 'lodash-es'
import { useFormItem } from 'element-plus'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => [],
  },
  data: {
    type: Array,
    default: () => [],
  },
  height: {
    type: String,
    default: '400px',
  },
  defaultProps: {
    type: Object,
    default: () => ({
      label: 'label',
      value: 'value',
    }),
  },
  searchPlaceholder: {
    type: String,
    default: '',
  },
  selectedType: {
    type: String,
    default: 'custom',
  },
  columns: {
    type: Array,
    default: () => [],
  },
})
const emit = defineEmits(['update:modelValue', 'change'])

const initVal = () => {
  return {
    search: '',
    checked: false,
    cloneOptionalData: [],
    treeRef: null,
    selectDataList: props.modelValue,
    flatDataList: [], // 扁平数据源
    isIndeterminate: false,
    elTreeV2_height: 0,
  }
}
const state = reactive(initVal())

watch(
  () => props.data,
  (val) => {
    state.flatDataList = val.reduce((pre, next) => {
      pre.push(...next.children)
      return pre
    }, [])
  },
  {
    immediate: true,
    deep: true,
  }
)

onMounted(() => {
  nextTick(() => {
    state.elTreeV2_height = document
      .querySelector('.selection-exhibit')
      .getBoundingClientRect().height
  })
})

/**
 * @description: 全选
 * @return {*}
 * @param {*} flag
 */
const checkedAll = (flag) => {
  state.selectDataList = flag ? cloneDeep(state.flatDataList) : []
}

/**
 * @description: 搜索
 * @return {*}
 * @param {*} query
 */
const onQueryChanged = (query) => {
  state.treeRef?.filter(query)
}

/**
 * @description: 搜索
 * @return {*}
 * @param {*} query
 */
const filterMethod = (query, node) => {
  return node[props.defaultProps.label]?.includes(query)
}

/**
 * @description: 当复选框被点击的时候触发
 * @return {*}
 */
const checkChange = (data, { checkedNodes }) => {
  const checkedList = [...checkedNodes.filter((item) => !item.children)]
  state.selectDataList = checkedList
}

/**
 * @description: 清空
 * @return {*}
 */
const handleClearAll = () => {
  state.treeRef.setCheckedKeys([])
  state.selectDataList = []
}

/**
 * @description: 删除
 * @return {*}
 * @param {*} i  下标
 */
const handleDelete = (i) => {
  state.selectDataList.splice(i, 1)
}

watch(
  () => state.selectDataList,
  (val) => {
    const checkedKeys = val.map((item) => item[props.defaultProps.value])

    const timer = setTimeout(() => {
      clearTimeout(timer)
      state.treeRef?.setCheckedKeys(checkedKeys)
    }, 300)

    state.isIndeterminate =
      val.length > 0 && val.length < state.flatDataList.length
    state.checked = val.length === state.flatDataList.length

    emit('update:modelValue', val)
  },
  {
    immediate: true,
    deep: true,
  }
)

const { formItem } = useFormItem()
watch(
  () => props.modelValue,
  () => {
    formItem?.validate('change').catch((err) => {})
  }
)

/**
 * @description: 重置
 * @return {*}
 */
const reset = () => {
  Object.assign(state, initVal())
}

defineExpose({
  reset,
})
</script>
<style lang="scss" scoped>
.optional-data-selection {
  display: flex;
  border-radius: 4px;
  border: 1px solid var(--eas-border-color-2);
  width: 100%;
}

.optional-data-selection {
  //flex: 1;
  overflow: hidden;

  > div {
    display: flex;
    flex-direction: column;
    padding-top: 5px;
    //padding: 5px 10px 10px 10px;
    flex: 1;
    overflow: hidden;
  }
  .selection-left {
    width: 280px;
  }
  .selection-left,
  .selection-right {
    > div {
      &:not(:last-of-type) {
        padding: 0px 10px;
      }
      &:last-of-type {
        margin: 10px 0;
      }
    }
  }
  .selection-exhibit {
    height: 100%;
    overflow-y: auto;

    .selection-list {
      display: flex;
      align-items: center;
      width: 100%;
      padding: 0 10px;
      height: 32px;
      line-height: 32px;
      border-radius: 2px;
      :deep(.el-checkbox) {
        width: 100%;
        padding: 0 10px;
        &.is-checked {
          span {
            color: var(--eas-color-primary);
          }
        }
        &:hover {
          background-color: var(--eas-hover-color-2);
        }
      }
      :deep(.el-checkbox__label) {
        display: flex;
        width: 100%;
      }

      &:hover {
        color: var(--eas-color-primary);
      }
    }
    .selected {
      padding: 0 10px;
      > div {
        background-color: var(--eas-hover-color-2);
        padding: 0 10px;
        &:hover {
          * {
            color: var(--eas-color-primary);
          }
        }
      }
      &:not(:last-of-type) {
        margin-bottom: 10px;
      }
    }
  }

  .selection-left {
    border-right: 1px solid var(--eas-border-color-2);

    .selection-left-all {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
  }
}

:deep() {
  .not-required .el-input__wrapper {
    box-shadow: 0 0 0 1px var(--el-input-border-color, var(--el-border-color))
      inset !important;
  }
}
</style>
