<template>
  <template v-if="isSideHidden(item)">
    <template
      v-if="
        hasOneShowingChild(item.children, item, false, false) &&
        (!onlyOneChild.children?.length || onlyOneChild.noShowingChildren)
      ">
      <AppLink :to="resolvePath(basePath, onlyOneChild.path)">
        <div :class="{ 'router-link-active': isActive }">
          <el-menu-item :index="resolvePath(basePath, onlyOneChild.path)">
            <SvgIcon
              v-show="onlyOneChild.icon"
              class="mr5 c86919d fz18"
              :name="onlyOneChild.icon" />
            <template #title>
              <span class="fz14">
                {{ onlyOneChild.title }}
              </span>
            </template>
          </el-menu-item>
        </div>
      </AppLink>
    </template>
    <!-- 有子菜单时 -->
    <el-sub-menu
      popper-class="nd-left-nav-sub"
      v-else
      :index="resolvePath(basePath, item.path)">
      <template #title>
        <SvgIcon
          class="mr5 fz18"
          :class="[isActive ? 'left-nav-acitve' : 'c86919d']"
          v-show="item.icon"
          :name="item.icon" />
        <span class="fz14">
          {{ item.title }}
        </span>
      </template>
      <div class="nest-menu">
        <SidebarItem
          v-for="child of item.children"
          :key="child.path"
          :item="child"
          :basePath="resolvePath(basePath, child.path)" />
      </div>
    </el-sub-menu>
  </template>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import useMenu from '@/layouts/hooks/useMenu'
import AppLink from '@/layouts/components/AppLink/index.vue'
const route = useRoute()
const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
  basePath: {
    type: String,
    default: '',
  },
})
const isActive = computed(() => {
  return props.item?.hasSubs?.includes(route.path)
})
const { onlyOneChild, hasOneShowingChild, resolvePath } = useMenu()
const isSideHidden = (val) => {
  return !Reflect.has(val, 'sideHidden') || !val.sideHidden
}
defineOptions({
  name: 'SidebarItem',
})
</script>
<style lang="scss">
.nd-left-nav-sub {
  .el-menu {
    padding: 4px 0;
    min-width: 120px;
    .nest-menu {
      display: flex;
      align-items: center;
      flex-direction: column;
      > * {
        width: 100%;
        padding: 0 4px;
        > * {
          > * {
            &:first-of-type {
              height: var(--eas-menu-item-height);
              line-height: var(--eas-menu-item-height);
              padding: 0 4px;
            }
          }
        }
      }
    }
  }
}
.left-nav-acitve {
  color: var(--eas-color-primary);
  & ~ * {
    color: var(--eas-color-primary) !important;
  }
}
</style>
