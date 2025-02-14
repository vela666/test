<script setup>
import { computed } from 'vue'
import NavbarItem from '../NavbarItem/index.vue'
import useRouteStore from '@/store/modules/route'
import useAppStore from '@/store/modules/app'
import { cloneDeep } from 'lodash-es'

const props = defineProps({
  special: {
    type: Boolean,
    default: false,
  },
})
const store = useRouteStore()
const appStore = useAppStore()

const appList = computed(() => appStore.appList)

const specialPath = ['/unified-panel', '/my-apps']
const menu = computed(() => {
  return props.special
    ? cloneDeep(store.routes.addRoutes)
        .filter((item) => {
          if (specialPath.includes(item.path)) {
            item.hidden = false
            item.children[0].hidden = false
          }
          return specialPath.includes(item.path)
        })
        .reverse()
    : store.routes.addRoutes
})

defineOptions({
  name: 'MenuBar',
})
</script>

<template>
  <div class="nd-top-menu-bar" v-if="special || appList.length > 0">
    <el-menu
      :default-active="$route.path"
      mode="horizontal"
      :popper-offset="1"
      :ellipsis="false"
      :unique-opened="true">
      <NavbarItem
        v-for="route in menu"
        :key="route.path"
        :item="route"
        :base-path="route.path" />
    </el-menu>
  </div>
</template>
<style lang="scss">
.nd-top-menu-bar {
  // el-menu 样式修改
  width: 100%;
  // height: var(--eas-menubar-height);
  height: calc(100% - 2px);
  padding: 0 20px;

  .el-menu {
    height: 100%;
    width: 100%;
    overflow: hidden;
    --el-menu-hover-bg-color: transparent;

    &.el-menu--horizontal {
      border-bottom: none;

      .el-menu-item {
        height: 100%;
        padding: 0;
        margin-right: 30px;

        &.is-active {
          border: none;
          position: relative;
          color: var(--eas-color-primary);

          &::after {
            position: absolute;
            content: '';
            bottom: 0;
            width: 100%;
            height: 4px;
            left: 50%;
            transform: translate(-50%, 0);
            background-color: var(--eas-color-primary);
            border-radius: var(--eas-border-radius);
          }
        }
      }

      .el-sub-menu {
        margin-right: 8px;
        & ~ a {
          margin-left: 10px;
        }
        /* margin-right: 40px;

        .el-sub-menu__icon-arrow {
          right: 0px;
        }*/
        @media screen and (max-width: 1500px) {
          .el-sub-menu__title {
            padding-right: 10px;
          }
        }

        .el-sub-menu__title {
          display: flex;
          align-items: center;
          padding-left: 10px;
          border: none;

          > .el-sub-menu__icon-arrow {
            margin-top: 0;
            position: static;
            font-size: 14px;
            color: #cbd0d6;
          }

          .nd-top-sub-menu-title {
            position: relative;
            margin-right: 5px;
            height: 100%;
            display: flex;
            align-items: center;
          }
        }

        &.is-active {
          .el-sub-menu__title {
            //border: none;
            .nd-top-sub-menu-title {
              //position: relative;
              &::after {
                position: absolute;
                content: '';
                left: 50%;
                transform: translate(-50%, 0);
                bottom: 0;
                width: 100%;
                height: 4px;
                background-color: var(--eas-color-primary);
                border-radius: var(--eas-border-radius);
              }
            }
          }
          .el-sub-menu__icon-arrow {
            color: var(--eas-color-primary);
          }
        }

        &.is-opened {
          .el-sub-menu__icon-arrow {
            color: var(--eas-color-primary);
            transform: rotateZ(180deg) !important;
          }
        }
      }

      // 菜单很多展示不下时 把 ... 改为 更多
      .el-sub-menu__hide-arrow {
        .el-sub-menu__icon-more {
          // 因为重置了--el-menu-icon-width的默认值  src/styles/themes.scss
          width: 24px;
          /* &::after {
            content: '更多';
            font-size: 14px;
          }*/
        }
      }
    }
  }
}

.nd-top-sub-menu {
  &.el-popper.is-light {
    border: none;
    //margin-top: -5px;
    padding: 0;
  }

  &.el-menu--horizontal {
    border: none;

    .el-menu--popup {
      --el-menu-hover-bg-color: var(--eas-color-primary-light-1) !important;
      //min-width: 127px;
      min-width: auto;
      padding: 4px;
      border-radius: var(--eas-border-radius);
      box-shadow: var(--eas-box-shadow-light);

      .el-menu-item {
        height: var(--eas-menu-item-height);
        color: var(--eas-text-color-primary);
        padding: 8px;
        display: flex;
        align-items: center;
        &:not(.is-active) {
          .eas-menu-item__icon {
            color: var(--eas-text-color-light);
          }
        }
        .eas-menu-item__icon {
          font-size: 18px;
          margin-right: 5px;
        }

        .eas-menu-item__title {
          height: 100%;
          display: flex;
          align-items: center;
        }

        &.is-active {
          color: var(--eas-color-primary);
          //background-color: var(--eas-color-primary-light-1);
        }

        &:hover {
          background-color: var(--eas-hover-color);
        }
      }

      /* .router-link-active.router-link-exact-active {
        .el-menu-item {
          color: var(--eas-color-primary);
          //background-color: var(--eas-color-primary-light-1);
        }
      }*/
    }
  }
}
</style>
