<template>
  <CommonDrawer
    @submit="submit"
    @close="close"
    :loading="state.operateLoading"
    v-model="state.showOperate"
    :title="$t('dataManagement.customTable.configAttributes')">
    <OperateTip class="mb20">
      {{ $t('dataManagement.customTable.configAttributesTip') }}
    </OperateTip>
    <el-button @click="addRow()" class="mt20 mb10" type="primary" text
      >+{{ $t('dataManagement.addRow') }}</el-button
    >
    <vxe-table
      border
      ref="vxeTableRef"
      class="nd-vxe-table-custom nd-vxe-column-center"
      min-height="110px"
      auto-resize
      :row-config="{ isHover: true }"
      :column-config="{ resizable: true }"
      :data="state.attrList"
      :scroll-y="{ enabled: true }"
      :scroll-x="{ enabled: true }">
      <!--      <vxe-column title=" " align="center" type="seq" width="55" />-->
      <vxe-column
        v-for="(column, index) of columns"
        :key="index"
        :title="column.label"
        :align="column.align"
        :min-width="column.width">
        <!--        <template #header>
          <div v-showTips class="c1c2028">{{ column.fEn }}</div>
          <div v-showTips class="c86919d">{{ column.fZh }}</div>
        </template>-->
        <template #default="{ row }">
          <template v-if="column.prop === 'primaryKey'">
            <SvgIcon
              v-if="state.mapField[row.customFiled]?.primaryKeyOrNot"
              name="select1"
              class="c5473e8" />
          </template>
          <template v-else-if="column.prop === 'customFiled'">
            <FieldSelect
              @change="(val) => fieldSelectChange(row, val)"
              :selectedFields="selectedFields"
              v-model="row[column.prop]"
              :selectData="state.fieldList" />
          </template>
          <template v-else-if="column.prop === 'relationExtraInfo'">
            <PropSelect
              v-show="row.customFiled"
              :desc="$t('dataManagement.customTable.selectAttributes')"
              clearable
              height="32px"
              :list="filterPropSelectList(row.customFiled)"
              v-model="row.relationExtraInfo"
              :limit="associatedAttrLimit" />
          </template>
          <template v-else-if="column.prop === 'fieldType'">
            {{ fieldEnum[state.mapField[row.customFiled]?.columnType]?.label }}
          </template>
          <template v-else>
            {{ state.mapField[row.customFiled]?.columnDisplay }}
          </template>
        </template>
      </vxe-column>
      <vxe-column
        align="center"
        fixed="right"
        width="80"
        :title="$t('common.operate')">
        <template #default="{ rowIndex }">
          <el-button
            v-if="state.attrList.length > 1"
            @click="deleteRow(rowIndex)"
            class="nd-operate-btn-active fz28"
            text>
            <SvgIcon name="delete1" class="fz16 c86919d" />
          </el-button>
        </template>
      </vxe-column>
    </vxe-table>
  </CommonDrawer>
</template>

<script setup>
import { computed, markRaw, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { isEmpty } from 'lodash-es'
import FieldSelect from './FieldSelect.vue'
import { tableTypeArr } from '@/enumeration/index.js'
import {
  getCustomAssociablePropertyList,
  getCustomAssociatedPropertyDetails,
  getCustomFieldList,
  setCustomAssociableProperty,
} from '@/api/modules/custom-table.js'
import { t } from '@/locales/i18n'
/*column: '__fid'
columnDisplay: '__fid'
columnType: 'text'
primaryKeyOrNot: false*/
// 左侧字段对应的数据类型字段， 右侧对应关联属性，
// 如字段数据类型为text关联属性则只保留string的类型数据
const fieldEnum = {
  text: {
    label: t('common.text'),
    filter: ['string'],
  },
  int4: {
    label: t('dataManagement.numeral'),
    filter: ['int'],
  },
  int8: {
    label: t('dataManagement.numeral'),
    filter: ['int'],
  },
}

const initVal = () => {
  return {
    operateLoading: false,
    showOperate: false,
    rowData: {},
    attrList: [],
    associatedAttrList: [],
    fieldList: [],
    mapField: {},
  }
}
const columns = [
  {
    label: t('dataManagement.customTable.primaryKey'),
    prop: 'primaryKey',
    align: 'center',
    width: '30px',
  },
  {
    label: t('dataManagement.fieldName'),
    prop: 'customFiled',
    width: '150px',
  },
  {
    label: t('dataManagement.displayName'),
    prop: 'customFieldDisplay',
    width: '150px',
  },
  {
    label: t('dataManagement.dataType'),
    prop: 'fieldType',
    width: '50px',
  },
  {
    label: t('dataManagement.customTable.relatedAttributes'),
    prop: 'relationExtraInfo',
    width: '180px',
  },
]
const attrLimit = ['eventField', 'userField']
const emit = defineEmits(['getList'])
const state = reactive(initVal())
// 事件名称下拉互斥 防止重复
// 已选字段
const selectedFields = computed(() => {
  return state.attrList.map((item) => item.customFiled).filter(Boolean)
})
// 关联属性限制
const associatedAttrLimit = computed(() => {
  const limit =
    tableTypeArr[
      state.attrList.find(
        (item) => item.relationExtraInfo?.tableType !== undefined
      )?.relationExtraInfo?.tableType
    ]
  return limit && state.attrList.length !== 1 ? [limit] : attrLimit
})

const fieldSelectChange = (row, val) => {
  row.relationExtraInfo = {}
}

const filterPropSelectList = (val) => {
  if (!val) return state.associatedAttrList
  const filterCriteria =
    fieldEnum[state.mapField[val]?.columnType]?.filter || []
  return Object.entries(state.associatedAttrList).reduce(
    (result, [key, items]) => {
      result[key] = attrLimit.includes(key)
        ? items.filter((item) => filterCriteria.includes(item.fType))
        : items
      return result
    },
    {}
  )
}

const addRow = (data) => {
  state.attrList.push({
    customFieldDisplay: '',
    customFiled: '',
    fieldType: '',
    relationField: '',
    relationExtraInfo: {},
    tableType: 0,
    ...data,
  })
}

const deleteRow = (index) => {
  state.attrList.splice(index, 1)
}

const close = () => {
  Object.assign(state, initVal())
}

const submit = async () => {
  if (
    !state.attrList.length ||
    state.attrList.some((item) => isEmpty(item.relationExtraInfo))
  ) {
    ElMessage.warning(t('dataManagement.customTable.confirmConfig'))
    return
  }

  state.operateLoading = true
  await setCustomAssociableProperty({
    fieldList: state.attrList.map((item) => {
      return {
        customFieldDisplay: state.mapField[item.customFiled]?.columnDisplay,
        customFiled: item.customFiled,
        fieldType: state.mapField[item.customFiled]?.columnType,
        relationExtraInfo: JSON.stringify(item.relationExtraInfo),
        relationField: item.relationExtraInfo.fEn,
        tableType: item.relationExtraInfo.tableType,
      }
    }),
    id: state.rowData.id,
  }).finally((_) => {
    state.operateLoading = false
  })
  ElMessage.success(t('common.operationSuccessfully'))
  state.showOperate = false
  emit('getList')
}

// 获取字段列表
const asyncGetCustomFieldList = async (tableId) => {
  const { data } = await getCustomFieldList(tableId)
  state.fieldList = markRaw(data.fieldList)
  state.mapField = markRaw(
    data.fieldList.reduce((p, c) => {
      p[c.column] = c
      return p
    }, {})
  )
}

// 获取详情数据
/*
关联属性回显必须字段
const initProps = {
  fEn: mVal.value?.fEn,
  tableType: mVal.value?.tableType,
  // fType: mVal.value?.fType,有时需要
  name: mVal.value?.fZh || mVal.value?.name,
}
*/
const asyncGetCustomAssociatedPropertyDetails = async (tableId) => {
  const { data } = await getCustomAssociatedPropertyDetails(tableId)
  state.attrList = data.map((item) => {
    return {
      ...item,
      relationExtraInfo: JSON.parse(
        isEmpty(item.relationExtraInfo) ? '{}' : item.relationExtraInfo
      ),
    }
  })
}

// 获取对应事件的事件属性和用户属性、用户分群、用户标签
const asyncGetCustomAssociablePropertyList = async () => {
  const { data } = await getCustomAssociablePropertyList()
  state.associatedAttrList = data
}

const open = async (row) => {
  state.showOperate = true
  state.rowData = markRaw(row)
  try {
    state.operateLoading = true
    asyncGetCustomAssociablePropertyList()
    await asyncGetCustomFieldList(row.id)
    await asyncGetCustomAssociatedPropertyDetails(row.id)
    if (!state.attrList.length) {
      addRow()
      /* addRow({
         customFiled: state.fieldList[0].column,
      })*/
    }
  } catch (e) {
    console.log(e)
  }
  state.operateLoading = false
}

defineExpose({
  open,
})
defineOptions({
  name: 'ConfigureAssociationAttr',
})
</script>

<style scoped lang="scss">
.nd-associated-attr {
  .elem-hover {
    display: none;
  }
  &:hover {
    .elem-hover {
      display: block;
    }
  }
}
</style>
