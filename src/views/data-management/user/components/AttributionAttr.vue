<template>
  <CommonDrawer
    @submit="submit"
    @close="close"
    size="600px"
    :loading="state.operateLoading"
    v-model="state.showOperate"
    :title="$t('dataManagement.userAttr.addUserAttribution')">
    <el-table
      ref="tableRef"
      border
      class="nd-table-custom h-auto"
      :data="state.eventAttributeList">
      <el-table-column prop="fEn" :label="$t('dataManagement.attributeName')" />
      <el-table-column prop="fZh" :label="$t('dataManagement.displayName')" />
      <el-table-column prop="fType" :label="$t('dataManagement.dataType')">
        <template #default="{ row }">
          {{ eventDataTypeListMap[row.fType] }}
        </template>
      </el-table-column>
    </el-table>
  </CommonDrawer>
</template>

<script setup>
import { markRaw, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { eventDataTypeListMap } from '@/enumeration/data-management/event'

import {
  asyncSelectUserAttribution,
  asyncAddUserAttribution,
} from '@/api/modules/data-management/user'
import { recordBehavior } from '@/utils/record-behavior.js'
import { t } from '@/locales/i18n'

const initVal = () => {
  return {
    operateLoading: false,
    showOperate: false,
    eventAttributeList: [],
  }
}

const emit = defineEmits(['getData'])
const state = reactive(initVal())
const formRef = ref(null)

const close = () => {
  Object.assign(state, initVal())
}
const submit = async () => {
  recordBehavior({
    moduleName: '数据管理',
    submoduleName: '用户属性',
    operate: '新增用户归因属性',
  })
  state.operateLoading = true
  const { fEn, fType, fZh } = state.eventAttributeList[0]
  await asyncAddUserAttribution({
    fEn,
    fType,
    fZh,
  }).finally(() => {
    state.operateLoading = false
  })
  state.showOperate = false
  emit('getData')
  ElMessage.success(t('common.addedSuccessfully'))
}

const getData = async () => {
  const { data } = await asyncSelectUserAttribution()
  state.eventAttributeList = markRaw(data)
}

// data.mark: 1 内购  2 广告
const open = (mark) => {
  state.showOperate = true
  getData()
}

defineExpose({
  open,
})
defineOptions({
  name: 'AttributionAttr',
})
</script>
