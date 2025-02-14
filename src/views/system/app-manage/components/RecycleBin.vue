<template>
  <CommonDrawer
    :loading="state.loading"
    :title="$t('system.apps.recycleBin')"
    size="700px"
    @close="close"
    :showBtn="false"
    v-model="state.show">
    <el-table class="nd-table-custom" :data="state.tableData" border>
      <el-table-column
        v-for="column of columns"
        :prop="column.prop"
        :key="column.label"
        :label="column.label"
        :show-overflow-tooltip="!!column.prop">
        <template #default="{ row }">
          <el-button
            type="primary"
            text
            v-if="column.operate"
            @click="recycleApp(row)">
            {{ $t('common.restore') }}
          </el-button>
          <template v-else>
            {{ row[column.prop] }}
          </template>
        </template>
      </el-table-column>
    </el-table>
  </CommonDrawer>
</template>

<script setup>
import { reactive } from 'vue'
import { asynRecycleApp, asynGetRecycleBinList } from '@/api/modules/app'
import { recordBehavior } from '@/utils/record-behavior.js'
import { authEnum } from '../enum.js'
import { useI18n } from 'vue-i18n'
const { t } = useI18n() // 使用useI18n钩子获取国际化t函数

const emit = defineEmits(['getData'])

const initVal = () => {
  return {
    loading: false,
    show: false,
    tableData: [],
  }
}

const columns = [
  {
    prop: 'appName',
    label: t('system.apps.appName'),
  },
  {
    prop: 'appId',
    label: 'App Id',
  },
  {
    prop: 'projectListStr',
    label: t('system.apps.belongingProjectTeam'),
  },
  {
    prop: 'createBy',
    label: t('common.createBy'),
  },
  {
    prop: 'restore',
    label: t('system.apps.periodValidity'),
  },
  {
    label: t('common.operate'),
    operate: true,
  },
].filter((item) => {
  if (!authEnum.del && item.operate) {
    return false
  }
  return true
})

const state = reactive(initVal())

const close = () => {
  Object.assign(state, initVal())
  emit('getData', false)
}

const getRecycleBinList = async () => {
  state.loading = true
  const { data } = await asynGetRecycleBinList().finally((_) => {
    state.loading = false
  })
  state.tableData = data
}

const recycleApp = async (row) => {
  await asynRecycleApp(row.appId)
  recordBehavior({
    moduleName: '系统管理',
    submoduleName: '应用管理',
    operate: `恢复应用【${row.appName}】-${row.appId}`,
  })
  getRecycleBinList()
}

const open = () => {
  state.show = true
  getRecycleBinList()
}

defineExpose({
  open,
})
defineOptions({
  name: 'RecycleBin',
})
</script>

<style scoped lang="scss"></style>
