<template>
  <div class="analysis-sidebar__container">
    <el-scrollbar>
      <div class="analysis-sidebar__body">
        <slot />
      </div>
    </el-scrollbar>
    <div class="analysis-sidebar__footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup></script>

<style lang="scss" scoped>
.analysis-sidebar {
  &__container {
    height: 100%;
    padding-left: 10px;
    color: var(--eas-text-color-primary);
    display: flex;
    flex-direction: column;
  }
  &__body {
    flex: 1;
    padding-right: 10px;
  }
  &__footer {
    height: 72px;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    padding-right: 20px;
    flex-shrink: 0;
  }
}
</style>
