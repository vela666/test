<template>
  <div
    :class="{
      'nd-sql-editor-disabled': disabled,
      'nd-sql-editor-hidden': !sqlShow,
    }"
    class="w100-percentage h100-percentage nd-sql-editor">
    <VAceEditor
      @change="(...reset) => emit('change', reset)"
      v-model:value="sqlContent"
      v-bind="attrs"
      class="w100-percentage"
      lang="mysql"
      :options="{
        enableBasicAutocompletion: true,
        enableSnippets: true,
        enableLiveAutocompletion: true,
        tabSize: 6,
        fontSize: 14,
        maxLines: maxLines,
        minLines: minLines,
        wrap: true,
        showPrintMargin: false,
      }"
      ref="vAceEditorRef" />
  </div>
  <div v-if="toolbar" class="w100-percentage">
    <div v-if="$slots.toolbar" class="sql-toolbar">
      <slot name="toolbar" />
    </div>
    <div class="sql-toolbar" v-else>
      <Tooltip>
        <el-link
          v-if="isExternal(operateMap[type].help)"
          class="fz28 nd-operate-btn-active"
          :underline="false"
          :href="operateMap[type].help"
          target="_blank">
          <SvgIcon class="fz16" name="help3" />
        </el-link>
        <el-button
          v-else
          class="p0 m0 nd-operate-btn-active fz28"
          text
          @click="sqlContent = ''">
          <SvgIcon class="fz16" name="help3" />
        </el-button>
        <template #content>
          <span
            v-html="
              isExternal(operateMap[type].help)
                ? $t('common.help')
                : operateMap[type].help
            "></span>
        </template>
      </Tooltip>

      <Tooltip>
        <el-link
          class="fz28 nd-operate-btn-active"
          :underline="false"
          :href="operateMap[type].example"
          target="_blank">
          <SvgIcon class="fz16" name="example1" />
        </el-link>
        <template #content>{{ $t('common.example') }}</template>
      </Tooltip>

      <Tooltip>
        <el-button
          class="p0 m0 nd-operate-btn-active fz28"
          text
          @click="handleClipboard(`{AppId:appId}`, $event)">
          <SvgIcon class="fz16" name="copy3" />
        </el-button>
        <template #content
          >{{ $t('common.copyTemplateExpression') }}{AppId:appId}</template
        >
      </Tooltip>

      <Tooltip>
        <el-button
          :disabled="!sqlContent"
          class="p0 m0 nd-operate-btn-active fz28"
          text
          @click="sqlContent = ''">
          <SvgIcon class="fz16" name="delete1" />
        </el-button>
        <template #content>{{ $t('common.clear') }}</template>
      </Tooltip>

      <Tooltip>
        <el-button
          :disabled="!sqlContent"
          class="p0 m0 nd-operate-btn-active fz28"
          text
          @click="sqlFormat">
          <SvgIcon class="fz16" name="format1" />
        </el-button>
        <template #content>{{ $t('common.format') }}</template>
      </Tooltip>

      <Tooltip>
        <el-button
          :disabled="!sqlContent"
          class="p0 m0 nd-operate-btn-active fz28"
          text
          @click="handleClipboard(sqlContent, $event)">
          <SvgIcon class="fz18" name="copy2" />
        </el-button>
        <template #content>{{ $t('common.copySQL') }}</template>
      </Tooltip>

      <el-button
        type="primary"
        class="m0"
        :disabled="!sqlContent || verifyBtnDisabled"
        :loading="loading"
        @click="emit('validateSQL')">
        {{ $t('btn.check') }}
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, useAttrs } from 'vue'
import { VAceEditor } from 'vue3-ace-editor'
import 'ace-builds/src-noconflict/mode-mysql'
import 'ace-builds/src-noconflict/theme-chrome'
import { addCompleter } from 'ace-builds/src-noconflict/ext-language_tools'
import 'ace-builds/src-noconflict/ext-beautify'
import 'ace-builds/src-noconflict/snippets/mysql'
import 'ace-builds/src-noconflict/ext-static_highlight'
import { format } from 'sql-formatter'
import handleClipboard from '@/utils/clipboard'
import { isExternal } from '@/utils'
import useCommonStore from '@/store/modules/common.js'
import { t } from '@/locales/i18n'
const useCommon = useCommonStore()

// import * as ace from 'ace-builds'
// ace.config.loadModule('ace/ext/language_tools', (langTools) => {
//   langTools.addCompleter(tipsCompleter)
// })

onMounted(async () => {
  tipsData.value = await useCommon.getSqlTipInfo()
})

/**
 * @description: 自定义提示语
 * @return {*}
 */
// caption 显示的名称；value 插入的值；score 权重（数值越大，提示越靠前）；meta 描述
const tipsData = ref([])
let tipsCompleter = {
  getCompletions: (editor, session, pos, prefix, callback) => {
    callback(null, tipsData.value)
  },
}
addCompleter(tipsCompleter)

const operateMap = {
  // 自定义表-中间表
  1: {
    help: 'https://help.aliyun.com/document_detail/130512.html?spm=a2c4g.11186623.3.3.42a4159aRe3air',
    example: 'https://yifants.feishu.cn/docx/AzkFdO7KSovqpkxO7iNcPBLLnNb',
  },
  // 事件属性
  2: {
    help: `${t('analysis.sqlquery.expressionRules')}<br />
            ${t('analysis.sqlquery.expressionRules1')}<br />
            ${t('analysis.sqlquery.expressionRules2')}<br />
            ${t('analysis.sqlquery.expressionRules3')}<br />
            ${t('analysis.sqlquery.expressionRules4')}<br />
            ${t('analysis.sqlquery.expressionRules5')}<br />
            ${t('analysis.sqlquery.expressionRules6')}<br />
            ${t('analysis.sqlquery.expressionRules7')}`,
    example: 'https://yifants.feishu.cn/docx/doxcnyddUqyrLKnZffbNThamfHb',
  },
  3: {
    // 用户分群-自定义SQL分群
    help: 'https://help.aliyun.com/zh/hologres/user-guide/developer-guide/',
    example: 'https://yifants.feishu.cn/docx/doxcnwEm9k4SfFoX863EC9vE0ae',
  },
  // 用户标签/SQL标签
  4: {
    // 用户分群-自定义SQL分群
    help: 'https://help.aliyun.com/zh/hologres/user-guide/developer-guide/',
    example: 'https://yifants.feishu.cn/docx/doxcnwEm9k4SfFoX863EC9vE0ae',
  },
}

const attrs = useAttrs()

const props = defineProps({
  disabled: {
    type: Boolean,
    default: false,
  },
  // 要提示的内容 和 operateMap对应
  type: {
    type: String,
    default: '1',
  },
  modelValue: {
    type: String,
    default: '',
  },
  maxLines: {
    type: [String, Number],
    default: 30,
  },
  minLines: {
    type: [String, Number],
    default: '12',
  },
  toolbar: {
    type: Boolean,
    default: false,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  // 禁用校验按钮
  verifyBtnDisabled: {
    type: Boolean,
    default: false,
  },
  // 隐藏/显示sql输入框
  sqlShow: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['update:modelValue', 'validateSQL', 'change'])

const sqlContent = computed({
  get() {
    return props.modelValue
  },
  set(val) {
    emit('update:modelValue', val)
  },
})

/**
 * @description: 格式化SQL
 * @return {*}
 */
const sqlFormat = () => {
  sqlContent.value = getFormatSQL(sqlContent.value)
}

/**
 * @description: 格式化SQL
 * @return {*}
 */
const getFormatSQL = (value) => {
  return format(value.trim(), {
    language: 'postgresql',
    tabWidth: 4,
    keywordCase: 'upper',
    linesBetweenQueries: 2,
  })
}

const vAceEditorRef = ref()

const getVAceEditorEle = () => {
  return vAceEditorRef.value
}

defineExpose({
  getFormatSQL,
  getVAceEditorEle,
})

defineOptions({
  name: 'AceEditor',
})
</script>

<style lang="scss" scoped>
.sql-toolbar {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  width: 100%;
  padding: 10px 0;
  gap: 14px;
  .el-link {
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
svg {
  pointer-events: none;
}
.nd-operate-btn-active {
  color: var(--eas-text-color-light);
}

.nd-sql-editor {
  border: 1px solid var(--eas-border-color-2);
}
.nd-sql-editor-disabled {
  opacity: 0.7;
  :deep(.ace_scroller) {
    pointer-events: none;
  }
}
.nd-sql-editor-hidden {
  display: none;
}
</style>
<style lang="scss">
.ace_editor.ace_autocomplete {
  width: 500px;
}
</style>
