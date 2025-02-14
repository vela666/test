<script setup>
import { ref, computed } from 'vue'
import { ArrowDown } from '@element-plus/icons-vue'
import useEventStore from '@/store/modules/event'
import { cloneDeep } from 'lodash-es'
import { t } from '@/locales/i18n'
defineOptions({
  name: 'EventRuleSelect',
})

const eventStore = useEventStore()
const eventRuleSelect = ref(null)
const visibleChange = (val) => {
  visible.value = val
}
const visible = ref(false)
// 选择(使用规则)规则
const ruleSelected = (item) => {
  if (!item?.eventScreenId || item.eventScreenId === ruleId.value) {
    return
  }
  eventStore.useEventRule(item.eventScreenId)
  eventRuleSelect.value?.handleClose()
}
// 判断是否选中
const isSlected = (item) => {
  return item.eventScreenId === ruleId.value
}
const ruleId = computed(() => eventStore.ruleId)
// 规则列表（自己创建的和他人创建的）
const ruleList = computed(() => {
  const data = cloneDeep(eventStore.eventRules)
  if (Array.isArray(data?.customGroupRuleList)) {
    // 默认规则 名称国际化
    data.customGroupRuleList.forEach((item) => {
      if (item.eventScreenName === '默认规则') {
        item.eventScreenName = t('analysis.defaultRule')
      }
    })
    // 添加默认规则
    /* const findIndex = data.customGroupRuleList.findIndex(
      (el) => el.eventScreenName === '默认规则'
    )
    if (findIndex > -1) {
      const temp = cloneDeep(data.customGroupRuleList[findIndex])
      data.customGroupRuleList.splice(findIndex, 1)
      data.customGroupRuleList.unshift(temp)
    } */
  }
  return data
})
const ruleListMap = computed(() => {
  const listMap = {}
  if (Array.isArray(ruleList.value?.customGroupRuleList)) {
    ruleList.value.customGroupRuleList.forEach((element) => {
      listMap[element.eventScreenId] = element.eventScreenName
    })
  }
  if (Array.isArray(ruleList.value?.publicGroupRuleList)) {
    ruleList.value.publicGroupRuleList.forEach((element) => {
      listMap[element.eventScreenId] = element.eventScreenName
    })
  }
  return listMap
})
// 选中规则显示名称
const displayName = computed(() => {
  return ruleListMap.value?.[ruleId.value]
})
</script>

<template>
  <el-dropdown
    trigger="click"
    placement="bottom-start"
    @visible-change="visibleChange"
    popper-class="event-rule-select-popper"
    :teleported="false"
    ref="eventRuleSelect">
    <div class="event-rule-panel">
      <span v-showTips class="event-rule-label">{{ displayName }}</span>
      <el-icon :class="['event-rule-icon', visible ? 'is-rotate' : '']">
        <ArrowDown />
      </el-icon>
    </div>
    <template #dropdown>
      <div class="event-rule-menu">
        <div class="rule-group">
          <div class="rule-title">{{ $t('analysis.createdByMe') }}</div>
          <div class="rule-list">
            <div
              class="rule-item"
              v-for="item in ruleList?.customGroupRuleList"
              :key="`my_item_${item.eventScreenId}`"
              @click="ruleSelected(item)">
              <div
                v-showTips
                :class="[
                  'rule-item__title',
                  {
                    'is-selected': isSlected(item),
                  },
                ]">
                {{ item.eventScreenName }}
              </div>
            </div>
          </div>
        </div>
        <div class="rule-group mt5">
          <div class="rule-title bt">{{ $t('analysis.publicByOthers') }}</div>
          <div class="rule-list">
            <div
              class="rule-item"
              v-for="item in ruleList?.publicGroupRuleList"
              :key="`other_item_${item.eventScreenId}`"
              @click="ruleSelected(item)">
              <div
                v-showTips
                :class="[
                  'rule-item__title2',
                  {
                    'is-selected': isSlected(item),
                  },
                ]">
                {{ item.eventScreenName }}
              </div>
              <div class="rule-owner" v-showTips>{{ item.creator }}</div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </el-dropdown>
</template>

<style scoped lang="scss">
.event-rule-panel {
  display: flex;
  align-items: center;
  width: 140px;
  height: 40px;
  padding: 10px;
  color: var(--eas-text-color-primary);
  cursor: pointer;
}
.event-rule-label {
  max-width: 94px;
  margin-right: 16px;
  font-size: var(--eas-font-size-base);
}
.event-rule-icon {
  transition: all 0.3s;
  color: var(--eas-text-color-light);
}
.is-rotate {
  transform: rotate(-180deg);
}
.event-rule-menu {
  width: 270px;
  height: 270px;
  background: #fff;
  box-shadow: 0 3px 10px 1px rgba(28, 32, 40, 0.18);
  border-radius: var(--eas-border-radius-4);
  padding: 14px 4px;
  overflow-y: auto;
}
.rule-title {
  margin: 0 7px 8px 7px;
  font-size: var(--eas-font-size-small);
  color: var(--eas-hover-color-3);
  &.bt {
    padding-top: 14px;
    border-top: 1px solid var(--eas-hover-color-4);
  }
}
.rule-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 40px;
  padding: 10px 7px;
  font-size: var(--eas-font-size-base);
  color: var(--eas-text-color-primary);
  cursor: pointer;
  &:hover {
    background-color: var(--eas-hover-color);
  }
}
.rule-item__title {
  max-width: 230px;
}
.rule-item__title2 {
  max-width: 130px;
}
.is-selected {
  color: var(--eas-color-primary);
}
.rule-owner {
  max-width: 60px;
  color: var(--eas-text-color-light);
}
</style>
