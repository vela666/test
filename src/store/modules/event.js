import { defineStore } from 'pinia'
import { reactive, ref, computed, watch } from 'vue'
import {
  getAllRuleList,
  getCurrentUsedRule,
  getEventList,
  useGroupRuleRequest,
  getEventRuleById,
} from '@/api/modules/event-group'
import { cloneDeep } from 'lodash-es'
import useUserStore from './user'
import { t } from '@/locales/i18n'
const useEventStore = defineStore('event', () => {
  const userStore = useUserStore()
  const eventRules = ref(null)
  const ruleId = ref(null)
  const allEvents = ref([])
  const eventGroups = ref([])
  const currentEventList = computed(() => {
    let res = []
    for (const item of eventGroups.value) {
      if (Array.isArray(item?.eventList)) {
        res = [...res, ...item.eventList]
      }
    }
    return res
  })
  // 获取当前应用下的事件分组规则
  async function getEventRules(appId) {
    if (appId) {
      try {
        const res = await getAllRuleList({ appId })
        if (res.code === 200 && res.data) {
          eventRules.value = cloneDeep(res.data)
        }
      } catch (error) {
        console.log(error)
      }
    } else {
      eventRules.value = null
    }
  }
  // 获取当前应用的事件分组规则
  async function getUsedEventRule(appId) {
    if (appId) {
      try {
        const res = await getCurrentUsedRule({ appId })
        if (res.code === 200) {
          ruleId.value = res.data?.eventScreenId
          if (!ruleId.value) {
            // 没有选中规则，就取第一组 默认规则
            const temp = eventRules.value?.customGroupRuleList
            if (Array.isArray(temp)) {
              const find = temp[0]
              if (find) {
                ruleId.value = find.eventScreenId
              }
            }
          }
        }
      } catch (error) {
        console.log(error)
      }
    } else {
      ruleId.value = null
    }
  }
  // 获取当前应用下的所有事件
  async function getAllEvents(appId) {
    if (appId) {
      try {
        const res = await getEventList({ appId })
        if (res.code === 200 && Array.isArray(res.data)) {
          allEvents.value = res.data
        }
      } catch (error) {
        console.log(error)
      }
    } else {
      allEvents.value = []
    }
  }
  // 获取事件相关的数据 allEvents、eventRules、ruleId
  async function getEventsAbout(appId) {
    await getAllEvents(appId)
    await getEventRules(appId)
    await getUsedEventRule(appId)
    await getEventGroup(ruleId.value)
  }
  /**
   * @description 使用规则
   * @param {number} eventScreenId 事件分组筛选规则id
   */
  async function useEventRule(eventScreenId) {
    try {
      const res = await useGroupRuleRequest({
        appId: sessionStorage.getItem('appId'),
        eventScreenId: eventScreenId,
        userId: userStore.userInfo.userId,
      })
      if (res.code === 200) {
        await getUsedEventRule(sessionStorage.getItem('appId'))
      }
    } catch (error) {
      console.log(error)
    }
  }
  //根据事件分组规则设置事件分组
  async function getEventGroup(ruleId) {
    if (ruleId) {
      try {
        const res = await getEventRuleById({
          appId: sessionStorage.getItem('appId'),
          eventScreenId: ruleId,
          userId: userStore.userInfo.userId,
        })
        if (res.code === 200 && res.data) {
          eventGroupSet(res.data)
        }
      } catch (error) {
        console.log(error)
      }
    } else {
      eventGroups.value = []
    }
  }
  // 根据分组规则设置当前的事件分组
  function eventGroupSet(ruleInfo) {
    if (!ruleInfo?.eventGroupJson) {
      //设置 默认规则 分组
      eventGroups.value = [
        {
          eventGroupName: t('analysis.defaultGroup'),
          eventList: [...allEvents.value],
        },
      ]
      return
    }
    const eventsMap = new Map()
    for (const el of allEvents.value) {
      eventsMap.set(el.eventId, el)
    }
    const jsonData = JSON.parse(ruleInfo.eventGroupJson)
    if (!Array.isArray(jsonData)) return
    const groupList = []
    for (const group of jsonData) {
      const temp = {
        eventGroupName: group.eventGroupName,
        eventList: [],
      }
      if (
        Array.isArray(group.eventList) &&
        group.eventGroupName !== '默认分组'
      ) {
        for (const el of group.eventList) {
          const eventItem = eventsMap.get(el.eventId)
          if (eventItem) {
            temp.eventList.push({ ...eventItem })
            eventsMap.delete(el.eventId)
          }
        }
      }
      groupList.push(temp)
    }
    // 用剩下的事件装填默认分组
    const fIndex = groupList.findIndex((el) => el.eventGroupName === '默认分组')
    if (fIndex > -1) {
      groupList[fIndex].eventList = [...eventsMap.values()]
    }
    groupList.forEach((item) => {
      if (item.eventGroupName === '默认分组') {
        item.eventGroupName = t('analysis.defaultGroup')
      }
    })
    eventGroups.value = cloneDeep(groupList)
  }
  watch(ruleId, async (val) => {
    await getEventGroup(val)
  })
  return {
    allEvents,
    ruleId,
    eventRules,
    eventGroups,
    currentEventList,
    getEventRules,
    getUsedEventRule,
    getAllEvents,
    getEventsAbout,
    useEventRule,
    getEventGroup,
  }
})
export default useEventStore
