import { computed, nextTick, shallowRef, markRaw, reactive, ref } from 'vue'
import App from '../components/App.vue'
import Member from '../components/Member.vue'
import {
  asyncAddProjectGroup,
  asyncEditProjectGroup,
  asyncGetOptionalUserList,
  asyncGetProjectGroupInfo,
  asyncGetProjectGroupList,
  asyncRemoveProjectGroup,
} from '@/api/modules/project-group'
import { ElMessage } from 'element-plus'
import { t } from '@/locales/i18n'

const compontentList = {
  App: markRaw(App),
  Member: markRaw(Member),
}

const initVal = () => {
  return {
    state: {
      groupList: [],
      // 当前选择的项目组
      groupActived: {
        id: '',
        name: '',
        // 控制是否显示添加成员/应用按钮 0 普通成员、1 项目组管理员(显示)
        userType: '',
      },
      // 项目负责人列表
      projectManagerList: [],
      tipDialog: false,
      addOrEditGruopDialog: false,
      memberOrApp: 'Member',
      currentCompontent: compontentList.Member,
      formData: {
        projectId: '',
        projectName: '',
        projectManagerUserIdList: [],
      },
      // 临时选择数据
      selectedItem: {},
      operateLoading: false,
      exhibitLoading: false,
    },
    filterConfig: {
      projectName: '',
    },
    /*  pageConfig: {
      // 分页器配置
      page: 1, // 当前页码
      pageSize: 20, // 每页数量
      total: 0, // 总数
    },*/
  }
}

export default function () {
  const tipDialogOption = {
    title: '',
    content: '',
    type: '',
  }

  const state = reactive(initVal().state)
  const filterConfig = reactive(initVal().filterConfig)
  // const pageConfig = reactive(initVal().pageConfig)

  const componentRefs = shallowRef({})
  // 过滤后的项目组列表
  const filterGroupList = computed(() => {
    return state.groupList.filter((item) => {
      return item.projectName
        .toLocaleLowerCase()
        .includes(filterConfig.projectName.toLocaleLowerCase())
    })
  })

  const formRef = ref(null)

  const resetData = () => {
    state.isIndeterminate = false
    state.selectAllMenu = false
    state.formData = initVal().state.formData
  }

  // 新增或编辑提交
  const addOrEditGruopSubmit = () => {
    formRef.value.validate(async (valid) => {
      if (!valid) return
      state.operateLoading = true
      const bool = !!state.formData.projectId
      const fn = bool ? asyncEditProjectGroup : asyncAddProjectGroup
      await fn(state.formData).finally((_) => {
        state.operateLoading = false
      })
      ElMessage.success(
        `${bool ? t('common.editedSuccessfully') : t('common.newSuccessfullyAdded')}`
      )
      state.addOrEditGruopDialog = false
      await getProjectGroupList()
      componentRefs.value[state.memberOrApp].getList()
    })
  }

  // 切换项目组
  const switchGroup = (item) => {
    if (item.projectId === state.groupActived.id) return
    state.groupActived.id = item.projectId
    state.groupActived.name = item.projectName
    state.groupActived.userType = item.userType
  }

  const memberOrAppToggle = (item) => {
    state.currentCompontent = compontentList[item]
  }

  const addAppOrMember = (item) => {
    componentRefs.value[state.memberOrApp].addHandlder()
  }

  const scrollToCurrentSelectedProjectGroup = () => {
    nextTick(() => {
      const parent = document.querySelector('#nd-group')
      const top = parent.querySelector(`[data-id='${state.groupActived.id}']`)
      if (top) {
        parent.scrollTop = top.offsetTop - 6
      }
    })
  }
  const defaultFirstGroup = () => {
    const { projectId, projectName, userType } = state.groupList[0]
    state.groupActived.id = projectId
    state.groupActived.name = projectName
    state.groupActived.userType = userType
    scrollToCurrentSelectedProjectGroup()
  }

  // 设置组件实例
  const setRefs = (name, el) => {
    componentRefs.value[name] = el
  }

  const gruopDialogClose = () => {
    state.formData = initVal().state.formData
  }

  const addOrEditGruop = async (params) => {
    state.addOrEditGruopDialog = true
    if (params) {
      state.operateLoading = true
      const { data } = await asyncGetProjectGroupInfo(params.projectId).finally(
        (_) => {
          state.operateLoading = false
        }
      )
      state.formData = data
    }
    const { data } = await asyncGetOptionalUserList({
      managerUserIds: state.formData.projectManagerUserIdList,
    })
    state.projectManagerList = markRaw(data)
  }

  const removeGruop = async (bool, params) => {
    if (params) state.selectedItem = markRaw(params)
    if (!bool) {
      state.operateLoading = true
      await asyncRemoveProjectGroup({
        projectIdList: [state.selectedItem.projectId],
      }).finally((_) => {
        state.operateLoading = false
      })
      ElMessage.success(t('common.deleteSuccessfully'))
      getProjectGroupList()
      state.selectedItem = {}
    } else {
      tipDialogOption.title = t('system.projectTeams.deleteProjectTeam')
      tipDialogOption.content = t('system.projectTeams.deleteProjectTeamMsg', [
        state.selectedItem.projectName,
      ])
    }
    state.tipDialog = bool
  }

  const getProjectGroupList = async () => {
    state.exhibitLoading = true
    const {
      data: { list },
    } = await asyncGetProjectGroupList({
      size: -1,
    }).finally((_) => {
      state.exhibitLoading = false
    })
    state.groupList = markRaw(list)
    if (!state.groupList.length) {
      state.groupActived = initVal().state.groupActived
      return
    }
    const item = list.find((item) => item.projectId === state.groupActived.id)
    if (item) {
      state.groupActived.id = item.projectId
      state.groupActived.name = item.projectName
      state.groupActived.userType = item.userType
      // scrollToCurrentSelectedProjectGroup()
    } else {
      defaultFirstGroup()
    }
  }
  getProjectGroupList()
  return {
    // ...toRefs(state),
    state,
    filterConfig,
    filterGroupList,
    tipDialogOption,
    formRef,
    setRefs,
    resetData,
    switchGroup,
    removeGruop,
    addOrEditGruop,
    addAppOrMember,
    gruopDialogClose,
    memberOrAppToggle,
    addOrEditGruopSubmit,
  }
}
