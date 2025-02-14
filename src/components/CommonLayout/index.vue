<template>
  <div v-loading="loading" class="common-layout" :class="{ p20: pd }">
    <div class="common-layout-container">
      <div
        class="common-layout-header"
        v-if="Object.keys($slots).some((k) => ['hl', 'hr'].includes(k))">
        <div class="header-main">
          <div class="header-main-l">
            <slot name="hl"></slot>
          </div>
          <div class="header-main-r">
            <slot name="hr"></slot>
          </div>
        </div>
        <div></div>
      </div>
      <div class="common-layout-main">
        <slot></slot>
      </div>
      <div
        v-if="Object.keys($slots).includes('footer')"
        class="common-layout-footer">
        <slot name="footer"></slot>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  loading: {
    type: Boolean,
    default: false,
  },
  pd: {
    type: Boolean,
    default: false,
  },
})

defineOptions({
  name: 'CommonLayout',
})
</script>

<style scoped lang="scss">
.common-layout {
  width: 100%;
  height: 100%;
  overflow: hidden;
  &-container {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    background-color: #fff;
    padding: 0 20px;
  }

  &-header {
    width: 100%;
    min-height: 72px;
    display: flex;
    padding: 20px 0;
    justify-content: space-between;

    .header-main {
      width: 100%;
      display: flex;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 10px;
      &-l,
      &-r {
        display: flex;
        align-self: center;
        gap: 10px;
        /* :deep(.el-button) {
          margin: 0;
        }*/
      }
    }
  }
  &-main {
    flex: 1;
    overflow: hidden;
  }
  &-footer {
    height: 64px;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    position: relative;
  }

  .over-hidden {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .icon-btn {
    color: var(--eas-color-primary);
    cursor: pointer;

    + .icon-btn {
      margin-left: 12px;
    }
  }

  .title {
    position: relative;
    height: 20px;
    line-height: 20px;
    font-size: 12px;
    font-weight: bold;
    padding-left: 14px;
    margin-bottom: 20px;

    &:before {
      content: '';
      display: block;
      position: absolute;
      top: 0;
      left: 0;
      width: 4px;
      height: 16px;
      margin-top: 2px;
      background-color: var(--eas-color-primary);
    }
  }
}
</style>
