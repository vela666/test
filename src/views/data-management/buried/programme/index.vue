<template>
  <div class="position-relative">
    <el-tabs
      v-model="tabActive"
      class="h100-percentage"
      @tab-change="handleChange">
      <el-tab-pane
        lazy
        :label="$t('dataManagement.buried.testMetadataTab')"
        name="1">
        <MetaData ref="metaDataRef" />
      </el-tab-pane>
      <el-tab-pane
        lazy
        :label="$t('dataManagement.buried.dataAcceptanceTab')"
        name="2">
        <DataCheck />
      </el-tab-pane>
    </el-tabs>
    <div
      v-if="authEnum.moreOperation && tabActive === '1'"
      class="nd-tabs-right">
      <div class="flex-center gap10">
        <el-button type="info" text @click="syncData">
          <SvgIcon name="sync1" class="mr5 fz16" />
          {{ $t('dataManagement.buried.syncToOnline') }}
        </el-button>
        <el-divider direction="vertical" />
        <el-button type="info" text @click="dowloadData">
          <SvgIcon name="export" class="mr5 fz12" />
          {{ $t('dataManagement.buried.downloadBurialPlan') }}
        </el-button>
        <el-divider direction="vertical" />
        <el-button type="info" text @click="clearData">
          <SvgIcon name="delete1" class="mr5 fz12" />
          {{ $t('dataManagement.buried.clearBurialPlan') }}
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { authEnum, authEnumDesc } from './enum.js'
import MetaData from './MetaData.vue'
import DataCheck from './DataCheck.vue'
import { useTipModal } from '@/components/TipDialog/index.js'
import { recordBehavior } from '@/utils/record-behavior.js'
import {
  asyncCleanProgramme,
  asyncExportProgramme,
  asyncSyncByProgramme,
} from '@/api/modules/programme/common.js'
import { ElMessage } from 'element-plus'
import { t } from '@/locales/i18n.js'

const tempKey = 'programmeTop'

const tabActive = ref(sessionStorage.getItem(tempKey) || '1')
const metaDataRef = ref()

console.log(authEnum, 'authEnum')
console.log(authEnumDesc, 'authEnumDesc')

recordBehavior({
  moduleName: '数据管理',
  submoduleName: '埋点方案',
  operate: '进入页面',
})

const handleChange = (name) => {
  sessionStorage.setItem(tempKey, name)
}

const syncData = () => {
  useTipModal({
    content: t('dataManagement.buried.syncToOnlineTip'),
    iconType: 3,
    title: t('dataManagement.buried.syncToOnline'),
    // 传事件
    async onSubmit(cb) {
      recordBehavior({
        moduleName: '数据管理',
        submoduleName: '埋点方案',
        operate: '同步到线上埋点',
      })
      await asyncSyncByProgramme().finally((_) => {
        cb()
      })
      ElMessage.success(t('common.operate'))
    },
  })
}
const dowloadData = async () => {
  recordBehavior({
    moduleName: '数据管理',
    submoduleName: '埋点方案',
    operate: '下载埋点方案',
  })
  await asyncExportProgramme()
  ElMessage.success(t('common.operate'))
}
const clearData = () => {
  useTipModal({
    content: t('dataManagement.buried.clearBuriedPointTip'),
    iconType: 3,
    btnSwap: true,
    title: t('dataManagement.buried.clearBurialPlan'),
    // 传事件
    async onSubmit(cb) {
      recordBehavior({
        moduleName: '数据管理',
        submoduleName: '埋点方案',
        operate: '清空埋点方案',
      })
      await asyncCleanProgramme().finally((_) => {
        cb()
      })
      metaDataRef.value.getData()
      ElMessage.success(t('common.operate'))
    },
  })
}

defineOptions({
  name: 'Programme',
})
</script>

<style scoped lang="scss">
.nd-tabs-right {
  position: absolute;
  top: 31px;
  right: 21px;
}
:deep(.el-tab-pane) {
  display: flex;
  flex-direction: column;
  height: 100%;
}
</style>
