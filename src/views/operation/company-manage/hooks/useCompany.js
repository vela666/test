import {
  ref,
  computed,
  reactive,
  shallowRef,
  onMounted,
  watch,
  nextTick,
} from 'vue'
import { getCompanyList } from '@/api/modules/operation'
import { getInitRoleMenu, getAdminRoleMenu } from '@/api/modules/menu'
import { asyncGetAppManageList } from '@/api/modules/app'
import {
  updateCompanyStatus,
  resetCompanyManagerPwd,
  addCompany,
  updateCompany,
  openAttribution,
} from '@/api/modules/operation'
import { invitationActive } from '@/api/modules/user'
import {
  flattenTree,
  mapMenuPermissionData,
  mapSubmitPermissionData,
  mapWithoutChildren,
} from '@/utils/dataProcessing'
import { ElMessage } from 'element-plus'
import copyText from '@/utils/clipboard'
import { roleInitIdsEnum } from '@/enumeration/index'
import { cloneDeep } from 'lodash-es'
import { isEmail, isAccount1 } from '@/utils/validate'

const initState = () => ({
  show: false,
  selectAll: false,
  isIndeterminate: false,
  formData: {
    companyName: '',
    managerUserName: '',
    managerAccount: '',
    email: '',
    companyType: 0,
    version: 1,
    rolePermissions: [],
    companyContractList: [
      {
        companyCode: '',
        // 状态：1 试用、2 正式，3 到期，4 中止(停止)
        contractStatus: 1,
        // 合同类型：1 时间、2 事件量暂时写死
        contractType: 2,
        endTime: '',
        purchaseVolume: '',
        startTime: '',
        date: [],
        // 用于编辑时从后端拿的数据不可删除
        isDel: true,
      },
    ],
  },
  isEmail: false,
  openftFormData: {
    appId: '',
  },
  openftLoading: false,
  loading: false,
})
export default function () {
  const state = reactive(initState())
  const treeRef = ref(null)
  const treeData = shallowRef([])
  const treeDataFlat = computed(() => {
    return flattenTree(treeData.value)
  })

  const resetFormData = () => {
    Object.assign(state.formData, initState().formData)
  }
  const treeCheck = (obj, checkedObj) => {
    const { checkedKeys } = checkedObj
    const checked = checkedKeys.length === treeDataFlat.value.length
    state.isIndeterminate =
      !!checkedKeys.length && checkedKeys.length < treeDataFlat.value.length
    // 设置全选状态
    if (state.selectAll !== checked) {
      state.selectAll = checked
    }
  }

  const contractStatusChange = (item) => {
    item.purchaseVolume = item.contractStatus === 1 ? '' : 1
  }

  const addCompanyContract = () => {
    if (
      state.formData.companyContractList.some(
        (item) =>
          !item.date.length
      )
    ) {
      ElMessage.warning('合同服务期不能为空')
      return
    }
    state.formData.companyContractList.push({
      ...initState().formData.companyContractList[0],
      contractStatus: 2,
      purchaseVolume: 1,
    })
  }

  const delCompanyContract = (index) => {
    state.formData.companyContractList.splice(index, 1)
  }

  const selectAllChange = (bool) => {
    // 设置勾选节点
    treeRef.value.setCheckedNodes(bool ? treeData.value : [])
    state.isIndeterminate = false
  }

  // 设置全选或半选状态
  const setSelected = (data) => {
    const checked = data.length === treeDataFlat.value.length
    state.isIndeterminate =
      !!data.length && data.length < treeDataFlat.value.length
    // 设置全选状态
    if (state.selectAll !== checked) {
      state.selectAll = checked
    }
  }

  const validateEmail = (rule, value, callback) => {
    if (value && !isEmail(value)) {
      callback(new Error('请输入正确邮箱'))
      return
    }
    callback()
  }

  const validateAccount = (rule, value, callback) => {
    if (!isAccount1(value)) {
      callback(new Error('仅支持英文、特殊字符、数字'))
      return
    }
    callback()
  }

  const formRules = {
    companyName: [
      { required: true, max: 50, message: '请输入企业名称', trigger: 'blur' },
    ],
    managerUserName: [
      {
        required: true,
        max: 50,
        message: '请输入企业管理员用户名',
        trigger: 'blur',
      },
    ],
    managerAccount: [
      {
        required: true,
        message: '仅支持英文、特殊字符、数字',
        trigger: 'blur',
      },
      { validator: validateAccount, trigger: 'blur' },
    ],
    email: [
      { required: true, message: '请输入邮箱', trigger: 'blur' },
      { validator: validateEmail, trigger: 'blur' },
    ],
  }
  const loading = ref(false)
  const role = ref('adminList')
  let oldeRole = 'adminList'
  const roleList = ref(null)
  const roleMenus = ref({})
  const formRef = ref(null)
  let selectPermission = {}
  let defaultRolePermission = {}
  // 是否是编辑状态
  const isEdit = ref(false)
  // 编辑时的角色Id
  let editRoleId = ''
  // 数据id 编辑时要传的id
  let dataId = null
  // 公司code编辑时要传的id
  let companyCode = ''
  /**
   * Row type definition
   * @typedef {Object} Row
   * @property {string} name -企业名称
   * @property {string} userName -企业管理员用户名
   * @property {string} account -企业管理员登陆账号
   * @property {string} email -邮箱
   * @property {string} valid -有效期
   * @property {number} supportVersion -版本 code
   * @property {string} code -版本
   */

  /**
   * @description 新增、编辑企业
   * @param {boolean} edit - false新增；true-编辑
   * @param {Row} data - 编辑时对应的表格数据
   * @returns
   */
  const addOrEdit = async (edit, data = {}) => {
    state.show = true
    isEdit.value = edit
    if (edit) {
      state.formData.companyName = data.name
      state.formData.managerUserName = data.userName
      state.formData.managerAccount = data.account
      state.formData.email = data.email ?? ''
      state.isEmail = !!data.email
      state.formData.companyType = data.companyType
      if (data?.companyContractList?.length) {
        state.formData.companyContractList = data.companyContractList.map(
          (item) => {
            return {
              ...item,
              isDel: false,
              date: [item.startTime, item.endTime],
            }
          }
        )
      }

      state.formData.valid = data.valid

      state.formData.version = data.supportVersion
    }
    roleList.value = edit ? [] : ['adminList', 'analystList', 'normalList']
    try {
      if (!edit) {
        const res = await getInitRoleMenu()
        const temp = {}
        if (res.code === 200 && res.data) {
          res.data?.forEach((el) => {
            for (const key in el) {
              temp[key] = el[key]
            }
          })
        }
        roleMenus.value = cloneDeep(temp)
        setTreeData(role.value)
        setDefaultRolePermission()
      }
      if (edit) {
        dataId = data.id
        companyCode = data.code
        await setAdminRoleMenu(data)
      }
    } catch (error) {
      console.log(error)
    }
  }

  //设置角色的默认权限
  const setDefaultRolePermission = () => {
    const origData = cloneDeep(treeData.value)
    const permissionLimit = {
      adminList: 'all',
      analystList: ['/see-plate', '/analysis', '/user'],
      normalList: ['/see-plate'],
    }
    for (const key of roleList.value) {
      if (permissionLimit[key] === 'all') {
        defaultRolePermission[key] = flattenTree({
          data: cloneDeep(treeData.value),
        }).map((el) => el.id)
      } else {
        defaultRolePermission[key] = flattenTree({
          data: cloneDeep(treeData.value).filter((el) =>
            permissionLimit[key].includes(el.path)
          ),
        }).map((el) => el.id)
        // 默认增加项目组的查看权限
        defaultRolePermission[key].push('project:view')
      }
    }
    nextTick(() => {
      initSelectPermission()
      setCheckedByIds('adminList')
    })
  }

  const initSelectPermission = () => {
    for (const key of roleList.value) {
      treeRef.value.setCheckedKeys(defaultRolePermission[key])
      const nodes = treeRef.value.getCheckedNodes()
      const half = treeRef.value.getHalfCheckedNodes()
      selectPermission[key] = {
        nodes: nodes,
        half: half,
      }
    }
  }

  // 用keys 设置默认选中
  const setCheckedByIds = (val) => {
    treeRef.value.setCheckedKeys(defaultRolePermission[val])
    state.selectAll = val === 'adminList'
    state.isIndeterminate = val !== 'adminList'
  }

  // 编辑的时候设置企业管理员的菜单权限展示
  const setAdminRoleMenu = async (data) => {
    const adminRes = await getAdminRoleMenu({ companyCode: data.code })
    if (adminRes.code === 200 && adminRes.data) {
      // 全部菜单
      const allMenu = mapMenuPermissionData(
        adminRes?.data?.adminAllMenuList ?? []
      )
      treeData.value = cloneDeep(allMenu)
      // 管理员已经有的菜单
      const menu = mapMenuPermissionData(
        adminRes?.data?.adminOwnedMenuList ?? []
      )
      editRoleId = 'roleId'
      nextTick(() => {
        setSelected(flattenTree(menu))
        treeRef.value.setCheckedNodes(mapWithoutChildren(menu))
      })
    }
  }

  // 新增企业时角色切换
  const roleLabelChange = (val) => {
    const nodes = treeRef.value.getCheckedNodes()
    const half = treeRef.value.getHalfCheckedNodes()
    selectPermission[oldeRole] = {
      nodes: nodes,
      half: half,
    }
    oldeRole = val
    setTreeData(val)
    nextTick(() => {
      let permission = []
      if (selectPermission[val]?.['nodes'] !== undefined) {
        permission = selectPermission[val]['nodes']
        treeRef.value.setCheckedNodes(cloneDeep(permission))
        setSelected(cloneDeep(permission))
      } else {
        setCheckedByIds(val)
      }
    })
  }
  // 设置el-tree data
  const setTreeData = (roleType) => {
    const data = mapMenuPermissionData(roleMenus.value?.[roleType])
    treeData.value = cloneDeep(data)
  }
  // 获取已选中的菜单、按钮权限
  const getCheckedPermission = () => {
    return mapSubmitPermissionData([
      ...treeRef.value.getCheckedNodes(),
      ...treeRef.value.getHalfCheckedNodes(),
    ])
  }
  // Drawer关闭
  const commonDrawerClose = () => {
    resetFormData()
    role.value = 'adminList'
    roleMenus.value = null
    oldeRole = 'adminList'
    selectPermission = {}
    state.selectAll = false
    state.isIndeterminate = false
    editRoleId = ''
    defaultRolePermission = {}
    companyCode = ''
    dataId = ''
  }
  // 表单提交时获取权限
  const getAuthMenuList = () => {
    const authMenuList = {}
    const curRoleId = isEdit.value ? editRoleId : roleInitIdsEnum[role.value]
    if (!isEdit.value) {
      roleList.value.forEach((el) => {
        const key = roleInitIdsEnum[el]
        authMenuList[key] = []
        const roleMenu = selectPermission[el]
        if (el !== role.value && roleMenu !== undefined) {
          authMenuList[key] = mapSubmitPermissionData([
            ...roleMenu.nodes,
            ...roleMenu.half,
          ])
        }
      })
    }
    authMenuList[curRoleId] = getCheckedPermission()
    return authMenuList
  }
  // 表单提交
  const submitForm = () => {
    formRef.value.validate(async (valid) => {
      if (valid) {
        const requestUrl = isEdit.value ? updateCompany : addCompany
        const data = {
          name: state.formData.companyName,
          userName: state.formData.managerUserName,
          account: state.formData.managerAccount,
          email: state.formData.email ?? '',
          companyType: state.formData.companyType,
          valid: state.formData.valid,
          supportVersion: state.formData.version,
          companyContractList: state.formData.companyContractList.map(
            (item) => {
              return {
                ...item,
                contractStatus: item.contractStatus,
                contractType: item.contractType,
                startTime: item.date[0],
                endTime: item.date[1],
                purchaseVolume:
                  item.contractStatus === 2 ? item.purchaseVolume : '',
              }
            }
          ),
        }
        //菜单、按钮权限
        data['authMenuList'] = getAuthMenuList()
        if (isEdit.value) {
          data['id'] = dataId
          data['companyCode'] = companyCode
        }

        try {
          loading.value = true
          const res = await requestUrl(data)
          if (res.code === 200) {
            state.show = false
            if (!isEdit.value) {
              ElMessage({
                message: `企业开通成功，已发送账号激活邮件给客户`,
                type: 'success',
              })
            } else {
              ElMessage({
                message: `编辑企业成功`,
                type: 'success',
              })
            }
            await getListData()
          }
        } catch (error) {
          console.log(error)
        }
        loading.value = false
      }
    })
  }

  /** 表格数据相关 **/
  // 过滤、筛选状态
  const filterState = reactive({
    searchKey: '',
    status: '',
    version: '',
  })
  const tableData = ref([])
  const getListData = async () => {
    const data = {}
    state.loading = true
    const res = await getCompanyList(data)
    if (res.code === 200 && res.data) {
      tableData.value = res.data
    }
    state.loading = false
  }
  onMounted(async () => {
    getListData()
    const res = await asyncGetAppManageList({ size: -1 })
    if (res.code === 200 && res.data?.pageInfo?.list) {
      res.data.pageInfo.list.forEach((item) => {
        item.label = item.name
        item.value = item.companyCode
        item.disabled = true
        if (item.children && item.children.length) {
          item.children.forEach((items) => {
            items.label = items.appName
            items.value = items.appId
          })
        }
      })
      appList.value = res.data.pageInfo.list
    }
  })
  // 表格展示数据
  const filterTableData = computed(() => {
    let data = []
    if (Array.isArray(tableData.value)) {
      data = tableData.value.filter((item) => {
        let keyFlag = true
        let statusFlag = true
        let versionFlag = true
        if (filterState.searchKey !== '') {
          if (
            item.name
              .toLowerCase()
              .indexOf(filterState.searchKey.toLowerCase()) === -1 &&
            item.code
              .toLowerCase()
              .indexOf(filterState.searchKey.toLowerCase()) === -1
          ) {
            keyFlag = false
          }
        }

        if (filterState.status !== '') {
          if (item.status !== filterState.status) {
            statusFlag = false
          }
        }
        if (filterState.version !== '') {
          if (item.supportVersion !== filterState.version) {
            versionFlag = false
          }
        }
        return keyFlag && statusFlag && versionFlag
      })
    }
    return data
  })

  //点击更多
  const tipDialogVisible = ref(false)
  const tipData = ref({
    title: '',
    iconType: 3,
    text: '',
    params: null,
    type: '',
  })
  const tipDialogClose = () => {
    tipData.value = { title: '', iconType: 3, text: '', params: null, type: '' }
  }
  const clickMore = (command) => {
    if (['status', 'invite', 'reset'].includes(command.type)) {
      moreOperation[command.type](command.data)
    }
  }
  // 更多操作
  const moreOperation = {
    //企业账号启用禁用
    status: (params) => {
      const text = params.status === 0 ? '禁用' : '启用'
      tipDialogVisible.value = true
      tipData.value = {
        title: `${text}企业账号`,
        iconType: 3,
        text: `确定${text}【${params.name}】企业吗?`,
        params,
        type: 'status',
      }
    },
    //企业账号邀请激活
    invite: async (params) => {
      state.loading = true
      await invitationActive({
        userId: params.userId,
      }).finally((_) => {
        state.loading = false
      })
      ElMessage.success('邮件发送成功')
    },
    // 重置企业账号密码
    reset: (params) => {
      tipDialogVisible.value = true
      tipData.value = {
        title: '重置密码',
        iconType: 3,
        text: `您确定要重置【${params.name}】企业的密码吗？`,
        params,
        type: 'reset',
      }
    },
  }
  const confirmLoding = ref(false)
  const tipDialogSubmit = () => {
    if (['status', 'reset'].includes(tipData.value.type)) {
      confirmLoding.value = true
      confirmOperation[tipData.value.type]()
    }
  }
  const confirmOperation = {
    //企业账号启用禁用
    status: async () => {
      const status = tipData.value.params.status === 0 ? 1 : 0
      try {
        const res = await updateCompanyStatus({
          status,
          id: tipData.value.params.id,
        })
        if (res.code === 200) {
          ElMessage({
            message: `${status === 0 ? '启用' : '禁用'}成功`,
            type: 'success',
          })
          tipDialogVisible.value = false
          await getListData()
        }
      } catch (error) {
        confirmLoding.value = false
      }
      confirmLoding.value = false
    },
    // 重置企业账号密码
    reset: async () => {
      try {
        const res = await resetCompanyManagerPwd({
          userId: tipData.value.params.userId,
        })
        if (res.code === 200 && res.data) {
          ElMessage({
            message: '密码重置成功',
            type: 'success',
          })
          tipDialogVisible.value = false
          isReset.value = true
          resetData.value = res.data
          resetDialogVisible.value = true
        }
      } catch (error) {
        confirmLoding.value = false
      }
      confirmLoding.value = false
    },
  }
  // 重置密码操作(新增账号展示账号密码信息)
  const isReset = ref(true)
  const resetData = ref(null)
  const resetDialogVisible = ref(false)
  const resetDialogClose = () => {
    resetData.value = null
    isReset.value = true
  }
  // 复制重置密码信息
  const copyResetInfo = (event) => {
    const text = `
    账号：${resetData.value.account}
    密码：${resetData.value.password}
    登录地址：${host.value}
  `
    copyText(text, event)
    resetDialogVisible.value = false
  }
  const host = ref(window.location.host)

  const openftFormRef = ref(null)
  const openftDrawerVisible = ref(false)
  const appList = ref([])
  const openftLoading = ref(false)

  /**
   * @description 开通方投配置
   */
  const openft = () => {
    openftDrawerVisible.value = true
  }

  /**
   * @description 关闭开通方投配置
   */
  const openftDrawerClose = () => {
    openftFormRef.value.resetFields()
    nextTick(() => {
      openftDrawerVisible.value = false
    })
  }

  /**
   * @description 提交开通方投配置
   */ const openftSubmit = () => {
    openftFormRef.value.validate((valid) => {
      if (valid) {
        openftLoading.value = true
        openAttribution({ appId: state.openftFormData.appId })
          .then((res) => {
            if (res.code === 200) {
              ElMessage({
                message: '已开通方投配置',
                type: 'success',
              })
              openftDrawerClose()
            }
          })
          .finally(() => {
            openftLoading.value = false
          })
      }
    })
  }

  return {
    state,
    treeRef,
    treeData,
    treeDataFlat,
    resetFormData,
    treeCheck,
    selectAllChange,
    contractStatusChange,
    addCompanyContract,
    delCompanyContract,
    formRules,
    filterState,
    getListData,
    filterTableData,
    isEdit,
    openftDrawerVisible,
    openft,
    appList,
    openftLoading,
    openftFormRef,
    openftDrawerClose,
    openftSubmit,
    addOrEdit,
    role,
    formRef,
    commonDrawerClose,
    submitForm,
    tipDialogVisible,
    tipData,
    tipDialogClose,
    clickMore,
    confirmLoding,
    tipDialogSubmit,
    resetData,
    resetDialogVisible,
    resetDialogClose,
    copyResetInfo,
    host,
    roleList,
    roleLabelChange,
    loading,
    isReset,
  }
}
