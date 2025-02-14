<script setup>
import { computed, ref } from 'vue'
import Logo from '../Logo/index.vue'
import VersionSwitch from '../VersionSwitch/index.vue'
import AppSelect from '../AppSelect/index.vue'
import MenuItem from '../MenuItem/index.vue'
import UserInfo from '../UserInfo/index.vue'
import MenuBar from '../MenuBar/index.vue'
import Notice from '../Notice/index.vue'
import AsyncExport from '../AsyncExport/index.vue'
import useRoutes from '@/store/modules/route'
import useUserStore from '@/store/modules/user'
import { domesticOverseasMark } from '@/utils/domesticOverseas.js'
import { useRoute, useRouter } from 'vue-router'
import { t } from '@/locales/i18n'

const userStore = useUserStore()
const { routes } = useRoutes()
const router = useRouter()
const system = computed(() => {
  return routes.rawData.find((item) => item.path === '/system')
})

const unifiedPanel = computed(() => {
  return routes.rawData.find((item) => item.path === '/unified-panel')
})

const dataOperate = computed(() => {
  return (
    sessionStorage.getItem('appId') &&
    routes.rawData.find((item) => item.path === '/external/data-operate')
  )
})

const ftOperate = computed(() => {
  if (domesticOverseasMark() === 1) {
    return {
      path: userStore.FTUrl,
      title: t('layouts.navbar.fangtouAttribution'),
    }
  } else {
    return false
  }
})

const systemSubPath = system.value?.children.map((item) => {
  return item.path
})

const noticeRef = ref(null)
const asyncExportRef = ref(null)
const moreDropdownRef = ref(null)
const moreVisible = ref(false)

const helpMenu = [
  [
    {
      icon: 'guide',
      title: t('layouts.navbar.newUserGuide'),
      path: 'https://yifants.feishu.cn/wiki/QEeKwaQ3UipZx9kHuBmcLzlYnFi',
    },
    {
      icon: 'manual',
      title: t('layouts.navbar.operationManual'),
      path: 'https://yifants.feishu.cn/wiki/G2CVwrgWiim4M8k5LrocN8G1nKM',
    },
    {
      icon: 'faq',
      title: t('layouts.navbar.commonProblem'),
      path: 'https://yifants.feishu.cn/docs/doccnFjpQlH8o5Qw3lv7atkwqAb',
    },
  ],
  [
    {
      icon: 'version-update',
      title: t('layouts.navbar.versionUpdate'),
      path: 'https://yifants.feishu.cn/docs/doccnwTqxaDkfHjuq3DHQHeseVh#',
    },
    {
      icon: 'app-access',
      title: t('myApp.integrateApp'),
      path: (() => {
        return router.resolve('/app-access').href
      })(),
    },
    {
      icon: 'problem-feedback',
      title: t('layouts.navbar.feedbackOnIssues'),
      path: 'https://yifants.feishu.cn/share/base/form/shrcn8OhfVBfUdh2TRx4cgVjvIg?iframeFrom=docx&ccm_open=iframe',
    },
  ],
]

const route = useRoute()

const notShowPath = ['/unified-panel', '/my-apps']
const isNotShowPath = computed(() => notShowPath.includes(route.path))

const isSystemRoute = computed(() =>
  route.meta?.hasParents?.includes('/system')
)

const moreVisibleChange = (val) => {
  moreVisible.value = val
}

const closeMoreDropdown = () => {
  moreDropdownRef.value.handleClose()
}
defineOptions({
  name: 'Navbar',
})
</script>

<template>
  <div class="navbar">
    <div class="navbar-left">
      <Logo />
    </div>
    <div class="navbar-right">
      <div class="top-bar">
        <div class="top-bar-left">
          <div
            class="flex-center"
            v-show="userStore?.userInfo?.type !== 1 && !isNotShowPath">
            <div class="divider-border" style="margin: 0"></div>
            <AppSelect class="mr10 ml20" :disabled="isSystemRoute" />
          </div>
        </div>

        <MenuBar :special="isNotShowPath" />

        <div class="top-bar-right">
          <div class="flex-center gap10">
            <template v-if="!isNotShowPath">
              <router-link
                v-if="unifiedPanel"
                class="flex-center gap5 nd-router-link"
                target="_blank"
                :to="unifiedPanel.path">
                <SvgIcon name="unified-panel" class="fz16" />
                {{ $t('layouts.navbar.integratedDashboard') }}
              </router-link>
              <router-link
                v-if="userStore?.userInfo?.type !== 1"
                class="flex-center gap5 nd-router-link"
                target="_blank"
                to="/my-apps">
                <SvgIcon name="app-manage" class="fz16" />
                {{ $t('layouts.navbar.myApps') }}
              </router-link>
            </template>

            <el-dropdown
              v-if="system"
              trigger="click"
              popper-class="eas-dropdown_menu"
              placement="bottom-end">
              <div>
                <el-tooltip
                  effect="dark"
                  :content="$t('layouts.navbar.systemManagement')"
                  placement="bottom"
                  :hide-after="0">
                  <svg-icon
                    :class="{
                      'nd-icon-active': systemSubPath.includes($route.path),
                    }"
                    :name="system.icon"
                    class="eas-icon-base" />
                </el-tooltip>
              </div>
              <template #dropdown>
                <el-dropdown-menu>
                  <router-link
                    v-for="item of system.children"
                    :key="item.id"
                    class="eas-menu-item"
                    :to="item.path">
                    <el-dropdown-item>
                      <menu-item :icon="item.icon" :title="item.title" />
                    </el-dropdown-item>
                  </router-link>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <el-tooltip
              effect="dark"
              :content="$t('layouts.navbar.exportTask')"
              placement="bottom"
              :hide-after="0">
              <svg-icon
                name="export-record"
                class="eas-icon-base"
                @click="asyncExportRef?.open()" />
            </el-tooltip>
            <el-tooltip
              effect="dark"
              :content="$t('layouts.notice.messageNotification')"
              placement="bottom"
              :hide-after="0">
              <el-badge
                :is-dot="noticeRef?.unreadCount > 0"
                class="bage-dot mt5">
                <svg-icon
                  name="message"
                  class="eas-icon-base"
                  @click="noticeRef?.open()" />
              </el-badge>
            </el-tooltip>

            <el-dropdown
              ref="moreDropdownRef"
              @visible-change="moreVisibleChange"
              trigger="click"
              max-height="300px"
              popper-class="eas-dropdown_menu"
              placement="bottom-end">
              <el-button
                :class="{
                  'nd-operate-btn-active-hover': moreVisible,
                }"
                class="p0 nd-operate-btn-active fz28"
                text>
                <SvgIcon name="more2" class="fz20" />
              </el-button>
              <template #dropdown>
                <div class="nd-top-more-operation">
                  <div v-if="ftOperate || dataOperate" class="flex">
                    <a
                      v-if="ftOperate"
                      :href="ftOperate.path"
                      target="_blank"
                      @click="closeMoreDropdown"
                      class="flex-center flex-column c545e6e elem-hover gap10"
                      style="flex: 1 0 33.33%; padding: 0 10px">
                      <SvgIcon name="ft-operate" class="fz20" />
                      <span class="fz14" style="white-space: nowrap">
                        {{ ftOperate.title }}
                      </span>
                    </a>
                    <router-link
                      @click="closeMoreDropdown"
                      v-if="dataOperate"
                      class="flex-center flex-column c545e6e elem-hover gap10"
                      style="flex: 1 0 33.33%; padding: 0 10px"
                      target="_blank"
                      :to="dataOperate.path">
                      <SvgIcon name="data-operate" class="fz20" />
                      <span class="fz14" style="white-space: nowrap">
                        {{ dataOperate.title }}
                      </span>
                    </router-link>
                    <div style="flex: 1 0 33.33%; padding: 0 10px"></div>
                  </div>
                  <div
                    v-show="ftOperate || dataOperate"
                    class="nd-top-more-operation-line"></div>
                  <div class="flex flex-direction-column">
                    <div
                      class="flex"
                      v-for="(item, index) in helpMenu"
                      :key="`help_${index}`"
                      style="margin-bottom: 30px">
                      <div
                        class="flex-center flex-level-center"
                        v-for="(items, i) in item"
                        :key="`help_item_${i}`"
                        style="flex: 1 0 33.33%; padding: 0 10px">
                        <a
                          @click="closeMoreDropdown"
                          class="flex-center flex-column c545e6e elem-hover gap10 no-active"
                          target="_blank"
                          :href="items.path">
                          <SvgIcon
                            v-if="items.icon"
                            :name="items.icon"
                            class="fz20" />
                          <span class="fz14" style="white-space: nowrap">
                            {{ items.title }}
                          </span>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </template>
            </el-dropdown>
          </div>
          <user-info />
          <VersionSwitch />
        </div>
      </div>
    </div>
  </div>

  <!-- 消息通知 -->
  <Notice ref="noticeRef" />
  <!-- 异步导出 -->
  <AsyncExport ref="asyncExportRef" />
</template>

<style scoped lang="scss">
.nd-router-link {
  color: var(--eas-text-color-light);
  padding: 6px 8px;
  &:hover {
    color: var(--eas-color-primary);
    background-color: var(--eas-hover-color);
    border-radius: 4px;
  }
}
.nd-top-more-operation {
  height: 270px;
  background: #fff;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  box-shadow: 3px 3px 10px 0 rgba(84, 115, 231, 0.1);
  padding: 20px;
}

.nd-top-more-operation-line {
  margin: 15px 0;
  width: 100%;
  height: 1px;
  border: 1px solid var(--eas-hover-color-4);
  white-space: nowrap;
}

.navbar {
  display: flex;
  width: var(--eas-header-width);
  height: var(--eas-header-height);
  background-color: var(--eas-header-bg-color);
  border-bottom: 1px solid var(--eas-border-color);
}
.navbar-left {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: var(--eas-header-left-width);
  height: var(--eas-header-height);
}
.navbar-right {
  //width: calc(var(--eas-header-width) - var(--eas-header-left-width));
  width: var(--eas-header-width);
  height: var(--eas-header-height);
}
.top-bar {
  // height: var(--eas-topbar-height);
  height: 100%;
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  // border-bottom: 1px solid var(--eas-border-color);
  &-left {
    display: flex;
    // width: 242px;
    align-items: center;
  }
  &-right {
    display: flex;
    flex-shrink: 0;
  }
}

.eas-icon-base {
  width: 28px;
  height: 28px;
  color: var(--eas-text-color-light);
  cursor: pointer;
  transition: 0.3s all;
  &:hover {
    @include icon-active();
  }
}

.divider-border {
  width: 1px;
  height: 16px;
  border: 1px solid #f2f2f2;
  margin: 0 10px 0 20px;
}

.bage-dot {
  :deep() {
    .el-badge__content.is-fixed.is-dot {
      top: 6px;
      right: 10px;
    }
  }
}
</style>
