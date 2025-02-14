<template>
  <el-button
    @click="open"
    class="mobile-filter w32"
    :type="state.active && 'primary'">
    <SvgIcon
      :class="state.active ? 'c5473e8' : 'c545e6e'"
      name="funnel-filter" />
    <!--    {{ t('dashboard.filter') }}-->
  </el-button>
  <el-drawer
    v-model="state.visible"
    append-to-body
    direction="btt"
    lock-scroll
    :close-on-click-modal="!state.operateLoading"
    :close-on-press-escape="!state.operateLoading"
    :with-header="false"
    class="nd-m-filter-drawer"
    :title="t('common.filterConditions')"
    size="50%">
    <div
      v-show="hasCollect"
      v-loading="state.operateLoading"
      class="nd-m-filter-container">
      <div class="flex-center flex-between nd-m-filter-t">
        <span>{{ t('common.filterConditions') }}</span>
        <el-button type="primary" text @click="resetConditions"
          >{{ t('btn.clearAction') }}
        </el-button>
      </div>
      <div class="nd-m-filter-content">
        <template
          v-for="(k, index) of Object.keys(state.collectList)"
          :key="index">
          <span v-if="k !== 'default'" class="c545e6e txt-bold">
            {{
              t(`dashboard.${k === 'shared' ? 'sharedWithMe' : 'favoriteList'}`)
            }}
          </span>
          <div
            v-for="(item, index) of state.collectList[k]"
            :key="index"
            @click="exec(item)"
            class="flex-center flex-between nd-m-filter-item"
            :class="{
              'nd-m-filter-item-active': item.id === state.active,
            }">
            <div class="flex-center overflow-hidden w100-percentage">
              <template v-if="k === 'default'">
                <div class="no-wrap">
                  {{
                    t(
                      `dashboard.${item.dashboardDefault ? 'globalDefaultFilter' : 'personalDefaultFilter'}`
                    )
                  }}
                </div>
                <span class="ml10 mr10">|</span>
              </template>
              <div class="nd-m-filter-item-title" v-showTips>
                {{ item.name }}
              </div>
            </div>
            <el-icon v-if="item.id === state.active"><Select /></el-icon>
          </div>
        </template>
      </div>
    </div>

    <div
      class="h100-percentage flex-center flex-level-center"
      v-show="!hasCollect">
      <Empty :desc="t('dashboard.noFavorites')" />
    </div>
  </el-drawer>
</template>

<script setup>
import { computed, reactive } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Select } from '@element-plus/icons-vue'
import { cloneDeep } from 'lodash-es'

import useOperate from '@/components/PropsFilter/useOperate'
import { conditionInItVal } from '@/views/see-plate/enum.js'

import { asyncFavoriteList } from '@/api/modules/see-plate/filter-favorite.js'
import { useI18n } from 'vue-i18n'

const emit = defineEmits(['getData'])
const condition = defineModel({
  type: Object,
  default() {
    return conditionInItVal()
  },
})
const reqConditionParam = defineModel('reqConditionParam', {
  type: Object,
  default() {
    return {}
  },
})

const route = useRoute()
const { t } = useI18n()

const { parseFiltersFromRes, getConditionResult } = useOperate()

const initVal = () => {
  return {
    active: '',
    operateLoading: false,
    visible: false,
    collectConditionList: {
      shared: [],
      created: [],
    },
    condition: conditionInItVal(),
  }
}
const state = reactive(initVal())

const hasCollect = computed(() => {
  return Object.keys(state.collectList).some((k) => state.collectList[k].length)
})

const exec = (item) => {
  state.active = item.id
  handleConditionResult(parseFiltersFromRes(JSON.parse(item.filter)[0]))
  state.visible = false
  emit('getData')
}

const resetConditions = () => {
  state.active = ''
  state.condition = initVal().condition
  condition.value = cloneDeep(state.condition)
  reqConditionParam.value = {}
  emit('getData')
  state.visible = false
}

const handleConditionResult = async (val) => {
  try {
    const result = await getConditionResult({
      condition: val || state.condition,
    })
    condition.value = cloneDeep(val || state.condition)
    reqConditionParam.value = result
  } catch (e) {
    ElMessage.warning(e)
    await Promise.reject('')
  }
}

const open = async () => {
  state.condition = cloneDeep(condition.value)
  state.visible = true
  getAllData()
}

const handleDefaultCondition = () => {
  let data = null
  state.active = ''
  if (state.collectList.default.length) {
    const val = state.collectList.default.reduce((p, item) => {
      if (item.userDefault === 1) {
        p.unshift(item)
      } else {
        p.push(item)
      }
      return p
    }, [])[0]
    state.active = val.id
    data = parseFiltersFromRes(JSON.parse(val.filter)[0])
  }

  if (data) {
    handleConditionResult(data)
  } else {
    condition.value = conditionInItVal()
    reqConditionParam.value = {}
  }
}

const getAllData = async (exec = false) => {
  if (!route.query.kanBanId) return
  await getFilterFavoriteList()
  exec && handleDefaultCondition()
}

const getFilterFavoriteList = async () => {
  state.operateLoading = true
  const { data } = await asyncFavoriteList({
    businessId: route.query.kanBanId,
  }).finally((_) => {
    state.operateLoading = false
  })
  state.collectList = Object.keys(data).reduce(
    (p, c) => {
      const val = data[c]
      if (c === 'created') {
        val.forEach((item) => {
          // 全局默认 或 个人默认
          if (item.dashboardDefault || item.userDefault) {
            p.default.push(item)
          } else {
            p.collect.push(item)
          }
        })
      } else {
        p.shared.push(...val)
      }
      return p
    },
    { default: [], collect: [], shared: [] }
  )
}
defineExpose({
  getAllData,
})
defineOptions({
  name: 'FilterCondition',
})
</script>
<style lang="scss">
.nd-m-filter-drawer {
  .el-drawer__body {
    padding: 0;
  }
}
</style>
<style scoped lang="scss">
.mobile-filter {
  font-size: 16px;
}
.nd-m-filter-t {
  font-size: 14px;
  padding: 10px;
  border-bottom: 1px solid var(--eas-border-color);
  margin-bottom: 10px;
}

.nd-m-filter-item {
  color: #545e6e;
  padding: 0 10px;
}
.nd-m-filter-item-title {
  margin-right: 10px;
}

.nd-m-filter-item-active {
  color: var(--eas-color-primary);
  background-color: var(--eas-color-primary-light-1);
}
.nd-m-filter-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 0 10px 0;
  overflow-y: auto;
  gap: 5px;
  > div {
    height: 32px;
    line-height: 32px;
  }
}
.nd-m-filter-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}
</style>
