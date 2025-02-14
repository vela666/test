import { h, reactive, ref, nextTick, markRaw, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { cloneDeep, debounce } from 'lodash-es'
import useUserStore from '@/store/modules/user'
import {
  asyncGetUserList,
  asyncAddUser,
  asyncEditUser,
  asyncGetPartnerTagList,
  asyncGetMemberInfo,
  asyncResetUserPassword,
  asyncUpdUserStatus,
  invitationActive,
  typeVerify,
  transferUserData,
  userDepart,
} from '@/api/modules/user'
import {
  asyncAddTeam,
  asyncGetTeamList,
  asyncDeleteTeam,
  asyncEditTeam,
  userBatchSync,
} from '@/api/modules/team-management'
import { slicePagingData } from '@/utils/dataProcessing'
import { asyncGetRoleList } from '@/api/modules/role-manage'
import { asyncGetOptionalProjectGroupList } from '@/api/modules/project-group'
import { useTipModal } from '@/components/TipDialog/index.js'
import { ElButton } from 'element-plus'
const initVal = () => {
  return {
    state: {
      selectAllList: [],
      selectList: [],
      tableAllData: [],
      pagedData: [],
      show: false,
      tipDialog: false,
      addOrEditDialog: false,
      teamDialog: false,
      dialogVisible: false,
      dialogLoading: false,
      // externalDialog: false,
      formData: {
        // 当登陆账号是 合作伙伴时 添加、编辑都只能是合作伙伴且禁用标识下拉选择
        // 编辑时 登陆账号 禁用
        outsider: false,
        dataSync: 1,
        partnerTagName: '',
        departmentId: '',
        name: '',
        account: '',
        email: '',
        roleIdList: [],
        projectIdList: [],
        userId: '',
      },
      isEmail: false,
      formUserData: {
        dataSync: 2,
      },
      partnerList: [],
      roleList: [],
      projectGroupList: [],
      rowData: {},
      // 部门管理
      teamData: [],
      teamUpdName: '',
      tempTeamAddList: [],
      exhibitLoading: false,
      operateLoading: false,
    },
    filterConfig: {
      // 用户名称、账号、邮箱
      searchCondition: '',
      // false：内部人员、 true：合作伙伴
      outsiderFilter: '',
      // 状态：0 正常、1 禁用、2 密码错误锁定、3 长时间未登录锁定，(2和3统一归类为锁定状态)
      status: '',
      team: '',
    },
    pageConfig: {
      // 分页器配置
      page: 1, // 当前页码
      pageSize: 20, // 每页数量
      total: 0, // 总数
    },
  }
}

const maxPartnerTxtLen = 50

export default function (t) {
  const userStore = useUserStore()
  let isTeamOperate = false
  const closeMethods = {
    memberDialogClose() {
      state.formData = initVal().state.formData
    },
    teamDialogClose() {
      state.tempTeamAddList = initVal().state.tempTeamAddList
      state.teamUpdName = ''
      isTeamOperate && getUserList()
      isTeamOperate = false
    },
  }

  const teamMethods = {
    async saveEdit(params) {
      // 排除当前的
      const data = state.teamData.filter(
        (item, index) => index !== params.index
      )
      const repeat = data.some((v) => v.name === state.teamUpdName)
      if (repeat) {
        ElMessage.error(t('system.members.departmentExists'))
        return
      }
      await asyncEditTeam({
        code: params.item.code,
        name: state.teamUpdName,
      })
      getTeamList()
      isTeamOperate = true
      ElMessage.success(t('common.editedSuccessfully'))
      // params.item.name = state.teamUpdName
      this.cancelEdit(params)
    },
    showEdit(params) {
      state.teamUpdName = params.item.name
      params.item.edit = true
      state.teamData.forEach((v, vIndex) => {
        if (params.item.name !== v.name) state.teamData[vIndex].edit = false
      })
      nextTick(() => {
        document.querySelector(`#team-input${params.index}`).focus()
      })
    },
    cancelEdit(params) {
      params.item.edit = false
      state.teamUpdName = ''
    },
    async deleteTeam(params) {
      await asyncDeleteTeam({
        departmentCodeList: [params.item.code],
      })
      ElMessage.success(t('common.deleteSuccessfully'))
      isTeamOperate = true
      getTeamList()
    },
    async addOrCancelTeam(params) {
      if (params.add) {
        const repeat = state.teamData.some(
          (item) => item.name === params.item.name
        )
        if (repeat) {
          ElMessage.error(t('system.members.departmentExists'))
          return
        }
        await asyncAddTeam({
          name: params.item.name,
        })
        getTeamList()
        isTeamOperate = true
        ElMessage.success(t('common.addedSuccessfully'))
      }
      state.tempTeamAddList.splice(params.index, 1)
    },
  }

  const buttonMethods = {
    async addOrEdit(params) {
      state.addOrEditDialog = true
      getTeamList()
      getRoleList()
      getProjectGroupList()
      getPartnerTagList()
      if (params.row) {
        state.operateLoading = true
        const { data } = await asyncGetMemberInfo(params.row.userId).finally(
          (_) => {
            state.operateLoading = false
          }
        )
        state.formData = data
        state.isEmail = !!data.email
      }
      if (userStore.userInfo.partnerTagName) {
        state.formData.outsider = !!userStore.userInfo.partnerTagName
        state.formData.partnerTagName = userStore.userInfo.partnerTagName
      }
    },
    async enableData(params) {
      await asyncUpdUserStatus({
        userList: [
          {
            userId: params.row.userId,
            userStatus: 0,
          },
        ],
      })
      ElMessage.success(t('system.members.accountEnabledSuccessfully'))
      getUserList()
    },
    async disabledData(params) {
      if (params.submit) {
        state.operateLoading = true
        await asyncUpdUserStatus({
          userList: [
            {
              userId: state.rowData.userId,
              userStatus: 1,
            },
          ],
        }).finally((_) => {
          state.operateLoading = false
        })
        ElMessage.success(t('system.members.accountDisabledSuccessfully'))
        getUserList()
      } else {
        tipDialogOption.title = t('system.members.disableMember')
        tipDialogOption.content = t('system.members.disableMemberMsg', [
          params.row.name,
        ])
      }
      state.tipDialog = !params.submit
    },
    async inviteActivation(params) {
      state.exhibitLoading = true
      await invitationActive({
        userId: params.row.userId,
      }).finally((_) => {
        state.exhibitLoading = false
      })
      ElMessage.success(t('system.members.emailSentSuccessfully'))
    },
    /* async resetData(params) {
      try {
        if (!params.row.email) {
          await useTipModal(
            {
              content: `请先给该成员【${params.row.name}】添加邮箱后再重置密码，新密码将通过邮件发送给成员。`,
              needLoading: false,
              title: '添加邮箱',
            },
            {
              btn: ({ updShow }) =>
                h(
                  ElButton,
                  {
                    onClick(event) {
                      updShow(false)
                    },
                    type: 'primary',
                  },
                  () => '知道了'
                ),
            }
          )
          return
        }
        await asyncResetUserPassword({
          userId: params.row.userId,
        })
        useTipModal(
          {
            content: `成员【${params.row.name}】的密码已被重置，新密码已通过邮件发送给成员。`,
            iconType: 1,
            needLoading: false,
            title: '重置密码',
          },
          {
            btn: ({ updShow }) =>
              h(
                ElButton,
                {
                  onClick(event) {
                    updShow(false)
                  },
                  type: 'primary',
                },
                () => '知道了'
              ),
          }
        )
      } catch (e) {
        console.log(e)
      }
    },
    async deleteData(params) {
      tipDialogOption.title = '删除成员'
      tipDialogOption.content = `将【${params.row.name}】成员从部门中删除，将取消该用户所有分享（看板分享、筛选分享），确定删除吗？`
      state.tipDialog = true
    }, */
    /**
     * @description: 设置用户离职
     * @return {*}
     * @param {*} params
     */
    resign(params) {
      transferUserData({ userId: params.row.userId }).then(({ data }) => {
        // 无可转移的数据资产
        if (!data || data?.projectInfoList?.length === 0) {
          useTipModal({
            title: t('system.members.setResignation'),
            content: t('system.members.setResignationMsg', [params.row.name]),
            needLoading: false,
            btnSwap: true,
          })
            .then(() => {
              userDepart({
                userId: params.row.userId,
                groupList: [],
              }).then(() => {
                ElMessage.success(t('common.operationSuccessfully'))
                getUserList()
              })
            })
            .catch((e) => {})
        } else {
          // 有可转移的数据资产
          state.userResignRef.open(data, params.row)
        }
      })
    },
  }

  const tipDialogOption = {
    title: '',
    content: '',
    type: '',
    params: {},
  }

  const commonDrawerRef = ref(null)
  const addOrEditRef = ref(null)

  const state = reactive(initVal().state)
  const filterConfig = reactive(initVal().filterConfig)
  const pageConfig = reactive(initVal().pageConfig)

  // 添加部门
  const addTeam = () => {
    state.tempTeamAddList.push({
      name: '',
    })
    nextTick(() => {
      document
        .querySelector(`#add-team-input${state.tempTeamAddList.length - 1}`)
        .focus()
    })
  }

  const addOrEditSubmit = () => {
    addOrEditRef.value.validate(async (valid) => {
      if (!valid) return
      state.operateLoading = true
      const bool = !!state.formData.userId
      const fn = bool ? asyncEditUser : asyncAddUser
      const params = {
        ...state.formData,
      }
      // 编辑时不传项目组
      let multipleFlag = false
      if (bool) {
        Reflect.deleteProperty(params, 'projectIdList')
      } else {
        try {
          const res = await typeVerify({ account: state.formData.account })
          if (res && res.code === 200 && res.data?.subAccountOrNot) {
            state.operateLoading = false
            await ElMessageBox.confirm(
              t('system.members.accountJoinMsg', [
                state.formData.account,
                res.data.masterAccountEmail,
              ]),
              t('common.tip'),
              {
                type: 'warning',
                closeOnClickModal: false,
                closeOnPressEscape: false,
                center: true,
                customClass: 'nd-message-box-424',
              }
            )
            state.operateLoading = true
            multipleFlag = true
          }
        } catch (error) {
          state.operateLoading = false
          return
        }
      }
      const { data } = await fn(params).finally((_) => {
        state.operateLoading = false
      })
      state.addOrEditDialog = false
      getUserList()
      if (bool) {
        if (state.formData.userId === userStore.userInfo.userId) {
          userStore.getUserInfo()
        }
        ElMessage.success(t('common.editedSuccessfully'))
      } else {
        ElMessage.success(
          t('system.members.createdAccountSuccessfully', [
            multipleFlag
              ? t('system.members.activationEmailMainAccount')
              : t('system.members.activationEmailAccount'),
            state.formData.name,
          ])
        )
      }
    })
  }

  const teamManagement = (val) => {
    state.teamDialog = true
    getTeamList()
  }

  const partnerChange = (val) => {
    let tmp = val.trim()
    if (tmp.length > maxPartnerTxtLen)
      ElMessage.warning(t('system.members.partnerInputMax', [maxPartnerTxtLen]))
    state.formData.partnerTagName = tmp.slice(0, maxPartnerTxtLen)
  }

  const closeExecuteOperation = (type = '') => {
    // 其他操作
    closeMethods[type]?.()
  }

  /**
   * @description 部门相关
   * @param params {Object} 参数
   * {
   *     item:  当前数据,
   *     index:  当前数据索引,
   *     type: 执行操作类型,
   *     add: {Boolean} 添加部门后保存
   * }
   */
  const teamExecuteOperation = (params) => {
    ElMessage.closeAll()
    teamMethods[params.type]?.(params)
  }
  /**
   * @description 按钮相关
   * @param params {Object} 参数
   * {
   *     type: 执行操作类型,
   *     row: 当前数据,
   *     submit:  {Boolean} 是否提交
   * }
   */
  const buttonExecuteOperation = debounce((params) => {
    const { type, otherRow = '', row = '' } = params
    if (row) state.rowData = row
    tipDialogOption.type = type
    buttonMethods[type]?.(params)
  }, 100)

  const getTeamList = async () => {
    const { data } = await asyncGetTeamList()
    state.teamData = data
  }

  const handleTableData = debounce(() => {
    const outsiderVal = !Number.isInteger(filterConfig.outsiderFilter)
    const searchCondition = filterConfig.searchCondition.toLocaleLowerCase()
    const searchTeam = filterConfig.team.toLocaleLowerCase()
    const statusHasVal = !Number.isInteger(filterConfig.status)
    const data = cloneDeep(state.tableAllData)
      .map((parent) => {
        const children = parent.children.filter((sub) => {
          const { name, account, email, status, outsider } = sub
          const search = (name + '' + account + '' + email)
            .toLocaleLowerCase()
            .includes(searchCondition)

          const isStatusMatch =
            statusHasVal ||
            status === filterConfig.status ||
            (filterConfig.status === 2 && [2, 3].includes(status))

          const isOutsiderMath =
            outsiderVal || filterConfig.outsiderFilter === +outsider

          return search && isStatusMatch && isOutsiderMath
        })

        return {
          ...parent,
          children,
        }
      })
      .filter((team) => {
        const name = team.departmentName
          .toLocaleLowerCase()
          .includes(searchTeam)
        return statusHasVal ? name : name && team.children.length > 0
      })

    /* pageConfig.total =
      data.reduce((p, c) => {
        return (p += c.children.length)
      }, 0) + data.length*/
    /*state.pagedData = markRaw(
      slicePagingData(data, pageConfig.page, pageConfig.pageSize)
    )*/
    state.pagedData = markRaw(data)
  })

  const getUserList = async () => {
    state.exhibitLoading = true
    const {
      data: { list },
    } = await asyncGetUserList({
      size: -1,
    }).finally((_) => {
      state.exhibitLoading = false
    })
    state.tableAllData = list.map((item) => {
      const children = item.userList.map((sub) => {
        return {
          ...sub,
          newId: sub.userId,
        }
      })
      return {
        ...item,
        newId: item.departmentCode,
        children,
      }
    })
    handleTableData()
  }

  const getPartnerTagList = async () => {
    const { data } = await asyncGetPartnerTagList()
    state.partnerList = markRaw(data)
  }

  const getRoleList = async () => {
    const { data } = await asyncGetRoleList()
    state.roleList = markRaw(data)
  }

  const getProjectGroupList = async () => {
    const { data } = await asyncGetOptionalProjectGroupList()
    state.projectGroupList = markRaw(data)
  }

  getUserList()
  /*getTeamList()
  getRoleList()
  getProjectGroupList()
  getPartnerTagList()*/
  watch(
    () => filterConfig,
    (val) => {
      handleTableData()
    },
    {
      deep: true,
    }
  )

  const accountAsync = () => {
    state.selectList = cloneDeep(state.selectAllList)
    state.formUserData.dataSync = state.selectList.every(
      (item) => item.dataSync === 2
    )
      ? 2
      : 1
    state.dialogVisible = true
  }

  const formRef = ref(null)

  const handleSelectionChange = (val) => {
    state.selectAllList = val.filter((item) => !item.children)
  }
  const handleDelete = (index) => {
    state.selectList.splice(index, 1)
  }
  const handleDialogClose = () => {
    formRef.value.resetFields()
    state.dialogVisible = false
  }
  const handleDialogSubmit = () => {
    const data = {
      status: state.formUserData.dataSync,
      businessIds: state.selectList.map((item) => item.userId),
    }
    state.dialogLoading = true
    userBatchSync(data)
      .then((res) => {
        if (res.code === 200) {
          getUserList()
          handleDialogClose()
        }
      })
      .finally(() => {
        state.dialogLoading = false
      })
  }

  return {
    // ...toRefs(state),
    state,
    userStore,
    filterConfig,
    pageConfig,
    tipDialogOption,
    addOrEditRef,
    commonDrawerRef,
    addTeam,
    partnerChange,
    teamManagement,
    // handleTableData,
    addOrEditSubmit,
    teamExecuteOperation,
    closeExecuteOperation,
    buttonExecuteOperation,
    accountAsync,
    formRef,
    handleSelectionChange,
    handleDelete,
    handleDialogClose,
    handleDialogSubmit,
    getUserList,
  }
}
