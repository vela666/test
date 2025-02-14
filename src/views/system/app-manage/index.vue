<template>
  <CommonLayout>
    <template #hl>
      <CommonInput
        v-model="filterConfig.searchCondition"
        :desc="$t('system.apps.searchAppNameId')"
        class="w220" />
    </template>
    <template #hr>
      <el-button @click="recycleBinRef.open()">
        {{ $t('system.apps.recycleBin') }}
      </el-button>
      <Auth :value="authEnum.add">
        <template #default="{ title }">
          <el-button @click="addOrEdit(true)" type="primary" class="m0">
            <SvgIcon name="add1" class="fz16 mr3" />
            {{ title }}</el-button
          >
        </template>
      </Auth>
    </template>
    <el-table
      v-loading="state.exhibitLoading"
      class="nd-table-custom"
      :data="state.pagedData"
      border>
      <el-table-column
        v-for="column of columns"
        :prop="column.prop"
        :key="column.label"
        :label="column.label"
        :show-overflow-tooltip="!!column.prop">
        <template #header v-if="column.switch">
          <FilterDropdown
            @change="handleTableData"
            v-model="filterConfig.status"
            :list="appStatusType"
            :name="column.label" />
        </template>
        <template #default="{ row }">
          <template v-if="column.switch">
            <el-switch
              :disabled="!row.appOperation"
              :active-value="0"
              :inactive-value="1"
              v-model="row.newStatus"
              @change="switchChange(row)">
            </el-switch>
          </template>
          <template v-else-if="column.operate">
            <MoreChoices
              @click="(type) => moreChoicesFn[type](row)"
              :row="row" />
          </template>
          <template v-else>
            {{
              thousandQuantileProcessing(
                row[column.prop],
                column.prop === 'dataQuantity'
              )
            }}
          </template>
        </template>
      </el-table-column>
    </el-table>
    <template #footer>
      <Pagination
        v-model:limit="pageConfig.pageSize"
        v-model:page="pageConfig.page"
        :total="pageConfig.total"
        @getData="handleTableData" />
    </template>
  </CommonLayout>
  <CommonDrawer
    v-model="state.drawerShow"
    size="600px"
    :loading="state.operateLoading"
    ref="commonDrawerRef"
    :title="`${state.formData.appId ? $t('system.apps.editApp') : $t('system.apps.addNewApp')}`"
    @close="close"
    @submit="submit">
    <el-form
      ref="formRef"
      :rules="formRules"
      label-position="top"
      label-width="100px"
      :model="state.formData">
      <el-form-item :label="$t('system.apps.appName')" prop="appName">
        <CommonInput
          maxlength="50"
          :prefixSlot="false"
          show-word-limit
          v-model="state.formData.appName" />
      </el-form-item>
      <el-form-item
        v-if="!state.formData.appId"
        :label="$t('system.apps.assignProjectTeam')"
        prop="projectIdList">
        <el-select
          class="w100-percentage"
          v-model="state.formData.projectIdList"
          multiple
          filterable
          :reserve-keyword="false"
          collapse-tags
          @visible-change="projectSelectVisibleChange"
          :max-collapse-tags="3"
          :placeholder="t('common.pleaseSelect')">
          <el-option
            v-for="item of state.projectGroupList"
            :key="item.projectId"
            :label="item.projectName"
            :value="item.projectId"
            :disabled="item.userType !== 1" />
        </el-select>
        <div class="fz12 c545e6e">
          {{ $t('system.apps.noSuitableProjectTeam') }}
          <router-link
            target="_blank"
            class="c5473e8"
            :to="handleCreateProjectGroup()">
            {{ $t('system.apps.newProjectTeam') }}
          </router-link>
        </div>
      </el-form-item>
      <!--
      <el-form-item label="启用归因功能">
        <el-switch v-model="state.formData.attribution" />
      </el-form-item>
      <el-form-item label="平台" prop="platform">
        <el-radio-group v-model="state.formData.platform">
          <el-radio-button
            :label="item"
            :value="item"
            v-for="item of Object.keys(platformList)"
            :key="item"
          >
            {{ platformList[item] }}
          </el-radio-button>
        </el-radio-group>
      </el-form-item>
      <WeChatGame v-model:form="state.formData" />-->
    </el-form>
  </CommonDrawer>

  <CommonDrawer
    :loading="state.filterRuleLoading"
    :title="$t('system.apps.trackingPointsFilteringRules')"
    size="600px"
    @close="closeFilterRule"
    @submit="saveFilterRule"
    v-model="state.filterRuleShow">
    <OperateTip class="mb20">
      <p class="fz12">
        {{ $t('system.apps.enabledStateMsg') }}
        <span class="cff9f24">
          {{ $t('system.apps.pleaseOperateCaution') }}
        </span>
      </p>
      <p class="fz12">
        {{ $t('system.apps.emptyNotProcessed') }}
        <span class="cff9f24">
          {{ $t('system.apps.formatSeparated') }}
        </span>
      </p>
    </OperateTip>
    <el-form
      ref="filterAttributeForm"
      :model="state.ruleFormData"
      label-position="top"
      label-width="100px">
      <el-form-item
        :label="`${$t('common.open')}/${$t('common.close')}`"
        prop="switch">
        <el-switch
          v-model="state.filterAttributeSwitch"
          active-value="1"
          inactive-value="0" />
      </el-form-item>
      <el-form-item :label="`${$t('system.apps.region')}(__reg)`" prop="__reg">
        <CommonInput
          :desc="$t('system.apps.pleaseEnterRegion')"
          :prefixSlot="false"
          :disabled="state.filterAttributeSwitch === '0'"
          v-model="state.ruleFormData.__reg" />
      </el-form-item>
      <!--      <el-form-item label="应用商店(__store)" prop="__store">
        <CommonInput
          desc="请输入应用商店"
          :prefixSlot="false"
          :disabled="state.filterAttributeSwitch === '0'"
          v-model="state.ruleFormData.__store" />
      </el-form-item>
      <el-form-item label="游戏包名(__pkg_name)" prop="__pkg_name">
        <CommonInput
          desc="请输入游戏包名"
          :prefixSlot="false"
          :disabled="state.filterAttributeSwitch === '0'"
          v-model="state.ruleFormData.__pkg_name" />
      </el-form-item>-->
      <el-form-item
        :label="`${$t('system.apps.gameVersion')}(__current_version)`"
        prop="__current_version">
        <CommonInput
          :desc="$t('common.pleaseEnter')"
          :prefixSlot="false"
          :disabled="state.filterAttributeSwitch === '0'"
          v-model="state.ruleFormData.__current_version" />
      </el-form-item>
      <el-form-item
        :label="`${$t('system.apps.sdkVersion')}(__sdk_version)`"
        prop="__sdk_version">
        <CommonInput
          :desc="$t('common.pleaseEnter')"
          :prefixSlot="false"
          :disabled="state.filterAttributeSwitch === '0'"
          v-model="state.ruleFormData.__sdk_version" />
      </el-form-item>
    </el-form>
  </CommonDrawer>

  <SubscribeConfig ref="subscribeConfigRef" />
  <RecycleBin ref="recycleBinRef" @getData="getAppList" />

  <OperateVerifyDialog
    btnSwap
    html
    :ref="(ref) => (state.operateVerifyDialogRef = ref)" />
</template>

<script setup>
import { computed, watch, reactive, ref, markRaw } from 'vue'
// import WeChatGame from './components/WeChatGame.vue'
import MoreChoices from './components/MoreChoices.vue'
import SubscribeConfig from './components/SubscribeConfig.vue'
import RecycleBin from './components/RecycleBin.vue'
import { appStatusType } from '@/enumeration'
import {
  asyncGetAppList,
  asyncAddApp,
  asyncUpdAppStatus,
  asyncEditApp,
  asyncQueryAppInfo,
  asynDeleteApp,
} from '@/api/modules/app'
import { asyncGetOptionalProjectGroupList } from '@/api/modules/project-group'
import { debounce } from 'lodash-es'
import { isBoolean } from '@/utils/types'
import {
  slicePagingData,
  thousandQuantileProcessing,
} from '@/utils/dataProcessing'
import { ElMessage } from 'element-plus'
import useAppStore from '@/store/modules/app'
import { authEnum } from './enum.js'
import { useRouter } from 'vue-router'
import { getFilteringRules, setFilteringRules } from '@/api/modules/buried.js'
import { recordBehavior } from '@/utils/record-behavior.js'
import { useI18n } from 'vue-i18n'
const { t } = useI18n() // 使用useI18n钩子获取国际化t函数
/*
const platformList = {
  wechat: '微信小游戏',
  /!* all: '全部平台',
  douyin: '抖音小游戏',
  andriod: 'Andriod',
  ios: 'IOS',*!/
}
*/
const router = useRouter()

const formRules = {
  appName: [
    { required: true, message: t('common.pleaseEnter'), trigger: 'blur' },
  ],
  // projectIdList: [{ required: true, message: '请选择', trigger: 'blur' }],
}

const columns = [
  {
    prop: 'appName',
    label: t('system.apps.appName'),
  },
  {
    prop: 'appId',
    label: 'App Id',
  },
  /* {
    prop: 'prop',
    label: '平台',
  },*/
  {
    prop: 'projectListStr',
    label: t('system.apps.belongingProjectTeam'),
  },
  {
    prop: 'createBy',
    label: t('common.createBy'),
  },
  {
    prop: 'createTime',
    label: t('common.createTime'),
  },
  {
    prop: 'updateTime',
    label: t('common.updateTime'),
  },
  {
    label: t('common.status'),
    // prop: 'status',
    switch: true,
  },
  {
    label: t('common.operate'),
    operate: true,
  },
]

const initVal = () => {
  return {
    state: {
      tableAllData: [],
      pagedData: [],
      projectGroupList: [],
      tipDialog: false,
      filterRuleLoading: false,
      drawerShow: false,
      filterRuleShow: false,
      // 当前行数据
      rowData: {},
      formData: {
        appId: '',
        appName: '',
        projectIdList: [],
        /*  platform: '',
        attribution: false,
        refreshNode: 0,*/
      },
      filterAttributeSwitch: '0',
      ruleFormData: {
        __reg: '',
        __current_version: '',
        __sdk_version: '',
      },
      operateLoading: false,
      exhibitLoading: false,
    },
    filterConfig: {
      searchCondition: '',
      // 0 启用 1停用
      status: '',
    },
    pageConfig: {
      // 分页器配置
      page: 1, // 当前页码
      pageSize: 20, // 每页数量
      total: 0, // 总数
    },
  }
}
const { getAppList: getSelectAppList } = useAppStore()
const state = reactive(initVal().state)
const filterConfig = reactive(initVal().filterConfig)
const pageConfig = reactive(initVal().pageConfig)
const formRef = ref(null)
const recycleBinRef = ref(null)
const subscribeConfigRef = ref(null)
const commonDrawerRef = ref(null)

const moreChoicesFn = {
  edit(row) {
    addOrEdit(row)
  },
  access(row) {
    const routeUrl = router.resolve({
      path: '/app-access',
      query: {
        appId: row.appId,
        appName: row.appName,
        virtualAppId: sessionStorage.getItem('appId'),
      },
    })
    window.open(routeUrl.href, '_blank')
  },
  async rule(row) {
    state.rowData = markRaw(row)
    state.filterRuleShow = true
    state.filterRuleLoading = true
    const { data } = await getFilteringRules(row.appId).finally((_) => {
      state.filterRuleLoading = false
    })
    state.filterAttributeSwitch = data.switch
    Object.assign(state.ruleFormData, data.rules)
  },
  subscription(row) {
    subscribeConfigRef.value.open(row.appId)
    state.subscriptionShow = true
  },
  delete(row) {
    state.operateVerifyDialogRef.open({
      title: t('system.apps.deleteApp'),
      verifyText: t('system.apps.sureDeleteApp'),
      content: t('system.apps.sureDeleteAppMsg', [row.appName]),
      async submit() {
        await asynDeleteApp(row.appId)
        recordBehavior({
          moduleName: '系统管理',
          submoduleName: '应用管理',
          operate: `删除应用【${row.appName}】-${row.appId}`,
        })
        ElMessage.success(t('common.deleteSuccessfully'))
        getAppList(false)
      },
    })
  },
}

// 关闭埋点过滤规则
const closeFilterRule = () => {
  state.filterAttributeSwitch = initVal().state.filterAttributeSwitch
  Object.assign(state.ruleFormData, initVal().state.ruleFormData)
}

// 保存埋点过滤规则
const saveFilterRule = async () => {
  const params = {
    appId: state.rowData.appId,
    switch: state.filterAttributeSwitch,
    rules: {
      ...state.ruleFormData,
      __reg: state.ruleFormData.__reg.toLocaleLowerCase(),
    },
  }
  state.filterRuleLoading = true
  await setFilteringRules(params).finally((_) => {
    state.filterRuleLoading = false
  })
  state.filterRuleShow = false
  ElMessage.success(t('common.operationSuccessfully'))
}

const getProjectGroupList = async () => {
  const { data } = await asyncGetOptionalProjectGroupList({
    size: -1,
  })
  state.projectGroupList = markRaw(data)
}

const addOrEdit = async (row) => {
  state.drawerShow = true
  if (!isBoolean(row)) {
    state.operateLoading = true
    const { data } = await asyncQueryAppInfo(row.appId).finally((_) => {
      state.operateLoading = false
    })
    state.formData = data
  }
}

const projectSelectVisibleChange = (bool) => {
  bool && getProjectGroupList()
}

const close = () => {
  state.formData = initVal().state.formData
}

const submit = debounce(() => {
  formRef.value.validate(async (valid) => {
    if (!valid) return
    state.operateLoading = true
    const bool = !!state.formData.appId
    const fn = bool ? asyncEditApp : asyncAddApp
    const params = {
      ...state.formData,
    }
    if (bool) {
      Reflect.deleteProperty(params, 'projectIdList')
    }
    await fn(params).finally((_) => {
      state.operateLoading = false
    })
    ElMessage.success(
      `${bool ? t('common.editedSuccessfully') : t('common.addedSuccessfully')}`
    )
    getAppList()
    state.drawerShow = false
  })
}, 100)

const restoreStatus = () => {
  const val = state.pagedData.find((item) => item.appId === state.rowData.appId)
  if (val) val.newStatus = val.status
}

const switchChange = async (row) => {
  state.rowData = markRaw(row)
  if (state.rowData.newStatus === state.rowData.status) return
  if (state.rowData.newStatus === 1) {
    state.operateVerifyDialogRef.open({
      title: t('system.apps.stopApp'),
      verifyText: t('system.apps.sureStopApp'),
      content: `
        <div class="mb5">${t('system.apps.sureStopApp', [row.appName])}</div>
        <div class="ml20">
          <div class="dot">${t('system.apps.stopAppNotDatabase')}</div>
          <div class="dot">${t('system.apps.reenableNotRetrieved')}</div>
          <div class="dot">${t('system.apps.noViewData')}</div>
        </div>
      `,
      close: restoreStatus,
      submit: switchChangeSubmit,
    })
    return
  }
  switchChangeSubmit()
}

const switchChangeSubmit = async () => {
  try {
    ElMessage.closeAll()
    state.operateLoading = true
    const { code } = await asyncUpdAppStatus({
      appList: [
        {
          appId: state.rowData.appId,
          appStatus: state.rowData.newStatus,
        },
      ],
    }).finally((_) => {
      state.operateLoading = false
    })
    code === 200 &&
      ElMessage.success(
        `${state.rowData.newStatus === 0 ? t('common.successfullyEnabled') : t('common.deactivationSuccessful')}`
      )
    getAppList()
  } catch (e) {
    restoreStatus()
  }
}

const handleTableData = debounce(() => {
  const searchCondition = filterConfig.searchCondition.toLocaleLowerCase()
  const data = state.tableAllData.filter((item) => {
    /*   return conformsTo(item, {
      appName: (value) => {
        return (value + item.appId)
          .toLocaleLowerCase()
          .includes(searchCondition)
      },
      newStatus: (value) => {
        return (
          !Number.isInteger(filterConfig.status) ||
          value === filterConfig.status
        )
      },
    })*/
    const search = (item.appName + item.appId)
      .toLocaleLowerCase()
      .includes(searchCondition)

    const isStatusMatch =
      !Number.isInteger(filterConfig.status) ||
      item.newStatus === filterConfig.status

    return search && isStatusMatch
  })
  pageConfig.total = data.length
  state.pagedData = markRaw(
    slicePagingData(data, pageConfig.page, pageConfig.pageSize)
  )
})

const getAppList = async (exec = true) => {
  state.exhibitLoading = true
  const {
    data: {
      pageInfo: { list },
    },
  } = await asyncGetAppList({
    size: -1,
  }).finally((_) => {
    state.exhibitLoading = false
  })
  state.tableAllData = list.map((item) => {
    return {
      ...item,
      newStatus: item.status,
    }
  })

  handleTableData()
  exec && getSelectAppList()
}
getAppList()
getProjectGroupList()

watch(
  () => filterConfig,
  (val) => {
    handleTableData()
  },
  {
    deep: true,
  }
)

const handleCreateProjectGroup = () => {
  return {
    path: '/system/group-manage',
    query: {
      appJump: 1,
      virtualAppId: sessionStorage.getItem('appId'),
    },
  }
}
defineOptions({
  name: 'AppManage',
})
</script>

<style lang="scss">
.dot {
  display: flex;
  align-items: center;
  margin-bottom: 4px;
  &::before {
    margin-right: 4px;
    display: inline-block;
    width: 6px;
    height: 6px;
    content: '';
    background-color: var(--eas-text-color-primary);
    border-radius: 50%;
  }
}
</style>
