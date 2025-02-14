<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'

import imgsrc from '@/assets/images/no_app.png'
import { topApp } from '@/api/modules/app'
import useUserStore from '@/store/modules/user'
import useAppStore from '@/store/modules/app'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { cloneDeep } from 'lodash-es'
import useRoutes from '@/store/modules/route.js'
import CommonInput from '@/components/CommonInput/index.vue'

const { t } = useI18n()

const userStore = useUserStore()
const appStore = useAppStore()
const router = useRouter()
const { routes } = useRoutes()

const search = ref('')
const appList = computed(() => {
  const data = cloneDeep(appStore.appList)
  return data.sort((a, b) => b.topFlag - a.topFlag)
})

const hasAppManage = computed(() => {
  return routes.rawData
    .find((item) => item.path === '/system')
    ?.children.some((item) => item.path === '/system/app-manage')
})

const filterList = computed(() => {
  return appList.value.filter(
    (item) =>
      item.appName.toLowerCase().indexOf(search.value.toLowerCase()) > -1 ||
      item.appId.toLowerCase().indexOf(search.value.toLowerCase()) > -1
  )
})
// 设置收藏
const setFavorite = async (data) => {
  const res = await topApp({
    appId: data.appId,
    companyCode: userStore.userInfo.currentCompany,
    operateType: data.topFlag ? 2 : 1,
    userId: userStore.userInfo.userId,
  })
  if (res.code === 200) {
    ElMessage({
      message: `${data.topFlag ? t('common.cancelFavorite') : t('common.favorite')}成功`,
      type: 'success',
    })
    await appStore.getAppList()
  }
}
// 选择应用
const selectedApp = (appId) => {
  const myEvent = new CustomEvent('myAppSelect', {
    detail: {
      appId: appId,
    },
  })
  window.dispatchEvent(myEvent)
  router.push({ name: 'Index' })
}

const handleSelectAccess = (item) => {
  const myEvent = new CustomEvent('myAppSelect', {
    detail: {
      appId: item.appId,
    },
  })
  window.dispatchEvent(myEvent)
  router.push({
    path: '/app-access',
  })
}

defineOptions({
  name: 'MyApps',
})
</script>

<template>
  <div
    v-if="appStore.appList.length > 0"
    class="eas-my-apps"
    v-loading="appStore.appLoading">
    <div class="app-search">
      <CommonInput
        class="app-search-input"
        v-model="search"
        :desc="t('myApp.searchAppNameOrAppId')"
        style="width: 500px"></CommonInput>
    </div>
    <div class="app-list">
      <div
        :class="['app-item', { favorites: item.topFlag }]"
        v-for="item in filterList"
        :key="`app-item_${item.id}`"
        @click="selectedApp(item.appId)">
        <div class="app-item-row">
          <div class="app-item-row__name" v-showTips>
            {{ item.appName }}
          </div>
        </div>
        <div class="app-info">
          <div class="app-item-row h16 mb16 fz12">
            <div class="row-label h16">App Id：</div>
            <div class="row-val h16 is-appid" v-showTips>{{ item.appId }}</div>
          </div>
          <!-- <div class="app-item-row h16 mb16 fz12">
            <div class="row-label h16">入库数：</div>
            <div class="row-val h16 ml12">
              {{ thousandsFilter(item.dataNum) }}
            </div>
          </div> -->
          <div class="app-item-row h16 fz12">
            <div class="row-label h16">
              {{ t('myApp.assignedProjectGroup') }}
            </div>
            <div class="row-val is-group h16" v-showTips>
              {{ item.projects }}
            </div>
          </div>
        </div>
        <div class="app-footer">
          <div class="app-access-btn" @click.stop="handleSelectAccess(item)">
            <svg-icon class="eas-icon-base mr8" name="app-access" />
            {{ t('myApp.integrateApp') }}
          </div>
          <el-tooltip
            effect="dark"
            placement="top"
            :enterable="false"
            :hide-after="0">
            <template #content>
              {{
                item.topFlag ? t('common.cancelFavorite') : t('common.favorite')
              }}
            </template>
            <el-button
              @click.stop="setFavorite(item)"
              :class="[item.topFlag ? 'is-favorite' : 'no-favorite']">
              <svg-icon
                :name="item.topFlag ? 'star-filled' : 'star'"
                :class="[{ 'favorite-color': item.topFlag }, 'mr5']" />
              {{
                item.topFlag ? t('common.hasFavorite') : t('common.favorite')
              }}
            </el-button>
          </el-tooltip>
        </div>
      </div>
    </div>
  </div>
  <div class="no__app" v-else v-loading="appStore.appLoading">
    <div v-show="!appStore.appLoading">
      <img :src="imgsrc" />
      <div class="desc-text">
        <div>{{ t('myApp.noAppsInYourAccount') }}</div>
        <div class="mt14" v-if="!hasAppManage">
          {{ t('myApp.contactAdminToIntegrateApp') }}
        </div>
        <el-button
          v-else
          class="mt18"
          type="primary"
          size="large"
          @click="$router.push('/system/app-manage')"
          >{{ t('myApp.goAppManagement') }}</el-button
        >
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.eas-my-apps {
  height: 100%;
  padding: 20px 0px !important;
}
.app-search {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 40px;
  &-input {
    :deep(.el-input__wrapper) {
      box-shadow: 4px 4px 10px 0px rgba(84, 115, 231, 0.1);
    }
  }
}
.app-list {
  display: grid;
  gap: 30px;
  height: calc(100% - 132px);
  overflow-y: auto;
  margin-top: 60px;
  grid-template-columns: repeat(auto-fill, 377px);
  grid-template-rows: repeat(auto-fill, 186px);
  justify-content: center;
}
.space_between {
  justify-content: space-between;
}
.app-item {
  width: 377px;
  height: 186px;
  padding: 27px 20px 0px 20px;
  border-radius: var(--eas-border-radius-4);
  background-color: var(--eas-white-bg-color);
  transition: var(--el-transition-duration);
  cursor: pointer;
  &:hover {
    box-shadow: var(--eas-box-shadow-login-form);
  }
  &-row {
    display: flex;
    align-items: center;
  }
  &-row__left {
    display: flex;
    align-items: center;
  }
  &-row__right {
    color: var(--eas-color-primary);
    cursor: pointer;
  }
  &-row__name {
    max-width: 182px;
    margin-right: 10px;
    height: 21px;
    color: var(--eas-text-color-primary);
    font-size: var(--eas-font-size-medium);
    font-weight: 700;
  }
}
.app-icon-btn {
  width: 16px;
  height: 16px;
  color: var(--eas-text-color-light);
  cursor: pointer;
}
.favorite-color {
  color: var(--eas-color-primary);
}
.row-label {
  color: var(--eas-text-color-light);
  font-weight: 400;
}
.row-val {
  color: var(--eas-text-color-primary);
  font-weight: 400;
}
.is-group {
  width: 198px;
}
.is-appid {
  width: 214px;
}
.no__app {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  text-align: center;
  color: var(--eas-text-color-primary);
  font-size: var(--eas-font-size-medium);
  font-weight: var(--eas-font-weight-400);
}
.desc-text {
  position: relative;
  margin-top: -30px;
}
.favorites {
  position: relative;
  &::before {
    content: '';
    position: absolute;
    width: 100%;
    height: 4px;
    top: 0;
    left: 0;
    border-radius: 2px;
    background-color: var(--eas-color-primary);
  }
}
.app-info {
  width: 100%;
  padding: 19px 0px;
  border-bottom: 1px solid #f2f2f2;
}
.mb16 {
  margin-bottom: 16px;
}
.h16 {
  height: 16px;
}
.mr8 {
  margin-right: 8px;
}
.eas-icon-base {
  color: var(--eas-color-primary);
}
.app-footer {
  height: 51px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.is-favorite {
  background-color: #eff2ff !important;
  color: #5473e7 !important;
  &:active {
    border-color: transparent !important;
  }
}
.no-favorite {
  background-color: var(--eas-border-color) !important;
  color: var(--eas-text-color-light) !important;
  &:active {
    border-color: transparent !important;
  }
}
.app-access-btn {
  display: flex;
  align-items: center;
  color: var(--eas-color-primary);
  padding-left: 70px;
  flex: 1;
  height: 51px;
}
</style>
