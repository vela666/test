<script setup>
import { reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import useAppStore from '@/store/modules/app'
import { recordBehavior } from '@/utils/record-behavior.js'
import { externalUrl } from '@/enumeration'
import { asyncExportAppConfig } from '@/api/modules/app.js'

const router = useRoute()
const appStore = useAppStore()

const exportLoading = ref(false)
const app = reactive({
  appName: '',
  appId: '',
})
const { appName, appId } = router.query

if (appName && appId) {
  app.appName = appName
  app.appId = appId
} else {
  app.appName =
    appStore.appList.filter((el) => el.appId === appStore.app)?.[0]?.appName ??
    ''
  app.appId = appStore.app
}
/**
 * 登录
 * @param {number} type 导出类型: 1,事件_事件属性_用户属性配置文件; 2,埋点配置
 * @returns
 */
const exportConfig = async (type = 1) => {
  exportLoading.value = true
  try {
    if (type === 1) {
      await asyncExportAppConfig({
        appId: app.appId,
      })
    }
  } finally {
    exportLoading.value = false
  }
}

const handleToOpen = (url) => {
  return `${url}?virtualAppId=${app.appId}`
}

recordBehavior({
  moduleName: '通用',
  submoduleName: '应用接入',
  operate: '查看应用接入指引',
})
defineOptions({
  name: 'AppAccess',
})
</script>

<template>
  <div class="eas-app-access">
    <div class="eas-app-access__header title_font">
      {{ $t('myApp.integrateApp') }}
    </div>
    <div class="eas-app-access__body">
      <el-scrollbar>
        <el-steps direction="vertical">
          <el-step>
            <template #title>
              <div class="eas-step-container">
                <div class="eas-step-container__header title_font">
                  {{ $t('system.apps.app') }}
                </div>
                <div class="eas-step-container__body content_font">
                  <div class="eas-step-container__item mgb15">
                    <span>{{ $t('myApp.currentAppName') }}</span>
                    <span class="eas-text-color">{{ app.appName }}</span>
                  </div>
                  <div class="eas-step-container__item">
                    <span>{{ $t('myApp.currentAppId') }}</span>
                    <span class="eas-text-color">{{ app.appId }}</span>
                  </div>
                </div>
              </div>
            </template>
          </el-step>
          <el-step>
            <template #title>
              <div class="eas-step-container">
                <div class="eas-step-container__header title_font">
                  {{ $t('myApp.designBurialPointScheme') }}
                </div>
                <div class="eas-step-container__body content_font">
                  <div class="eas-step-container__item mgb15">
                    {{ $t('myApp.designBurialPointSchemeMsg') }}
                  </div>
                  <div class="eas-step-container__item mgb15">
                    <span>{{ $t('myApp.uploadTemplate') }}</span>
                    <el-link
                      type="primary"
                      :href="externalUrl.event"
                      target="_blank"
                      :underline="false">
                      {{ $t('myApp.downloadEventTemplate') }}
                    </el-link>
                    <span class="primary-color">、</span>
                    <el-link
                      type="primary"
                      :href="externalUrl.eventAttr"
                      target="_blank"
                      :underline="false">
                      {{ $t('myApp.downloadEventAttributeTemplate') }}
                    </el-link>
                    <span class="primary-color">、</span>
                    <el-link
                      type="primary"
                      :href="externalUrl.userAttr"
                      target="_blank"
                      :underline="false">
                      {{ $t('myApp.downloadUserAttributeTemplate') }}
                    </el-link>
                  </div>
                  <div class="eas-step-container__item mgb15">
                    <span>{{ $t('myApp.manuallyAdd') }}</span>
                    <router-link
                      target="_blank"
                      :to="handleToOpen('/data-management/buried/programme')">
                      {{ $t('dataManagement.event.addEvent') }}
                    </router-link>
                    <span class="primary-color">、</span>
                    <router-link
                      target="_blank"
                      :to="handleToOpen('/data-management/buried/programme')">
                      {{ $t('myApp.eventAttribute') }}
                    </router-link>
                    <span class="primary-color">、</span>
                    <router-link
                      target="_blank"
                      :to="handleToOpen('/data-management/buried/programme')">
                      {{ $t('myApp.userAttribute') }}
                    </router-link>
                    <span class="primary-color mr20"></span>
                    <el-link
                      type="primary"
                      href="https://yifants.feishu.cn/wiki/FpULwe2KEiIQBAkNyt4cfKGEnlb"
                      target="_blank"
                      :underline="false">
                      {{ $t('myApp.viewSystemAttribute') }}
                    </el-link>
                    <el-link
                      class="ml20"
                      type="primary"
                      href="https://yifants.feishu.cn/wiki/VpxEw0YF7iE8IwkOUdMcDb0Pnke"
                      target="_blank"
                      :underline="false">
                      {{ $t('myApp.learnMore') }}
                    </el-link>
                  </div>
                  <!-- <div class="eas-step-container__item">
                    <el-button
                      type="primary"
                      @click="exportConfig(1)"
                      v-loading="exportLoading">
                      导出配置
                    </el-button>
                  </div> -->
                </div>
              </div>
            </template>
          </el-step>
          <el-step>
            <template #title>
              <div class="eas-step-container">
                <div class="eas-step-container__header title_font">
                  {{ $t('myApp.integratedSdk') }}
                </div>
                <div class="eas-step-container__body content_font">
                  <div class="eas-step-container__item mgb15">
                    <el-link
                      href="https://yifants.feishu.cn/docx/OfjYdKPiiolEQdxyK6TctaTOnIg"
                      target="_blank"
                      type="primary"
                      :underline="false">
                      {{ $t('myApp.integrationSdkMsg', ['Android 5.x.x']) }}
                    </el-link>
                  </div>
                  <div class="eas-step-container__item mgb15">
                    <el-link
                      href="https://yifants.feishu.cn/wiki/wikcnOt0NYvc1MMBu40qGJ2PhYe"
                      target="_blank"
                      type="primary"
                      :underline="false">
                      {{ $t('myApp.integrationSdkMsg', ['IOS 5.x.x']) }}
                    </el-link>
                  </div>
                  <div class="eas-step-container__item mgb15">
                    <el-link
                      href="https://yifants.feishu.cn/docs/doccne92LB74R3xmcqlRYuwOlPf"
                      target="_blank"
                      type="primary"
                      :underline="false">
                      {{ $t('myApp.integrationSdkMsg', ['H5 5.x.x']) }}
                    </el-link>
                  </div>
                  <div class="eas-step-container__item mgb15">
                    <el-link
                      href="https://yifants.feishu.cn/wiki/FE3dwPI2tiPfwJkXeg6cMNyLnle"
                      target="_blank"
                      type="primary"
                      :underline="false">
                      {{ $t('myApp.integrationSdkMsg', ['Unity 1.x.x']) }}
                    </el-link>
                  </div>
                  <!-- <div class="eas-step-container__item">
                    <el-button type="primary" @clikc="exportConfig(2)">
                      导出埋点配置
                    </el-button>
                  </div> -->
                </div>
              </div>
            </template>
          </el-step>
          <el-step>
            <template #title>
              <div class="eas-step-container">
                <div class="eas-step-container__header title_font">
                  {{ $t('myApp.testData') }}
                </div>
                <div class="eas-step-container__body content_font">
                  <div class="eas-step-container__item mgb15">
                    <span>
                      {{ $t('myApp.testDataMsg') }}
                    </span>
                    <router-link
                      target="_blank"
                      :to="handleToOpen('/data-management/buried/realtime')">
                      {{ $t('myApp.viewTestData') }}
                    </router-link>
                  </div>
                  <div class="eas-step-container__item mgb15">
                    {{ $t('myApp.viewTestDataMsg') }}
                    <router-link
                      target="_blank"
                      :to="handleToOpen('/data-management/buried/programme')">
                      {{ $t('myApp.proceedToAcceptance') }}
                    </router-link>
                  </div>
                  <div class="eas-step-container__item">
                    <el-link
                      href="https://yifants.feishu.cn/docs/doccn2aeVMccWOev21Dz9a6xCTf"
                      target="_blank"
                      type="primary"
                      :underline="false">
                      {{ $t('myApp.testingDevice') }}(iOS)
                    </el-link>
                    <el-link
                      class="ml20"
                      href="https://yifants.feishu.cn/docs/doccnzrFSrkjnHid6nhRDibxayf"
                      target="_blank"
                      type="primary"
                      :underline="false">
                      {{ $t('myApp.testingDevice') }}(Android)
                    </el-link>
                  </div>
                </div>
              </div>
            </template>
          </el-step>
          <el-step>
            <template #title>
              <div class="eas-step-container">
                <div class="eas-step-container__header title_font">
                  {{ $t('myApp.configureTrackingPoints') }}
                </div>
                <div class="eas-step-container__body content_font">
                  <div class="eas-step-container__item mgb15">
                    {{ $t('myApp.configureTrackingPointsMsg') }}
                  </div>
                  <div class="eas-step-container__item mgb15">
                    <span>{{ $t('myApp.uploadTemplate') }}</span>
                    <el-link
                      type="primary"
                      :href="externalUrl.event"
                      target="_blank"
                      :underline="false">
                      {{ $t('myApp.downloadEventTemplate') }}
                    </el-link>
                    <span class="primary-color">、</span>
                    <el-link
                      type="primary"
                      :href="externalUrl.eventAttr"
                      target="_blank"
                      :underline="false">
                      {{ $t('myApp.downloadEventAttributeTemplate') }}
                    </el-link>
                    <span class="primary-color">、</span>
                    <el-link
                      type="primary"
                      :href="externalUrl.userAttr"
                      target="_blank"
                      :underline="false">
                      {{ $t('myApp.downloadUserAttributeTemplate') }}
                    </el-link>
                  </div>
                  <div class="eas-step-container__item mgb15">
                    <span>{{ $t('myApp.manuallyAdd') }}</span>
                    <router-link
                      target="_blank"
                      :to="handleToOpen('/data-management/event')">
                      {{ $t('dataManagement.event.addEvent') }}
                    </router-link>
                    <span class="primary-color">、</span>
                    <router-link
                      target="_blank"
                      :to="handleToOpen('/data-management/event-attr')">
                      {{ $t('myApp.addEventAttribute') }}
                    </router-link>
                    <span class="primary-color">、</span>
                    <router-link
                      target="_blank"
                      :to="handleToOpen('/data-management/user')">
                      {{ $t('myApp.addUserAttribute') }}
                    </router-link>
                    <span class="primary-color mr20"></span>
                    <el-link
                      type="primary"
                      href="https://yifants.feishu.cn/wiki/FpULwe2KEiIQBAkNyt4cfKGEnlb"
                      target="_blank"
                      :underline="false">
                      {{ $t('myApp.viewSystemAttribute') }}
                    </el-link>
                    <el-link
                      class="ml20"
                      type="primary"
                      href="https://yifants.feishu.cn/wiki/VpxEw0YF7iE8IwkOUdMcDb0Pnke"
                      target="_blank"
                      :underline="false">
                      {{ $t('myApp.learnMore') }}
                    </el-link>
                  </div>
                  <div class="eas-step-container__item mgb15">
                    {{ $t('myApp.configureTrackingPointsOnline') }}
                    <el-link
                      type="primary"
                      href="https://yifants.feishu.cn/wiki/G2CVwrgWiim4M8k5LrocN8G1nKM#share-WthPdGBDIog2fCxqiVFcuOhankd"
                      target="_blank"
                      :underline="false">
                      {{ $t('myApp.viewOperationInstruction') }}
                    </el-link>
                  </div>
                  <div class="eas-step-container__item">
                    <el-button
                      type="primary"
                      @click="exportConfig(1)"
                      v-loading="exportLoading">
                      {{ $t('myApp.exportOnlineTrackingPointConfig') }}
                    </el-button>
                  </div>
                </div>
              </div>
            </template>
          </el-step>
          <el-step>
            <template #title>
              <div class="eas-step-container">
                <div class="eas-step-container__header title_font">
                  {{ $t('myApp.gameRelease') }}
                </div>
                <div class="eas-step-container__body content_font">
                  <div class="eas-step-container__item mgb15">
                    {{ $t('myApp.gameReleaseMsg') }}
                  </div>
                  <div class="eas-step-container__item">
                    <span>{{ $t('myApp.viewMoreReportAnalysis') }}</span>
                    <router-link
                      target="_blank"
                      :to="handleToOpen('/analysis/event')">
                      {{ $t('analysis.event.analysisName') }}
                    </router-link>
                    <span class="primary-color">、</span>
                    <router-link
                      target="_blank"
                      :to="handleToOpen('/analysis/retention')">
                      {{ $t('analysis.retention.analysisName') }}
                    </router-link>
                    <span class="primary-color">、</span>
                    <router-link
                      target="_blank"
                      :to="handleToOpen('/analysis/attr')">
                      {{ $t('analysis.attr.analysisName') }}
                    </router-link>
                    <span class="primary-color">、</span>
                    <router-link
                      target="_blank"
                      :to="handleToOpen('/analysis/sqlquery')">
                      {{ $t('analysis.sqlquery.analysisName') }}
                    </router-link>
                    <span class="primary-color">。</span>
                  </div>
                </div>
              </div>
            </template>
          </el-step>
          <el-step>
            <template #title>
              <div class="eas-step-container">
                <div class="eas-step-container__header title_font">
                  {{ $t('common.errorDetail') }}
                </div>
                <div class="eas-step-container__body content_font">
                  <div class="eas-step-container__item">
                    <span>
                      {{ $t('myApp.errorDetailMsg') }}
                    </span>
                    <router-link
                      target="_blank"
                      :to="handleToOpen('/data-management/buried/error')">
                      {{ $t('common.viewDetail') }}
                    </router-link>
                  </div>
                </div>
              </div>
            </template>
          </el-step>
        </el-steps>
      </el-scrollbar>
    </div>
  </div>
</template>

<style scoped lang="scss">
.title_font {
  color: var(--eas-text-color);
  font-size: var(--eas-font-size-medium);
  font-weight: bold;
}
.content_font {
  color: var(--eas-text-color-primary);
  font-size: var(--eas-font-size-medium);
  font-weight: 400;
}
.eas-text-color {
  color: var(--eas-text-color);
}
.primary-color {
  color: var(--eas-color-primary);
}
.eas-app-access {
  height: 100%;
  padding: 0px !important;
  &__header {
    padding: 10px 0px 10px 20px;
    background-color: transparent;
    user-select: none;
  }
  &__body {
    margin: 0 20px 49px 20px;
    height: calc(100% - 90px);
    a {
      color: var(--eas-color-primary);
    }
    .el-scrollbar {
      padding: 20px;
    }
    background-color: var(--eas-white-bg-color);
    border-radius: var(--eas-border-radius-4);
    overflow-y: auto;
    :deep(.el-step__line) {
      left: 16px;
      width: 1px;
      background-color: var(--eas-split-line-color);
    }
    :deep(.el-step__icon.is-text) {
      width: 32px;
      height: 32px;
      font-size: var(--eas-font-size-extra-large);
      color: var(--eas-color-primary);
      border: 1px solid var(--eas-color-primary);
      background-color: var(--eas-color-primary-light-1);
    }
    :deep(.el-step.is-vertical) {
      .el-step__head {
        width: 32px;
      }
    }
    :deep(.el-step__main) {
      padding-left: 20px;
      margin-bottom: 24px;
    }
  }
}
.eas-step-container {
  margin-top: 6px;
  &__body {
    margin-top: 20px;
    padding: 20px;
    border-radius: var(--eas-border-radius-4);
    border: 1px solid var(--eas-border-color);
  }
  &__item {
    display: flex;
    align-items: center;
    :deep(.el-link__inner) {
      font-size: var(--eas-font-size-medium);
    }
  }
}
.mgb15 {
  margin-bottom: 15px;
}
</style>
