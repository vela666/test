<template>
  <div class="navbar">
    <SvgIcon
      @click="showNav(true)"
      name="kanban-manage1"
      class="fz16"
      style="color: #fff" />
    <div
      class="flex-center flex-level-center c-pointer nd-mobile-app"
      @click="showAppDrawer(true)">
      <div class="mr3 fz16 ellipsis">{{ appName }}</div>
      <el-icon :class="['nd-mobile-icon fz16 m0', { 'is-rotate': appDrawer }]"
        ><ArrowDown
      /></el-icon>
    </div>
    <div></div>
  </div>
  <el-drawer
    v-model="drawer"
    append-to-body
    direction="ltr"
    lock-scroll
    :with-header="false"
    class="nd-m-nav-drawer"
    size="86%">
    <div class="nd-m-nav-container">
      <div ref="navRef" class="nd-m-nav-l">
        <SvgIcon
          @click="showNav(false)"
          name="kanban-manage1"
          class="fz16 c1c2028 nd-close-nav" />

        <a
          class="nd-m-nav-item no-bg"
          v-for="item of rawData"
          :key="item.path"
          :href="handleHref(item.path)">
          <div
            class="nd-m-nav-item"
            :class="{ 'nd-m-nav-item-active': route.path === item.path }">
            <SvgIcon v-show="item.icon" :name="item.icon" />
          </div>
        </a>
      </div>
      <div class="nd-m-nav-r">
        <div class="nd-nav-title">{{ navTitle }}</div>
        <component
          :ref="(el) => setRefs(route.path, el)"
          :is="componentNames[route.path]" />
      </div>
    </div>
  </el-drawer>
  <el-drawer
    v-model="appDrawer"
    append-to-body
    direction="ttb"
    lock-scroll
    :with-header="false"
    class="nd-m-app-drawer"
    size="44%">
    <div class="mobile-app-container">
      <el-input
        autocomplete="off"
        autocorrect="off"
        autocapitalize="off"
        spellcheck="false"
        v-model="search"
        class="mobile-app-search"
        :placeholder="t('system.apps.searchAppNameId')"
        clearable>
        <template #prefix>
          <svg-icon name="search" class="eas-icon-prefix"></svg-icon>
        </template>
      </el-input>
      <div class="mobile-app-list" v-if="filterList.length">
        <div
          v-for="item in filterList"
          :key="item.appId"
          :class="{ 'mobile-app-item-active': app === item.appId }"
          @click="showAppDrawer(false, item)"
          class="mobile-app-item flex-center">
          <SvgIcon name="app-manage" class="fz16" />

          <span v-showTips class="w100-percentage"> {{ item.appName }}</span>
        </div>
      </div>
      <div v-if="filterList.length === 0" class="app-empty-box">
        <Empty />
      </div>
    </div>
  </el-drawer>
</template>

<script setup>
import { ref, onMounted, computed, markRaw } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import useRouteStore from '@/store/modules/route'
import useAppStore from '@/store/modules/app.js'
import SideKanBan from '@mobile/views/see-plate/components/SideKanBan/index.vue'
import 'vue-smooth-picker/style.css'
import { ArrowDown } from '@element-plus/icons-vue'
import { t } from '@/locales/i18n.js'
import { cloneDeep } from 'lodash-es'
import useUserStore from '@/store/modules/user.js'
import eventBus from '@/plugins/event-bus.js'

const route = useRoute()
const router = useRouter()
// 后端路由数据
const {
  routes: { rawData },
} = useRouteStore()
const appStore = useAppStore()
const userStore = useUserStore()

const search = ref('')
const navRef = ref()
const drawer = ref(true)
const appDrawer = ref(false)
const componentsRefs = ref({})

const userId = computed(() => userStore.userInfo.userId)
const app = computed({
  get() {
    return appStore.app
  },
  set(newVal) {
    appStore.app = newVal
  },
})

const appList = computed(() => {
  const data = cloneDeep(appStore.appList)
  return data.sort((a, b) => b.topFlag - a.topFlag)
})

const appName = computed(() => {
  return appStore.appList.find((item) => item.appId === app.value).appName
})

const filterList = computed(() => {
  return appList.value.filter(
    (item) =>
      item.appName.toLowerCase().indexOf(search.value.toLowerCase()) > -1 ||
      item.appId.toLowerCase().indexOf(search.value.toLowerCase()) > -1
  )
})

const componentNames = {
  '/see-plate': markRaw(SideKanBan),
}

const setRefs = (val, el) => {
  componentsRefs.value[val] = el
}

const navTitle = computed(() => {
  return rawData.find((item) => item.path === route.path)?.title
})

const showAppDrawer = (bool, item) => {
  if (!bool) {
    const oldApp = app.value
    app.value = item.appId
    localStorage.setItem(userId.value, item.appId)
    sessionStorage.setItem('appId', item.appId)
    if (app.value !== oldApp) {
      const url = window.location.href.split('?')?.[0] || window.location.href
      window.history.replaceState('', '', url)
      window.location.reload()
    }
  }
  appDrawer.value = bool
}
const handleHref = (path) => {
  const originalHref = router.resolve({
    path,
  }).href
  return `/mobile/${originalHref}`
}

const showNav = (mark) => {
  drawer.value = mark
}

eventBus.on('selectKanban', () => {
  drawer.value = false
})

onMounted(() => {
  drawer.value = false
})
defineOptions({
  name: 'Navbar',
})
</script>
<style lang="scss">
.nd-m-nav-drawer {
  .el-drawer__body {
    padding: 0;
  }
  .nd-m-nav-container {
    display: flex;
    height: 100%;
  }
  .nd-m-nav-l {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 50px;
    background-color: #ebf4ff;
    padding-left: 5px;
    color: var(--eas-text-color-1);

    .nd-close-nav {
      height: 70px;
    }
    .nd-m-nav-item {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 30px;
      width: 100%;
      color: #7e88ac;
      font-size: 16px;
    }
    .nd-m-nav-item-active {
      border-top-left-radius: 4px;
      border-bottom-left-radius: 4px;
      background-color: #fff;
    }
  }
}
.nd-m-app-drawer {
  .el-drawer__body {
    padding: 0;
    overflow: hidden;
  }
}
</style>
<style scoped lang="scss">
.ellipsis {
  max-width: 150px;
}
.app-empty-box {
  display: flex;
  justify-content: center;
  height: 100%;
  :deep(.empty-box-desc) {
    overflow: hidden;
  }
}
.mobile-app-container {
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.mobile-app-search {
  padding: 0 10px;
  margin-bottom: 10px;
  margin-top: 10px;
  :deep(.el-input__wrapper) {
    box-shadow: none;
  }
}
.mobile-app-list {
  overflow-y: auto;
  overflow-x: hidden;
  height: 100%;
}
.mobile-app-item {
  margin: 0 10px;
  width: 95%;
  height: 36px;
  padding: 0 20px 0 10px;
  gap: 10px;
}
.mobile-app-item-active {
  color: var(--eas-color-primary);
  background-color: var(--eas-color-primary-light-1);
}
.nd-mobile-app {
  color: #fff;
  font-size: 16px;
}
.navbar {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 50px;
  background-color: var(--eas-color-primary);
  padding: 0 10px;
}

.nd-m-nav-r {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  flex: 1;
}

.nd-nav-title {
  font-size: 16px;
  padding: 0 10px;
  margin-top: 20px;
  margin-bottom: 10px;
  font-weight: 700;
  color: var(--eas-text-color-1);
}
</style>
