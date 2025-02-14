<script setup>
import { ref, reactive, computed, watch, nextTick, useAttrs } from 'vue'
import VisualChartContent from './components/VisualChartContent.vue'
import { cloneDeep } from 'lodash-es'

const attrs = useAttrs()
const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
})

const VisualChartViewRef = ref(null)

/**
 * @description 关闭弹框
 */
const handleDialogClose = (type, config) => {
  dialogVisible.value = false
  if (type !== 'save') {
    emit('close')
  } else {
    emit('close', config)
  }
}

/**
 * @description 暂存
 */
const handleSaveClose = () => {
  VisualChartViewRef.value.handleSave((config) => {
    handleDialogClose('save', config)
  })
}

const emit = defineEmits(['update:visible', 'close'])

const dialogVisible = computed({
  get() {
    return props.visible
  },
  set(val) {
    emit('update:visible', val)
  },
})

defineOptions({
  name: 'visualChart',
})
</script>
<template>
  <div>
    <CommonDialog
      v-model="dialogVisible"
      :width="900"
      :title="$t('analysis.sqlquery.visualChart')"
      :show-close="false"
      :need-footer="false"
      fullscreen
      @close="handleDialogClose">
      <template #header>
        <DialogFullScreenHeader
          @close="handleDialogClose"
          :title="$t('analysis.sqlquery.visualChart')">
          <template #right>
            <div>
              <!-- 暂存 -->
              <el-button
                class="m0 skip"
                type="primary"
                @click="handleSaveClose">
                <SvgIcon class="fz16 mr3" name="save2" />
                <span class="fz14">{{
                  $t('analysis.sqlquery.temporaryStorage')
                }}</span>
              </el-button>
            </div>
          </template>
        </DialogFullScreenHeader>
      </template>
      <template #default>
        <VisualChartContent
          ref="VisualChartViewRef"
          v-bind="attrs"></VisualChartContent>
      </template>
    </CommonDialog>
  </div>
</template>
<style lang="scss" scoped>
.visual {
  height: 100%;
  overflow: hidden;
  background: var(--eas-color-primary-light-1);
  &-left {
    padding: 10px 0 0 10px;
    background: #ffffff;
    &-operate {
      > div {
        padding-bottom: 10px;
      }
    }
    .active {
      position: relative;
      color: var(--eas-color-primary);
      &:before {
        content: '';
        position: absolute;
        left: 0;
        bottom: 0;
        width: 100%;
        height: 4px;
        border-radius: 2px;
        background: var(--eas-color-primary);
      }
    }
    &-content {
      height: calc(100% - 61px);
    }
  }
  &-right {
    flex: 1;
    background: #ffffff;
    overflow: hidden;
  }
}
</style>
