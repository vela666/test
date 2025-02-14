<script setup>
import { cloneDeep, isObject, isEmpty } from 'lodash-es'
import { ref, computed, watch, nextTick, inject, toRef } from 'vue'
import { useScroll } from '@vueuse/core'
import { v4 as uuidv4 } from 'uuid'
import { anchorPointScrollHandler, descShowHandler } from '@/utils'
import useEventStore from '@/store/modules/event'
import { eventTypeListMap } from '@/enumeration/data-management/event'
import { paramKey } from '@/enumeration'
import { useRouter } from 'vue-router'
import { getHideFieldInfo } from '@/api/modules/analysis/common.js'
import { createPopper } from '@popperjs/core'
import { t } from '@/locales/i18n'

defineOptions({
  name: 'IndexSelect',
})
const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({}),
  },
  anyEvent: {
    type: Boolean,
    default: false,
  },
  filtEventType: {
    type: Array,
    default: () => [],
  },
  // 禁用数据标识 eventId
  disabledIds: {
    type: Array,
    default: () => [],
  },
})
const appId = toRef(inject('appId', sessionStorage.getItem('appId')))
const emit = defineEmits(['change', 'update:modelValue'])
const eventStore = useEventStore()
const isManual = ref(false)

const search = ref('')
// 展示搜索内容
const searchContent = computed(() => {
  const list = []
  for (const group of groupList.value) {
    const temp = {
      id: group.id,
      eventGroupName: group.eventGroupName,
      eventList: [],
    }
    if (Array.isArray(group.eventList)) {
      temp.eventList = group.eventList.filter(
        (item) =>
          item?.eventName
            ?.toLowerCase()
            ?.indexOf(search.value.toLowerCase()) !== -1 ||
          item?.eventNameZh
            ?.toLowerCase()
            ?.indexOf(search.value.toLowerCase()) !== -1
      )
      if (temp.eventList.length) {
        list.push(temp)
      }
    }
  }
  return list
})
watch(search, () => (hoverItem.value = {}))

const indexSelector = ref(null)
const displayName = computed(() => {
  for (const group of groupList.value) {
    if (Array.isArray(group.eventList)) {
      for (const el of group.eventList) {
        if (
          props.modelValue?.eventId === el.eventId ||
          props.modelValue?.eventName === el.eventName
        ) {
          return el.eventNameZh
        }
      }
    }
  }
  return ''
})
const selectedChange = (item) => {
  if (isSameEvent(item) || item.permissionStatus === false || item.disabled)
    return
  indexSelector.value?.handleClose()
  const val = cloneDeep({
    ...props.modelValue,
    ...item,
  })
  isManual.value = true
  emit('update:modelValue', val)
  emit('change', val)
}

const isSameEvent = (attr) => {
  return (
    attr?.eventId === props.modelValue?.eventId ||
    attr?.eventName === props.modelValue?.eventName
  )
}

const groupList = computed(() => {
  const temp = []
  let nums = 0
  let groups = cloneDeep(eventStore.eventGroups)

  if (props.filtEventType.length) {
    groups = groups.map((item) => {
      const eventList = item.eventList.filter(
        (item) => !props.filtEventType.includes(item.eventType)
      )
      return {
        ...item,
        eventList,
      }
    })
  }
  // eventType 1自定义事件，2预置事件, 3虚拟事件
  for (const item of groups) {
    temp.push({
      id: uuidv4(),
      ...item,
      count: Array.isArray(item.eventList) ? item.eventList.length : 0,
    })
    const count =
      (Array.isArray(item.eventList) ? item.eventList : [])?.filter(
        (el) => el.permissionStatus !== false
      )?.length || 0
    nums += count
  }
  if (nums > 0 && props.anyEvent === true) {
    temp.push({
      id: uuidv4(),
      eventGroupName: t('analysis.anyEvent'),
      eventList: [
        {
          eventId: -1,
          eventName: '任意事件',
          eventNameZh: t('analysis.anyEvent'),
        },
      ],
      count: 1,
    })
  }
  const m = (props.disabledIds || [])
    .map((p) => +p)
    .filter((item) => item !== props.modelValue?.eventId)
  temp.forEach((item) => {
    item.eventList.forEach((v) => {
      v.disabled = m.includes(+v.eventId)
    })
  })
  return temp
})
//
let isClick = false
const scrollRef = ref(null)
const activeGroup = ref('')
/**
 * @description 左侧导航栏点击操作
 * @param {*} item
 */
const selectPanelNav = (item) => {
  activeGroup.value = item
  isClick = true
  const ele = document.getElementById(item)
  ele.scrollIntoView({ behavior: 'smooth' })
}

/**
 * @description 区分点击标签和鼠标拖动滚动条
 */
const { isScrolling } = useScroll(scrollRef)
watch(isScrolling, (val) => {
  if (!val && isClick) {
    isClick = false
  }
})

// 滚动条滚动处理
const scrollHandler = () => {
  if (isClick) {
    return
  }
  const links = groupList.value.map((el) => el.id)
  const containerRect = scrollRef.value?.getBoundingClientRect()
  const res = anchorPointScrollHandler(links, containerRect)
  res && (activeGroup.value = res.link)
}

// el-dropdown 收起和展示
const showMenu = ref(false)
const visibleChange = (val) => {
  if (val) {
    nextTick(() => {
      scrollRef.value?.addEventListener('scroll', scrollHandler, true)
      const ele = document.querySelector('.index-box-body__right .is-selected')
      const links = groupList.value.map((el) => el.id)
      if (ele) {
        const container = document.querySelector('.index-box-body__right')
        const top = ele.offsetTop - container.offsetTop - 150
        isClick = true
        scrollRef.value.scrollTo({ top })
        activeGroup.value = ele?.parentElement?.parentElement?.id || links[0]
      }
    })
  } else {
    scrollRef.value?.removeEventListener('scroll', scrollHandler)
    search.value = ''
    hoverItem.value = {}
  }
  showMenu.value = val
}

const hoverItem = ref({})
const easIndexPopverRef = ref()
/**
 * @description 展示事件详情
 */
const showDesc = (e, item) => {
  hoverItem.value = { ...item }
  createPopper(e.target, easIndexPopverRef.value, {
    placement: 'right',
    modifiers: [
      {
        name: 'flip',
        options: {
          fallbackPlacements: ['top', 'right'],
        },
      },
      {
        name: 'offset',
        options: {
          offset: [0, 22],
        },
      },
      {
        name: 'preventOverflow',
        options: {
          padding: 8,
        },
      },
    ],
  })
}

const router = useRouter()
// 跳转到事件管理页面
const goTo = (hoverItem) => {
  const routeData = router.resolve({
    path: `/data-management/event?virtualAppId=${sessionStorage.getItem('appId')}`,
    query: { [paramKey]: hoverItem.eventName },
  })
  window.open(routeData.href, '_blank')
}

async function searchEventStatus(val) {
  const allEvents = groupList.value.reduce((acc, cur) => {
    return [].concat(acc, cloneDeep(cur.eventList))
  }, [])
  const find = allEvents.find(
    (el) => el.eventId == val.eventId || el.eventName == val.eventName
  )
  if (!find) {
    //查找不存在的事件
    try {
      const res = await getHideFieldInfo([
        {
          appId: appId.value || sessionStorage.getItem('appId'),
          field: val.eventName,
          type: 0,
        },
      ])
      if (res.code === 200 && res.data) {
        const resData = res.data?.[0]
        const eventData = {
          ...val,
          eventName: val.eventName,
          eventNameZh: resData?.fieldDisplayName || val.eventNameZh,
          permissionStatus: resData.status === 0,
        }
        if (resData?.dataId) {
          eventData['eventId'] = resData.dataId
        }
        isManual.value = true
        emit('update:modelValue', eventData)
      }
    } catch (error) {
      console.log(error)
    }
    return false
  } else if (find?.permissionStatus === false) {
    isManual.value = true
    emit('update:modelValue', {
      ...val,
      permissionStatus: find.permissionStatus,
    })

    return false
  }
  return true
}

watch(
  () => props.modelValue,
  async (val) => {
    if (isObject(val) && Object.keys(val).length > 0) {
      if (!isManual.value) {
        const status = await searchEventStatus(val)
        if (!status) return
      }
      isManual.value = false
    }
  },
  { deep: true, immediate: true }
)
</script>

<template>
  <div class="eas-index-select">
    <el-dropdown
      trigger="click"
      placement="bottom-start"
      popper-class="eas-index-popper"
      @visible-change="visibleChange"
      ref="indexSelector">
      <div
        :class="[
          'eas-drop-box',
          { 'active-border': showMenu },
          { 'no-permission': modelValue?.permissionStatus === false },
        ]">
        {{ displayName || modelValue.eventNameZh }}
      </div>
      <template #dropdown>
        <div class="eas-drop-panel">
          <div class="index-box-top">
            <div class="rule-select" v-if="!search">
              <EventRuleSelect />
            </div>
            <CommonInput
              v-model="search"
              :class="['index-box-search', { 'no-search-val': search == '' }]"
              :desc="$t('analysis.searchEventOrDisplay')" />
          </div>
          <div class="index-box-body" v-if="showMenu">
            <div v-if="search" class="search-content">
              <div
                class="event-data"
                v-for="item in searchContent"
                :key="`search-content_${item.id}`">
                <div class="event-data__title" v-showTips>
                  {{ item.eventGroupName }}
                </div>
                <div class="event-data-list">
                  <div
                    :class="[
                      'event-data-item',
                      {
                        'is-selected': isSameEvent(data),
                      },
                      {
                        'no-permission':
                          data.permissionStatus === false || data.disabled,
                      },
                    ]"
                    v-for="data in item?.eventList"
                    :key="`event_item_${data.eventId}`"
                    @mouseenter="showDesc($event, data)"
                    @click="selectedChange(data)">
                    <div class="event-title" v-showTips>
                      {{ data.eventNameZh }}
                    </div>
                    <div class="event-type">
                      {{ eventTypeListMap[data.eventType] }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <template v-else>
              <div class="index-box-body__left">
                <div class="index-group__nav">
                  <div
                    :class="['nav-item', { active: activeGroup == item.id }]"
                    v-for="item in groupList"
                    :key="item.id"
                    @click="selectPanelNav(item.id)">
                    <div v-showTips class="nav-item__tilte">
                      {{ item.eventGroupName }}
                    </div>
                    <div class="nav-item__count">{{ item.count }}</div>
                  </div>
                </div>
                <div class="index-group__cfg">
                  <EventGroupConfig />
                </div>
              </div>
              <div class="index-box-body__right" ref="scrollRef">
                <div
                  class="event-data"
                  v-for="item in groupList"
                  :key="`event_${item.id}`"
                  :id="item.id">
                  <div class="event-data__title" v-showTips>
                    {{ item.eventGroupName }}
                  </div>
                  <div class="event-data-list">
                    <div
                      :class="[
                        'event-data-item',
                        {
                          'is-selected': isSameEvent(data),
                        },
                        {
                          'no-permission':
                            data.permissionStatus === false || data.disabled,
                        },
                      ]"
                      v-for="data in item?.eventList"
                      :key="`event_item_${data.eventId}`"
                      @mouseenter="showDesc($event, data)"
                      @click="selectedChange(data)">
                      <div class="event-title" v-showTips>
                        {{ data.eventNameZh }}
                      </div>
                      <div class="event-type">
                        {{ eventTypeListMap[data.eventType] }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </div>
          <div
            ref="easIndexPopverRef"
            v-show="!isEmpty(hoverItem)"
            class="eas-index-popver">
            <div class="popver-info-item">
              <div class="popver-info-item__left">
                {{ hoverItem.eventNameZh || $t('analysis.eventDisplayName') }}
              </div>
              <div
                class="popver-info-item__right"
                v-if="hoverItem?.eventType !== undefined">
                <el-tooltip
                  effect="dark"
                  :content="$t('common.viewDetail')"
                  placement="top"
                  :hide-after="0">
                  <div style="display: inline-flex">
                    <svg-icon name="share" @click="goTo(hoverItem)" />
                  </div>
                </el-tooltip>
              </div>
            </div>
            <div class="attribute-en-name">
              {{ hoverItem.eventName || 'eventName' }}
            </div>
            <div class="attribute-other">
              <div class="attribute-category">
                {{ eventTypeListMap[hoverItem.eventType] }}
              </div>
            </div>
            <div class="attribute-remark">
              {{ $t('common.remark') }}：{{ hoverItem.eventDesc || '--' }}
            </div>
          </div>
        </div>
      </template>
    </el-dropdown>
  </div>
</template>

<style scoped lang="scss">
.active-border {
  border-color: var(--eas-color-primary);
}
.eas-index-select {
  display: inline-block;
  margin-right: 8px;
}
.eas-drop-panel {
  width: 620px;
  height: 420px;
  .index-box-search {
    :deep(.el-input__wrapper) {
      box-shadow: none;
      padding: 5px 10px;
    }
  }
}
.index-box-top {
  display: flex;
  align-items: center;
  width: 100%;
}
.rule-select {
  width: 141px;
  height: 40px;
  border-right: 1px solid var(--eas-border-color);
}
.index-box-search {
  &.no-search-val {
    width: calc(100% - 141px);
  }
}
.index-box-body {
  width: 100%;
  height: calc(100% - 40px);
  display: flex;
  border-top: 1px solid var(--eas-border-color);
}
.index-box-body__left {
  height: 100%;
  width: 141px;
  border-right: 1px solid var(--eas-border-color);
}
.index-group__nav {
  width: 140px;
  height: calc(100% - 40px);
  overflow-y: auto;
}
.nav-item {
  width: 100%;
  height: 40px;
  display: flex;
  position: relative;
  padding: 11px 8px 10px 10px;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  &.active {
    &::after {
      content: '';
      top: 0px;
      left: 0px;
      position: absolute;
      width: 4px;
      height: 100%;
      background-color: var(--eas-color-primary);
      border-radius: var(--eas-border-radius);
    }
    background-color: var(--eas-color-primary-light-1);
    .nav-item__tilte {
      color: var(--eas-color-primary);
    }
  }
  &:hover:not(.active) {
    background-color: var(--eas-hover-color);
  }
  &__tilte {
    font-size: var(--eas-font-size-base);
    color: var(--eas-text-color-primary);
    max-width: 94px;
  }
  &__count {
    width: 20px;
    height: 16px;
    padding: 0px 3px;
    line-height: 16px;
    text-align: center;
    font-size: var(--eas-font-size-small);
    color: var(--eas-text-color-light);
    background-color: var(--eas-hover-color-1);
  }
}
.index-group__cfg {
  width: 140px;
  height: 40px;
  color: var(--eas-text-color-primary);
  border-top: 1px solid var(--eas-border-color);
  &:hover {
    color: var(--eas-color-primary);
  }
}
.index-box-body__right {
  width: calc(100% - 141px);
  margin: 10px 0px 10px 10px;
  padding-right: 10px;
  overflow: auto;
}
.event-data {
  &:not(:last-child) {
    margin-bottom: 10px;
  }
  &__title {
    max-width: 400px;
    padding-left: 10px;
    position: relative;
    font-size: var(--eas-font-size-small);
    font-weight: bold;
    color: var(--eas-text-color-light-1);
    /* &::after {
      content: '';
      top: 2px;
      left: 0px;
      position: absolute;
      width: 4px;
      height: 16px;
      background-color: var(--eas-color-primary);
      border-radius: 3px;
    }*/
  }
  &-list {
    margin-top: 9px;
  }
  &-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 32px;
    padding: 7px 10px 6px;
    font-size: var(--eas-font-size-base);
    border-radius: var(--eas-border-radius-4);
    cursor: pointer;
    &:not(:last-child) {
      margin-bottom: 4px;
    }
    &:hover:not(.is-selected) {
      background-color: var(--eas-hover-color);
    }
    &.no-permission {
      cursor: not-allowed;
      .event-title,
      .event-type {
        color: var(--eas-text-color-light-1);
      }
    }
  }
}
.event-title {
  width: 318px;
  color: var(--eas-text-color-primary);
}
.event-type {
  font-size: 12px;
  color: var(--eas-text-color-light);
}
.is-selected {
  background-color: var(--eas-color-primary-light-1);
  .event-title {
    color: var(--eas-color-primary);
  }
}
.search-content {
  width: calc(100% - 10px);
  margin: 10px 0px 10px 10px;
  padding-right: 10px;
  overflow: auto;
}
</style>
