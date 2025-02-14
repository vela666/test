<script setup>
import { cloneDeep, isEmpty } from 'lodash-es'
import { ref, computed, watch, nextTick } from 'vue'
import { useScroll } from '@vueuse/core'
import { v4 as uuidv4 } from 'uuid'
import { anchorPointScrollHandler, descShowHandler } from '@/utils'
import useEventStore from '@/store/modules/event'
import { eventTypeListMap } from '@/enumeration/data-management/event'
import { paramKey } from '@/enumeration'
import { createPopper } from '@popperjs/core'
defineOptions({
  name: 'IndexSelectMultiple',
})
const props = defineProps({
  modelValue: {
    type: Array,
    default: () => [],
  },
  maxCount: {
    type: Number,
    default: 10,
  },
})
const emit = defineEmits(['change', 'update:modelValue'])
const eventStore = useEventStore()

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

const groupList = computed(() => {
  const temp = []
  const groups = eventStore.eventGroups
  for (const item of groups) {
    temp.push({
      id: uuidv4(),
      ...item,
      count: Array.isArray(item.eventList) ? item.eventList.length : 0,
    })
  }
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
      const ele = document.querySelector('.is-selected')
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

const checkedList = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

const checkAll = ref(false)
const isIndeterminate = ref(false)

/**
 * @description: 全选
 * @return {*}
 */
const handleCheckAllChange = (val) => {
  isIndeterminate.value = false

  const totalEvent = groupList.value.reduce((pre, next) => {
    pre.push(...next.eventList.filter((el) => el.permissionStatus !== false))
    return pre
  }, [])
  const checkedData = val ? totalEvent.slice(0, props.maxCount) : []
  checkedList.value = checkedData
  // handleCheckChange(checkedData)
}

watch(checkedList, (val) => {
  const totalEvent = groupList.value.reduce((pre, next) => {
    pre.push(...next.eventList)
    return pre
  }, [])
  checkAll.value =
    val.length > 0 &&
    (val.length === props.maxCount || totalEvent.length === val.length)
  isIndeterminate.value =
    val.length > 0 &&
    val.length < props.maxCount &&
    totalEvent.length !== val.length

  emit('change', val)
})
/**
 * @description: 选中触发的方法
 * @return {*}
 * @param {*} val
 */
const handleCheckChange = (val) => {
  // const totalEvent = groupList.value.reduce((pre, next) => {
  //   pre.push(...next.eventList)
  //   return pre
  // }, [])
  // checkAll.value =
  //   val.length > 0 &&
  //   (val.length === props.maxCount || totalEvent.length === val.length)
  // isIndeterminate.value =
  //   val.length > 0 &&
  //   val.length < props.maxCount &&
  //   totalEvent.length !== val.length
  // emit('change', val)
}

const allSelectedDisabled = computed(() => {
  return (
    eventStore.allEvents.filter((el) => el.permissionStatus !== false)
      .length === 0
  )
})
</script>

<template>
  <div class="eas-index-select">
    <el-dropdown
      trigger="click"
      placement="bottom-start"
      popper-class="eas-index-popper"
      @visible-change="visibleChange"
      ref="indexSelector">
      <div :class="['eas-drop-box', { 'active-border': showMenu }]">
        {{ $t('user.event') }}({{ checkedList.length }})
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
              <el-checkbox-group
                v-model="checkedList"
                @change="handleCheckChange">
                <div
                  class="event-data"
                  v-for="item in searchContent"
                  :key="`search-content_${item.id}`">
                  <div class="event-data__title" v-showTips>
                    {{ item.eventGroupName }}
                  </div>
                  <div class="event-data-list">
                    <div
                      :class="['event-data-item']"
                      v-for="data in item?.eventList"
                      :key="`event_item_${data.eventId}`"
                      @mouseenter="showDesc($event, data)">
                      <div class="flex-center" style="width: 100%">
                        <el-checkbox
                          :label="data"
                          :value="data"
                          :disabled="
                            data.permissionStatus === false ||
                            (checkedList.length >= maxCount &&
                              !checkedList.some(
                                (item) => item.eventId === data.eventId
                              ))
                          ">
                          <div class="flex-center">
                            <div class="event-title" v-showTips>
                              {{ data.eventNameZh }}
                            </div>
                            <div class="event-type">
                              {{ eventTypeListMap[data.eventType] }}
                            </div>
                          </div>
                        </el-checkbox>
                      </div>
                    </div>
                  </div>
                </div>
              </el-checkbox-group>
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
              <div class="right__container">
                <div class="pl10 pr10 flex-center flex-between">
                  <el-checkbox
                    v-model="checkAll"
                    :indeterminate="isIndeterminate"
                    @change="handleCheckAllChange"
                    :disabled="allSelectedDisabled">
                    {{ $t('common.selectAll') }}
                  </el-checkbox>
                  <span class="fz14">
                    {{ $t('common.selected') }}
                    <span style="color: var(--eas-color-primary)">
                      {{ checkedList.length }}
                    </span>
                    {{ $t('common.pcs') }}
                  </span>
                </div>
                <div class="index-box-body__right" ref="scrollRef">
                  <el-checkbox-group
                    v-model="checkedList"
                    @change="handleCheckChange">
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
                          :class="['event-data-item']"
                          v-for="data in item?.eventList"
                          :key="`event_item_${data.eventId}`"
                          @mouseenter="showDesc($event, data)">
                          <div class="flex-center" style="width: 100%">
                            <el-checkbox
                              :label="data"
                              :value="data"
                              :disabled="
                                data.permissionStatus === false ||
                                (checkedList.length >= maxCount &&
                                  !checkedList.some(
                                    (item) => item.eventId === data.eventId
                                  ))
                              ">
                              <div class="flex-center">
                                <div class="event-title" v-showTips>
                                  {{ data.eventNameZh }}
                                </div>
                                <div class="event-type">
                                  {{ eventTypeListMap[data.eventType] }}
                                </div>
                              </div>
                            </el-checkbox>
                          </div>
                        </div>
                      </div>
                    </div>
                  </el-checkbox-group>
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
                <svg-icon
                  name="share"
                  @click="
                    $router.push({
                      path: '/data-management/event',
                      query: { [paramKey]: hoverItem.eventName },
                    })
                  " />
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

.right__container {
  display: flex;
  flex-direction: column;
  width: 100%;
  color: var(--eas-text-color-primary);
}
.index-box-body__right {
  // width: calc(100% - 141px);
  margin: 0px 0px 10px 10px;
  padding-right: 10px;
  overflow: auto;
  display: flex;
  flex-direction: column;
}
.event-data {
  .el-checkbox {
    width: 100%;
  }
  :deep() {
    .el-checkbox__label {
      flex: 1;
      color: var(--eas-text-color-primary);
    }
    .el-checkbox.is-checked {
      .event-title {
        color: var(--eas-color-primary);
      }
    }
  }
  &:not(:last-child) {
    margin-bottom: 10px;
  }
  &__title {
    max-width: 400px;
    padding-left: 10px;
    position: relative;
    font-size: var(--eas-font-size-small);
    font-weight: bold;
    // color: var(--eas-text-color-primary);
    height: 20px;
    display: flex;
    color: var(--eas-text-color-light-1);
    align-items: center;
    /* &::after {
      content: '';
      // top: 2px;
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
    padding: 0 10px;
    font-size: var(--eas-font-size-base);
    border-radius: var(--eas-border-radius-4);
    cursor: pointer;
    &:not(:last-child) {
      margin-bottom: 4px;
    }
    &:hover:not(.is-selected) {
      background-color: var(--eas-hover-color);
    }
  }
}
.event-title {
  width: 318px;
  // color: var(--eas-text-color-primary);
  flex: 1;
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
