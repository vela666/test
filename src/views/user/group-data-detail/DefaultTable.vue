<template>
  <div class="flex-column gap20 nd-user-default-table">
    <div class="flex-between flex-center">
      <div>
        <Auth :value="authEnum.exportUserData">
          <template #default="{ title }">
            <el-button
              v-loading="state.exportLoading"
              v-if="state.total"
              @click="exportData"
              type="primary">
              <SvgIcon name="download" class="mr5 fz16" />
              {{ title }}
            </el-button>
          </template>
        </Auth>
      </div>
      <div class="flex-center gap10">
        <div class="c545e6e">
          {{ $t('common.maximumPieces', [state.total, 1000]) }}
        </div>
        <CustomField
          v-model="customColumnVal"
          :data="state.customColumnData"
          :defaultProps="{
            value: 'propertyName',
            label: 'propertyNameDisplay',
          }"
          @submit="emit('customColumnConfirm')"
          valueKey
          placement="left" />
      </div>
    </div>

    <vxe-table
      v-loading="state.tableLoading"
      border
      ref="vxeTableRef"
      class="nd-vxe-table-custom nd-vxe-column-center"
      max-height="660px"
      auto-resize
      show-overflow
      show-header-overflow
      :row-config="{ isHover: true }"
      :column-config="{ resizable: true }"
      :data="state.tableData"
      :scroll-x="{ enabled: true, gt: 10 }"
      :scroll-y="{ enabled: true, gt: 100 }">
      <vxe-column
        sortable
        :title="item.propertyNameDisplay"
        v-for="item of columns"
        :field="item.propertyName"
        :key="item.propertyName"
        min-width="200"
        :align="alignProcessing(item)"
        :fixed="fixedColumnList.includes(item.propertyName) ? 'left' : ''">
        <template #default="{ row }">
          <div
            class="c-pointer c5473e8"
            v-if="fixedColumnList.includes(item.propertyName)"
            @click="showSquenceDetail(row)">
            {{ row[item.propertyName] }}
          </div>
          <template v-else>
            {{ row[item.propertyName] }}
          </template>
        </template>
      </vxe-column>
    </vxe-table>
    <UserSequence ref="userSequenceRef" />
  </div>
</template>

<script setup>
import { computed, reactive, ref, markRaw } from 'vue'
import UserSequence from '@/views/user/components/UserSequence/index.vue'
import { asyncGetAllUserAttr } from '@/api/modules/data-management/user'
import { asyncGetGroupUserList } from '@/api/modules/user-group'
import { exportToExcel } from '@/utils/excel'
import { numberTypeList } from '@/enumeration/user/common.js'
import { authEnum } from '../user-group/enum.js'
import { recordBehavior } from '@/utils/record-behavior.js'
import { handleCustomColumn } from '@/utils/dataProcessing.js'

const props = defineProps({
  customColumn: {
    type: Array,
    default() {
      return []
    },
  },
  groupName: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:customColumn'])

const fixedColumnList = ['__fid', '__did']
const state = reactive({
  customColumnData: [],
  tableData: [],
  userFieldTypeInfoMap: {},
  total: 0,
  exportLoading: false,
  tableLoading: false,
})
const vxeTableRef = ref(null)
const userSequenceRef = ref(null)

const customColumnVal = computed({
  get() {
    return props.customColumn
  },
  set(val) {
    localStorage.setItem('customTableColumn', JSON.stringify(val))
    emit('update:customColumn', val)
  },
})
/*const vxeTableHeight = computed(() => {
  return state.tableData.length * 65 > 660
    ? 660
    : state.tableData.length * 65 < 145
    ? 145
    : state.tableData.length * 65
})*/

const columns = computed(() => {
  return state.customColumnData.filter((e) =>
    customColumnVal.value.includes(e.propertyName)
  )
})

const alignProcessing = (prop) => {
  if (numberTypeList.includes(state.userFieldTypeInfoMap[prop.propertyName])) {
    return 'right'
  }
  return 'left'
}

const showSquenceDetail = (row) => {
  recordBehavior({
    moduleName: '用户',
    submoduleName: '用户分群',
    operate: '进入用户行为序列页面',
  })
  userSequenceRef.value.open(row, state.tableData)
}

const getCustomColumnData = async () => {
  const { data } = await asyncGetAllUserAttr()
  state.customColumnData = markRaw(
    data
      .map((item) => {
        return {
          ...item,
          disabled: fixedColumnList.includes(item.propertyName),
        }
      })
      .sort(
        (a, b) =>
          /^__/.test(b.propertyName) - /^__/.test(a.propertyName) ||
          /^(__fid|__did)/.test(b.propertyName) - /^__/.test(a.propertyName)
      )
  )

  /*  if (state.customColumnData.length) {
    /!*customColumnVal.value = [
      ...fixedColumnList,
      ...state.customColumnData
        .filter((item) => !/^__/.test(item.propertyName))
        .map((e) => e.propertyName),
    ]*!/
  }*/

  customColumnVal.value = handleCustomColumn(
    state.customColumnData.map((e) => e.propertyName)
  )
}

const exportData = async () => {
  if (state.exportLoading) return
  const columnsData = state.customColumnData.map((item) => {
    return item.propertyNameDisplay
  })
  const dataKeys = state.customColumnData.map((item) => {
    return item.propertyName
  })
  let dataValues = vxeTableRef.value.getTableData().visibleData.map((v) =>
    dataKeys.map((j) => {
      return v[j]
    })
  )
  state.exportLoading = true
  await exportToExcel({
    fileName: props.groupName,
    sheets: {
      // sheetName: '工作表名字 可选',
      sheetData: [columnsData, ...dataValues],
    },
  }).finally((_) => {
    state.exportLoading = false
  })
}

const getTableData = async (id) => {
  state.tableLoading = true
  const { data } = await asyncGetGroupUserList(id).finally((_) => {
    state.tableLoading = false
  })
  state.tableData = markRaw(data.userInfoList)
  state.userFieldTypeInfoMap = markRaw(data.userFieldTypeInfoMap)
  state.total = data.userTotal
}
/**
 * @description: 动态列
 * @return {*}
 * @param {*} list
 */
/*const confirmField = (list) => {
  state.columns = list.map((item) => {
    item.label = item.zhName
    item.prop = item.enName
    return item
  })
}*/

getCustomColumnData()
defineExpose({
  getTableData,
})
defineOptions({
  name: 'DefaultTable',
})
</script>

<style scoped lang="scss"></style>
