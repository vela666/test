<template>
  <CommonDrawer
    @close="close"
    :showBtn="false"
    :loading="state.operateLoading"
    v-model="state.show"
    :title="$t('dataManagement.buried.acceptanceResults')">
    <div class="flex flex-direction-column h100-percentage gap10">
      <div>
        {{ $t('dataManagement.buried.timeRange') }}：
        {{
          `${state.rowData.startTime} ${$t('common.to')} ${state.rowData.endTime}`
        }}
      </div>
      <div class="flex-center flex-between">
        <div class="flex-center gap10">
          <CommonInput
            clearable
            @input="getData"
            :placeholder="$t('dataManagement.buried.searchEventAttrDisplay')"
            v-model="filterConfig.searchVal"
            class="w220" />
          <CommonInput
            clearable
            @input="getData"
            :placeholder="$t('dataManagement.buried.searchExceptionDesc')"
            v-model="filterConfig.searchErrVal"
            class="w220" />
        </div>
        <Auth :value="authEnum.exportAbnormal">
          <template #default>
            <el-button
              v-loading="state.dowloadLoading"
              type="primary"
              :disabled="state.dataRef?.disabled"
              @click="exportAbnormalData">
              <svg-icon name="download" class="mr5 fz16" />
              {{ $t('dataManagement.buried.exportAbnormalData') }}
              <!-- {{ title }} -->
            </el-button>
          </template>
        </Auth>
      </div>
      <el-table
        class="nd-table-custom"
        :data="state.tableData"
        border
        v-loading="state.loading">
        <el-table-column
          v-for="item in columns"
          :key="item.prop"
          :label="item.label"
          :prop="item.prop"
          show-overflow-tooltip
          v-bind="{ ...item }">
          <template #default="{ row }">
            <div
              v-if="item.prop === 'typeDesc'"
              :class="typeDescMap[row.typeDesc]">
              {{ row.typeDesc }}
            </div>
            <div
              v-else-if="item.prop === 'errMsg'"
              class="flex flex-column overflow-hidden">
              <div v-for="(msg, index) of row.errMsg" :key="index" v-showTips>
                {{ msg }}
              </div>
            </div>
            <template v-else-if="item.prop === 'operation'">
              <el-button
                v-if="row.typeDesc !== $t('common.success')"
                text
                type="primary"
                @click="handleDetail(row)">
                {{ $t('dataManagement.buried.viewReport') }}
              </el-button>
              <span v-else>--</span>
            </template>
            <template v-else>{{ row[item.prop]?.toLocaleString() }}</template>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </CommonDrawer>
  <JsonView
    ref="jsonviewRef"
    :json-data="state.sampleData"
    :title="$t('dataManagement.buried.viewReport')" />
</template>

<script setup>
import { markRaw, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { debounce } from 'lodash-es'
import { recordBehavior } from '@/utils/record-behavior.js'
import { authEnum } from '../enum.js'
import JsonView from '@/views/data-management/buried/component/JsonView.vue'
import {
  asyncExportInspection,
  asyncSearchInspectionDetail,
} from '@/api/modules/programme/data-check.js'
import { delNullProperty } from '@/utils/dataProcessing.js'
import { t } from '@/locales/i18n.js'

const initVal = () => {
  return {
    state: {
      operateLoading: false,
      show: false,
      rowData: {
        startTime: '',
        endTime: '',
      },
      sampleData: {},
      tableData: [],
      dowloadLoading: false,
    },
    filterConfig: { searchVal: '', searchErrVal: '' },
  }
}

const emit = defineEmits(['getData'])
const state = reactive(initVal().state)
const filterConfig = reactive(initVal().filterConfig)
const jsonviewRef = ref(null)
const commonUploadRef = ref(null)
const columns = [
  {
    label: t('dataManagement.buried.eventAndAttribute'),
    prop: 'name',
  },
  {
    label: t('dataManagement.displayName'),
    prop: 'displayName',
  },
  {
    label: t('dataManagement.buried.acceptanceResults'),
    prop: 'typeDesc',
  },
  {
    label: t('dataManagement.buried.exceptionDescription'),
    prop: 'errMsg',
    'show-overflow-tooltip': false,
  },
  {
    label: t('common.operate'),
    prop: 'operation',
  },
]
const typeDescMap = {
  成功: 'c00b42a',
  异常: 'cf53f3f',
  未上报: 'ccbd0d6',
}
const close = () => {
  Object.assign(state, initVal().state)
  Object.assign(filterConfig, initVal().filterConfig)
}

const exportAbnormalData = async () => {
  recordBehavior({
    moduleName: '数据管理',
    submoduleName: '埋点方案',
    operate: '下载异常数据',
  })
  state.dowloadLoading = true
  await asyncExportInspection(state.rowData.id).finally((_) => {
    state.dowloadLoading = false
  })
  ElMessage.success(t('dataManagement.exportSuccessfully'))
}

const handleDetail = (row) => {
  state.sampleData = JSON.parse(row.sampleData)
  jsonviewRef.value.open()
}

const getData = debounce(async () => {
  state.operateLoading = true
  const {
    data: { list },
  } = await asyncSearchInspectionDetail(
    delNullProperty({
      ...filterConfig,
      inspectionId: state.rowData.id,
      size: -1,
    })
  ).finally((_) => {
    state.operateLoading = false
  })
  state.tableData = list.map((item) => {
    return {
      ...item,
      errMsg: item.errMsg?.split(/\r\n/) || ['--'],
    }
  })
}, 300)

const open = (row) => {
  state.rowData = markRaw(row)
  state.show = true
  getData()
}

defineExpose({
  open,
})
defineOptions({
  name: 'AcceptanceResult',
})
</script>

<style scoped lang="scss">
.nd-data-acceptance-way {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--eas-text-color-light-1);
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
}
.nd-data-acceptance-way-acitve {
  border-color: var(--eas-color-primary);
}
.nd-data-acceptance-time-range {
  :deep(.el-form-item__content) {
    width: 300px;
  }
}
</style>
