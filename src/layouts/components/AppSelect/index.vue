<script setup>
import { ref, computed, onMounted, watch, onUnmounted, nextTick } from 'vue'
import { CaretBottom } from '@element-plus/icons-vue'
import copyText from '@/utils/clipboard'
import { topApp } from '@/api/modules/app'
import useUserStore from '@/store/modules/user'
import useAppStore from '@/store/modules/app'
import { ElMessage } from 'element-plus'
import { cloneDeep } from 'lodash-es'
import { t } from '@/locales/i18n'

defineOptions({
  name: 'AppSelect',
})

defineProps({
  disabled: {
    type: Boolean,
    default: false,
  },
})
const userStore = useUserStore()
const appStore = useAppStore()
const appList = computed(() => {
  const data = cloneDeep(appStore.appList)
  return data.sort((a, b) => b.topFlag - a.topFlag)
})
const userId = computed(() => userStore.userInfo.userId)
const search = ref('')

const app = computed({
  get() {
    return appStore.app
  },
  set(newVal) {
    appStore.app = newVal
  },
})

const setMyAppSelect = (e) => {
  if (e?.detail?.appId) {
    app.value = e.detail.appId
    localStorage.setItem(userId.value, e.detail.appId)
    sessionStorage.setItem('appId', e.detail.appId)
  }
}

onMounted(async () => {
  window.addEventListener('myAppSelect', setMyAppSelect)
})
onUnmounted(() => {
  window.removeEventListener('myAppSelect', setMyAppSelect)
})

const filterList = computed(() => {
  return appList.value.filter(
    (item) =>
      item.appName.toLowerCase().indexOf(search.value.toLowerCase()) > -1 ||
      item.appId.toLowerCase().indexOf(search.value.toLowerCase()) > -1
  )
})

// 复制appId
const copyAppId = (text, event) => {
  copyText(text, event)
}

//设置收藏状态
const setFavorite = async (status, data) => {
  const res = await topApp({
    appId: data.appId,
    companyCode: userStore.userInfo.currentCompany,
    operateType: status ? 1 : 2,
    userId: userStore.userInfo.userId,
  })
  if (res.code === 200) {
    ElMessage({
      message: `${status ? t('common.favoriteSuccess') : t('common.unfavoriteSuccess')}`,
      type: 'success',
    })
    await appStore.getAppList()
  }
}

const appDrop = ref(null)

//visible-change
const visible = ref(false)
const visibleChange = (val) => {
  visible.value = val
  if (val) {
    search.value = ''
  }
}

const commandChange = (command) => {
  const oldApp = app.value
  app.value = command.appId
  localStorage.setItem(userId.value, command.appId)
  sessionStorage.setItem('appId', command.appId)
  appDrop.value && appDrop.value.handleClose()
  if (app.value !== oldApp) {
    const url = window.location.href.split('?')?.[0] || window.location.href
    window.history.replaceState('', '', url)
    window.location.reload(true)
  }
}

const appEnum = computed(() => {
  return appList.value.reduce((acc, cur) => {
    acc[cur['appId']] = cur['appName']
    return acc
  }, {})
})
</script>

<template>
  <el-dropdown
    class="app-select"
    popper-class="app-select-popper"
    trigger="click"
    placement="bottom-start"
    @visible-change="visibleChange"
    ref="appDrop"
    :disabled="disabled">
    <div class="app-select-panel" :class="{ 'is-disabled': disabled }">
      <span v-showTips class="app-select-label">{{ appEnum[app] }}</span>
      <el-icon :class="['app-select-icon', visible ? 'is-rotate' : '']">
        <CaretBottom />
      </el-icon>
    </div>
    <template #dropdown>
      <div class="eas-dropdown-menu">
        <div class="eas-app-search-prefix">
          <el-input
            v-model="search"
            class="eas-search-input"
            :placeholder="t('system.apps.searchAppNameId')"
            clearable>
            <template #prefix>
              <svg-icon name="search" class="eas-icon-prefix"></svg-icon>
            </template>
          </el-input>
        </div>
        <div
          v-for="item in filterList"
          :key="item.appId"
          :class="[
            'eas-select-dropdown__item',
            app === item.appId ? 'eas-dropdown-app__selected' : '',
          ]"
          @click="commandChange(item)">
          <div class="app-item">
            <div class="app-item-left">
              <div v-showTips class="text text-id">{{ item.appName }}</div>
              <div v-showTips class="text text-name">{{ item.appId }}</div>
            </div>
            <div class="app-item-right">
              <el-tooltip
                effect="dark"
                :content="$t('layouts.copyAppId')"
                placement="top"
                :enterable="false">
                <div
                  class="eas-icon-box mr10"
                  @click.stop="copyAppId(item.appId, $event)">
                  <svg-icon name="copy1" class="eas-icon-btn"></svg-icon>
                </div>
              </el-tooltip>
              <el-tooltip
                v-if="item.topFlag"
                effect="dark"
                :content="$t('common.cancelFavorite')"
                placement="top"
                :enterable="false">
                <div
                  class="eas-icon-box"
                  @click.stop="setFavorite(false, item)">
                  <svg-icon
                    name="star-filled"
                    class="eas-icon-btn favorite"></svg-icon>
                </div>
              </el-tooltip>
              <el-tooltip
                v-else
                effect="dark"
                :content="$t('common.favorite')"
                placement="top"
                :enterable="false">
                <div class="eas-icon-box" @click.stop="setFavorite(true, item)">
                  <svg-icon name="star" class="eas-icon-btn"></svg-icon>
                </div>
              </el-tooltip>
            </div>
          </div>
        </div>
        <div v-if="filterList.length === 0" class="app-empty-box">
          <Empty />
        </div>
      </div>
    </template>
  </el-dropdown>
</template>

<style scoped lang="scss">
.app-empty-box {
  height: 200px;
  padding: 0px 4px 0px 6px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.app-select-panel {
  width: 184px;
  height: 32px;
  color: var(--eas-text-color);
  font-size: var(--eas-font-size-base);
  line-height: 28px;
  background-color: var(--eas-color-primary-light-1);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 14px;
  border-radius: 16px;
  &.is-disabled {
    color: var(--el-disabled-text-color);
    background: var(--eas-border-color-light);
    cursor: not-allowed;
    .app-select-icon {
      color: var(--el-disabled-text-color);
    }
  }
}
.app-select-label {
  max-width: 136px;
}
.eas-icon-box {
  width: 15px;
  height: 15px;
  display: flex;
  align-items: center;
  &:hover {
    .eas-icon-btn {
      color: var(--eas-color-primary);
    }
  }
}
.eas-icon-btn,
.eas-icon-prefix {
  width: 15px;
  height: 15px;
  color: var(--eas-text-color-light);
}
.eas-icon-btn {
  /*处理copy方法在svg上报错*/
  pointer-events: none;
}
.favorite {
  color: var(--eas-color-primary);
}
.eas-app-search-prefix {
  position: absolute;
  top: 0;
  padding: 10px 4px 8px 6px;
  background-color: #fff;
  z-index: 10;
  :deep(.el-input) {
    width: 272px;
  }
}
.app-item {
  display: flex;
  justify-content: space-between;
  &-left {
    .text {
      height: 16px;
      line-height: 16px;
      max-width: 178px;
      &-id {
        color: var(--eas-text-color-primary);
      }
      &-name {
        color: var(--eas-text-color-light);
      }
    }
  }
  &-right {
    display: flex;
    align-items: center;
  }
}
.eas-select-empty {
  margin: 0px;
  padding: 50px 12px 4px 4px;
}
.eas-dropdown-menu {
  max-height: 364px;
  padding: 50px 12px 4px 4px;
}
.eas-select-dropdown__item {
  height: 52px;
  padding: 10px 6px;
  cursor: pointer;
  font-size: var(--eas-font-size-small);
  &:hover {
    background-color: var(--eas-hover-color);
  }
  .text-id {
    font-size: var(--eas-font-size-base);
  }
  &.eas-dropdown-app__selected {
    font-weight: normal;
    .text-id {
      color: var(--eas-color-primary) !important;
    }
    .text-name {
      color: var(--eas-color-primary) !important;
    }
  }
}
.app-select-icon {
  transition: all 0.3s;
  color: var(--eas-text-color-light);
}
.is-rotate {
  transform: rotate(-180deg);
}
</style>
<style lang="scss">
.app-select-popper {
  &.el-dropdown__popper {
    width: 300px;
    border: none;
    box-shadow: var(--eas-box-shadow-light);
    .el-scrollbar__bar {
      &.is-vertical {
        width: 8px;
        right: 0px;
        top: 15px;
      }
    }
    .el-popper__arrow {
      display: none;
    }
    .el-scrollbar {
      margin-bottom: 4px;
    }
  }
}
</style>
