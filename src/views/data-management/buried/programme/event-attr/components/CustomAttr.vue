<template>
  <CommonDrawer
    @submit="submit"
    @close="close"
    :loading="state.operateLoading"
    v-model="state.showOperate"
    :title="$t('dataManagement.addAttribute')"
    :size="`${+props.type === 1 ? 1010 : 950}px`">
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
          {{ $t('dataManagement.clickDownloadTemplate') }}
          <a
            @click.stop
            target="_blank"
            class="c5473e8"
            :href="externalUrl[+type === 1 ? 'eventAttr' : 'userAttr']"
            >{{ +type === 1 ? '事件' : '用户' }}属性.xlsx</a
          >
        </div>
      </template>
    </CommonUpload>
    <el-button @click="addRow" class="mt20 mb10" type="primary" text
      >+{{ $t('dataManagement.addRow') }}</el-button
    >
    <el-form
      v-if="state.formData.attrList.length"
      label-position="top"
      class="flex gap10"
      ref="formRef"
      :model="state.formData">
      <div class="nd-serial-number">
        <div v-for="item of state.formData.attrList.length" :key="item">
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
          v-for="(item, index) of state.formData.attrList"
          :key="index"
          :label="!index ? column.label : ''"
          :prop="`attrList.${index}.${column.prop}`"
          :rules="column.rules"
          class="mt5">
          <component
            :class="[column.class, 'mr10']"
            :prefixSlot="false"
            :trimAllSpace="column.prop !== 'fZh'"
            :maxlength="column.max"
            show-word-limit
            @blur="validateForm(generateValidateKeys(column.prop))"
            :desc="$t('common.pleaseEnter')"
            v-model="item[column.prop]"
            :is="column.component || CommonInput" />
          <div
            @click="deleteRow(index, column.prop)"
            v-if="
              column.prop === state.columns.slice(-1)[0].prop &&
              state.formData.attrList.length > 1
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
import { h, markRaw, nextTick, reactive, ref } from 'vue'
import { ElMessage, ElOption, ElSelect } from 'element-plus'
import { analysisExcel } from '@/utils/excel'
import { validIdentifierRegex1 } from '@/utils/validate'
import { debounce } from 'lodash-es'
import { filteNotDisplayrDataTypeMap } from '@/enumeration/data-management/event-attr'
import { restoreGetEnum } from '@/utils/dataProcessing'
import { externalUrl } from '@/enumeration'
import { recordBehavior } from '@/utils/record-behavior.js'
import CommonInput from '@/components/CommonInput/index.vue'
import CustomField from '@/components/CustomField/index.vue'
import { asyncSearchEventList } from '@/api/modules/programme/event.js'
import { asyncAddEventField } from '@/api/modules/programme/event-attr.js'
import { asyncAddUserField } from '@/api/modules/programme/user.js'
import { t } from '@/locales/i18n'

const initVal = () => {
  return {
    columns: [],
    configEventList: [],
    operateLoading: false,
    showOperate: false,
    formData: {
      attrList: [],
    },
  }
}

const props = defineProps({
  // 1是事件属性 2是用户属性
  type: {
    type: String,
    default: '1',
  },
})

const trigger = ['blur', 'change']

const columnMap = [
  {
    label: t('dataManagement.attributeName'),
    prop: 'fEn',
    rules: [
      {
        required: true,
        message: t('dataManagement.attrNameRules'),
        trigger,
      },
      {
        validator: (rule, value, callback) => {
          const val = value + ''
          if (val.length > 50) {
            callback(new Error(t('dataManagement.upToCharacters', [50])))
            return
          }
          if (!validIdentifierRegex1(val)) {
            callback(new Error(t('dataManagement.attrNameRules')))
            return
          }
          let bool =
            state.formData.attrList.filter((item) => val === item.fEn).length >
            1
          if (bool) {
            callback(new Error(t('dataManagement.duplicateAttrVame')))
            return
          }
          callback()
        },
        trigger,
      },
      // { min: 1, max: 50, message: '最多50字符', trigger },
    ],
    max: 50,
    class: +props.type === 1 ? 'w140' : 'w180',
  },
  {
    label: t('dataManagement.displayName'),
    prop: 'fZh',
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
          /*if (/\s/g.test(val)) {
            callback(new Error(`显示名不能包含空格`))
            return
          }*/
          let bool =
            state.formData.attrList.filter((item) => {
              return val === item.fZh
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
    class: +props.type === 1 ? 'w140' : 'w180',
  },
  {
    label: t('dataManagement.dataType'),
    prop: 'fType',
    rules: [
      {
        required: true,
        message: t('dataManagement.pleaseSelectDynamic', [
          t('dataManagement.dataType'),
        ]),
        trigger,
      },
    ],
    class: 'w120',
    component: (props) => {
      return h(ElSelect, { ...props }, () =>
        restoreGetEnum({
          data: filteNotDisplayrDataTypeMap,
        }).map((item) => {
          return h(ElOption, { label: item.label, value: item.type })
        })
      )
    },
  },
  {
    label: t('dataManagement.unit'),
    prop: 'fUnit',
    rules: [
      {
        validator: (rule, value, callback) => {
          if ((value + '').trim().length > 20) {
            callback(new Error(t('dataManagement.upToCharacters', [20])))
            return
          }
          callback()
        },
        trigger,
      },
      // { min: 0, max: 200, message: '最多200字符', trigger },
    ],
    max: 20,
    class: 'w120',
  },
  {
    label: t('common.description'),
    prop: 'fDesc',
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
    class: 'w120',
    max: 200,
  },
  ...(+props.type === 1
    ? [
        {
          label: t('dataManagement.eventAttr.configureEvents'),
          prop: 'eventIds',
          component: (props) => {
            return h(CustomField, {
              ...props,
              label: t('dataManagement.eventProp'),
              data: state.configEventList,
              defaultProps: {
                value: 'eventId',
                label: 'eventName',
              },
            })
          },
        },
      ]
    : []),
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
  const { excelColumns, excelData } = await analysisExcel(file, {
    format: true,
    customKey: rowKeys,
  })
  if (excelColumns.length < columnMap.length) {
    ElMessage.error(t('dataManagement.uploadByTemplate'))
    return
  }
  // 解析文件中的内容并生成表格
  state.formData.attrList = [...state.formData.attrList, ...excelData]
  // 重置不存在的数据类型
  state.formData.attrList.forEach((item) => {
    if (!filteNotDisplayrDataTypeMap[item.fType]) {
      item.fType = ''
    }
    if (!Array.isArray(item.eventIds) && +props.type === 1) {
      const idList = item.eventIds.split(',')
      item.eventIds = state.configEventList.reduce((p, c) => {
        idList.forEach((item) => {
          if (c.eventName === item) {
            p.push(c.eventId)
          }
        })
        return p
      }, [])
    }
  })

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
  state.formData.attrList.unshift(
    rowKeys.reduce((obj, key) => {
      obj[key] = key === 'eventIds' ? [] : ''
      return obj
    }, {})
  )
}

const deleteRow = (index) => {
  state.formData.attrList.splice(index, 1)
  validateForm(generateValidateKeys())
}

const generateValidateKeys = (key) => {
  return state.formData.attrList.reduce((p, item, i) => {
    if (key) {
      p.push(`attrList.${i}.${key}`)
    } else {
      Object.keys(item).forEach((k) => {
        p.push(`attrList.${i}.${k}`)
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
  if (!state.formData.attrList.length) return
  formRef.value.validate(async (valid) => {
    if (!valid) return
    const bool = +props.type === 1

    recordBehavior({
      moduleName: '数据管理',
      submoduleName: '埋点方案',
      operate: `新增${bool ? '事件属性' : '用户属性'}`,
    })
    const fn = bool ? asyncAddEventField : asyncAddUserField

    state.operateLoading = true
    const { code } = await fn({
      fieldList: state.formData.attrList.map((item) => {
        const [fType, fLen = ''] = item.fType.split('_')
        return {
          ...item,
          fType,
          fLen,
        }
      }),
    }).finally((_) => {
      state.operateLoading = false
    })
    if (code === 200) {
      emit('getData')
      ElMessage.success(t('common.addedSuccessfully'))
      state.showOperate = false
    }
  })
}

const getAppEvents = async () => {
  state.operateLoading = true
  const {
    data: { list },
  } = await asyncSearchEventList({
    size: -1,
  }).finally((_) => {
    state.operateLoading = false
  })
  // 去除预置事件
  state.configEventList = list
}

const open = () => {
  state.showOperate = true
  if (+props.type === 1) getAppEvents()
}

defineExpose({
  open,
})
defineOptions({
  name: 'CustomAttr',
})
</script>
