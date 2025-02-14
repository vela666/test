<template>
  <div v-if="navList?.children.length" class="nd-left-nav">
    <div
      class="flex-center nd-left-nav-title"
      :class="[!isCollapse ? 'flex-between' : 'flex-level-center p0']">
      <span v-show="!isCollapse" v-showTips>{{ navList.title }}</span>
      <SvgIcon
        @click="updMenuCollapse"
        class="c-pointer fz18 elem-hover c86919d"
        :name="`menu-${isCollapse ? 'open' : 'close'}`" />
    </div>
    <el-menu
      text-color="#545e6e"
      :collapse="isCollapse"
      active-text-color="#5473E8"
      :default-active="route.path"
      :collapse-transition="false"
      class="nd-sidebar-menus">
      <SidebarItem
        v-for="item of navList.children"
        :key="item.path"
        :item="item"
        :basePath="item.path" />
    </el-menu>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import SidebarItem from './SidebarItem.vue'
import useRouteStore from '@/store/modules/route'
import { findTopLevelParent } from '@/utils/dataProcessing'
// 后端路由数据
const {
  routes: { rawData },
} = useRouteStore()
const route = useRoute()
const isCollapse = ref(
  JSON.parse(sessionStorage.getItem('menuCollapse') || 'false')
)
const navList = ref({
  title: '',
  children: [],
  hasSubs: [],
})
const menuWidth = computed(() => {
  return isCollapse.value ? '38px' : '150px'
})

const updMenuCollapse = () => {
  isCollapse.value = !isCollapse.value
  sessionStorage.setItem('menuCollapse', isCollapse.value)
}

watch(
  () => route.path,
  (val) => {
    if (navList.value?.hasSubs?.includes(val)) return
    navList.value = findTopLevelParent(rawData, route.path, 'path')
  },
  {
    immediate: true,
  }
)
defineOptions({
  name: 'LeftNav',
})
</script>
<style lang="scss">
.nd-sidebar-menus {
  border: none;
  overflow: hidden;
  width: v-bind(menuWidth);

  .el-menu-item,
  .el-sub-menu__title {
    border: none;
    height: var(--eas-menu-item-height);
    line-height: var(--eas-menu-item-height);
    &:hover {
      background-color: var(--eas-hover-color) !important;
    }
  }

  & .nest-menu .el-sub-menu > .el-sub-menu__title,
  & .el-sub-menu .el-menu-item {
    //background-color: var(--eas-color-primary-light-1) !important;

    &:hover {
      background-color: var(--eas-hover-color) !important;
    }
  }

  .router-link-active {
    color: var(--eas-color-primary);
    > * {
      color: var(--eas-color-primary);
      background-color: var(--eas-color-primary-light-1);
    }
  }
  .el-tooltip__trigger {
    padding: 0 0 0 10px;
  }
}
</style>
<style lang="scss" scoped>
.nd-left-nav {
  width: v-bind(menuWidth);
  height: 100%;
  background-color: #fff;
  transition: width 0.2s;
  &-title {
    font-size: 14px;
    font-weight: bold;
    color: #1c2028;
    padding-left: 20px;
    padding-right: 10px;
    height: 50px;
  }
}
</style>
