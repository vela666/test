<template>
  <div
    class="optional-data-selection"
    :style="`height: ${height}`"
    v-loading="loading">
    <div class="selection-left">
      <div class="selection-left-all">
        <div>
          <span class="mr5">
            {{ $t('common.opt') }}
            <i class="c5473e8">{{ state.cloneOptionalData.length }}</i>
            {{ $t('common.pcs') }}
          </span>
          <slot></slot>
        </div>
        <el-checkbox
          v-show="!!state.cloneOptionalData.length"
          :indeterminate="isIndeterminate"
          v-model="state.checked"
          @change="checkedAll">
          {{ $t('common.selectAll') }}
        </el-checkbox>
      </div>

      <CommonInput
        v-model="state.search"
        :desc="$t('btn.search')"
        class="w100-percentage skip" />
      <div class="selection-exhibit">
        <el-checkbox-group
          v-if="state.cloneOptionalData.length"
          v-model="selectedData">
          <div
            v-for="item of state.cloneOptionalData"
            class="selection-list"
            :key="item[valueKey]">
            <el-checkbox :label="item[valueKey]" :value="item[valueKey]">
              <span v-showTips class="w100-percentage ellipsis fz14 c616161">
                {{ item[valueLabel] }}
              </span>
            </el-checkbox>
          </div>
        </el-checkbox-group>
        <div
          v-else
          class="c86919d h100-percentage flex-center flex-level-center">
          {{ $t('common.noData') }}
        </div>
      </div>
    </div>
    <div class="selection-right">
      <div class="flex-center flex-between">
        <span>
          {{ $t('common.selected') }}
          <i class="c5473e8">{{ selectLists.length }}</i>
          {{ $t('common.pcs') }}
        </span>
        <el-button v-show="!!selectedData.length" text @click="delData(false)">
          {{ $t('common.clear') }}
        </el-button>
      </div>
      <div class="selection-exhibit">
        <div v-for="item of selectLists" :key="item" class="selected">
          <div class="flex-center flex-between">
            <span v-showTips class="w100-percentage ellipsis c616161">
              {{ item[valueLabel] }}
            </span>
            <SvgIcon
              @click="delData(item)"
              class="c-pointer ml10 c8a8a8a"
              name="close1" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, computed, watch } from 'vue'
import { uniqBy, cloneDeep } from 'lodash-es'
import { isBoolean } from '@/utils/types'
// 如项目组管理的 添加成员/应用
/*<OptionalDataSelection
valueKey="userId"
:list="state.optionaMemberlData"
v-model="state.addMemberFormData.selectedMembers"
    />*/
const props = defineProps({
  loading: {
    type: Boolean,
    default: false,
  },
  modelValue: {
    type: Array,
    default: () => [],
  },
  list: {
    type: Array,
    default: () => [],
  },
  height: {
    type: String,
    default: '612px',
  },
  valueLabel: {
    type: String,
    default: 'name',
  },
  valueKey: {
    type: String,
    default: 'id',
  },
})
const emit = defineEmits(['update:modelValue', 'change'])

const initVal = () => {
  return {
    search: '',
    checked: false,
    cloneOptionalData: [],
  }
}
const state = reactive(initVal())
const isIndeterminate = computed(() => {
  return (
    !!selectedData.value.length &&
    !state.cloneOptionalData.every((item) =>
      selectedData.value.includes(item[props.valueKey])
    )
  )
})

// 已选数据
const selectedData = computed({
  get() {
    return props.modelValue
  },
  set(val) {
    emit('update:modelValue', val)
  },
})

const optionalData = computed(() => {
  return props.list
})
// 已选列表
const selectLists = computed(() => {
  return optionalData.value.filter((item) =>
    selectedData.value.includes(item[props.valueKey])
  )
})

watch(
  optionalData,
  (val) => {
    state.cloneOptionalData = cloneDeep(val)
  },
  {
    // deep: true,
    immediate: true,
  }
)
watch([() => state.search, selectedData], ([val]) => {
  state.cloneOptionalData = optionalData.value.filter((item) =>
    item[props.valueLabel].toLowerCase().includes(val.toLowerCase())
  )
  state.checked = state.cloneOptionalData.length
    ? state.cloneOptionalData.every((item) =>
        selectedData.value.includes(item[props.valueKey])
      )
    : false
})

const checkedAll = (mark) => {
  let tmp = state.cloneOptionalData.map((item) => item[props.valueKey])
  let mergeVal = uniqBy([...selectedData.value, ...tmp])
  let filterVal = selectedData.value.filter((item) => !tmp.includes(item))
  selectedData.value = mark ? mergeVal : filterVal
}

const delData = (val) => {
  if (isBoolean(val)) {
    selectedData.value = []
  } else {
    selectedData.value = selectLists.value
      .filter((item) => item[props.valueKey] !== val[props.valueKey])
      .map((item) => item[props.valueKey])
  }
}

const reset = (val) => {
  Object.assign(state, initVal())
}

defineOptions({
  name: 'OptionalDataSelection',
})
</script>
<style lang="scss" scoped>
.optional-data-selection {
  display: flex;
  border-radius: 4px;
  border: 1px solid var(--eas-border-color-2);
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
</style>
