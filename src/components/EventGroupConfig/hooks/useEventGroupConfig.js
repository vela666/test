import { ref, reactive, nextTick, watch, computed } from 'vue'
import { ElMessage } from 'element-plus'
import {
  getEventList,
  getEventRuleById,
  saveEventRule,
  saveUseEventRule,
  getEventGroupRule,
  editRuleNameRequest,
  deleteRuleRequest,
  useGroupRuleRequest,
  getCurrentUsedRule,
} from '@/api/modules/event-group'
import useUserStore from '@/store/modules/user'
import useEventStore from '@/store/modules/event'
import { t } from '@/locales/i18n'
export default function () {
  const userStore = useUserStore()
  const userInfo = computed(() => userStore.userInfo)
  const eventStore = useEventStore()
  // 获取当前appId下的所有事件
  const allEvents = ref([])
  const getAllEvents = async () => {
    const res = await getEventList({ appId: sessionStorage.getItem('appId') })
    if (res.code === 200 && Array.isArray(res.data)) {
      allEvents.value = [...res.data]
    }
  }

  const dialogVisible = ref(false)
  const showDialog = () => {
    dialogVisible.value = true
  }

  const currentRule = computed(() => {
    let data = []
    for (const key in eventStore.eventRules) {
      if (Array.isArray(eventStore.eventRules[key])) {
        data = [...data, ...eventStore.eventRules[key]]
      }
    }
    data.forEach((item) => {
      if (item.eventScreenName === '默认规则') {
        item.eventScreenName = t('analysis.defaultRule')
      }
    })
    return data.find((el) => el.eventScreenId === eventStore.ruleId) ?? {}
  })

  watch(dialogVisible, async (val) => {
    if (val) {
      await getAllEvents()
      await getRuleList()
      const ruleItem =
        ruleList.value.find((el) => el.eventScreenId === eventStore.ruleId) ??
        ruleList.value[0]
      console.log(eventStore.eventRules, 'eventStore.eventRules')
      setRuleSelected(ruleItem)
    }
  })
  // 公开状态
  const isOpen = ref(false)
  // 全局默认（管理员设置，user的type为2）
  const isGlobal = ref(false)

  // 获取当前应用下的事件分组规则
  const leftLoading = ref(false)
  const ruleList = ref([])
  const getRuleList = async () => {
    leftLoading.value = true
    try {
      const res = await getEventGroupRule({
        appId: sessionStorage.getItem('appId'),
      })
      if (res.code === 200 && Array.isArray(res.data)) {
        ruleList.value = [...res.data]
      }
    } catch (error) {
      leftLoading.value = false
    }
    leftLoading.value = false
  }
  // 当前选中展示的规则
  const activeRule = ref({})
  // 选择规则
  const selectedRule = (data) => {
    if (data?.eventScreenId === activeRule.value?.eventScreenId) return
    setRuleSelected(data)
  }
  const setRuleSelected = (data) => {
    isOpen.value = data?.screenType === 2
    isGlobal.value = data?.globalDefault === 2 && userInfo.value.type === 2
    activeRule.value = { ...data }
    setRuleGroup({ ...data })
  }
  // 设置选中规则的分组展示
  const list = ref([])
  // 设置选中规则的分组展示
  const setRuleGroup = (rule) => {
    const groupList = []
    if (!rule?.eventGroupJson) return
    // 使用Map重新组装默认分组中的事件
    const eventsMap = new Map()
    for (const el of allEvents.value) {
      eventsMap.set(el.eventId, el)
    }
    const jsonData = JSON.parse(rule.eventGroupJson)
    if (!Array.isArray(jsonData)) return
    jsonData.forEach((group, i) => {
      const temp = {
        id: group.eventGroupName !== '默认分组' ? i + 1 : -1,
        name: group.eventGroupName,
        editable: false,
        editName: '',
        children: [],
      }
      if (group.eventGroupName !== '默认分组') {
        if (Array.isArray(group.eventList)) {
          group.eventList.forEach((el) => {
            const eventItem = eventsMap.get(el.eventId)
            if (eventItem) {
              temp.children.push({ ...eventItem })
            }
            eventsMap.delete(el.eventId)
          })
        }
      }
      groupList.push(temp)
    })
    // 重新组装默认分组中的事件
    const defaultIndex = groupList.findIndex((item) => item.name === '默认分组')
    if (defaultIndex > -1) {
      groupList[defaultIndex].children = [...eventsMap.values()]
    }
    groupList.forEach((item) => {
      if (item.name === '默认分组') {
        item.name = t('analysis.defaultGroup')
      }
    })
    list.value = groupList
  }

  const commonDialogVisible = ref(false)
  const formRules = {
    ruleName: [
      {
        required: true,
        max: 24,
        message: t('rules.enterRuleName'),
        trigger: 'blur',
      },
    ],
  }
  const formData = reactive({
    ruleName: '',
  })
  const ruleFormRef = ref(null)

  const commonDialogClose = () => {
    formData.ruleName = ''
    operatingRule.value = null
  }
  const showTitle = ref('')
  const ruleOperation = ref(0) // 0,新建规则; 1,编辑规则名称; 2,复制规则;
  const operatingRule = ref(null) // 需要编辑/复制/删除的规则
  // 添加规则
  const addRule = () => {
    ruleOperation.value = 0
    commonDialogVisible.value = true
    showTitle.value = t('analysis.addRule')
  }
  // 修改规则名称
  const editRuleName = (data) => {
    ruleOperation.value = 1
    commonDialogVisible.value = true
    showTitle.value = t('analysis.editRuleName')
    formData.ruleName = data.eventScreenName
    operatingRule.value = { ...data }
  }
  // 复制规则
  const copyRule = (data) => {
    ruleOperation.value = 2
    commonDialogVisible.value = true
    showTitle.value = t('analysis.copyRule')
    formData.ruleName = data.eventScreenName
    operatingRule.value = { ...data }
  }

  // 新建规则、编辑规则名称、复制规则弹出框确认
  const ruleSubmit = () => {
    ruleFormRef.value.validate(async (valid) => {
      if (valid) {
        if ([0, 1, 2].includes(ruleOperation.value)) {
          confirmCommonDialogOperation[ruleOperation.value]()
        }
      }
    })
  }
  //新建规则、编辑规则名称、复制规则操作处理
  const confirmCommonDialogOperation = [
    async () => {
      //0,新建规则（只包含一个默认分组）后直接发送保存请求
      if (allEvents.value.length === 0) {
        ElMessage({
          message: t('analysis.currentAppNotEvent'),
          type: 'warning',
        })
        return
      }
      const defaultGroup = [
        {
          eventGroupName: '默认分组',
          orderNum: 0,
          eventList: JSON.parse(JSON.stringify(allEvents.value)),
        },
      ]
      const appId = sessionStorage.getItem('appId')
      const params = {
        appId,
        eventGroupJson: JSON.stringify(defaultGroup),
        eventScreenName: formData.ruleName,
        globalDefault: 1, // 自定义全局默认设置 1 否 2 是
        screenType: 1, //1 不公开 2 公开
        userId: userInfo.value.userId,
      }
      confirmLoding.value = true
      try {
        const res = await saveEventRule(params)
        if (res.code === 200 && res.data) {
          commonDialogVisible.value = false
          ElMessage({
            message: t('common.createSuccess'),
            type: 'success',
          })
          await getRuleList()
          eventStore.getEventRules(appId)
          // 设置新创建的规则为选中规则
          const find = ruleList.value.find(
            (el) => el.eventScreenId === res.data
          )
          if (find && Object.keys(find).length > 0) {
            setRuleSelected({ ...find })
          }
        }
      } catch (error) {
        confirmLoding.value = false
      }
      confirmLoding.value = false
    },
    async () => {
      //1,编辑规则名称
      const appId = sessionStorage.getItem('appId')
      const params = {
        appId,
        eventScreenId: operatingRule.value.eventScreenId,
        eventScreenName: formData.ruleName,
      }
      confirmLoding.value = true
      try {
        const res = await editRuleNameRequest(params)
        if (res.code === 200) {
          commonDialogVisible.value = false
          ElMessage({
            message: t('common.editedSuccessfully'),
            type: 'success',
          })
          await getRuleList()
          eventStore.getEventRules(appId)
        }
      } catch (error) {
        confirmLoding.value = false
      }
      confirmLoding.value = false
    },
    async () => {
      //2,复制规则
      const appId = sessionStorage.getItem('appId')
      const params = {
        appId,
        eventGroupJson: operatingRule.value?.eventGroupJson ?? '',
        eventScreenName: formData.ruleName,
        globalDefault: 1, // 自定义全局默认设置 1 否 2 是
        screenType: 1, //1 不公开 2 公开
        userId: userInfo.value.userId,
      }
      confirmLoding.value = true
      try {
        const res = await saveEventRule(params)
        if (res.code === 200 && res.data) {
          commonDialogVisible.value = false
          ElMessage({
            message: t('common.successfulCopy'),
            type: 'success',
          })
          await getRuleList()
          eventStore.getEventRules(appId)
          // 设置复制的规则为选中规则
          const find = ruleList.value.find(
            (el) => el.eventScreenId === res.data
          )
          if (find && Object.keys(find).length > 0) {
            setRuleSelected({ ...find })
          }
        }
      } catch (error) {
        confirmLoding.value = false
      }
      confirmLoding.value = false
    },
  ]

  // 删除规则
  const deleteRule = (data) => {
    if (ruleList.value.length < 2) return
    tipData.value = {
      title: t('analysis.deleteRule'),
      iconType: 3,
      text: t('analysis.deleteRuleMsg', [data.eventScreenName]),
      params: { ...data },
      type: 'deleteRule',
    }
    tipDialogVisible.value = true
  }

  // 删除事件分组
  const deleteGroup = (data, index) => {
    tipData.value = {
      title: t('analysis.deleteGroup'),
      iconType: 3,
      text: t('analysis.deleteGroupMsg', [data.name, data?.children?.length]),
      params: { ...data },
      type: 'deleteGroup',
    }
    tipDialogVisible.value = true
  }

  // 删除规则/事件分组处理
  const confirmOperation = {
    deleteRule: async () => {
      const { params } = tipData.value
      if (!params?.eventScreenId) return
      const appId = sessionStorage.getItem('appId')
      const datas = {
        appId,
        eventScreenId: params.eventScreenId,
      }
      try {
        const res = await deleteRuleRequest(datas)
        if (res.code === 200) {
          tipDialogVisible.value = false
          ElMessage({
            message: t('common.deleteSuccessfully'),
            type: 'success',
          })
          await getRuleList()
          eventStore.getEventRules(appId)
          // 如果是当前选中的规则
          if (params.eventScreenId === activeRule.value?.eventScreenId) {
            setRuleSelected(
              ruleList.value.length > 0 ? { ...ruleList.value[0] } : {}
            )
          }
          if (params.eventScreenId === eventStore.ruleId) {
            await eventStore.getUsedEventRule(sessionStorage.getItem('appId'))
          }
        }
      } catch (error) {
        confirmLoding.value = false
      }
      confirmLoding.value = false
    },
    deleteGroup: async () => {
      ElMessage({
        message: t('common.deleteSuccessfully'),
        type: 'success',
      })
      const { params } = tipData.value
      const currentIndex = list.value.findIndex((el) => el.id === params.id)
      const defaultIndex = list.value.findIndex((el) => el.id === -1)
      if (defaultIndex > -1 && currentIndex > -1) {
        if (Array.isArray(params.children)) {
          const defaultChildren = JSON.parse(
            JSON.stringify(list.value[defaultIndex].children)
          )
          const currentChildren = JSON.parse(JSON.stringify(params.children))
          list.value[defaultIndex].children = [
            ...defaultChildren,
            ...currentChildren,
          ]
          list.value.splice(currentIndex, 1)
        }
      }
      confirmLoding.value = false
      tipDialogVisible.value = false
    },
  }

  // TipDialog 展示数据
  const tipDialogVisible = ref(false)
  const confirmLoding = ref(false)
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

  const tipDialogSubmit = () => {
    if (['deleteRule', 'deleteGroup'].includes(tipData.value.type)) {
      confirmLoding.value = true
      confirmOperation[tipData.value.type]()
    }
  }

  // 编辑状态标识
  const isEdit = ref(false)
  //开启编辑状态
  const setEdit = () => {
    isEdit.value = true
  }
  // 编辑事件分组名称
  const editGroupName = (index) => {
    list.value[index].editable = true
    list.value[index].editName = list.value[index].name
  }
  const confirmGroupName = (index) => {
    const editName = list.value[index]?.editName?.trim()
    if (!editName) {
      ElMessage({
        message: t('rules.groupNameNotEmpty'),
        type: 'warning',
      })
      return
    }
    if (editName?.length > 24) {
      ElMessage({
        message: t('rules.groupNameLength'),
        type: 'warning',
      })
      return
    }
    const id = list.value[index].id
    const find = list.value.find((el) => el.name == editName && el.id != id)
    if (find) {
      ElMessage({
        message: t('rules.groupNameExists', [editName]),
        type: 'warning',
      })
      return
    }
    list.value[index].name = editName
    list.value[index].editable = false
  }
  const cancelGroupName = (index) => {
    list.value[index].editName = ''
    list.value[index].editable = false
  }

  // 添加事件分组
  const addGroup = () => {
    const ids = list.value.map((item) => item.id).filter((el) => el > 0)
    const newId = ids.length > 0 ? Math.max(...ids) + 1 : 1
    list.value.push({
      id: newId,
      name: `${t('analysis.group')}${newId}`,
      editable: false,
      editName: '',
      children: [],
    })
    // 滚动到最底部
    nextTick(() => {
      const el = document.querySelector('.group-container>div')
      el.scrollIntoView({ behavior: 'smooth', block: 'end' })
    })
  }
  // 重置规则分组
  const resetGroup = () => {
    let temp = []
    list.value.forEach((item) => {
      if (Array.isArray(item.children)) {
        temp = [...temp, ...item.children]
      }
    })
    list.value = [
      {
        id: -1,
        name: t('analysis.defaultGroup'),
        editable: false,
        editName: '',
        children: [...temp],
      },
    ]
  }
  // 退出编辑
  const exitEdit = () => {
    resetEditStatus()
    setRuleSelected({ ...activeRule.value })
  }
  // 重置数据状态
  const resetEditStatus = () => {
    for (let i = 0; i < list.value.length; i++) {
      if (list.value[i].editable) {
        list.value[i].editable = false
      }
    }
    isEdit.value = false
  }
  const rightLoading = ref(false)
  // 使用当前选中规则
  const useRule = async () => {
    const eventScreenId = activeRule.value?.eventScreenId
    if (!eventScreenId) return
    rightLoading.value = true
    try {
      const res = await useGroupRuleRequest({
        appId: sessionStorage.getItem('appId'),
        eventScreenId: eventScreenId,
        userId: userInfo.value.userId,
      })
      if (res.code === 200) {
        ElMessage({
          message: t('analysis.successfullyApplyRule'),
          type: 'success',
        })
        await eventStore.getUsedEventRule(sessionStorage.getItem('appId'))
        dialogVisible.value = false
      }
    } catch (error) {
      rightLoading.value = false
    }
    rightLoading.value = false
  }
  // 保存（保存并使用）规则 type:1,保存; 2,保存并使用
  const saveRule = async (type = 1) => {
    if (list.value.length == 0) return
    const dataJson = []
    const groupNames = {}
    list.value.forEach((group, index) => {
      const temp = {
        eventGroupName:
          group.name === t('analysis.defaultGroup') ? '默认分组' : group.name,
        orderNum: index,
        eventList: [],
      }
      if (groupNames[group.name]) {
        groupNames[group.name] += 1
      } else {
        groupNames[group.name] = 1
      }
      if (Array.isArray(group.children)) {
        group.children.forEach((item, idx) => {
          temp.eventList.push({ ...item, orderNum: idx })
        })
      }
      dataJson.push(temp)
    })
    // 判断分组名称是否重复
    for (const key in groupNames) {
      if (!key) {
        ElMessage({
          message: t('rules.groupNameNotEmpty'),
          type: 'warning',
        })
        return
      }
      if (key.length > 24) {
        ElMessage({
          message: t('rules.groupNameLength'),
          type: 'warning',
        })
        return
      }
      if (groupNames[key] > 1) {
        ElMessage({
          message: t('rules.ruleGroupNameExists', [key]),
          type: 'warning',
        })
        return
      }
    }
    const appId = sessionStorage.getItem('appId')
    const data = {
      appId,
      eventScreenId: activeRule.value.eventScreenId,
      eventGroupJson: JSON.stringify(dataJson),
      eventScreenName: activeRule.value.eventScreenName,
      globalDefault: isGlobal.value && userInfo.value.type === 2 ? 2 : 1, // 自定义全局默认设置 1 否 2 是
      screenType: isOpen.value ? 2 : 1, //1 不公开 2 公开
      userId: userInfo.value.userId,
    }
    // type: 1,保存; 2,保存并使用
    let requestUrl = type === 2 ? saveUseEventRule : saveEventRule
    rightLoading.value = true
    try {
      const res = await requestUrl(data)
      if (res.code === 200) {
        ElMessage({
          message:
            type === 2
              ? t('analysis.successfullySavedUsed')
              : t('analysis.report.successfullySaved'),
          type: 'success',
        })
        await getRuleList()
        eventStore.getEventRules(appId)
        // 设置保存的规则为选中规则
        const find = ruleList.value.find((el) => el.eventScreenId === res.data)
        if (find && Object.keys(find).length > 0) {
          setRuleSelected({ ...find })
        }
        if (type === 2) {
          await eventStore.getUsedEventRule(appId)
          dialogVisible.value = false
        }
        resetEditStatus()
      }
    } catch (error) {
      rightLoading.value = false
    }
    rightLoading.value = false
  }
  // 分组管理的el-dialog 关闭的回调
  const eventGroupDialogClose = async () => {
    isOpen.value = false
    isGlobal.value = false
    resetEditStatus()
    activeRule.value = {}
    await eventStore.getEventGroup(eventStore.ruleId)
  }
  return {
    userInfo,
    list,
    dialogVisible,
    showDialog,
    isOpen,
    isGlobal,
    tipDialogVisible,
    confirmLoding,
    tipDialogClose,
    selectedRule,
    showTitle,
    ruleOperation,
    addRule,
    editRuleName,
    copyRule,
    deleteRule,
    commonDialogVisible,
    formRules,
    formData,
    ruleFormRef,
    commonDialogClose,
    ruleSubmit,
    isEdit,
    setEdit,
    editGroupName,
    confirmGroupName,
    cancelGroupName,
    deleteGroup,
    addGroup,
    resetGroup,
    exitEdit,
    ruleList,
    leftLoading,
    activeRule,
    operatingRule,
    tipData,
    tipDialogSubmit,
    eventGroupDialogClose,
    useRule,
    saveRule,
    rightLoading,
    currentRule,
  }
}
