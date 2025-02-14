<template>
  <el-table
    v-loading="state.operateLoading"
    class="nd-table-custom mt10 mb20"
    :data="state.appPagedData"
    border>
    <el-table-column
      v-for="column of appColumn"
      :prop="column.prop"
      :key="column.label"
      :label="column.label"
      v-bind="{ ...column }"
      :show-overflow-tooltip="!!column.prop">
      <template #header>
        <FilterDropdown
          v-if="column.prop === 'status'"
          @change="handleTableData"
          v-model="filterConfig.status"
          :list="appStatusType"
          :name="column.label" />
        <div v-if="column.prop === 'dataQuantity'">
          <span class="mr3">{{
            $t('system.projectTeams.inventoryQuantity')
          }}</span>
          <el-tooltip
            :content="$t('system.projectTeams.totalInventory')"
            placement="top">
            <svg-icon name="help2" />
          </el-tooltip>
        </div>
        <div
          v-if="
            ['eventFieldStatistic', 'userFieldStatistic'].includes(column.prop)
          ">
          <span class="mr3">{{ column.label }}</span>
          <el-tooltip
            :content="$t('system.projectTeams.publishedAttributes')"
            placement="top">
            <svg-icon name="help2" />
          </el-tooltip>
        </div>
      </template>
      <template #default="{ row }">
        <template v-if="column.operate">
          <el-button
            @click="buttonExecuteOperation({ type: 'setAuthority', row })"
            type="primary"
            text>
            {{ $t('system.projectTeams.setPermissionPackage') }}
          </el-button>
          <el-button
            @click="buttonExecuteOperation({ type: 'removeApp', row })"
            type="primary"
            text>
            {{ $t('common.remove') }}
          </el-button>
        </template>
        <template v-if="column.prop === 'dataQuantity'">
          {{ row.dataQuantity?.toLocaleString() }}
        </template>
        <div
          v-else-if="column.prop === 'status'"
          :class="appStatusTypeMap[row[column.prop]].class">
          {{ appStatusTypeMap[row[column.prop]].label }}
        </div>

        <template v-else>
          {{ row[column.prop] }}
        </template>
      </template>
    </el-table-column>
  </el-table>
  <Pagination
    class="flex-justify-content-end"
    v-model:limit="pageConfig.pageSize"
    v-model:page="pageConfig.page"
    :total="pageConfig.total"
    @getData="handleTableData" />
  <CommonDrawer
    v-model="state.addAppDialogShow"
    size="600px"
    :title="$t('system.projectTeams.addProjectApp')"
    :loading="state.operateLoading"
    @close="addAppDrawerClose"
    @submit="addAppSubmit">
    <el-form
      ref="addAppFormRef"
      :rules="addAppFormRules"
      label-position="top"
      label-width="100px"
      :model="state.addAppFormData">
      <el-form-item
        :label="`${$t('system.projectTeams.addProjectApp')}：`"
        prop="selectedApp">
        <div class="w100-percentage">
          <OptionalDataSelection
            :list="state.optionaApplData"
            valueKey="appId"
            valueLabel="appName"
            v-model="state.addAppFormData.selectedApp" />
          <div class="fz12 c86919d mt5 line-h-1-dot-5">
            {{ $t('system.projectTeams.addProjectAppMsg') }}
          </div>
        </div>
      </el-form-item>
    </el-form>
  </CommonDrawer>

  <CommonDrawer
    v-model="state.setAuthDialogShow"
    size="900px"
    :loading="state.operateLoading"
    :title="
      $t('system.projectTeams.appDataPermissionPackage', [
        state.rowData.appName,
      ])
    "
    @close="addAppDrawerClose"
    @submit="addAppSubmit"
    :showBtn="false">
    <div>
      <el-button
        @click="
          buttonExecuteOperation({
            type: 'addAuthPackage',
            otherRow: state.rowData,
          })
        "
        class="flex-center"
        type="primary">
        {{ $t('system.projectTeams.addNewPermissionPackage') }}
      </el-button>
      <div class="fz14 c545e6e mb10 mt20">
        {{ $t('system.projectTeams.addNewPermissionPackageMsg') }}
      </div>
      <div class="nd-title mb16">
        {{ $t('system.projectTeams.dataPermissionPackage') }}
      </div>
      <el-table class="nd-table-custom" :data="state.authTableData" border>
        <el-table-column
          v-for="column of authColumn"
          :prop="column.prop"
          :key="column.label"
          :label="column.label"
          :show-overflow-tooltip="!!column.prop"
          v-bind="{ ...column }">
          <template #default="{ row, $index }">
            <template v-if="column.useMembers">
              <DropDownItemSelection
                trigger="click"
                placement="bottom-start"
                @visible-change="
                  (visible) => useMembersChange(visible, row, $index)
                ">
                <el-button text type="primary">
                  {{ $t('btn.view') }}
                </el-button>
                <template #content>
                  <template v-for="(item, idx) of row.useMembers" :key="idx">
                    <el-dropdown-item>
                      {{ item.userName }}
                    </el-dropdown-item>
                  </template>
                </template>
              </DropDownItemSelection>
            </template>
            <template v-else-if="column.operate">
              <el-button
                @click="
                  buttonExecuteOperation({
                    type: 'editAuthPackage',
                    otherRow: row,
                  })
                "
                type="primary"
                :disabled="row.type === 0"
                class="p0"
                text>
                {{ $t('btn.edit') }}
              </el-button>
              <el-button
                @click="
                  buttonExecuteOperation({
                    type: 'allocationAuthPackage',
                    otherRow: row,
                  })
                "
                type="primary"
                text>
                {{ $t('btn.allocation') }}
              </el-button>
              <el-button
                @click="
                  buttonExecuteOperation({
                    type: 'removeAuthPackage',
                    otherRow: row,
                  })
                "
                type="primary"
                :disabled="row.type === 0"
                class="p0"
                text>
                {{ $t('btn.delete') }}
              </el-button>
            </template>
            <template v-else>
              {{ row[column.prop] }}
            </template>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </CommonDrawer>

  <CommonDrawer
    v-model="state.addAuthPackageDialogShow"
    size="600px"
    :title="`${state.addAuthFormData.dataPermissionId ? $t('system.projectTeams.editPermissionPackage') : $t('system.projectTeams.addNewPermissionPackage')}`"
    @close="addAuthDrawerClose"
    @submit="addAuthSubmit"
    :loading="state.addAuthLoading">
    <el-form
      ref="addAuthFormRef"
      :rules="addAuthFormRules"
      label-position="top"
      label-width="100px"
      :model="state.addAuthFormData">
      <el-form-item
        :label="`${$t('system.projectTeams.permissionPackageName')}：`"
        prop="name">
        <CommonInput
          maxlength="50"
          :prefixSlot="false"
          show-word-limit
          v-model="state.addAuthFormData.name" />
      </el-form-item>
      <el-form-item :label="`${$t('common.description')}：`" prop="description">
        <el-input
          clearable
          type="textarea"
          :rows="3"
          maxlength="100"
          resize="none"
          show-word-limit
          :placeholder="$t('common.pleaseEnter')"
          v-model="state.addAuthFormData.description" />
      </el-form-item>
      <el-form-item label="" prop="selectedApp">
        <NewConfigPermission ref="newConfigPermissionRef" />
      </el-form-item>
    </el-form>
  </CommonDrawer>

  <AuthAllocationDrawer
    ref="authAllocationRef"
    :authRow="state.otherRowData"
    :selectedGruop="selectedGruop"></AuthAllocationDrawer>

  <TipDialog
    iconType="3"
    btnSwap
    :loading="state.operateLoading"
    v-model="state.tipDialog"
    :title="tipDialogOption.title"
    @submit="
      buttonExecuteOperation({ type: tipDialogOption.type, submit: true })
    ">
    {{ tipDialogOption.content }}
  </TipDialog>
</template>

<script setup>
import { computed, ref, reactive, markRaw, watch, nextTick } from 'vue'
import { slicePagingData } from '@/utils/dataProcessing'
import { debounce, forEach } from 'lodash-es'
import { ElMessage } from 'element-plus'
import NewConfigPermission from './NewConfigPermission/index.vue'
import AuthAllocationDrawer from './AuthAllocationDrawer.vue'

import { appStatusType, appStatusTypeMap } from '@/enumeration'

import {
  asyncGetOptionalAppList,
  asyncProjectAppBinding,
  asyncGetProjectAppList,
  asyncProjectAppUnbinding,
} from '@/api/modules/project-group'
import {
  mutateDataPermission,
  getDataPermissionList,
  deleteDataPermission,
} from '@/api/modules/data-permission'

import { getDataPermissionMembers } from '@/api/modules/data-permission'

import { useI18n } from 'vue-i18n'
const { t } = useI18n() // 使用useI18n钩子获取国际化t函数

const props = defineProps({
  selectedGruop: {
    type: Object,
    default: () => {},
  },
  companyAdminOrProjectManager: {
    type: Boolean,
    default: false,
  },
})

const appColumn = computed(() => {
  const arr = [
    {
      prop: 'appName',
      label: t('system.apps.appName'),
    },
    {
      prop: 'appId',
      label: 'App Id',
    },
    {
      prop: 'dataQuantity',
      label: t('system.projectTeams.inventoryQuantity'),
      align: 'right',
    },
    {
      prop: 'eventStatistic',
      label: t('system.projectTeams.numberOfEvents'),
    },
    {
      prop: 'eventFieldStatistic',
      label: t('system.projectTeams.numberOfEventAttributes'),
    },
    {
      prop: 'userFieldStatistic',
      label: t('system.projectTeams.numberOfUserAttributes'),
    },
    {
      prop: 'status',
      label: t('common.status'),
    },
    {
      label: t('common.operate'),
      operate: true,
      minWidth: 120,
    },
  ]

  return arr.slice(
    0,
    props.companyAdminOrProjectManager ? arr.length : arr.length - 1
  )
})
const authColumn = [
  {
    prop: 'name',
    label: t('system.projectTeams.dataPermissionPackageName'),
  },
  {
    prop: 'description',
    label: t('common.description'),
  },
  {
    prop: 'createByName',
    label: t('common.createBy'),
  },
  {
    prop: 'createTime',
    label: t('common.createTime'),
  },
  {
    label: t('system.projectTeams.user'),
    useMembers: true,
  },
  {
    label: t('common.operate'),
    operate: true,
    minWidth: 100,
  },
]
const tipDialogOption = {
  title: '',
  content: '',
  type: '',
}
const addAppFormRules = {
  selectedApp: [
    {
      required: true,
      message: t('common.pleaseSelect'),
      trigger: ['blur', 'change'],
    },
  ],
}
const addAuthFormRules = {
  name: [
    {
      required: true,
      message: t('common.pleaseEnter'),
      trigger: ['blur', 'change'],
    },
  ],
}

const newConfigPermissionRef = ref(null)
const authAllocationRef = ref(null)

const buttonMethods = {
  async removeApp(params) {
    if (params.submit) {
      state.operateLoading = true
      await asyncProjectAppUnbinding({
        appIdList: [state.rowData.appId],
        projectId: props.selectedGruop.id,
      }).finally((_) => {
        state.operateLoading = false
      })
      ElMessage.success(t('system.projectTeams.removalSuccessful'))
      getList()
    } else {
      tipDialogOption.title = t('system.projectTeams.removeTheApp')
      tipDialogOption.content = t('system.projectTeams.removeTheAppMsg', [
        state.rowData.appName,
      ])
    }
    state.tipDialog = !params.submit
  },
  async setAuthority(params) {
    state.rowData = markRaw(params.row)
    state.setAuthDialogShow = true
    const data = {
      appId: state.rowData.appId,
    }
    state.authTableData = []
    getAppDataPermissionList(data)
  },
  /**
   * 新增权限包弹框，赋值事件、属性
   */
  async addAuthPackage() {
    state.addAuthPackageDialogShow = true
    nextTick(() => {
      newConfigPermissionRef.value.getData(state.otherRowData, 'add')
    })
  },
  /**
   * 编辑权限包弹框，赋值事件、属性
   */
  async editAuthPackage() {
    state.addAuthPackageDialogShow = true
    state.addAuthFormData = {
      dataPermissionId: state.otherRowData.dataPermissionId || null,
      name: state.otherRowData.name,
      description: state.otherRowData.description,
    }
    nextTick(() => {
      newConfigPermissionRef.value.getData(state.otherRowData, 'edit')
    })
  },
  /**
   * 数据权限包分配
   */
  async allocationAuthPackage() {
    nextTick(() => {
      authAllocationRef.value.openHandle()
    })
  },
  /**
   * 删除数据权限包
   */
  async removeAuthPackage(params) {
    if (params.submit) {
      state.operateLoading = true
      const params = {
        id: state.otherRowData.dataPermissionId,
      }
      deleteDataPermission(params)
        .then((res) => {
          if (res && res.code === 200) {
            ElMessage.success(t('common.deleteSuccessfully'))
            state.tipDialog = false
            const data = {
              appId: state.otherRowData.appId,
            }
            getAppDataPermissionList(data)
          }
        })
        .finally(() => {
          state.operateLoading = false
        })
    } else {
      tipDialogOption.title = t('system.projectTeams.deletePermissionPackage')
      tipDialogOption.content = t(
        'system.projectTeams.deletePermissionPackageMsg',
        [state.otherRowData.appName]
      )
      state.tipDialog = !params.submit
    }
  },
}

const initVal = () => {
  return {
    state: {
      appTableAllData: [],
      appPagedData: [],
      authTableData: [],
      tipDialog: false,
      addAppFormData: {
        name: '',
        selectedApp: [],
      },
      addAuthFormData: {
        dataPermissionId: null,
        name: '',
        description: '',
      },
      addAuthPackage: {
        selectedApp: [],
      },
      addAuthLoading: false,
      viewMembersInfo: {},
      viewMembersList: [],
      // 当前行数据
      rowData: {},
      // 如 对话框、抽屉里的表格数据
      otherRowData: {},
      optionaApplData: [],

      addAppDialogShow: false,
      setAuthDialogShow: false,
      addAuthPackageDialogShow: false,

      operateLoading: false,
      exhibitLoading: false,
    },
    filterConfig: {
      status: '',
    },
    pageConfig: {
      // 分页器配置
      page: 1, // 当前页码
      pageSize: 20, // 每页数量
      total: 0, // 总数
    },
  }
}
const state = reactive(initVal().state)
const pageConfig = reactive(initVal().pageConfig)
const filterConfig = reactive(initVal().filterConfig)
const addAppFormRef = ref(null)
const addAuthFormRef = ref(null)

const addAppDrawerClose = () => {
  state.addAppFormData = initVal().state.addAppFormData
}

const addAuthDrawerClose = () => {
  state.addAuthFormData = initVal().state.addAuthFormData
}

/**
 * @description 获取数据权限包用户列表
 */
const useMembersChange = async (visible, row, index) => {
  if (!visible) return
  state.otherRowData = row

  const res = await getDataPermissionMembers({
    id: state.otherRowData.dataPermissionId,
    projectId: props.selectedGruop.id,
  })
  if (res && res.code === 200) {
    state.authTableData[index].useMembers = res.data.filter(
      (e) => !!e.isAuthorized
    )
  }
}

/**
 * @description 应用权限列表
 */
const getAppDataPermissionList = (data) => {
  getDataPermissionList(data).then((res) => {
    if (res && res.code === 200) {
      state.authTableData = res.data
    }
  })
}

/**
 * @description 新建、编辑数据权限
 */
const addAuthSubmit = () => {
  addAuthFormRef.value.validate(async (valid) => {
    if (!valid) return
    const data = {
      appId: state.otherRowData.appId,
      ...state.addAuthFormData,
      detail: {
        eventFields: [],
        events: [],
        userFields: [],
      },
      type: 1,
    }
    const permissionData = newConfigPermissionRef.value.getPermission()
    for (let key in permissionData) {
      if (key === 'events') {
        data.newEvenVisible = permissionData[key].status
      } else if (key === 'eventFields') {
        data.newEvenFieldVisible = permissionData[key].status
      } else {
        data.newUserFieldVisible = permissionData[key].status
      }
      permissionData[key].ids.forEach((item) => {
        data.detail[key].push({
          id: item,
        })
      })
    }
    state.addAuthLoading = true
    const mesg = `${state.addAuthFormData.dataPermissionId ? t('common.editedSuccessfully') : t('common.newSuccessfullyAdded')}`
    mutateDataPermission(data)
      .then((res) => {
        if (res && res.code === 200) {
          ElMessage.success(mesg)
          addAuthDrawerClose()
          const data = {
            appId: state.otherRowData.appId,
          }
          getAppDataPermissionList(data)
        }
      })
      .finally(() => {
        state.addAuthLoading = false
      })

    state.addAuthPackageDialogShow = false
  })
}

const addAppSubmit = () => {
  addAppFormRef.value.validate(async (valid) => {
    if (!valid) return
    state.operateLoading = true
    await asyncProjectAppBinding({
      appIdList: state.addAppFormData.selectedApp,
      projectId: props.selectedGruop.id,
    }).finally((_) => {
      state.operateLoading = false
    })
    state.addAppDialogShow = false
    ElMessage.success(t('common.addedSuccessfully'))
    getList()
  })
}

const addHandlder = () => {
  state.addAppDialogShow = true
  getOptionalAppList()
}

const buttonExecuteOperation = debounce((params) => {
  const { type, otherRow = '', row = '' } = params
  if (row) state.rowData = row
  if (otherRow) state.otherRowData = otherRow

  tipDialogOption.type = type
  buttonMethods[type]?.(params)
}, 300)

const getOptionalAppList = async () => {
  state.operateLoading = true
  const { data } = await asyncGetOptionalAppList(
    props.selectedGruop.id
  ).finally((_) => {
    state.operateLoading = false
  })
  state.optionaApplData = markRaw(data)
}
const handleTableData = debounce(() => {
  const data = state.appTableAllData.filter((item) => {
    if (!Number.isInteger(filterConfig.status)) return true
    return item.status === filterConfig.status
  })
  pageConfig.total = data.length
  state.appPagedData = markRaw(
    slicePagingData(data, pageConfig.page, pageConfig.pageSize)
  )
})

const getList = async () => {
  state.operateLoading = true
  const {
    data: { list },
  } = await asyncGetProjectAppList({
    projectId: props.selectedGruop.id,
    size: -1,
  }).finally((_) => {
    state.operateLoading = false
  })
  state.appTableAllData = list
  handleTableData()
  // state.projectManagerList = markRaw(data)
}
watch(
  () => props.selectedGruop,
  debounce((val) => {
    if (!val.id) return
    getList()
  }, 100),
  {
    deep: true,
    immediate: true,
  }
)
defineExpose({
  getList,
  addHandlder,
})
defineOptions({
  name: 'App',
})
</script>

<style scoped lang="scss"></style>
