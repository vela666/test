<script setup>
import { ref, computed } from 'vue'
import { CaretBottom } from '@element-plus/icons-vue'
import useUserStore from '@/store/modules/user'
import { generateVersionUrl } from '@/utils/domesticOverseas.js'
import { t } from '@/locales/i18n'

const visible = ref(false)
const visibleChange = (val) => {
  visible.value = val
}

const versionEnum = {
  1: t('layouts.domesticVersion'),
  2: t('layouts.abroadVersion'),
}
const versionArr = Object.keys(versionEnum).map((el) => ({
  label: versionEnum[el],
  value: el,
}))
const userStore = useUserStore()

const commandChange = async (version) => {
  if (+version === +userStore.userInfo.currentVersion) return
  const a = document.createElement('a')
  a.href = await generateVersionUrl(version, true, location.hash.split('?')[0])
  a.target = '_blank'
  a.click()
}
const popperConfig = computed(() => {
  return {
    modifiers: [
      {
        name: 'offset',
        options: {
          offset: [0, 4],
        },
      },
    ],
  }
})

defineOptions({
  name: 'VersionSwitch',
})
</script>

<template>
  <el-dropdown
    trigger="click"
    class="version-switch"
    popper-class="version-switch-popper"
    @visible-change="visibleChange"
    @command="commandChange"
    :popper-options="popperConfig">
    <div
      :class="[
        'version-switch-panel',
        +userStore.userInfo.currentVersion === 2 ? 'oversea' : '',
      ]">
      <span class="mr3">{{
        versionEnum[userStore.userInfo.currentVersion]
      }}</span>
      <el-icon
        :class="[
          'version-switch-icon',
          'transition-all',
          visible ? 'is-rotate' : '',
        ]"
        ><CaretBottom
      /></el-icon>
    </div>
    <template #dropdown>
      <el-dropdown-menu class="version-switch-menu">
        <el-dropdown-item
          :disabled="
            +userStore.userInfo.supportVersion !== 3 &&
            +userStore.userInfo.supportVersion !== +item.value
          "
          v-for="item of versionArr"
          :key="`${item.label}_${item.value}`"
          :command="item.value"
          :class="[
            +item.value === +userStore.userInfo.currentVersion
              ? 'is-selected'
              : '',
          ]">
          {{ item.label }}
          <Tooltip
            placement="right"
            :visible-arrow="false"
            v-if="
              +userStore.userInfo.supportVersion !== 3 &&
              +userStore.userInfo.supportVersion !== +item.value
            ">
            <SvgIcon class="ml5" name="help2" />

            <template #content>
              {{
                $t('layouts.notAvailable', [
                  userStore.userInfo.supportVersion === 1
                    ? $t('layouts.abroadVersion')
                    : $t('layouts.domesticVersion'),
                ])
              }}
            </template>
          </Tooltip>
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<style scoped lang="scss">
.version-switch {
  display: flex;
  align-items: center;
  margin-right: 20px;
}
.version-switch-panel {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 90px;
  height: 36px;
  background-color: var(--eas-color-primary-light);
  padding: 0 10px;
  color: var(--eas-color-primary);
  font-size: var(--eas-font-size-base);
  font-weight: bold;
  border-radius: var(--eas-border-radius);
  &:focus {
    outline: 0;
  }
  cursor: pointer;
  &.oversea {
    color: var(--eas-color-warning);
    background-color: var(--eas-color-warning-light);
  }
  &.is-disabled {
    cursor: not-allowed;
    background-color: var(--eas-color-primary-light-1);
    color: var(--eas-color-primary-disabled);
  }
}
.version-switch-menu {
  width: 90px;
  height: 80px;
  padding: 4px;
  border-radius: var(--eas-border-radius);
  :deep(.el-dropdown-menu__item) {
    height: 36px;
    padding: 8px 0 9px 4px;
    font-size: var(--eas-font-size-base);

    &:not(.is-disabled) {
      color: var(--eas-text-color-primary);
      &:hover {
        background-color: var(--eas-hover-color);
      }
    }

    &.is-selected {
      color: var(--eas-color-primary);
      background-color: var(--eas-color-primary-light-1) !important;
    }
  }
}
.version-switch-icon {
  font-size: var(--eas-font-size-medium);
  transition: all 0.3s;
}
.is-rotate {
  transform: rotate(-180deg);
}
</style>
<style lang="scss">
.version-switch-popper {
  .el-popper__arrow {
    display: none;
  }
}
</style>
