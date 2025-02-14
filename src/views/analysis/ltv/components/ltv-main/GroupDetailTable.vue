<script setup>
import { reactive, shallowRef, ref } from 'vue'
import { thousandsFilter } from '@/utils/index.js'
import ResultClusterDialog from '@/views/analysis/components/ResultClusterDialog/index.vue'
import ResultUserListDialog from '@/views/analysis/components/ResultUserListDialog/index.vue'
import { createLtvResultSegmentation } from '@/api/modules/common'
import { isObject } from 'lodash-es'

defineOptions({
  name: 'GroupDetailTable',
})
const state = reactive({
  groupName: '',
  visible: false,
  columnList: [],
  tableData: [],
  onlyUserAction: false,
  flag: 0,
  noticeFlag: true,
  dataDesc: '',
})

const showGroupCluster = shallowRef()

const getGroupClusterParams = shallowRef()

const open = (options = {}) => {
  const {
    data,
    columnList,
    tableData,
    onlyUserAction,
    showCluster,
    flag,
    getClusterParams,
    dataDesc,
  } = options
  state.columnList = columnList ?? []
  state.tableData = tableData ?? []
  state.groupName = data?.['col_0'] ?? ''
  state.onlyUserAction = onlyUserAction
  showGroupCluster.value = showCluster
  state.flag = flag
  getGroupClusterParams.value = getClusterParams
  state.dataDesc = dataDesc
  state.noticeFlag = true
  state.visible = true
}

const resultClusterRef = ref(null)
const openClustDialog = (params = {}) => {
  resultClusterRef.value?.open(isObject(params) ? params : {})
}

const userListRef = ref(null)
const openUserListDialog = (params = {}) => {
  userListRef.value?.open(isObject(params) ? params : {})
}

defineExpose({
  open,
})
</script>

<template>
  <CommonDialog
    v-model="state.visible"
    :title="$t('analysis.component.groupDetails', [state.groupName])"
    :showBtn="false"
    width="70%">
    <LimitNotice
      v-if="state.tableData.length >= 1000"
      class="mb20"
      v-model="state.noticeFlag"
      :text="state.dataDesc" />
    <VxeTableSort
      :columns="state.columnList"
      :data="state.tableData"
      :min-height="100"
      :max-height="550"
      pageFlag>
      <template #customColumn="{ row, column, index }">
        <div>
          <div>
            <template
              v-if="
                showGroupCluster?.(
                  row,
                  index,
                  column.field,
                  state.onlyUserAction ? 2 : 1,
                  true
                )
              ">
              <span
                class="text-underline c-pointer"
                @click="
                  openUserListDialog(
                    getGroupClusterParams(
                      { row, column },
                      index,
                      state.onlyUserAction ? 2 : 1,
                      true
                    )
                  )
                ">
                {{ thousandsFilter(row[column.field]) }}
              </span>
              <svg-icon
                class="ml5 c-pointer"
                name="creator1"
                @click="
                  openClustDialog(
                    getGroupClusterParams(
                      { row, column },
                      index,
                      state.onlyUserAction ? 2 : 1,
                      true
                    )
                  )
                " />
            </template>
            <span v-else>{{ thousandsFilter(row[column.field]) }}</span>
          </div>
          <div v-if="row[column.field + '_user'] !== undefined">
            <template
              v-if="
                showGroupCluster?.(row, index, column.field + '_user', 2, true)
              ">
              <span
                class="text-underline c-pointer"
                @click="
                  openUserListDialog(
                    getGroupClusterParams({ row, column }, index, 2, true)
                  )
                ">
                {{ thousandsFilter(row[column.field + '_user']) }}
              </span>
              <svg-icon
                class="ml5 c-pointer"
                name="creator1"
                @click="
                  openClustDialog(
                    getGroupClusterParams({ row, column }, index, 2, true)
                  )
                " />
            </template>
            <span v-else>{{
              thousandsFilter(row[column.field + '_user'])
            }}</span>
          </div>
        </div>
      </template>
    </VxeTableSort>
  </CommonDialog>
  <ResultClusterDialog
    ref="resultClusterRef"
    :qp="{}"
    :api="createLtvResultSegmentation" />
  <ResultUserListDialog ref="userListRef" :analysisType="9" />
</template>

<style scoped lang="scss"></style>
