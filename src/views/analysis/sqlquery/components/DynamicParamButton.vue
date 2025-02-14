<script setup>
import { ref, reactive } from 'vue'
import PasteDrawer from '@/views/data-management/components/ReuseToButton/PasteDrawer.vue'
import { t } from '@/locales/i18n'

const config = {
  options: [
    {
      value: 'add',
      label: t('btn.add'),
      children: [
        {
          value: 'Number',
          label: 'Number',
          desc: `<h3>${t('analysis.sqlquery.numericalExpression')}</h3><p>${t('analysis.sqlquery.expressionMsg', [t('analysis.sqlquery.numerical')])}</p><span>${t('analysis.sqlquery.example')}</span><p>... WHERE number {Number:nm} AND ...，${t('analysis.sqlquery.exampleMsg', [t('analysis.sqlquery.numerical')])}</p>`,
        },
        {
          value: 'Text',
          label: 'Text',
          desc: `<h3>${t('analysis.sqlquery.textExpression')}</h3><p>${t('analysis.sqlquery.expressionMsg', [t('analysis.sqlquery.string')])}</p><span>${t('analysis.sqlquery.example')}</span><p>... WHERE varchar {Text:tx} AND ...，${t('analysis.sqlquery.exampleMsg', [t('analysis.sqlquery.string')])}</p>`,
        },
        {
          value: 'DateTime',
          label: 'DateTime',
          desc: `<h3>${t('analysis.sqlquery.timeExpression')}</h3><p>${t('analysis.sqlquery.expressionMsg', [t('analysis.sqlquery.time')])}</p><span>${t('analysis.sqlquery.example')}</span><p>... WHERE time {DateTime:dt} AND ...，${t('analysis.sqlquery.exampleMsg', [t('analysis.sqlquery.time')])}</p>`,
        },
        {
          value: 'Date',
          label: 'Date',
          desc: `<h3>${t('analysis.sqlquery.dateExpression')}</h3><p>${t('analysis.sqlquery.expressionMsg', [t('analysis.sqlquery.date')])}</p><span>${t('analysis.sqlquery.example')}</span><p>... WHERE date {Date:dt} AND ...，${t('analysis.sqlquery.exampleMsg', [t('analysis.sqlquery.date')])}</p>`,
        },
        {
          value: 'Selector',
          label: 'Selector',
          desc: `<h3>${t('analysis.sqlquery.option')}</h3><p>${t('analysis.sqlquery.optionMsg')}</p><span>${t('analysis.sqlquery.example')}</span><p>WHERE {Selector:filter} AND ...，${t('analysis.sqlquery.optionExampleMsg')}</p>`,
        },
        {
          value: 'AppId',
          label: 'App Id',
          desc: `<h3>${t('analysis.sqlquery.applyIDExpression')}</h3><p>${t('analysis.sqlquery.applyIDExpressionMsg')}</p><span>${t('analysis.sqlquery.example')}</span><p>FROM event_{AppId:appId} ...</p>`,
        },
      ],
    },
    {
      value: 'copy',
      label: t('btn.copy'),
      info: t('analysis.sqlquery.copyTips'),
    },
    {
      value: 'paste',
      label: t('btn.paste'),
      info: t('analysis.sqlquery.pasteTips'),
    },
  ],
  props: {
    expandTrigger: 'hover',
  },
  coverFlag: false,
}

const state = reactive(config)

const dropdown = ref(null)
const cascaderPanel = ref(null)

const emit = defineEmits(['getSelectParam', 'paste'])

const handleChange = (val) => {
  if (val) {
    if (val[0] === 'paste') {
      paste()
    }
    const opt = val[0]
    let key = ''
    if (Object.keys(val).length > 1) {
      key = val[1]
    }
    emit('getSelectParam', opt, key)
    // 关闭弹框
    dropdown.value.handleClose()
    // 清除选中节点
    cascaderPanel.value.clearCheckedNodes()
  }
}

const pasteDrawerRef = ref(null)

/**
 * @description 打开粘贴弹框
 */
const paste = (data) => {
  if (data) {
    emit('paste', data, state.coverFlag)
    return
  }
  state.coverFlag = false
  pasteDrawerRef.value.open()
}

defineOptions({
  name: 'DynamicParamButton',
})
</script>
<template>
  <el-dropdown
    trigger="hover"
    popper-class="eas-prop-popper eas-param-dropdown"
    placement="bottom-start"
    ref="dropdown">
    <el-button>
      <svg-icon name="param" class="fz18 mr3"></svg-icon>
      {{ $t('analysis.sqlquery.dynamicParameter') }}
    </el-button>
    <template #dropdown>
      <div>
        <el-cascader-panel
          ref="cascaderPanel"
          :options="state.options"
          :props="state.props"
          @change="handleChange">
          <template #default="{ data }">
            <span>{{ data.label }}</span>
            <Tooltip v-if="data.info">
              <SvgIcon class="fz14 ml5" name="help2" />
              <template #content>
                {{ data.info }}
              </template>
            </Tooltip>
            <div v-if="data.desc" class="dynamicDesc" v-html="data.desc" />
          </template>
        </el-cascader-panel>
      </div>
    </template>
  </el-dropdown>
  <!-- 粘贴弹框 -->
  <PasteDrawer @paste="paste" type="7" ref="pasteDrawerRef">
    <template #footer>
      <el-checkbox
        v-model="state.coverFlag"
        :label="$t('analysis.sqlquery.coveringParameters')" />
    </template>
  </PasteDrawer>
</template>
<style lang="scss" scoped>
.dynamicDesc {
  position: absolute;
  top: 0;
  left: 116.5px;
  display: none;
  width: 290px;
  padding: 16px;
  color: var(--eas-text-color-primary);
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
  cursor: default;
  overflow: auto;
}
.el-cascader-node {
  &:hover {
    .dynamicDesc {
      display: block;
      line-height: 2;
      :deep(h3) {
        margin-bottom: 10px;
        font-weight: bold;
        font-size: 14px;
        color: var(--eas-text-color-primary);
      }
      :deep(p) {
        margin-bottom: 10px;
        font-size: 14px;
        line-height: 14px;
        white-space: pre-wrap;
        color: var(--eas-text-color-primary);
      }
      :deep(span) {
        margin-bottom: 10px;
        font-weight: bold;
        color: var(--eas-text-color-primary);
        font-size: 14px;
      }
    }
  }
}
</style>
<style lang="scss">
.eas-param-dropdown {
  .el-cascader-menu {
    min-width: 105px;
  }
  .el-scrollbar {
    overflow: visible;
  }
  .el-scrollbar__wrap {
    overflow: visible;
  }
  .el-cascader-menu__wrap.el-scrollbar__wrap {
    height: 220px;
  }
}
</style>
