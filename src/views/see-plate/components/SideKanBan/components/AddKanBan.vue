<template>
  <CommonDrawer
    @submit="submit"
    @close="close"
    :loading="state.operateLoading"
    v-model="state.show"
    :title="t('dashboard.addDash')"
    size="600px">
    <div class="flex-column gap16">
      <el-radio-group @change="radioChange" v-model="state.radioVal">
        <el-radio-button :label="1" :value="1">{{
          t('dashboard.addDash')
        }}</el-radio-button>
        <el-radio-button :label="2" :value="2">
          {{ t('dashboard.createBasicDashboard') }}
          <Tooltip>
            <SvgIcon name="help2" />
            <template #content>
              {{ t('dashboard.addPreconfiguredReports') }}
            </template>
          </Tooltip>
        </el-radio-button>
      </el-radio-group>
      <el-form
        ref="formRef"
        :model="state.formData"
        :rules="formRules"
        label-position="top"
        label-width="100px">
        <el-form-item
          :label="`${t(`dashboard.dashboard`)}${t('common.name')}`"
          prop="name">
          <CommonInput
            :prefixSlot="false"
            v-model="state.formData.name"
            maxlength="50"
            show-word-limit
            :clearable="false" />
        </el-form-item>
        <SelectFolderOrSpace
          prop="folderBusinessId"
          :label="t('btn.addTo')"
          @change="selectFolderOrSpaceChange"
          v-model="state.formData.folderBusinessId" />
        <el-form-item
          v-if="state.radioVal === 2"
          :label="t('dashboard.basicReports')"
          prop="dashboardList">
          <CustomTreeSelection
            height="520px"
            v-model="state.formData.dashboardList"
            :data="state.kanBanList" />
        </el-form-item>
      </el-form>
    </div>
  </CommonDrawer>
</template>

<script setup>
import { markRaw, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import SelectFolderOrSpace from './SelectFolderOrSpace.vue'
import {
  asyncAddBaseKanBan,
  asyncAddKanBan,
  asyncGetBaseReportList,
} from '@/api/modules/see-plate/dashboard.js'
import { recordBehavior } from '@/utils/record-behavior.js'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const formRules = {
  name: [{ required: true, message: t('common.pleaseEnter') }],
  folderBusinessId: [{ required: true, message: t('common.pleaseSelect') }],
  dashboardList: [
    { required: true, message: t('common.pleaseSelect'), trigger: 'blur' },
  ],
}
const emit = defineEmits(['getData'])

const convertReportJsonToTree = (data) => {
  return data.map((item) => {
    const reports = JSON.parse(item.reportJson || '[]')
    const children = reports.map((node) => {
      const parsedNode = {
        id: `report_${node.reportId}`,
        label: node.reportName,
        ...node,
      }
      return parsedNode
    })
    return {
      ...item,
      id: `dash_${item.dashboardId}`,
      label: item.dashboardName,
      children,
      disabled: !children.length,
    }
  })
}

const initVal = () => {
  return {
    radioVal: 1,
    show: false,
    operateLoading: false,
    kanBanList: [],
    selectFolderOrSpaceParams: {},
    formData: {
      name: '',
      folderBusinessId: '',
      dashboardList: [],
    },
  }
}

const formRef = ref(null)
const state = reactive(initVal())

const selectFolderOrSpaceChange = (obj) => {
  state.selectFolderOrSpaceParams = markRaw(obj)
}

const radioChange = (val) => {
  if (val === 2 && !state.formData.name) {
    state.formData.name = t('dashboard.basicDashboard')
  }
}

const close = () => {
  Object.assign(state, initVal())
}

const getBaseReportList = async (empty) => {
  const { data } = await asyncGetBaseReportList()
  state.kanBanList = convertReportJsonToTree(data)
  if (empty) {
    state.kanBanList[0].selected = state.kanBanList[0].children.length !== 0
  }
}

// 映射新坐标位置
const mapNewCoordinates = (data) => {
  return data.map((report, index) => {
    const xCoordinate = (index % 2) * 6
    const yCoordinate = Math.floor(index / 2) * 4
    return {
      x: xCoordinate,
      y: yCoordinate,
      w: 6, // Width
      h: 4, // Height
      // i: report.reportId,
      id: +report.reportId,
      type: 2,
      noResize: false,
      minH: report.minH || 4,
    }
  })
}

const submit = () => {
  formRef.value.validate(async (valid) => {
    if (!valid) return
    state.operateLoading = true
    recordBehavior({
      moduleName: '数据看板',
      submoduleName: '数据看板',
      operate: '新建看板',
    })
    let fn = asyncAddKanBan
    const isSpace = state.selectFolderOrSpaceParams.type === 'space'
    let params = {
      [isSpace ? 'spaceBusinessId' : 'folderBusinessId']:
        state.formData.folderBusinessId,
      name: state.formData.name,
    }
    if (state.radioVal === 2) {
      fn = asyncAddBaseKanBan
      params = {
        ...params,
        reportInfoList: state.formData.dashboardList,
        viewConfigJson: JSON.stringify(
          mapNewCoordinates(state.formData.dashboardList)
        ),
      }
    }
    await fn(params).finally((_) => {
      state.operateLoading = false
    })
    ElMessage.success(t('common.createSuccess'))
    state.show = false
    emit('getData')
  })
}

const open = (empty = false) => {
  state.show = true
  getBaseReportList(empty)
  if (empty) {
    state.formData.folderBusinessId = '-2'
    state.radioVal = 2
    radioChange(state.radioVal)
  }
}

defineExpose({
  open,
})
defineOptions({
  name: 'AddKanBan',
})
</script>

<style scoped lang="scss"></style>
