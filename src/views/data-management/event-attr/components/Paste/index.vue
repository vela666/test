<template>
  <CommonDrawer
    @submit="submit"
    @close="close"
    :loading="state.operateLoading"
    v-model="state.showOperate"
    :title="$t('btn.paste')"
    :size="`${+props.type === 1 ? 1070 : 950}px`">
    <el-form
      label-position="top"
      class="flex gap10"
      ref="formRef"
      scroll-to-error
      :model="state.formData">
      <div class="nd-serial-number">
        <div v-for="item of state.formData.attrList.length" :key="item">
          <div class="nd-active-bg fz28">
            <span class="fz14 c545e6e">{{ item }}</span>
          </div>
        </div>
      </div>
      <div class="flex-column" v-for="column of columns" :key="column.label">
        <el-form-item
          v-for="(item, index) of state.formData.attrList"
          :key="index"
          :label="!index ? column.label : ''"
          :prop="`attrList.${index}.${column.prop}`"
          :rules="column.rules"
          class="mt5">
          <div
            v-if="column.prop === columns.slice(-1)[0].prop"
            class="w140 nd-fake-input nd-not-allowed"
            v-showTips>
            {{ attrTypeListMap[item[column.prop]] }}
            <el-button
              v-if="item[column.prop] === 4"
              text
              @click="viewConfig({ ...item, currentIndex: index })"
              type="primary">
              {{ $t('user.viewConfig') }}
            </el-button>
          </div>
          <component
            v-else
            :class="[column.class || 'w120']"
            :prefixSlot="false"
            :trimAllSpace="column.prop !== 'fZh'"
            :attrType="item.type"
            :maxlength="column.max"
            show-word-limit
            @blur="validateForm(generateValidateKeys(column.prop))"
            :desc="$t('common.pleaseEnter')"
            v-model="item[column.prop]"
            :is="column.component || CommonInput" />
        </el-form-item>
      </div>
      <div
        class="nd-serial-number ml5"
        v-if="state.formData.attrList.length > 1">
        <div
          v-for="(item, index) of state.formData.attrList.length"
          :key="item">
          <div @click="deleteRow(index)" class="nd-operate-btn-active fz28">
            <SvgIcon class="c86919d fz16" name="delete1" />
          </div>
        </div>
      </div>
    </el-form>
  </CommonDrawer>
  <ViewConfig :type="type" @updSql="updSql" ref="viewconfigRef" />
</template>

<script setup>
import { h, nextTick, reactive, ref } from 'vue'
import ViewConfig from './ViewConfig.vue'
import { validIdentifierRegex1 } from '@/utils/validate'
import { cloneDeep, debounce } from 'lodash-es'
import { ElOption, ElSelect, ElMessage } from 'element-plus'
import {
  attrTypeListMap,
  filteNotDisplayrDataTypeMap,
  virtualTypeList,
} from '@/enumeration/data-management/event-attr'
import { restoreGetEnum } from '@/utils/dataProcessing'
import { asyncAddEventAttr } from '@/api/modules/data-management/event-attr'
import { asyncAddUserAttr } from '@/api/modules/data-management/user'

import CommonInput from '@/components/CommonInput/index.vue'
import CustomField from '@/components/CustomField/index.vue'
import { recordBehavior } from '@/utils/record-behavior.js'
import { asyncGetAppEvents } from '@/api/modules/data-management/event.js'
import { t } from '@/locales/i18n'

const initVal = () => {
  return {
    operateLoading: false,
    showOperate: false,
    formData: {
      attrList: [],
    },
    configEventList: [],
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
const columns = [
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
    class: +props.type === 1 ? 'w120' : 'w160',
    max: 50,
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
          /* if (/\s/g.test(val)) {
            callback(new Error(`显示名不能包含空格`))
            return
          }*/
          let bool =
            state.formData.attrList.filter((item) => {
              return val === item.fZh + ''
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
    component: (props) => {
      const data =
        props.attrType === 4
          ? virtualTypeList
          : restoreGetEnum({
              data: filteNotDisplayrDataTypeMap,
            })
      return h(ElSelect, { ...props }, () =>
        data.map((item) => {
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
    class: 'w110',
    max: 20,
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
    max: 200,
  },
  ...(+props.type === 1
    ? [
        {
          label: t('dataManagement.eventAttr.configureEvents'),
          prop: 'eventIdList',
          component: (props) => {
            return h(CustomField, {
              ...props,
              class: 'w140',
              label: t('dataManagement.eventProp'),
              //自定义去除预置
              data: state.configEventList.filter(
                (v) => props.attrType !== 2 || v.eventType !== 2
              ),
              defaultProps: {
                value: 'eventId',
                label: 'eventName',
              },
            })
          },
        },
      ]
    : []),
  {
    label: t('common.type'),
    prop: 'type',
    disabled: true,
    type: true,
  },
]

const emit = defineEmits(['getData'])
const state = reactive(initVal())
const formRef = ref(null)
const viewconfigRef = ref(null)

const updSql = (data) => {
  state.formData.attrList[data.currentIndex].sql = data.sql
  state.formData.attrList[data.currentIndex].referField = data.referField
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

const close = () => {
  Object.assign(state, initVal())
}
const submit = () => {
  formRef.value.validate(async (valid) => {
    if (!valid) return

    const bool = +props.type === 1
    recordBehavior({
      moduleName: '数据管理',
      submoduleName: bool ? '事件属性' : '用户属性',
      operate: '复制粘贴事件',
    })
    const fn = bool ? asyncAddEventAttr : asyncAddUserAttr

    state.operateLoading = true
    const { code } = await fn({
      [bool ? 'eventPropertyList' : 'userPropertyList']:
        state.formData.attrList.map((item) => {
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
      state.showOperate = false
      ElMessage.success(t('dataManagement.pasteSuccessful'))
      emit('getData')
    }
  })
}

const getAppEvents = async () => {
  state.operateLoading = true
  const { data } = await asyncGetAppEvents().finally((_) => {
    state.operateLoading = false
  })
  state.configEventList = data
  // 重置不存在的数据类型
  state.formData.attrList.forEach((item) => {
    //自定义属性去除预置
    item.eventIdList = data
      .filter((v) => (item.type === 2 ? v.eventType !== 2 : true))
      .reduce((p, c) => {
        item.eventNameList?.forEach((item) => {
          if (c.eventName === item) {
            p.push(c.eventId)
          }
        })
        return p
      }, [])
  })
}

const open = (val = []) => {
  state.formData.attrList = val
  state.showOperate = true
  if (+props.type === 1) getAppEvents()
}

const viewConfig = (val) => {
  viewconfigRef.value.open(cloneDeep(val))
}
defineExpose({
  open,
})
defineOptions({
  name: 'Paste',
})
</script>
