<template>
  <CommonDrawer
    @submit="submit"
    @close="close"
    :loading="state.operateLoading"
    v-model="state.showOperate"
    size="885px"
    :title="$t('dataManagement.event.addCustomEvents')">
    <CommonUpload
      ref="commonUploadRef"
      :on-exceed="clearFiles"
      :show-file-list="false"
      @change="handelUploadFile">
      <template #desc>
        <div class="c86919d">
          {{ $t('dataManagement.supportFileExtensions') }}.xls / .xlsx
        </div>
        <div class="c86919d">
          {{ $t('dataManagement.clickDownloadTemplate')
          }}<a
            @click.stop
            target="_blank"
            class="c5473e8"
            :href="externalUrl.event"
            >事件.xlsx</a
          >
        </div>
      </template>
    </CommonUpload>
    <el-button @click="addRow" class="mt20 mb10" type="primary" text
      >+ {{ $t('dataManagement.addRow') }}
    </el-button>
    <el-form
      v-if="state.formData.eventList.length"
      label-position="top"
      class="flex gap10"
      ref="formRef"
      scroll-to-error
      :model="state.formData">
      <div class="nd-serial-number">
        <div v-for="item of state.formData.eventList.length" :key="item">
          <div class="nd-active-bg fz28">
            <span class="fz14 c545e6e">{{ item }}</span>
          </div>
        </div>
      </div>
      <div
        class="flex-column"
        v-for="column of state.columns"
        :key="column.label">
        <el-form-item
          v-for="(item, index) of state.formData.eventList"
          :key="index"
          :label="!index ? column.label : ''"
          :prop="`eventList.${index}.${column.prop}`"
          :rules="column.rules"
          class="mt5">
          <CommonInput
            class="w230 mr10"
            :prefixSlot="false"
            :trimAllSpace="column.prop !== 'eventNameZh'"
            :maxlength="column.max"
            show-word-limit
            @blur="validateForm(generateValidateKeys(column.prop))"
            :desc="$t('common.pleaseEnter')"
            v-model="item[column.prop]" />

          <div
            @click="deleteRow(index, column.prop)"
            v-if="
              column.prop === state.columns.slice(-1)[0].prop &&
              state.formData.eventList.length > 1
            "
            class="nd-operate-btn-active fz28 ml10">
            <SvgIcon class="c86919d fz16" name="delete1" />
          </div>
        </el-form-item>
      </div>
    </el-form>
  </CommonDrawer>
</template>

<script setup>
import { nextTick, markRaw, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { analysisExcel } from '@/utils/excel'
import { validIdentifierRegex } from '@/utils/validate'
import { debounce } from 'lodash-es'

import { asyncAddCustomEvent } from '@/api/modules/data-management/event'
import { externalUrl } from '@/enumeration'
import { recordBehavior } from '@/utils/record-behavior.js'
import { t } from '@/locales/i18n'

const initVal = () => {
  return {
    columns: [],
    operateLoading: false,
    showOperate: false,
    formData: {
      eventList: [],
    },
  }
}
const trigger = ['blur', 'change']
const columnMap = [
  {
    label: t('dataManagement.eventName'),
    prop: 'eventName',
    rules: [
      {
        required: true,
        message: t('dataManagement.eventNameRules'),
        trigger,
      },
      {
        validator: (rule, value, callback) => {
          const val = value + ''
          if (val.length > 50) {
            callback(new Error(t('dataManagement.upToCharacters', [50])))
            return
          }
          if (!validIdentifierRegex(val)) {
            callback(new Error(t('dataManagement.eventNameRules')))
            return
          }
          let bool =
            state.formData.eventList.filter((item) => val === item.eventName)
              .length > 1
          if (bool) {
            callback(new Error(t('dataManagement.duplicateEventVame')))
            return
          }
          callback()
        },
        trigger,
      },
      // { min: 1, max: 50, message: '最多50字符', trigger },
    ],
    max: 50,
  },
  {
    label: t('dataManagement.displayName'),
    prop: 'eventNameZh',
    rules: [
      {
        required: true,
        message: t('common.pleaseEnter'),
        trigger,
      },
      {
        validator: (rule, value, callback) => {
          const val = value + ''
          if (val.length > 50) {
            callback(new Error(t('dataManagement.upToCharacters', [50])))
            return
          }
          /* if (/\s/g.test(val)) {
            callback(new Error(`显示名不能包含空格`))
            return
          }*/
          let bool =
            state.formData.eventList.filter((item) => {
              return val === item.eventNameZh + ''
            }).length > 1
          if (bool) {
            callback(new Error(t('dataManagement.duplicateDisplayVame')))
            return
          }
          callback()
        },
        trigger,
      },
      // { min: 1, max: 50, message: '最多50字符', trigger },
    ],
    max: 50,
  },
  {
    label: t('common.description'),
    prop: 'eventDesc',
    rules: [
      {
        validator: (rule, value, callback) => {
          if ((value + '').trim().length > 200) {
            callback(new Error(t('dataManagement.upToCharacters', [200])))
            return
          }
          callback()
        },
        trigger,
      },
      // { min: 0, max: 200, message: '最多200字符', trigger },
    ],
    max: 200,
  },
]
const rowKeys = columnMap.map((item) => item.prop)

const emit = defineEmits(['getData'])
const state = reactive(initVal())
const formRef = ref(null)
const commonUploadRef = ref(null)

let requestIdleCallbackId = null

const mapColumns = (bool = true, data = rowKeys) => {
  if (!state.columns.length) {
    state.columns = markRaw(
      data.map((item, i) => {
        return columnMap.find(
          (column) => column.prop === (bool ? item.prop : item)
        )
      })
    )
  }
}

const handelUploadFile = async (file, fileList) => {
  state.operateLoading = true
  const { excelColumns, excelData } = await analysisExcel(file, {
    format: true,
    customKey: rowKeys,
  }).finally((_) => {
    state.operateLoading = false
  })
  if (excelColumns.length < columnMap.length) {
    ElMessage.error(t('dataManagement.uploadByTemplate'))
    return
  }
  // 解析文件中的内容并生成表格
  state.formData.eventList = [...state.formData.eventList, ...excelData]
  mapColumns(true, excelColumns)

  requestIdleCallbackId = requestIdleCallback(
    () => {
      validateForm(generateValidateKeys())
      cancelIdleCallback(requestIdleCallbackId)
    },
    {
      timeout: 300,
    }
  )
}

const addRow = () => {
  mapColumns(false)
  state.formData.eventList.unshift(
    rowKeys.reduce((obj, key) => {
      obj[key] = ''
      return obj
    }, {})
  )
}

const deleteRow = (index) => {
  state.formData.eventList.splice(index, 1)
  validateForm(generateValidateKeys())
}

const generateValidateKeys = (key) => {
  return state.formData.eventList.reduce((p, item, i) => {
    if (key) {
      p.push(`eventList.${i}.${key}`)
    } else {
      Object.keys(item).forEach((k) => {
        p.push(`eventList.${i}.${k}`)
      })
    }
    return p
  }, [])
}

// 对某些字段校验
const validateForm = debounce((type) => {
  nextTick(async () => {
    await formRef.value.validateField(type).catch((e) => {
      console.log(e)
    })
  })
}, 300)

const clearFiles = (files) => {
  commonUploadRef.value.clearFiles(files)
}

const close = () => {
  Object.assign(state, initVal())
}
const submit = () => {
  if (!state.formData.eventList.length) return
  formRef.value.validate(async (valid) => {
    if (!valid) return
    recordBehavior({
      moduleName: '数据管理',
      submoduleName: '事件管理',
      operate: '新增自定义事件',
    })
    state.operateLoading = true
    const { code } = await asyncAddCustomEvent({
      eventList: state.formData.eventList.map((item) => ({
        ...item,
        eventType: 1,
      })),
    }).finally((_) => {
      state.operateLoading = false
    })
    if (code === 200) {
      ElMessage.success(t('common.addedSuccessfully'))
      state.showOperate = false
      emit('getData')
    }
  })
}

const open = () => {
  state.showOperate = true
}

defineExpose({
  open,
})
defineOptions({
  name: 'CustomEvent',
})
</script>

<style scoped lang="scss"></style>
