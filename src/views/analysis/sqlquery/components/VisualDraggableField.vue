<script setup>
import { cloneDeep } from 'lodash-es'
import { ref, reactive, onMounted, watch, computed, useAttrs } from 'vue'
import draggable from 'vuedraggable'
import VisualSelectField from './VisualSelectField.vue'
import { v4 as uuidv4 } from 'uuid'
import { Plus } from '@element-plus/icons-vue'
import { debounce } from 'lodash-es'
import { t } from '@/locales/i18n'

const attrs = useAttrs()
const props = defineProps({
  modelValue: {
    type: Object,
    default: () => {},
  },
  columns: {
    type: Array,
    default: () => [],
  },
  data: {
    type: Array,
    default: () => [],
  },
  graphType: {
    type: Number,
    default: 1,
  },
})

const newGraphType = computed(() => {
  return props.graphType
})

onMounted(() => {
  document.body.ondrop = function (event) {
    event.preventDefault()
    event.stopPropagation()
  }
})

const state = reactive({
  name: '',
  fieldList: [],
  fieldFilterList: [],
  groupX: [],
  groupXRemove: [{ value: 'delete' }],
  groupXStart: false,
  groupChildX: [],
  groupChildXRemove: [{ value: 'delete' }],
  groupChildXStart: false,
  groupY: [],
  groupYRemove: [{ value: 'delete' }],
  groupYStart: false,
  groupRY: [],
  groupRYRemove: [{ value: 'delete' }],
  groupRYStart: false,
  showGroupRY: false,
})

const config = computed({
  get: () => {
    return props.modelValue
  },
  set: (val) => {
    emit('update:modelValue', val)
  },
})

watch(newGraphType, (newval) => {
  if (newval === 6) {
    let isCheck = false
    if (state.groupChildX.length) {
      const childX = cloneDeep(state.groupChildX)
      state.groupChildX.splice(0, state.groupChildX.length)
      state.groupX = state.groupX.concat(childX)
      isCheck = true
    }
    if (state.groupRY.length) {
      const rY = cloneDeep(state.groupRY)
      state.groupRY.splice(0, state.groupRY.length)
      state.groupY = state.groupY.concat(rY)
      isCheck = true
    }
    if (isCheck) {
      return
    }
  }
  if (newval !== 20) {
    // 还原图表类型
    state.groupY.forEach((item) => {
      item.graphType = 1
    })
    state.groupRY.forEach((item) => {
      item.graphType = 1
    })
  } else {
    // 组合图去除分组
    if (state.groupChildX.length) {
      const childX = cloneDeep(state.groupChildX)
      state.groupChildX.splice(0, state.groupChildX.length)
      state.groupX = state.groupX.concat(childX)
    }
  }
  handleFieldUpdate()
})

watch(
  () => props.modelValue,
  (newVal) => {
    state.fieldList.splice(0, state.fieldList.length)
    state.groupX.splice(0, state.groupX.length)
    state.groupChildX.splice(0, state.groupChildX.length)
    state.groupY.splice(0, state.groupY.length)
    state.groupRY.splice(0, state.groupRY.length)
    state.showGroupRY = false
    state.name = ''
    if (newVal && JSON.stringify(newVal) !== '{}') {
      const graphCfg = cloneDeep(props.modelValue)

      //初始化参数及字段名
      props.columns.forEach((item) => {
        const numStatus = item.sortType
          ? item.sortType === 'number'
          : typeof props.data
              .map((dataItem) => dataItem[item.prop])
              .filter((item) => item !== null)[0] === 'number'
        const value = [numStatus ? 'sum' : 'count']
        state.fieldList.push({
          id: uuidv4(),
          name: item.prop,
          newName: `${item.prop}(${value[0] === 'sum' ? t('analysis.sqlquery.sum') : t('analysis.sqlquery.distinctCount')})`,
          numStatus,
          iconStatus: false,
          value,
          sort: ['cancel'],
          graphType: 1,
        })
      })

      graphCfg.groupX.forEach((item) => {
        item.id = uuidv4()
        if (!item.sort) {
          item.sort = ['cancel']
        }
      })
      graphCfg.groupChildX.forEach((item) => {
        item.id = uuidv4()
        if (!item.sort) {
          item.sort = ['cancel']
        }
      })
      graphCfg.groupY.forEach((item) => {
        item.id = uuidv4()
        if (!item.sort) {
          item.sort = ['cancel']
        }
        if (!item.graphType) {
          item.graphType = 1
        }
      })
      graphCfg.groupRY &&
        graphCfg.groupRY.forEach((item) => {
          item.id = uuidv4()
          if (!item.sort) {
            item.sort = ['cancel']
          }
          if (!item.graphType) {
            item.graphType = 1
          }
        })
      state.groupX =
        graphCfg.groupX.filter((item) =>
          props.columns.some((col) => col.prop === item.name)
        ) || []
      state.groupChildX =
        graphCfg.groupChildX.filter((item) =>
          props.columns.some((col) => col.prop === item.name)
        ) || []
      state.groupY =
        graphCfg.groupY.filter((item) =>
          props.columns.some((col) => col.prop === item.name)
        ) || []
      if (graphCfg.groupRY && graphCfg.groupRY.length) {
        state.groupRY =
          graphCfg.groupRY.filter((item) =>
            props.columns.some((col) => col.prop === item.name)
          ) || []
      } else {
        state.groupRY = []
      }
      if (state.groupRY && state.groupRY.length) {
        state.showGroupRY = true
      }

      if (
        state.fieldList &&
        state.fieldList.length > 1 &&
        !state.groupX.length &&
        !state.groupY.length
      ) {
        const srtList = state.fieldList.filter(
          (item) => item.value[0] === 'count'
        )
        const numList = state.fieldList.filter(
          (item) => item.value[0] === 'sum'
        )
        state.groupX.push(
          cloneDeep(srtList.length ? srtList[0] : state.fieldList[0])
        )
        state.groupY.push(
          cloneDeep(numList.length ? numList[0] : state.fieldList[1])
        )
      }
    }
    handleFieldFilter()
    handleFieldUpdate()
  },
  { deep: true }
)

watch(
  () => state.groupX,
  () => {
    handleFieldUpdate()
  },
  { deep: true }
)

watch(
  () => state.groupChildX,
  () => {
    handleFieldUpdate()
  },
  { deep: true }
)

watch(
  () => state.groupY,
  () => {
    handleFieldUpdate()
  },
  { deep: true }
)

watch(
  () => state.groupRY,
  () => {
    handleFieldUpdate()
  },
  { deep: true }
)

/**
 * @description 过滤字段名称
 */
const handleFieldFilter = (e = '') => {
  state.fieldFilterList.splice(0, state.fieldFilterList.length)
  const filterList = state.fieldList.filter(
    (item) => item.name.toLocaleLowerCase().indexOf(e.toLocaleLowerCase()) > -1
  )
  state.fieldFilterList.push(...filterList)
}

/**
 *  @description 左侧不可移动顺序
 */
const handleColumnsMove = (e) => {
  if (e.to.id === 'columns' || e.to.id === 'groupXRemove') {
    return false
  }
}

/**
 *  @description 拖拽复制序列化
 */
const handleColumnsClone = (origin) => {
  const data = cloneDeep(origin)
  return data
}

/**
 * X轴拖拽方法
 */
const handleGroupXMove = (e) => {
  if (
    ['columns', 'groupChildXRemove', 'groupYRemove', 'groupRYRemove'].includes(
      e.to.id
    )
  ) {
    return false
  }
}
const handleGroupXStart = () => {
  state.groupXStart = true
}
const handleGroupXEnd = () => {
  state.groupXStart = false
}
const handleGroupXRemove = (e) => {
  if (e.from.id === 'groupX') {
    state.groupXRemove.splice(1, state.groupXRemove.length)
  }
}

/**
 * ChildX轴轴拖拽方法
 */
const handleGroupChildXMove = (e) => {
  if (
    ['columns', 'groupXRemove', 'groupYRemove', 'groupRYRemove'].includes(
      e.to.id
    )
  ) {
    return false
  }
}
const handleGroupChildXStart = () => {
  state.groupChildXStart = true
}
const handleGroupChildXEnd = () => {
  state.groupChildXStart = false
}
const handleGroupChildXRemove = (e) => {
  if (e.from.id === 'groupChildX') {
    state.groupChildXRemove.splice(1, state.groupChildXRemove.length)
  }
}

/**
 * Y轴拖拽方法
 */
const handleGroupYMove = (e) => {
  if (
    ['columns', 'groupXRemove', 'groupChildXRemove', 'groupRYRemove'].includes(
      e.to.id
    )
  ) {
    return false
  }
}
const handleGroupYStart = () => {
  state.groupYStart = true
}
const handleGroupYEnd = () => {
  state.groupYStart = false
}
const handleGroupYRemove = (e) => {
  if (e.from.id === 'groupY') {
    state.groupYRemove.splice(1, state.groupYRemove.length)
  }
}

/**
 * RY轴拖拽方法
 */
const handleGroupRYMove = (e) => {
  if (
    ['columns', 'groupXRemove', 'groupChildXRemove', 'groupYRemove'].includes(
      e.to.id
    )
  ) {
    return false
  }
}
const handleGroupRYStart = () => {
  state.groupRYStart = true
}
const handleGroupRYEnd = () => {
  state.groupRYStart = false
}
const handleGroupRYRemove = (e) => {
  if (e.from.id === 'groupRY') {
    state.groupRYRemove.splice(1, state.groupRYRemove.length)
  }
}

const handleDelGroupRY = () => {
  state.showGroupRY = false
  if (state.groupRY.length) {
    const rY = cloneDeep(state.groupRY)
    state.groupRY.splice(0, state.groupRY.length)
    state.groupY = state.groupY.concat(rY)
  }
}

const handleSort = (data) => {
  handleFieldUpdate()
}

const handleFieldDelete = (name, idx) => {
  state[`group${name}`].splice(idx, 1)
  handleFieldUpdate()
}

const handleFieldChange = (name, idx) => {
  state.groupX.forEach((item, index) => {
    if (item.sort[0] !== 'cancel' && name !== 'ChildX') {
      if (name !== 'X' || idx !== index) {
        item.sort = ['cancel']
      }
    }
  })
  state.groupChildX.forEach((item, index) => {
    if (item.sort[0] !== 'cancel' && name === 'ChildX') {
      if (name !== 'ChildX' || idx !== index) {
        item.sort = ['cancel']
      }
    }
  })
  state.groupY.forEach((item, index) => {
    if (item.sort[0] !== 'cancel' && name !== 'ChildX') {
      if (name !== 'Y' || idx !== index) {
        item.sort = ['cancel']
      }
    }
  })
  state.groupRY.forEach((item, index) => {
    if (item.sort[0] !== 'cancel' && name !== 'ChildX') {
      if (name !== 'RY' || idx !== index) {
        item.sort = ['cancel']
      }
    }
  })
  handleFieldUpdate()
}

const handleFieldUpdate = debounce((val) => {
  updateConfig()
}, 500)

const emit = defineEmits(['update:modelValue', 'getConfig'])

const updateConfig = () => {
  const config = {
    groupX: state.groupX,
    groupChildX: state.groupChildX,
    groupY: state.groupY,
    groupRY: state.groupRY,
    showGroupRY: state.showGroupRY,
    sortArr: props.modelValue?.sortArr || [],
  }
  emit('update:modelValue', config)
  emit('getConfig', config)
}

defineOptions({
  name: 'DraggableField',
})
</script>
<template>
  <div class="flex">
    <div class="draggable-field-left h100-percentage">
      <div class="ml10 mr20">
        <CommonInput
          style="width: 220px"
          v-model="state.name"
          :placeholder="$t('analysis.sqlquery.searchFieldName')"
          @input="handleFieldFilter" />
      </div>
      <div class="field-list">
        <span class="pl10 mt20 mb10 txt-bold">
          {{ $t('analysis.sqlquery.field') }}
        </span>
        <draggable
          id="columns"
          v-model="state.fieldFilterList"
          :group="{ name: 'cloneGroup', pull: 'clone', put: false }"
          :animation="500"
          item-key="id"
          :move="handleColumnsMove"
          :clone="handleColumnsClone"
          class="field-list-draggable">
          <template #item="{ element }">
            <div class="field-list-item ellipsis" :title="element.name">
              {{ element.name }}
            </div>
          </template>
        </draggable>
      </div>
    </div>
    <div class="draggable-field-right">
      <!-- X轴 -->
      <div class="draggable-field-right-header txt-bold mb10">
        {{
          newGraphType === 6
            ? `${$t('analysis.sqlquery.row')} / ${$t('analysis.group')}`
            : `${$t('analysis.sqlquery.xAxis')} / ${$t('analysis.group')}`
        }}
      </div>
      <draggable
        id="groupX"
        v-model="state.groupX"
        :group="{ name: 'cloneGroup', pull: true, put: true }"
        :animation="500"
        item-key="id"
        class="default-height"
        :move="handleGroupXMove"
        @start="handleGroupXStart"
        @end="handleGroupXEnd"
        @sort="handleSort">
        <template #item="{ element, index }">
          <div
            class="field-list-right-item ellipsis default-item"
            :title="element.name">
            <VisualSelectField
              v-model="state.groupX[index]"
              type="X"
              :index="index"
              @change="handleFieldChange"
              @delete="handleFieldDelete"
              :graphType="newGraphType"
              v-bind="attrs"></VisualSelectField>
          </div>
        </template>
      </draggable>
      <draggable
        id="groupXRemove"
        v-model="state.groupXRemove"
        :class="[
          'mt10',
          'default-height-remove',
          'group-box-remove',
          state.groupXStart ? 'group-remove-style' : '',
        ]"
        item-key="id"
        group="cloneGroup"
        @add="handleGroupXRemove"
        filter=".unmover"
        :sort="false">
        <template #item="{ index }">
          <div v-if="index === 0" class="sql-chart-right-bottom mb20 unmover">
            <span v-if="!state.groupXStart">
              {{ $t('analysis.sqlquery.dragToTop') }}
            </span>
            <div v-else class="flex-center">
              <SvgIcon class="fz14 ml10 mr10" name="delete1" />
              <span>
                <i class="el-icon-delete" />
                {{ $t('analysis.sqlquery.dragToDelete') }}
              </span>
            </div>
          </div>
        </template>
      </draggable>
      <!-- ChildX轴 -->
      <div
        v-if="newGraphType !== 5 && newGraphType !== 6 && newGraphType !== 20">
        <div class="draggable-field-right-header txt-bold mb10">
          {{ $t('analysis.sqlquery.subGroup') }}
        </div>
        <draggable
          id="groupChildX"
          v-model="state.groupChildX"
          :group="{ name: 'cloneGroup', pull: true, put: true }"
          :animation="500"
          item-key="id"
          class="default-height"
          :move="handleGroupChildXMove"
          @start="handleGroupChildXStart"
          @end="handleGroupChildXEnd"
          @sort="handleSort">
          <template #item="{ element, index }">
            <div
              class="field-list-right-item ellipsis default-item"
              :title="element.name">
              <VisualSelectField
                v-model="state.groupChildX[index]"
                type="ChildX"
                :index="index"
                @change="handleFieldChange"
                @delete="handleFieldDelete"
                :graphType="newGraphType"
                v-bind="attrs"></VisualSelectField>
            </div>
          </template>
        </draggable>
        <draggable
          id="groupChildXRemove"
          v-model="state.groupChildXRemove"
          :class="[
            'mt10',
            'default-height-remove',
            'group-box-remove',
            state.groupChildXStart ? 'group-remove-style' : '',
          ]"
          item-key="id"
          group="cloneGroup"
          @add="handleGroupChildXRemove"
          filter=".unmover"
          :sort="false">
          <template #item="{ index }">
            <div v-if="index === 0" class="sql-chart-right-bottom mb20 unmover">
              <span v-if="!state.groupChildXStart">
                {{ $t('analysis.sqlquery.dragToTop') }}</span
              >
              <div v-else class="flex-center">
                <SvgIcon class="fz14 ml10 mr10" name="delete1" />
                <span
                  ><i class="el-icon-delete" />{{
                    $t('analysis.sqlquery.dragToDelete')
                  }}</span
                >
              </div>
            </div>
          </template>
        </draggable>
      </div>
      <!-- Y轴 -->
      <div
        class="draggable-field-right-header txt-bold mb10 flex-center flex-between">
        <div>
          {{
            newGraphType === 6
              ? `${$t('analysis.sqlquery.row')} / ${$t('analysis.group')}`
              : `${$t('analysis.sqlquery.yAxis')} / ${$t('analysis.indicators')}`
          }}
        </div>
        <el-icon
          class="fz18 txt-bold c-pointer"
          v-if="!state.showGroupRY && newGraphType !== 5 && newGraphType !== 6"
          @click="state.showGroupRY = true"
          ><Plus
        /></el-icon>
      </div>
      <draggable
        id="groupY"
        v-model="state.groupY"
        :group="{ name: 'cloneGroup', pull: true, put: true }"
        :animation="500"
        item-key="id"
        class="default-height"
        :move="handleGroupYMove"
        @start="handleGroupYStart"
        @end="handleGroupYEnd"
        @sort="handleSort">
        <template #item="{ element, index }">
          <div
            class="field-list-right-item ellipsis default-item"
            :title="element.name">
            <VisualSelectField
              v-model="state.groupY[index]"
              type="Y"
              :index="index"
              @change="handleFieldChange"
              @delete="handleFieldDelete"
              :graphType="newGraphType"
              bgColor="var(--eas-color-success)"
              v-bind="attrs"></VisualSelectField>
          </div>
        </template>
      </draggable>
      <draggable
        id="groupYRemove"
        v-model="state.groupYRemove"
        :class="[
          'mt10',
          'default-height-remove',
          'group-box-remove',
          state.groupYStart ? 'group-remove-style' : '',
        ]"
        group="cloneGroup"
        item-key="id"
        @add="handleGroupYRemove"
        filter=".unmover"
        :sort="false">
        <template #item="{ index }">
          <div v-if="index === 0" class="sql-chart-right-bottom mb20 unmover">
            <span v-if="!state.groupYStart">
              {{ $t('analysis.sqlquery.dragToTop') }}</span
            >
            <div v-else class="flex-center">
              <SvgIcon class="fz14 ml10 mr10" name="delete1" />
              <span>{{ $t('analysis.sqlquery.dragToDelete') }}</span>
            </div>
          </div>
        </template>
      </draggable>
      <!-- RY轴 -->
      <div v-if="newGraphType !== 5 && newGraphType !== 6 && state.showGroupRY">
        <div
          class="draggable-field-right-header txt-bold mb10 flex-center flex-between">
          <div>
            {{ $t('analysis.sqlquery.secondaryYAxis') }} /
            {{ $t('analysis.indicators') }}
          </div>
          <el-button text @click="handleDelGroupRY">
            <SvgIcon class="fz14 ml10 mr10" name="delete1" />
          </el-button>
        </div>
        <draggable
          id="groupRY"
          v-model="state.groupRY"
          :group="{ name: 'cloneGroup', pull: true, put: true }"
          :animation="500"
          item-key="id"
          class="default-height"
          :move="handleGroupRYMove"
          @start="handleGroupRYStart"
          @end="handleGroupRYEnd"
          @sort="handleSort">
          <template #item="{ element, index }">
            <div
              class="field-list-right-item ellipsis default-item"
              :title="element.name">
              <VisualSelectField
                v-model="state.groupRY[index]"
                type="RY"
                :index="index"
                @change="handleFieldChange"
                @delete="handleFieldDelete"
                :graphType="newGraphType"
                bgColor="var(--eas-color-success)"
                v-bind="attrs"></VisualSelectField>
            </div>
          </template>
        </draggable>
        <draggable
          id="groupRYRemove"
          v-model="state.groupRYRemove"
          :class="[
            'mt10',
            'default-height-remove',
            'group-box-remove',
            state.groupRYStart ? 'group-remove-style' : '',
          ]"
          item-key="id"
          group="cloneGroup"
          @add="handleGroupRYRemove"
          filter=".unmover"
          :sort="false">
          <template #item="{ index }">
            <div v-if="index === 0" class="sql-chart-right-bottom mb20 unmover">
              <span v-if="!state.groupRYStart">
                {{ $t('analysis.sqlquery.dragToTop') }}</span
              >
              <div v-else class="flex-center">
                <SvgIcon class="fz14 ml10 mr10" name="delete1" />
                <span
                  ><i class="el-icon-delete" />{{
                    $t('analysis.sqlquery.dragToDelete')
                  }}</span
                >
              </div>
            </div>
          </template>
        </draggable>
      </div>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.draggable-field-left {
  width: 250px;
  border-right: 1px solid var(--eas-border-color);
}
.draggable-field-right {
  width: 280px;
  padding: 0 20px 0 20px;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  &-header {
    color: var(--eas-text-color-light);
    > i:hover {
      color: var(--eas-color-primary);
    }
  }
  .field-list-right-item {
    padding: 10px 10px 0 10px;
  }
}
.field-list {
  height: calc(100% - 32px);
  &-draggable {
    height: calc(100% - 55px);
    overflow-y: auto;
    overflow-x: hidden;
  }
  > span {
    display: inline-block;
    color: var(--eas-text-color-light);
  }
  &-item {
    width: 240px;
    padding: 6px 10px 6px;
    margin-right: 10px;
    margin-bottom: 6px;
    cursor: move;
    &:hover {
      background: var(--eas-hover-color);
    }
  }
}
.default-height {
  width: 240px;
  min-height: 52px;
  padding-bottom: 10px;
  background: var(--eas-color-primary-light-1);
}
.default-height-remove {
  width: 240px;
  line-height: 32px;
  .field-list-item {
    display: none;
  }
  .field-list-right-item {
    display: none;
  }
}
.group-remove-style {
  .sql-chart-right-bottom {
    line-height: 30px;
    color: var(--eas-color-danger);
    border: 1px dashed var(--eas-color-danger);
    background: var(--eas-color-danger-light);
    i {
      background: var(--eas-color-danger-light);
    }
  }
}
</style>
