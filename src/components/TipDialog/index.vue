<template>
  <el-dialog
    v-model="show"
    :close-on-click-modal="closeOnClickModal"
    :close-on-press-escape="closeOnPressEscape"
    :class="['nd-tip-dialog', className].join(' ')"
    append-to-body
    :width="width"
    align-center
    :show-close="!loading"
    destroy-on-close
    @closed="closed"
    @open="opened"
    v-bind="attrs">
    <template #header>
      <div class="el-dialog__title">
        <SvgIcon
          :name="iconEnumerate[iconType].svg"
          :class="iconEnumerate[iconType].class" />

        <span class="ml10">
          {{ title }}
          <slot name="header"></slot>
        </span>
      </div>
    </template>
    <div v-loading="loading" class="nd-tip-dialog-container">
      <div class="c545e6e">
        <div v-html="content"></div>
        <slot></slot>
      </div>
      <section>
        <div class="dialog-footer-l">
          <slot name="footer"></slot>
        </div>
        <div class="dialog-footer-r">
          <slot name="btn" :updShow="updShow"></slot>
          <template v-if="!Object.keys($slots).includes('btn') && showBtn">
            <el-button
              :text="!btnSwap"
              :type="btnSwap ? 'primary' : ''"
              class="skip"
              @click="show = false">
              {{ $t('btn.cancel') }}
            </el-button>
            <el-button
              :type="!btnSwap ? 'primary' : ''"
              @click="submit"
              :disabled="loading">
              {{ subTxt || $t('btn.confirm') }}
            </el-button>
          </template>
        </div>
      </section>
    </div>
  </el-dialog>
</template>

<script setup>
import { watch, computed, useAttrs } from 'vue'
import { ElButton, ElDialog, vLoading } from 'element-plus'
import { t } from '@/locales/i18n'

/*
 可调用index.js文件以函数方式调用像 elmessage-box一样
 可以用一个tipDialogOption变量 保存所有信息 来完成共用一个组件 不需要写多个
 src/views/system/role-manage/hooks/useState.js 可看这个
<TipDialog
    iconType="3"
    btnSwap
    v-model="state.tipDialog"
    :title="tipDialogOption.title"
    @submit="operationCallback(tipDialogOption.type, true)"
  >
    {{ tipDialogOption.content }}
  </TipDialog>*/

// 1:成功 2:失败 3:警告 4:信息
const iconEnumerate = {
  1: {
    svg: 'success1',
    class: 'c00b42a',
  },
  2: {
    svg: 'error1',
    class: 'cf53f3f',
  },
  3: {
    svg: 'warning1',
    class: 'cff7d00',
  },
  4: {
    svg: 'info1',
    class: 'c5473e8',
  },
}

const attrs = useAttrs()
const props = defineProps({
  // 如不满足则用default插槽
  content: {
    type: [String, Number],
    default: '',
  },
  // 实例 用于销毁
  instance: {
    type: Object,
    default: () => {},
  },
  // 针对只需要提示
  needLoading: {
    type: Boolean,
    default: true,
  },
  // -----以上都是函数方式调用 时传的
  // 1:成功 2:失败 3:警告 4:信息
  iconType: {
    type: [String, Number],
    default: 3,
  },
  modelValue: {
    type: Boolean,
    default: false,
  },
  // 按钮样式互换
  btnSwap: {
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
    default: '424px',
  },
  title: {
    type: [String],
    default: '',
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
  // 最大高度
  maxH: {
    type: String,
    default: '75%',
  },
})
const emit = defineEmits([
  'update:modelValue',
  'update:loading',
  'submit',
  'close',
  'open',
  'reject',
  'resolve',
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

const updShow = (bool = false) => {
  emit('resolve')
  if (!props.needLoading) {
    emit('update:loading', props.needLoading)
    show.value = props.needLoading
    return
  }
  emit('update:loading', bool)
  show.value = bool
}

const closed = () => {
  emit('close')
  if (!props.instance) return
  emit('reject', t('btn.cancel'))
  props.instance.unmount()
  document.body.removeChild(props.instance._container)
}

// 解决嵌套某些内容渲染时很慢 导致对话框有卡顿问题
const opened = () => {
  let setId = setTimeout(() => {
    emit('open')
    clearTimeout(setId)
    setId = null
  })
}

const submit = () => {
  emit('submit', props.instance ? updShow : '')
  if (!props.instance) return
  emit('update:loading', props.needLoading)
  emit('resolve')
  !props.needLoading && updShow()
}
defineOptions({
  name: 'TipDialog',
})
</script>

<style lang="scss">
.nd-tip-dialog {
  display: flex;
  flex-direction: column;
  max-height: var(--nd-dialog-maxH, 75%);
  border-radius: 10px;
  padding: 0;

  .el-dialog__body {
    display: flex;
    flex-direction: column;
    padding: 0;
    overflow: hidden;
  }

  .el-dialog__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-right: 0;
    padding: 20px 32px;

    .el-dialog__title {
      display: flex;
      align-items: center;

      > * {
        &:not(.svg-icon) {
          font-size: 16px;
          color: #333;
          font-weight: 700;
        }
      }
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
</style>
<style lang="scss" scoped>
.nd-tip-dialog-container {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: inherit;

  > div {
    flex: 1;
    overflow-y: auto;
    word-break: break-all;
    word-wrap: break-word;
    // white-space: pre-wrap;
    padding: 1px 32px;
  }

  > section {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 32px;
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
