<template>
  <el-dialog
    v-model="show"
    :close-on-click-modal="closeOnClickModal"
    :close-on-press-escape="closeOnPressEscape"
    :class="['add-or-upd-dialog', className].join(' ')"
    append-to-body
    :width="width"
    :show-close="!loading"
    destroy-on-close
    :fullscreen="fullscreen"
    @closed="emit('close')"
    @open="opened"
    v-bind="attrs">
    <template #header v-if="$slots.header">
      <div class="el-dialog__title">
        <slot name="header"></slot>
      </div>
    </template>
    <div v-loading="loading" class="add-or-upd-dialog-container">
      <div :style="[!needFooter && !fullscreen && 'margin-bottom: 20px;']">
        <slot></slot>
      </div>
      <section v-if="needFooter">
        <div class="dialog-footer-l">
          <slot name="footer"></slot>
        </div>
        <div class="dialog-footer-r">
          <slot name="footer-r" />
          <template v-if="showBtn">
            <el-button text class="skip" @click="cancel">
              {{ $t('btn.cancel') }}
            </el-button>
            <el-button @click="submit" :disabled="loading" type="primary">
              {{ subTxt || $t('btn.confirm') }}
            </el-button>
          </template>
        </div>
      </section>
    </div>
  </el-dialog>
</template>

<script setup>
/*<CommonDialog
    v-model="state.show"
    width="960px"
     title="测试"
    :loading="state.operatLoading"
@submit="submitForm"
@close="close">
 // 插槽
 <template #header>
      试验层【{{ state.infoData.experimentLayerName }}】详情
    </template>
内容
 </CommonDialog>*/
import { watch, computed, useAttrs } from 'vue'
import { debounce } from 'lodash-es'
import { ElButton, ElDialog } from 'element-plus'

const attrs = useAttrs()
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  // 点击其他地方关闭对话框
  closeOnClickModal: {
    type: Boolean,
    default: false,
  },
  // 按下 ESC 关闭 Dialog
  closeOnPressEscape: {
    type: Boolean,
    default: false,
  },
  className: {
    type: String,
    default: '',
  },
  width: {
    type: [String, Number],
    default: '550px',
  },
  // 需要底部
  needFooter: {
    type: Boolean,
    default: true,
  },
  // 是否显示按钮
  showBtn: {
    type: Boolean,
    default: true,
  },
  subTxt: {
    type: [String, Number],
    default: '',
  },
  loading: {
    type: Boolean,
    default: false,
  },
  fullscreen: {
    type: Boolean,
    default: false,
  },
  // 最大高度
  maxH: {
    type: String,
    default: '75%',
  },
  // 按钮样式互换
  btnSwap: {
    type: Boolean,
    default: false,
  },
})
const emit = defineEmits([
  'update:modelValue',
  'submit',
  'close',
  'open',
  'cancel',
])
const show = computed({
  get() {
    return props.modelValue
  },
  set(val) {
    emit('update:modelValue', val)
  },
})
watch(
  () => props.maxH,
  (val) => {
    // 设置全局css变量
    const docStyle = document.documentElement.style
    docStyle.setProperty('--nd-dialog-maxH', val)
  },
  { immediate: true }
)
// 解决嵌套某些内容渲染时很慢 导致对话框有卡顿问题
const opened = () => {
  let setId = setTimeout(() => {
    emit('open')
    clearTimeout(setId)
    setId = null
  })
}
const submit = debounce(() => {
  emit('submit')
}, 300)

const cancel = () => {
  show.value = false
  emit('cancel')
}

defineOptions({
  name: 'CommonDialog',
})
</script>
<style lang="scss">
.add-or-upd-dialog {
  &:not(.is-fullscreen) {
    display: flex;
    flex-direction: column;
    min-height: 240px;
    max-height: var(--nd-dialog-maxH, 75%);
    border-radius: 10px;

    .el-dialog__body {
      display: flex;
      flex-direction: column;
      padding: 0;
      overflow: hidden;
      min-height: 175px;
    }

    .el-dialog__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-right: 0;
      padding: 20px 32px;

      .el-dialog__title {
        font-size: 16px;
        color: #333;
        font-weight: 700;
      }

      .el-dialog__headerbtn {
        font-size: 20px;
        position: relative;
        top: 4px;
        width: auto;
        height: auto;
      }
    }
  }
  &.is-fullscreen {
    min-width: var(--nd-width);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    .el-dialog__header {
      padding: 20px;
    }
    .el-dialog__title {
      line-height: normal;
    }
    .el-dialog__body {
      border-top: 1px solid var(--eas-border-color);
      height: 100%;
      padding: 0;
      overflow: hidden;
    }
  }
}
</style>
<style lang="scss" scoped>
.add-or-upd-dialog {
  .add-or-upd-dialog-container {
    display: flex;
    flex-direction: column;
    overflow: hidden;

    > div {
      flex: 1;
      overflow-y: auto;
    }

    > section {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  }
  &:not(.is-fullscreen) {
    .add-or-upd-dialog-container {
      min-height: inherit;

      > div {
        padding: 1px 32px;
      }

      section {
        padding: 20px 32px;
      }
    }
  }
  &.is-fullscreen {
    .add-or-upd-dialog-container {
      height: 100%;
    }

    section {
      padding: 14px 20px;
    }
  }
}
.dialog-footer-l {
  font-size: 14px;
  color: #616161;
}

.dialog-footer-r {
  display: flex;
  align-items: center;
}
</style>
