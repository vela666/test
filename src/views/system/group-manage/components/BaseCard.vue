<template>
  <div :class="{ 'base-card-active': selected }" class="base-card">
    <div class="flex mb10 flex-between w100-percentage">
      <span class="header-title ellipsis">{{ item.projectName }}</span>
      <slot></slot>
    </div>
    <div class="w100-percentage flex-column gap10">
      <div class="desc">
        <span>{{ $t('system.projectTeams.projectLeader') }}：</span>
        <span class="ellipsis">{{ item.projectManagerListStr }}</span>
      </div>
      <div class="desc">
        <span>{{ $t('common.createBy') }}：</span>
        <span>{{ item.createBy }}</span>
      </div>
      <div class="desc">
        <span>{{ $t('common.createTime') }}：</span>
        <span>{{ item.createTime }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  item: {
    type: Object,
    require: true,
  },
  // 是否选中
  selected: {
    type: Boolean,
    default: false,
  },
})

defineOptions({
  name: 'BaseCard',
})
</script>

<style lang="scss" scoped>
.base-card {
  position: relative;
  width: 270px;
  height: 140px;
  border-radius: 4px;
  border: 1px solid var(--eas-text-color-light-1);
  padding: 20px;
  :deep(.nd-operate) {
    .svg-icon {
      color: var(--eas-text-color-light);
      visibility: hidden;
    }
  }
  .desc {
    display: flex;
    font-size: 12px;
    white-space: nowrap;

    .ellipsis {
      max-width: 160px;
    }

    > span {
      &:first-of-type {
        color: var(--eas-text-color-light);
      }

      &:last-of-type {
        color: var(--eas-text-color-primary);
      }
    }
  }

  &:first-of-type {
    margin-top: 6px;
  }

  &:last-of-type {
    margin-bottom: 6px;
  }

  .header-title {
    max-width: 170px;
    font-size: 14px;
    font-weight: bold;
    color: var(--eas-text-color-light);
  }

  &:hover {
    &:not(.base-card-active) {
      border-color: transparent;
      box-shadow: 0 0 6px 1px rgba(28, 32, 40, 0.18);

      .header-title {
        color: var(--eas-color-primary);
      }
      :deep(.nd-operate) {
        .svg-icon {
          visibility: visible;
        }
      }
    }
  }
}

.base-card-active {
  border-color: transparent;
  box-shadow: 0 0 6px 1px rgba(28, 32, 40, 0.18);

  .header-title {
    color: var(--eas-color-primary);
  }

  :deep(.nd-operate) {
    .svg-icon {
      visibility: visible;
    }
  }

  &:before {
    content: '';
    position: absolute;
    display: block !important;
    left: -1px;
    top: -1px;
    height: 140px;
    width: 6px;
    background-color: var(--eas-color-primary);
    border-top-left-radius: 4px;
    border-bottom-left-radius: 4px;
  }
}
</style>
