<template>
  <DefineTemplate v-slot="{ exhibit }">
    <AnalysisGlobalFilter
      :isAnalyze="false"
      title=""
      disabled
      :exhibit="exhibit"
      :data="state.filedsData" />
  </DefineTemplate>

  <el-badge :value="conditionLen" :hidden="!conditionLen">
    <DropDownPopoverSelection hide-after="0" :showPopover="!!conditionLen">
      <span>
        <Tooltip>
          <el-button @click="open" class="fz18 w32 m0">
            <SvgIcon class="c545e6e" name="funnel-filter" />
          </el-button>
          <template #content>{{ t('common.filterConditions') }}</template>
        </Tooltip>
      </span>
      <template #custom>
        <div class="p20 flex-column">
          <ReuseTemplate :exhibit="condition" />
          <div class="flex-center mt10 flex-between w100-percentage">
            <div class="mr20">
              <span v-show="!state.isConditionChange">{{
                state.collectName
              }}</span>
            </div>
            <el-button text @click="resetConditions(true)"
              >{{ t('btn.clearAction') }}
            </el-button>
          </div>
        </div>
      </template>
    </DropDownPopoverSelection>
  </el-badge>

  <CommonDrawer
    @submit="submit"
    @close="close"
    :loading="state.operateLoading"
    v-model="state.visible"
    :title="t('common.filterConditions')"
    size="700px"
    :subTxt="t('btn.calculate')"
    :needFooter="isTabActive1">
    <el-tabs v-model="state.tabActive" class="nd-tabs-container skip">
      <el-tab-pane lazy :label="t('dashboard.currentFilter')" name="1">
        <div class="current-filter" v-show="state.condition.filters.length">
          <div class="flex-center flex-between mb15">
            <div class="w100-percentage flex overflow-hidden mr20">
              <span v-showTips v-show="!state.isConditionChange">{{
                state.collectName
              }}</span>
            </div>
            <div class="no-wrap">
              <el-button @click="resetConditions(false)">
                {{ t('btn.clearAction') }}</el-button
              >
              <el-button @click="collectConditions">
                {{ t('common.favorite') }}</el-button
              >
            </div>
          </div>
          <AnalysisGlobalFilter
            :isAnalyze="false"
            title=""
            @change="conditionChange"
            v-model="state.condition"
            :data="state.filedsData"
            @add="addCondition"
            @remove="deleteCondition" />
        </div>
        <div
          class="h100-percentage flex-center flex-level-center"
          v-show="!state.condition.filters.length">
          <div class="flex-column flex-vertical-center">
            <Empty :desc="t('dashboard.noFilter')" />
            <el-button @click="addCondition()" type="primary" class="mt20">
              {{ t('dashboard.addFilter') }}
            </el-button>
          </div>
        </div>
      </el-tab-pane>
      <el-tab-pane lazy :label="t('common.favorite')" name="2">
        <div v-show="hasCollect" class="flex-column gap20">
          <template
            v-for="(k, index) of Object.keys(state.collectList)"
            :key="index">
            <span v-if="k !== 'default'" class="c545e6e txt-bold">
              {{
                t(
                  `dashboard.${k === 'shared' ? 'sharedWithMe' : 'favoriteList'}`
                )
              }}
            </span>
            <div
              v-for="(item, index) of state.collectList[k]"
              :key="index"
              class="flex-center flex-between">
              <DropDownPopoverSelection placement="left">
                <div class="flex-center overflow-hidden">
                  <template v-if="k === 'default'">
                    <div class="c86919d no-wrap">
                      {{
                        t(
                          `dashboard.${item.dashboardDefault ? 'globalDefaultFilter' : 'personalDefaultFilter'}`
                        )
                      }}
                    </div>
                    <span class="ml10 mr10">|</span>
                  </template>
                  <div class="c545e6e mr10" v-showTips>
                    {{ item.name }}
                  </div>
                </div>
                <template #custom>
                  <div class="p20">
                    <ReuseTemplate
                      :exhibit="
                        parseFiltersFromRes(JSON.parse(item.filter)[0])
                      " />
                    <div class="c545e6e mt10">
                      {{ t('common.creator') }}：{{ item.creator }}
                    </div>
                  </div>
                </template>
              </DropDownPopoverSelection>
              <MoreChoices
                @click="(type) => moreChoicesFn[type](item)"
                :type="k"
                :notShowBtn="seePlateStore.selectedInfo.authority === 1"
                :data="item" />
            </div>
          </template>
        </div>

        <div
          class="h100-percentage flex-center flex-level-center"
          v-show="!hasCollect">
          <Empty :desc="t('dashboard.noFavorites')" />
        </div>
      </el-tab-pane>
    </el-tabs>
    <template #footer-l>
      <div class="flex-center">
        <el-checkbox v-model="state.storageConditionBool">
          <span class="c545e6e"> {{ t('dashboard.saveDraft') }}</span>
        </el-checkbox>
        <Tooltip>
          <SvgIcon class="ml5 c86919d fz14" name="help2" />
          <template #content> {{ t('dashboard.saveCurrentFilter') }} </template>
        </Tooltip>
      </div>
    </template>
  </CommonDrawer>

  <ReNameDialog @getData="getFilterFavoriteList" ref="reNameDialogRef" />
  <CollectDialog @getData="getFilterFavoriteList" ref="collectDialogRef" />
  <SetAsDefaultDialog
    @getData="getFilterFavoriteList"
    ref="setAsDefaultDialogRef" />
  <Share @getData="getFilterFavoriteList" ref="shareRef" />
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { createReusableTemplate } from '@vueuse/core'
import { cloneDeep } from 'lodash-es'
import ReNameDialog from './ReNameDialog.vue'
import CollectDialog from './CollectDialog.vue'
import SetAsDefaultDialog from './SetAsDefaultDialog.vue'
import MoreChoices from './MoreChoices.vue'
import Share from './Share.vue'

import useOperate from '@/components/PropsFilter/useOperate'
import { conditionInItVal } from '@/views/see-plate/enum.js'

import { getFieldList } from '@/api/modules/analysis/common'
import {
  asyncShareFilter,
  asyncFavoriteList,
  asyncDeleteFavorite,
  asyncDefaultSetFilter,
} from '@/api/modules/see-plate/filter-favorite.js'
import { storageConditionKey } from '@/views/see-plate/enum'
import { useTipModal } from '@/components/TipDialog'
import useSeePlateStore from '@/store/modules/see-plate.js'
import { useI18n } from 'vue-i18n'

const [DefineTemplate, ReuseTemplate] = createReusableTemplate()

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
const seePlateStore = useSeePlateStore()

const {
  handleDelConditionData,
  handleAddConditionData,
  parseFiltersFromRes,
  getConditionResult,
} = useOperate()

const initVal = () => {
  const storageConditionVal = sessionStorage.getItem(storageConditionKey())
  return {
    storageConditionBool: !!storageConditionVal,
    operateLoading: false,
    isConditionChange: false,
    tabActive: '1',
    visible: false,
    collectConditionList: {
      shared: [],
      created: [],
    },
    storageConditionVal,
    collectName: '',
    condition: conditionInItVal(),
  }
}
const shareRef = ref(null)
const reNameDialogRef = ref(null)
const collectDialogRef = ref(null)
const setAsDefaultDialogRef = ref(null)
const state = reactive(initVal())
const isTabActive1 = computed(() => {
  return state.tabActive === '1'
})
const hasCollect = computed(() => {
  return Object.keys(state.collectList).some((k) => state.collectList[k].length)
})

const conditionLen = computed(() => {
  return condition.value.filters.reduce((p, c) => {
    p += c.filters?.length || 1
    return p
  }, 0)
})

const moreChoicesFn = {
  exec(item) {
    state.isConditionChange = false
    state.collectName = item.name
    handleConditionResult(parseFiltersFromRes(JSON.parse(item.filter)[0]))
    state.visible = false
    emit('getData')
  },
  shared(item) {
    shareRef.value.open(item)
  },
  cancelShared(item) {
    useTipModal({
      content: t('dashboard.confirmCancelShare', [item.name]),
      iconType: 3,
      btnSwap: true,
      title: t('btn.cancelShare'),
      // 传事件
      async onSubmit(cb) {
        await asyncShareFilter({
          businessId: route.query.kanBanId,
          favoriteId: item.id,
          shareSetType: 0,
        }).finally((_) => {
          cb()
        })
        ElMessage.success(t('common.unshareSuccess'))
        getFilterFavoriteList()
      },
    })
  },
  setAsDefault(item) {
    const obj = cloneDeep(item)
    delete obj.type
    setAsDefaultDialogRef.value.open({
      ...obj,
      businessId: route.query.kanBanId,
    })
  },
  cancelDefault(item) {
    const bool = item.dashboardDefault === 1
    const mark = t(`dashboard.${bool ? 'global' : 'personal'}`)
    const tip = t(`dashboard.${bool ? 'forAllSharedMembers' : `forYouOnly`}`, [
      mark,
    ])
    useTipModal({
      content: t('dashboard.currentDefaultFilter', {
        mark,
        tip,
      }),
      iconType: 3,
      btnSwap: true,
      title: t('dashboard.cancelDefaultFilter', [mark]),
      // 传事件
      async onSubmit(cb) {
        await asyncDefaultSetFilter({
          businessId: route.query.kanBanId,
          defaultSet: false,
          favoriteId: item.id,
          type: bool ? 1 : 2,
        }).finally((_) => {
          cb()
        })
        ElMessage.success(t('dashboard.cancelDefaultSuccess', [mark]))
        getFilterFavoriteList()
      },
    })
  },
  rename(item) {
    reNameDialogRef.value.open({ ...item, businessId: route.query.kanBanId })
  },
  delete(item) {
    useTipModal({
      content: t('dashboard.confirmDelete', [item.name]),
      iconType: 3,
      btnSwap: true,
      title: t('btn.delete'),
      // 传事件
      async onSubmit(cb) {
        await asyncDeleteFavorite({
          businessId: route.query.kanBanId,
          favoriteId: item.id,
        }).finally((_) => {
          cb()
        })
        ElMessage.success('common.deleteSuccessfully')
        getFilterFavoriteList()
      },
    })
  },
}

const conditionChange = () => {
  state.isConditionChange = true
}

// 添加全局筛选项
const addCondition = (index) => {
  state.isConditionChange = true
  state.condition = handleAddConditionData({
    condition: state.condition,
    // noLimit: propsFilterLimit,
    conditionList: state.filedsData,
    index,
  })
}

// 全局筛选删除一项
const deleteCondition = (index, subIndex) => {
  state.condition = handleDelConditionData({
    condition: state.condition,
    index,
    subIndex,
  })
}

const resetConditions = async (exec = false) => {
  state.condition = initVal().condition
  if (exec) {
    state.collectName = ''
    condition.value = cloneDeep(state.condition)
    reqConditionParam.value = {}
    sessionStorage.removeItem(storageConditionKey())
    emit('getData')
  }
  state.storageConditionBool = false
}

const collectConditions = async () => {
  try {
    const result = await getConditionResult({
      condition: state.condition,
    })
    collectDialogRef.value.open({
      businessId: route.query.kanBanId,
      filter: JSON.stringify([result]),
    })
  } catch (e) {
    ElMessage.warning(e)
  }
}

const close = () => {
  const name = state.collectName
  const isConditionChange = state.isConditionChange
  Object.assign(state, initVal())
  state.collectName = name
  state.isConditionChange = isConditionChange
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
  // console.log(condition.value, 'condition.value')
  state.condition = cloneDeep(condition.value)
  state.visible = true
  getAllData()
}

const submit = async () => {
  await handleConditionResult(state.condition)
  state.visible = false
  if (state.storageConditionBool) {
    state.collectName = ''
    const data = JSON.stringify(condition.value)
    sessionStorage.setItem(storageConditionKey(), data)
  } else {
    sessionStorage.removeItem(storageConditionKey())
  }
  emit('getData')
}

const handleDefaultCondition = () => {
  let data = null
  if (initVal().storageConditionVal) {
    data = JSON.parse(initVal().storageConditionVal)
  } else if (state.collectList.default.length) {
    const val = state.collectList.default.reduce((p, item) => {
      if (item.userDefault === 1) {
        p.unshift(item)
      } else {
        p.push(item)
      }
      return p
    }, [])[0]
    state.collectName = val.name
    data = parseFiltersFromRes(JSON.parse(val.filter)[0])

    /* const userDefault = state.collectList.default.find(
      (item) => item.userDefault === 1
    )
    const dashboardDefault = state.collectList.default.find(
      (item) => item.dashboardDefault === 1
    )

    state.collectName = userDefault.name || dashboardDefault.name
    data = parseFiltersFromRes(
      JSON.parse(userDefault.filter)[0] || dashboardDefault.filter[0]
    )*/
  }

  if (data) {
    handleConditionResult(data)
  } else {
    condition.value = conditionInItVal()
    reqConditionParam.value = {}
  }
}

// 获取对应事件的事件属性和用户属性、用户分群、用户标签
const asyncGetFieldList = async (parmas = {}) => {
  const { data } = await getFieldList(parmas)
  state.filedsData = data
}

const getAllData = async (exec = false) => {
  if (exec) state.collectName = ''
  if (!route.query.kanBanId) return
  state.operateLoading = true
  await Promise.all([
    asyncGetFieldList(),
    getFilterFavoriteList(false),
  ]).finally((_) => {
    state.operateLoading = false
  })
  exec && handleDefaultCondition()
}

const getFilterFavoriteList = async (exec = true) => {
  exec && (state.operateLoading = true)
  const { data } = await asyncFavoriteList({
    businessId: route.query.kanBanId,
  }).finally((_) => {
    exec && (state.operateLoading = false)
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

/*watch(
  () => route.query.kanBanId,
  async () => {
    state.collectName = ''
      if (!route.query.kanBanId) return
    await getAllData()
    handleDefaultCondition()
  },
  {
    immediate: true,
  }
)*/
defineExpose({
  getAllData,
})
defineOptions({
  name: 'FilterCondition',
})
</script>

<style scoped lang="scss">
.current-filter {
  display: flex;
  flex-direction: column;
  height: 100%;

  .nd-kanban-condition-filter {
    overflow: hidden;
    display: flex;
    flex-direction: column;
    padding: 0;
  }

  :deep(.global-filter-container) {
    height: 100%;
    overflow: auto;
    padding: 10px;
    &::-webkit-scrollbar-track-piece {
      background-color: var(--eas-hover-color);
    }
  }
  :deep(.add-conditions) {
    padding: 10px;
  }
}
</style>
