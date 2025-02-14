<template>
  <el-table
    v-loading="state.exhibitLoading"
    class="nd-table-custom mt10 mb20"
    :data="state.pagedData"
    border>
    <el-table-column
      v-for="column of columns"
      :prop="column.prop"
      :key="column.label"
      :label="column.label"
      :show-overflow-tooltip="!!column.prop">
      <template #header v-if="column.prop === 'status'">
        <FilterDropdown
          @change="handleTableData"
          v-model="filterConfig.status"
          :list="memberStatusList.filter((item) => item.type !== 3)"
          :name="column.label" />
      </template>
      <template #default="{ row }">
        <template v-if="column.operate">
          <el-button
            @click="buttonExecuteOperation({ type: 'setAuthority', row })"
            type="primary"
            :disabled="row.projectGroupIdentity === 1"
            text
            class="p0">
            {{ $t('system.projectTeams.setPermissions') }}
          </el-button>
          <Tooltip :showTips="row.projectGroupIdentity === 1">
            <template #content>{{
              $t('system.projectTeams.cannotRemovedProject')
            }}</template>
            <el-button
              @click="buttonExecuteOperation({ type: 'removeMember', row })"
              type="primary"
              text
              :class="{
                auto: row.projectGroupIdentity === 1,
              }"
              :disabled="row.projectGroupIdentity === 1">
              {{ $t('common.remove') }}
            </el-button>
          </Tooltip>
        </template>
        <div
          v-else-if="column.prop === 'status'"
          :class="memberStatusTypeMap[row[column.prop]].class">
          {{ memberStatusTypeMap[row[column.prop]].label }}
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
    v-model="state.addMemberDrawerShow"
    size="600px"
    :loading="state.operateLoading"
    ref="commonDrawerRef"
    :title="$t('system.projectTeams.addProjectMembers')"
    @close="addMemberDrawerClose"
    @submit="addMemberSubmit">
    <el-form
      ref="addMemberFormRef"
      :rules="addMemberFormRules"
      label-position="top"
      label-width="100px"
      :model="state.addMemberFormData">
      <el-form-item
        :label="`${$t('system.projectTeams.addProjectMembers')}：`"
        prop="selectedMembers">
        <div class="w100-percentage">
          <OptionalDataSelection
            valueKey="userId"
            :list="state.optionaMemberlData"
            v-model="state.addMemberFormData.selectedMembers" />
          <div class="fz12 c86919d mt5 line-h-1-dot-5">
            {{ $t('system.projectTeams.addProjectMembersMsg') }}
          </div>
        </div>
      </el-form-item>
    </el-form>
  </CommonDrawer>

  <CommonDrawer
    v-model="state.setAuthDrawerShow"
    size="600px"
    ref="commonDrawerRef"
    :title="$t('system.projectTeams.setPermissions')"
    :loading="state.operateLoading"
    @close="setAuthDrawerClose"
    @submit="setAuthSubmit">
    <CustomTreeSelection
      :props="{
        label: 'name',
      }"
      nodeKey="id"
      :selectedList="state.seleted"
      v-model="state.checkList"
      :data="state.dataList"
      @change="handleChangeTree">
      <template #leftTopDisplay>
        <div class="flex-center flex-between">
          <span>{{ $t('system.projectTeams.dataPermissionPackage') }}</span>
          <el-button @click="refreshTree" type="primary" text>
            {{ $t(btn.refresh) }}
          </el-button>
        </div>
      </template>
    </CustomTreeSelection>
  </CommonDrawer>

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
import { computed, watch, reactive, markRaw, ref, nextTick } from 'vue'
import { slicePagingData } from '@/utils/dataProcessing'
import role from '@/enumeration/role'
import { debounce } from 'lodash-es'
import { ElMessage } from 'element-plus'
import NewConfigPermission from './NewConfigPermission/index.vue'
import {
  asyncGetOptionalUserList,
  asyncProjectUserBinding,
  asyncProjectUserBindingList,
  asyncProjectUserUnbinding,
  asyncGetProjectAppList,
} from '@/api/modules/project-group'
import {
  getUserDataPermission,
  getDataPermissionByAppId,
  setUserDataPermission,
} from '@/api/modules/data-permission'
import { useI18n } from 'vue-i18n'
const { t } = useI18n() // 使用useI18n钩子获取国际化t函数
const { memberStatusList, memberStatusTypeMap } = role(t)

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
const columns = computed(() => {
  const arr = [
    {
      prop: 'name',
      label: t('system.roles.userName'),
    },
    {
      prop: 'account',
      label: t('login.account'),
    },
    {
      prop: 'roleIdentityListStr',
      label: t('system.members.systemRole'),
    },
    {
      prop: 'status',
      label: t('common.status'),
    },
    {
      label: t('common.operate'),
      operate: true,
    },
  ]
  return arr.slice(
    0,
    props.companyAdminOrProjectManager ? arr.length : arr.length - 1
  )
})
const tipDialogOption = {
  title: '',
  content: '',
  type: '',
}
const addMemberFormRules = {
  selectedMembers: [
    {
      required: true,
      message: t('common.pleaseSelect'),
      trigger: ['blur', 'change'],
    },
  ],
}

const buttonMethods = {
  async removeMember(params) {
    if (params.submit) {
      state.operateLoading = true
      await asyncProjectUserUnbinding({
        projectId: props.selectedGruop.id,
        userIdList: [state.rowData.userId],
      }).finally((_) => {
        state.operateLoading = false
      })
      ElMessage.success(t('system.projectTeams.removalSuccessful'))
      getList()
    } else {
      tipDialogOption.title = t('system.projectTeams.removeMembers')
      tipDialogOption.content = t('system.projectTeams.sureRemoveMembers', [
        params.row.type === 2
          ? t('system.projectTeams.adminNotView')
          : t('system.projectTeams.memberNotView'),
      ])
    }
    state.tipDialog = !params.submit
  },
  async setAuthority() {
    await getTreeList()

    //当前用户授权权限包集合
    const res = await getUserDataPermission({
      userId: state.rowData.userId,
      projectId: props.selectedGruop.id,
    })
    if (res && res.code === 200) {
      const list = []
      res.data.forEach((item) => {
        list.push(...item.dataPermissions)
      })
      state.seleted = list
    }
    state.setAuthDrawerShow = true
  },
}

const initVal = () => {
  return {
    state: {
      tableAllData: [],
      pagedData: [],
      tipDialog: false,
      addMemberDrawerShow: false,
      setAuthDrawerShow: false,
      addMemberFormData: {
        selectedMembers: [],
      },
      // 当前行数据
      rowData: {},
      // 如 对话框、抽屉里的表格数据
      otherRowData: {},
      optionaMemberlData: [],
      optionaApplData: [],

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
    dataList: [],
    checkList: [],
    seleted: [],
    nodeCheckList: [],
  }
}

const state = reactive(initVal().state)
const pageConfig = reactive(initVal().pageConfig)
const filterConfig = reactive(initVal().filterConfig)
const addMemberFormRef = ref(null)

for (let i = 0; i < 30; i++) {
  state.optionaApplData.push({
    name: `测试实${i}`,
    id: i,
  })
}

const handleTableData = debounce(() => {
  const data = state.tableAllData.filter((item) => {
    if (!Number.isInteger(filterConfig.status)) return true
    return item.status === filterConfig.status
  })
  pageConfig.total = data.length
  state.pagedData = markRaw(
    slicePagingData(data, pageConfig.page, pageConfig.pageSize)
  )
})

handleTableData()

const addHandlder = () => {
  state.addMemberDrawerShow = true
  getOptionalUserList()
}

const addMemberDrawerClose = () => {
  state.addMemberFormData = initVal().state.addMemberFormData
}

const addMemberSubmit = () => {
  addMemberFormRef.value.validate(async (valid) => {
    if (!valid) return
    state.operateLoading = true
    await asyncProjectUserBinding({
      projectId: props.selectedGruop.id,
      userIdList: state.addMemberFormData.selectedMembers,
    }).finally((_) => {
      state.operateLoading = false
    })
    state.addMemberDrawerShow = false
    ElMessage.success(t('common.addedSuccessfully'))
    getList()
  })
}

/**
 * @description 获取树列表
 */
const getTreeList = async () => {
  state.operateLoading = true
  try {
    //获取当前项目下的appId
    let ids = []
    const appIdListRes = await asyncGetProjectAppList({
      size: -1,
      projectId: props.selectedGruop.id,
    })
    if (appIdListRes && appIdListRes.code === 200) {
      ids = appIdListRes.data.list.map((e) => e.appId)
    }

    if (!ids.length) {
      return
    }

    //获取权限包列表
    const permissionByAppIdRes = await getDataPermissionByAppId({ ids })
    if (permissionByAppIdRes && permissionByAppIdRes.code === 200) {
      permissionByAppIdRes.data.forEach((item) => {
        item.id = item.appId
        item.name = item.appName
        item.children = item.dataPermissions
      })
      state.dataList = permissionByAppIdRes.data
    }
  } catch (error) {
    console.error(error)
  } finally {
    state.operateLoading = false
  }
}

/**
 * @description 刷新树列表
 */
const refreshTree = () => {
  getTreeList()
  const list = []
  state.nodeCheckList.forEach((item) => {
    list.push(...item.children)
  })
  state.seleted = list
}

/**
 * @description 获取选中数据节点
 */
const handleChangeTree = (node) => {
  state.nodeCheckList = node
}

/**
 * @description 关闭树
 */
const setAuthDrawerClose = () => {
  state.setAuthDrawerShow = false
}

/**
 * @description 获取选中数据节点
 */
const setAuthSubmit = async () => {
  try {
    const data = {
      dataPermissions: [],
      userId: state.rowData.userId,
      projectId: props.selectedGruop.id,
    }
    state.nodeCheckList.forEach((item) => {
      data.dataPermissions.push({
        appId: item.appId,
        dataPermissionIds: item.children.map((e) => e.id),
      })
    })
    state.operateLoading = true
    const res = await setUserDataPermission(data)
    if (res && res.code === 200) {
      ElMessage.success(t('system.projectTeams.successfullySetPermissions'))
      setAuthDrawerClose()
    }
  } catch (e) {
    console.error(e)
  } finally {
    state.operateLoading = false
  }
}

const buttonExecuteOperation = debounce((params) => {
  const { type, otherRow = '', row = '' } = params
  if (row) state.rowData = row
  tipDialogOption.type = type
  buttonMethods[type]?.(params)
}, 300)

const getOptionalUserList = async () => {
  state.operateLoading = true
  const { data } = await asyncGetOptionalUserList({
    projectId: props.selectedGruop.id,
  }).finally((_) => {
    state.operateLoading = false
  })
  state.optionaMemberlData = markRaw(data)
}

const getList = async () => {
  state.exhibitLoading = true
  const {
    data: { list },
  } = await asyncProjectUserBindingList({
    projectId: props.selectedGruop.id,
    size: -1,
  }).finally((_) => {
    state.exhibitLoading = false
  })
  state.tableAllData = list
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
  name: 'Member',
})
</script>

<style scoped lang="scss"></style>
