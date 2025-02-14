import {
  computed,
  nextTick,
  markRaw,
  reactive,
  watch,
  ref,
  shallowRef,
} from 'vue'
import { debounce } from 'lodash-es'
import {
  flattenTree,
  mapMenuPermissionData,
  mapWithoutChildren,
  mapSubmitPermissionData,
  slicePagingData,
  recursionFindData,
  filterTree,
} from '@/utils/dataProcessing'
import useRoutes from '@/store/modules/route'

import { ElMessage } from 'element-plus'
import {
  asyncAddRole,
  asyncEditRole,
  asyncRemoveRole,
  asyncGetRoleList,
  asyncRoleUserUnbinding,
  asyncGetViewMembersList,
} from '@/api/modules/role-manage'
import { asyncGetUserBoundMenu } from '@/api/modules/menu'

const initVal = () => {
  return {
    state: {
      tableAllData: [],
      pagedData: [],
      tipDialog: false,
      addOrEditDialog: false,
      viewMembersDialog: false,
      isIndeterminate: true,
      resetTipDialog: false,
      selectAllMenu: false,
      formData: {
        roleId: '',
        roleName: '',
        autoJoinSwitch: false,
        description: '',
        authMenuList: [],
      },
      viewMembersInfo: {},
      viewMembersList: [],
      // 当前行数据
      rowData: {},
      // 如 对话框、抽屉里的表格数据
      otherRowData: {},

      tipLoading: false,
      operateLoading: false,
      exhibitLoading: false,
    },
    filterConfig: {
      roleName: '',
    },
    pageConfig: {
      // 分页器配置
      page: 1, // 当前页码
      pageSize: 20, // 每页数量
      total: 0, // 总数
    },
  }
}

export default function (t) {
  const { routes } = useRoutes()

  const tipDialogOption = {
    title: '',
    content: '',
    type: '',
  }

  const buttonMethods = {
    async viewMembers() {
      state.operateLoading = true
      state.viewMembersDialog = true
      const { data } = await asyncGetViewMembersList({
        roleId: state.rowData.roleId,
        size: -1,
      }).finally((_) => {
        state.operateLoading = false
      })
      state.viewMembersInfo = markRaw(data.roleInfo)
      state.viewMembersList = markRaw(data.pageInfo.list)
    },
    // 查看成员-移除
    async removeMember(params) {
      if (params.submit) {
        state.tipLoading = true
        await asyncRoleUserUnbinding({
          roleId: state.viewMembersInfo.roleId,
          userId: state.otherRowData.userId,
        }).finally((_) => {
          state.tipLoading = false
        })
        ElMessage.success(t('common.removeSuccessfully'))
        state.tipDialog = false
        this.viewMembers()
      } else {
        tipDialogOption.title = t('system.roles.removeMember')
        tipDialogOption.content = t('system.roles.checkRemoveMember', [
          state.otherRowData.name,
        ])
      }
      state.tipDialog = !params.submit
    },
    async deleteData(params) {
      if (params.submit) {
        state.tipLoading = true
        await asyncRemoveRole({
          roleIdList: [state.rowData.roleId],
        }).finally((_) => {
          state.tipLoading = false
        })
        ElMessage.success(t('common.deleteSuccessfully'))
        getRoleList()
      } else {
        tipDialogOption.title = t('system.roles.removeRole')
        tipDialogOption.content = t('system.roles.checkRemoveRole', [
          state.rowData.roleName,
        ])
      }
      state.tipDialog = !params.submit
    },
  }
  const state = reactive(initVal().state)
  const filterConfig = reactive(initVal().filterConfig)
  const pageConfig = reactive(initVal().pageConfig)

  const handleTableData = debounce(() => {
    const data = state.tableAllData.filter((item) =>
      item.roleName
        .toLocaleLowerCase()
        .includes(filterConfig.roleName.toLocaleLowerCase())
    )
    pageConfig.total = data.length
    state.pagedData = markRaw(
      slicePagingData(data, pageConfig.page, pageConfig.pageSize)
    )
  })

  // 禁用掉项目组管理-查看的按钮
  const treeData = shallowRef(
    filterTree(
      mapMenuPermissionData(routes.rawData, ['project:view']),
      (node) => {
        // menuId_ = src/store/modules/route.js
        return !node.id.startsWith('menuId_') && node.menuType !== 1
      }
    )
  )

  const treeDataFlat = computed(() => {
    return flattenTree(treeData.value)
  })
  const treeRef = ref(null)
  const addOrEditRef = ref(null)

  // 项目组管理查看权限
  const projectTeamView = computed(() => {
    return recursionFindData(treeData.value, 'project:view')
  })

  const resetData = () => {
    state.isIndeterminate = true
    state.selectAllMenu = false
    Object.assign(state.formData, initVal().state.formData)
  }

  const selectAllMenuChange = (bool) => {
    // 设置勾选节点  平铺的数据
    treeRef.value.setCheckedNodes(
      bool ? mapWithoutChildren(treeData.value) : [projectTeamView.value]
    )
    state.isIndeterminate = !bool
  }

  const buttonExecuteOperation = debounce((params) => {
    const { type, otherRow = '', row = '', submit = false } = params
    if (row) state.rowData = row
    if (otherRow) state.otherRowData = otherRow

    tipDialogOption.type = type
    buttonMethods[type]?.(params)
  }, 300)

  // 设置全选或半选状态
  const setSelected = (data) => {
    const checked = data.length === treeDataFlat.value.length
    state.isIndeterminate =
      !!data.length && data.length < treeDataFlat.value.length
    // 设置全选状态
    if (state.selectAllMenu !== checked) {
      state.selectAllMenu = checked
    }
  }
  const addOrEdit = (val = '') => {
    state.addOrEditDialog = true
    nextTick(() => {
      treeRef.value.setCheckedNodes([projectTeamView.value])
    })
    if (!val) return
    Object.keys(state.formData).forEach((key) => {
      state.formData[key] = val[key]
    })
    editRole()
  }

  const editRole = async () => {
    // 已选择的权限
    const { data } = await asyncGetUserBoundMenu(state.formData.roleId)
    nextTick(() => {
      const meun = mapMenuPermissionData(data)
      setSelected(flattenTree(meun))
      treeRef.value.setCheckedNodes(mapWithoutChildren(meun))
      // treeRef.value.setCheckedKeys(['app:select'])
    })
  }

  // 新增或编辑提交
  const addOrEditSubmit = () => {
    addOrEditRef.value.validate(async (valid) => {
      if (!valid) return
      try {
        // 返回当前选中节点和半选中节点
        const authMenuList = mapSubmitPermissionData([
          ...treeRef.value.getCheckedNodes(),
          ...treeRef.value.getHalfCheckedNodes(),
        ])
        state.operateLoading = true
        const bool = !!state.formData.roleId
        const fn = bool ? asyncEditRole : asyncAddRole
        await fn({ ...state.formData, authMenuList }).finally((_) => {
          state.operateLoading = false
        })
        state.addOrEditDialog = false
        ElMessage.success(
          `${bool ? t('common.editedSuccessfully') : t('common.addedSuccessfully')}`
        )
        getRoleList()
      } catch (e) {
        console.log(e)
      }
    })
  }

  const treeCheck = (obj, checkedObj) => {
    setSelected(checkedObj.checkedKeys)
  }

  const getRoleList = async () => {
    state.exhibitLoading = true
    const { data } = await asyncGetRoleList().finally((_) => {
      state.exhibitLoading = false
    })
    state.tableAllData = data
    handleTableData()
  }
  getRoleList()
  watch(
    () => filterConfig,
    (val) => {
      handleTableData()
    },
    {
      deep: true,
    }
  )
  return {
    // ...toRefs(state),
    state,
    pageConfig,
    filterConfig,
    tipDialogOption,
    treeData,
    treeDataFlat,
    treeRef,
    addOrEditRef,
    addOrEdit,
    treeCheck,
    resetData,
    handleTableData,
    addOrEditSubmit,
    buttonExecuteOperation,
    selectAllMenuChange,
  }
}
