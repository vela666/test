<template>
  <el-drawer
    v-model="visible"
    append-to-body
    :show-close="!loading"
    destroy-on-close
    :close-on-click-modal="closeOnClickModal"
    :close-on-press-escape="closeOnPressEscape"
    :class="['nd-common-drawer', className].join(' ')"
    @close="close"
    :size="size"
    v-bind="attrs">
    <template #header v-if="$slots.title">
      <span class="el-drawer__title">
        <slot name="title"></slot>
      </span>
    </template>
    <div v-loading="loading">
      <!-- 要有tabs项参考
       src/assets/styles/global.scss 里的 .nd-tabs-container 类名写法
       src/views/see-plate/components/Dashboard/components/FilterCondition/index.vue
       -->
      <div class="n-drawer-tab-c">
        <div class="n-drawer-tab-c-t">
          <slot></slot>
        </div>
        <div class="flex-center flex-between p-20-32">
          <template v-if="needFooter">
            <div v-if="showFooterL">
              <slot name="footer-l"></slot>
            </div>
            <div v-if="showFooterR">
              <slot name="footer-r"></slot>
              <template v-if="showBtn">
                <el-button class="skip" @click="visible = false">
                  {{ $t('btn.cancel') }}
                </el-button>
                <el-button @click="emit('submit')" type="primary">
                  {{ subTxt || $t('btn.confirm') }}
                </el-button>
              </template>
            </div>
          </template>
        </div>
      </div>
    </div>
  </el-drawer>
</template>

<script setup>
import { computed, useAttrs } from 'vue'

const attrs = useAttrs()
const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  showFooterL: {
    type: Boolean,
    default: true,
  },
  showFooterR: {
    type: Boolean,
    default: true,
  },
  className: {
    type: String,
    default: '',
  },
  closeOnClickModal: {
    type: Boolean,
    default: false,
  },
  closeOnPressEscape: {
    type: Boolean,
    default: false,
  },
  showBtn: {
    type: Boolean,
    default: true,
  },
  size: {
    type: String,
    default: '900px',
  },
  subTxt: {
    type: String,
    default: '',
  },
  // 需要底部
  needFooter: {
    type: Boolean,
    default: true,
  },
  loading: {
    type: Boolean,
    default: false,
  },
})
const emit = defineEmits(['close', 'submit', 'update:modelValue'])
const visible = computed({
  get() {
    return props.show
  },
  set(val) {
    emit('update:modelValue', val)
  },
})
const close = () => {
  emit('close')
  // src/api/statusProcessing.js
  if (window.useTipModalInstance) {
    window.useTipModalInstance.unmount()
    document.body.removeChild(window.useTipModalInstance._container)
    window.useTipModalInstance = null
  }
}
defineOptions({
  name: 'CommonDrawer',
})
</script>

<style lang="scss">
.nd-common-drawer {
  background-color: #fff;
  .el-drawer__header {
    margin-bottom: 10px;
    align-items: center;
    justify-content: center;
    padding: 20px 32px;
  }

  .el-drawer__title {
    font-size: 16px;
    color: var(--eas-text-color);
    font-weight: bold;
  }

  .el-drawer__body {
    display: flex;
    flex-direction: column;
    padding: 0;
    > div {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
  }
}
</style>
<style lang="scss" scoped>
.n-drawer-tab-c {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;

  .n-drawer-tab-c-t {
    padding: 0 32px;
    flex: 1;
    overflow-y: auto;
  }
}
</style>
