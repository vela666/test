<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import ReportTag from '@/components/ReportTag/index.vue'
import { reportLabelAdd } from '@/api/modules/analysis/report'
import { cloneDeep } from 'lodash-es'
import { recordBehavior } from '@/utils/record-behavior.js'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  list: {
    type: Array,
    default: () => [],
  },
  labelList: {
    type: Array,
    default: () => [],
  },
})

const state = reactive({
  formData: {
    labelNameList: [],
  },
  tagList: [],
  loading: false,
})

const formRef = ref()

const emit = defineEmits([
  'update:modelValue',
  'update:list',
  'close',
  'visible-label',
])

const dialogVisible = computed({
  get() {
    return props.modelValue
  },
  set(val) {
    emit('update:modelValue', val)
  },
})

const propList = computed({
  get() {
    return props.list
  },
  set(val) {
    emit('update:list', val)
  },
})

watch(
  () => props.list,
  (newVal) => {
    state.formData.labelNameList.splice(0, state.formData.labelNameList.length)
    if (newVal && newVal.length === 1) {
      state.formData.labelNameList = cloneDeep(newVal[0].labelNameList || [])
    }
  },
  {
    deep: true,
  }
)

watch(
  () => props.labelList,
  (newVal) => {
    state.tagList = newVal || []
  },
  {
    deep: true,
  }
)

const handleDeleteReport = (index) => {
  propList.value.splice(index, 1)
}

/**
 * @description 关闭弹框
 */
const handleDialogClose = (type) => {
  formRef.value.resetFields()
  dialogVisible.value = false
  emit('close', type)
}

/**
 * @description 弹框提交表单
 */
const handleDialogSubmit = () => {
  formRef.value.validate((valid) => {
    if (valid) {
      const params = {
        labelNameList: state.formData.labelNameList,
        reportBusinessIds: propList.value.map((item) => item.businessId),
      }
      recordBehavior({
        moduleName: '数据报表',
        submoduleName: '数据报表',
        operate: '给报表添加标签',
      })
      state.loading = true
      reportLabelAdd(params)
        .then((res) => {
          if (res && res.code === 200) {
            handleDialogClose()
          }
        })
        .finally(() => {
          state.loading = false
        })
    }
  })
}

const getVisibleLabelList = () => {
  emit('visible-label')
}

defineOptions({
  name: 'AddReportTagDialog',
})
</script>
<template>
  <CommonDialog
    v-model="dialogVisible"
    width="550px"
    :title="$t('analysis.report.addTag')"
    :show-close="true"
    :need-footer="true"
    :loading="state.loading"
    @close="handleDialogClose('close')"
    @submit="handleDialogSubmit">
    <template #default>
      <div class="report-tag">
        <el-form
          ref="formRef"
          :model="state.formData"
          label-width="auto"
          label-position="top"
          size="default">
          <el-form-item>
            <template #label>{{
              $t('analysis.report.selectedReports', [propList.length])
            }}</template>
            <div class="report-tag-list p10">
              <div v-for="(item, index) in propList" :key="index">
                <div class="flex-center flex-between report-tag-list-li">
                  <div v-showTips>{{ item.reportName }}</div>
                  <SvgIcon
                    v-if="propList.length > 1"
                    name="close1"
                    class="fz14 c-pointer"
                    @click="handleDeleteReport(index)" />
                </div>
              </div>
            </div>
          </el-form-item>
          <el-form-item
            prop="labelNameList"
            :rules="[
              {
                required: true,
                message: $t('rules.tagCannotEmpty'),
                trigger: 'blur',
              },
            ]">
            <template #label
              >{{ $t('analysis.report.addTag') }}（{{
                state.formData.labelNameList.length
              }}/10）</template
            >
            <div class="w100-percentage">
              <ReportTag
                :options="state.tagList"
                v-model="state.formData.labelNameList"
                @visible-change="getVisibleLabelList">
              </ReportTag>
            </div>
          </el-form-item>
          <div class="warning-background p10 flex">
            <SvgIcon name="warning1" class="fz20 warning" />
            <div class="ml5">
              <div class="mb10">
                1、{{ $t('analysis.report.tagsAddedToReportMsg') }}
              </div>
              <div>
                2、{{ $t('analysis.report.tagsAddedSameOverwrittenMsg') }}
              </div>
            </div>
          </div>
        </el-form>
      </div>
    </template>
  </CommonDialog>
</template>
<style lang="scss" scoped>
.report-tag {
  &-list {
    width: 100%;
    height: 136px;
    border-radius: 4px;
    border: 1px solid var(--eas-border-color);
    overflow: auto;
    &-li {
      height: 32px;
      line-height: 32px;
      padding: 0 10px;
      margin-bottom: 10px;
      border-radius: 4px;
      background: var(--eas-border-color);
    }
  }
}
.warning-background {
  border-radius: 4px;
  background: #fff5e8;
  .warning {
    color: var(--eas-message-warning-text-color);
  }
}
</style>
