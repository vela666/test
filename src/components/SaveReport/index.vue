<script setup>
import { cloneDeep, pick } from 'lodash-es'
import { ref, reactive, computed, useAttrs } from 'vue'
import { ElMessage } from 'element-plus'
import ReportTag from '@/components/ReportTag/index.vue'
import {
  saveReport,
  getLabelName,
  editReport,
  getReportDetail,
} from '@/api/modules/analysis/common'
import { useRoute, useRouter } from 'vue-router'
import { asyncGetLeftKanBanInfo } from '@/api/modules/see-plate/index.js'
import { mapKanBanList } from '@/views/see-plate/utils.js'
import { reportBindingDashboardInfo } from '@/api/modules/analysis/report.js'
import { recursionFindData, traverseTree } from '@/utils/dataProcessing.js'
import { recordBehavior } from '@/utils/record-behavior.js'
import { reportTypeListMap } from '@/enumeration/report.js'
import { t } from '@/locales/i18n'

const attrs = useAttrs()
const props = defineProps({
  text: {
    type: String,
    default: '',
  },
  reportType: {
    type: [String, Number],
    default: '',
  },
  qp: {
    type: [Function, Object],
    default: () => {},
  },
  chartType: {
    type: [String, Number],
    default: '',
  },
  reportInfo: {
    type: Object,
    default: () => {},
  },
  // 1：另存为 默认：保存/更新
  type: {
    type: [String, Number],
    default: '',
  },
  updateFlag: {
    //是否需要编辑
    type: Boolean,
    default: true,
  },
})

const customTreeSelectionRef = ref(null)

const router = useRouter()
const route = useRoute()

const emit = defineEmits(['submit', 'update:reportInfo', 'reportDetail'])
const drawer = ref(false)
const formRef = ref(null)

const loading = ref(false)
const kanBanDataList = ref([])
const initFormData = () => ({
  id: '',
  businessId: '',
  name: '',
  // 记录添加的看板
  dashboardList: [],
  labelNameList: [],
  // 是否同步更新看板 1 关  2 开
  updateSet: 1,
  reportDesc: '',
})
const formData = reactive(initFormData())

const formRules = {
  name: [
    { required: true, message: t('rules.enterReportName') },
    {
      max: 50,
      message: t('rules.length1To50', [t('dashboard.report')]),
    },
  ],
}

// 更新报表
const isUpd = computed(() => {
  return route.query.id && !props.type
})

const close = () => {
  Object.assign(formData, initFormData())
}

const submit = () => {
  formRef.value.validate(async (valid) => {
    if (!valid) return
    const data = {
      ...formData,
      dashboardList: formData.dashboardList.map((e) => e.businessId),
    }
    emit('submit', data)
    handleSaveReport(data)
  })
}

const options = ref([])

/**
 * @description: 保存报表
 * @return {*}
 */
const handleSaveReport = (formData) => {
  const qp = typeof props.qp === 'function' ? props.qp() : props.qp
  const List = customTreeSelectionRef.value
    ? customTreeSelectionRef.value.optionalList()
    : []
  const totalBusinessIdList = List.map((item) => item.businessId)
  const params = {
    reportType: props.reportType,
    graphType: props.chartType,
    ...(props.reportType !== 7 ? { qp: JSON.stringify(qp) } : qp),
    ...formData,
    totalBusinessIdList,
  }
  let method = saveReport
  // 更新报表
  if (isUpd.value) {
    method = editReport
    params.id = route.query.id
    // 从看板过来的
    if (route.query.kanBanId) {
      // 看板存不存在
      const has = recursionFindData(
        kanBanDataList.value,
        route.query.kanBanId,
        'businessId'
      )
      params.originDashboardBusinessId = has ? route.query.kanBanId : ''
    }
  } else {
    recordBehavior({
      moduleName: '分析',
      submoduleName: reportTypeListMap[props.reportType],
      operate: '保存报表',
    })
  }

  loading.value = true
  method(params)
    .then((res) => {
      ElMessage.success(t('analysis.report.successfullySaved'))
      drawer.value = false

      if (props.updateFlag) {
        const query = {
          id: res.data,
          ...(route.query.kanBanId &&
            isUpd.value && {
              kanBanId: route.query.kanBanId,
            }),
        }
        router.replace({
          path: route.path,
          query,
        })
        // 更新报表信息
        getReportDetail({ reportId: res.data }).then((res) => {
          const data = {
            ...params,
            ...res.data,
            fromSave: true, // 从保存场景来的,不重新计算
          }
          emit('update:reportInfo', data)
          emit('reportDetail', data)
        })
      }
    })
    .finally(() => {
      loading.value = false
    })
}

const getLeftKanBanInfo = async () => {
  try {
    // 路径分析
    if (props.reportType === 5) return
    loading.value = true
    const { data: info } = await asyncGetLeftKanBanInfo().finally((_) => {
      loading.value = false
    })
    const resKanBanData = mapKanBanList(info || {})
    let resDashboardData = []
    // 更新报表
    if (isUpd.value) {
      // 获取绑定的看板
      loading.value = true
      const { data } = await reportBindingDashboardInfo({
        businessId: props.reportInfo.businessId,
      }).finally((_) => {
        loading.value = false
      })
      resDashboardData = data
    }
    kanBanDataList.value = traverseTree(resKanBanData, (item) => {
      if (item.authority === 1) {
        item.disabled = true
      }
      if (
        resDashboardData.some((e) => e.businessId === item.businessId) ||
        (!route.query.id && item.businessId === route.query.kanBanId)
      ) {
        item.selected = true
      }
    })
  } catch (e) {
    console.log(e)
  }
}

const open = () => {
  const qp = typeof props.qp === 'function' ? props.qp() : props.qp
  if (!qp) return
  drawer.value = true
  const field = ['name', 'reportDesc', 'dashboardList', 'labelNameList']
  if (props.reportInfo) {
    const temp = pick(cloneDeep(props.reportInfo), field)
    Object.assign(formData, temp)
    if (!props.type) {
      formData.id = props.reportInfo.id
      formData.businessId = props.reportInfo.businessId
      formData.updateSet = props.reportInfo.updateSet
    }
  }
  getLabelNameList()
  getLeftKanBanInfo()
}

/**
 * @description: 获取标签列表
 * @return {*}
 */
const getLabelNameList = () => {
  getLabelName().then((res) => {
    options.value = res.data
  })
}

defineOptions({
  name: 'SaveReport',
})
</script>

<template>
  <el-button
    @click="open"
    v-bind="attrs"
    :type="props.reportType === 7 && props.type !== '1' ? 'primary' : ''">
    <SvgIcon
      v-if="props.reportType === 7"
      class="fz16 mr3"
      :name="
        props.type === '1' ? 'save' : route.query.id ? 'refresh' : 'save-report'
      " />
    {{ text || $t('analysis.saveReport') }}
  </el-button>
  <CommonDrawer
    @close="close"
    @submit="submit"
    v-model="drawer"
    :title="text"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :loading="loading"
    size="600px">
    <el-form
      :rules="formRules"
      label-position="top"
      ref="formRef"
      :model="formData">
      <el-form-item prop="name" :label="$t('dashboard.reportName')">
        <CommonInput
          :prefixSlot="false"
          trimAllSpace
          show-word-limit
          :desc="$t('common.pleaseEnter')"
          maxlength="50"
          v-model="formData.name" />
      </el-form-item>
      <el-form-item
        v-if="reportType !== 5"
        :label="$t('analysis.report.addToDashboard')"
        prop="dashboardList">
        <CustomTreeSelection
          :props="{
            label: 'name',
          }"
          height="450px"
          nodeKey="businessId"
          ref="customTreeSelectionRef"
          v-model="formData.dashboardList"
          :data="kanBanDataList" />
      </el-form-item>
      <el-form-item prop="labelNameList">
        <template #label>
          {{ $t('analysis.report.addTag') }}（{{
            formData.labelNameList.length
          }}/10）
        </template>
        <div class="w100-percentage">
          <ReportTag v-model="formData.labelNameList" :options="options" />
        </div>
        <!-- <CommonInput
          :prefixSlot="false"
          trimAllSpace
          show-word-limit
          desc="输入标签名称，按enter键确认添加"
          maxlength="20"
          v-model="labelText"
          @keyup.enter="addLabel"
        /> -->
      </el-form-item>
      <el-form-item
        v-if="isUpd && reportType !== 5"
        prop="labelNameList"
        :label="$t('analysis.updateChartSettingsDashboard')">
        <el-switch
          v-model="formData.updateSet"
          :active-value="2"
          :inactive-value="1" />
      </el-form-item>
      <el-form-item :label="$t('common.remark')" prop="reportDesc">
        <CommonInput
          :prefixSlot="false"
          trimAllSpace
          show-word-limit
          :desc="$t('common.pleaseEnter')"
          maxlength="80"
          type="textarea"
          v-model="formData.reportDesc"
          resize="none"
          :rows="5" />
      </el-form-item>
    </el-form>
  </CommonDrawer>
</template>

<style scoped lang="scss"></style>
