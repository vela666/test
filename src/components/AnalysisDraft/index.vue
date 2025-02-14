<script setup>
import { ref, useAttrs } from 'vue'
import {
  getReportDraft,
  saveReportDraft,
} from '@/api/modules/analysis/draft.js'
import { ElMessage } from 'element-plus'
import { debounce } from 'lodash-es'
import { Close } from '@element-plus/icons-vue'
import { t } from '@/locales/i18n'

defineOptions({
  name: 'AnalysisDraft',
})

const attrs = useAttrs()
const props = defineProps({
  placement: {
    type: String,
    default: 'bottom',
  },
  //报表类型
  reportType: {
    type: Number,
    default: 0,
    require: true,
  },
})
const emit = defineEmits(['padding', 'save'])
const dataList = ref([])

/**
 * @description 保存报表草稿
 * @param {string} data json格式字符串
 */
const saveDraftRequest = debounce(async (data) => {
  if (!props.reportType || !data) return
  try {
    const res = await saveReportDraft({
      reportType: props.reportType,
      draftData: data,
    })
    if (res.code === 200) {
      ElMessage.success(t('analysis.report.successfullySaved'))
      await getData()
    }
  } catch (error) {
    console.log(error)
  }
}, 300)
// 保存草稿
const saveDraft = () => {
  emit('save', saveDraftRequest)
}

const getData = async () => {
  let res = []
  if (!props.reportType) return
  try {
    res = await getReportDraft({ reportType: props.reportType })
    if (res.code === 200 && res.data) {
      dataList.value = res.data?.slice(0, 5) ?? []
    }
  } catch (error) {
    console.log(error)
  }
}
const showMenu = ref(false)
const analysisDraftDrop = ref(null)
const visibleChange = (val) => {
  showMenu.value = val
  if (val) {
    getData()
  }
}
// 点击填充 触发 padding 事件
const paddingDraft = (item) => {
  emit('padding', item)
  analysisDraftDrop.value?.handleClose()
}

const handleClose = () => {
  analysisDraftDrop.value?.handleClose()
}
</script>

<template>
  <el-dropdown
    @visible-change="visibleChange"
    popper-class="analysis-draft__dropdown"
    trigger="click"
    :placement="placement"
    ref="analysisDraftDrop">
    <el-button v-bind="attrs" :class="{ 'is-unfold': showMenu }">
      {{ $t('analysis.draft') }}
    </el-button>
    <template #dropdown>
      <div class="analysis-draft_list">
        <div class="analysis-draft_list__header flex-between">
          <div class="flex-center">
            <div class="draft-title">{{ $t('analysis.draft') }}</div>
            <div class="draft-desc">{{ $t('analysis.keep5Draft') }}</div>
          </div>
          <el-icon @click="handleClose" class="fz20 c-pointer"
            ><Close
          /></el-icon>
        </div>
        <div class="analysis-draft_save">
          <el-button type="primary" text @click="saveDraft">
            <svg-icon name="save-draft" class="fz16"></svg-icon>
            <div class="analysis-draft_save__title">
              {{ $t('analysis.saveAnalysisDraft') }}
            </div>
          </el-button>
        </div>
        <div class="analysis-draft_list__body">
          <div
            class="analysis-draft_list__item"
            v-for="(item, index) in dataList"
            :key="`analysis-draft-list__item_${index}`">
            <div class="analysis-draft_list__item__text">
              {{ $t('analysis.temporarilyStored') }} {{ item.createTime }}
            </div>
            <el-button text type="primary" @click="paddingDraft(item)">
              {{ $t('analysis.fill') }}
            </el-button>
          </div>
        </div>
      </div>
    </template>
  </el-dropdown>
</template>

<style scoped lang="scss">
.el-button.is-unfold {
  border-color: var(--eas-color-primary);
  color: var(--eas-color-primary) !important;
}
.analysis-draft_list {
  width: 550px;
  height: 311px;
}
.analysis-draft_list__header {
  width: 100%;
  height: 62px;
  padding: 20px 32px 20px 32px;
  display: flex;
  align-items: center;
}
.draft-title {
  font-size: var(--eas-font-size-medium);
  font-weight: bold;
  color: #333;
}
.draft-desc {
  font-size: var(--eas-font-size-base);
  color: #333;
  margin-left: 10px;
}
.analysis-draft_list__body {
  padding: 10px 32px 20px 32px;
  width: 100%;
  height: calc(100% - 81px);
  overflow-y: auto;
}
.analysis-draft_save {
  height: 19px;
  display: flex;
  align-items: center;
  padding-left: 32px;
  color: var(--eas-color-primary);
  &__title {
    font-size: var(--eas-font-size-base);
    font-weight: 400;
    margin-left: 3px;
  }
}
.analysis-draft_list__item {
  width: 100%;
  height: 40px;
  padding: 10px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: var(--eas-font-size-base);
  font-weight: 400;
  color: var(--eas-text-color-primary);
  &:hover {
    background-color: var(--eas-hover-color);
  }
}
</style>
<style lang="scss">
.el-dropdown__popper.analysis-draft__dropdown {
  background: #fff;
  box-shadow: 0px 3px 6px 1px rgba(28, 39, 80, 0.2);
  border-radius: 10px;
  .el-popper__arrow {
    display: none;
  }
  .el-scrollbar__bar.is-vertical {
    right: 0px;
  }
  .el-dropdown__list {
    height: 100%;
    width: 100%;
  }
}
</style>
