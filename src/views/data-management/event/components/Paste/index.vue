<template>
  <CommonDrawer
    @submit="submit"
    @close="close"
    :loading="state.operateLoading"
    v-model="state.showOperate"
    :title="$t('btn.paste')"
    :size="size">
    <el-form
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
      <div class="flex-column" v-for="column of columns" :key="column.label">
        <el-form-item
          v-for="(item, index) of state.formData.eventList"
          :key="index"
          :label="!index ? column.label : ''"
          :prop="`eventList.${index}.${column.prop}`"
          :rules="column.rules"
          class="mt5">
          <div
            v-if="column.prop === columns.slice(-1)[0].prop"
            class="w180 mr10 nd-fake-input nd-not-allowed"
            v-showTips>
            {{ eventTypeListMap[item[column.prop]] }}
            <el-button
              v-if="item[column.prop] === 3"
              text
              @click="viewConfig({ ...item, currentIndex: index })"
              type="primary">
              {{ $t('user.viewConfig') }}
            </el-button>
          </div>
          <CommonInput
            v-else
            class="w180 mr10"
            :prefixSlot="false"
            :trimAllSpace="column.prop !== 'eventNameZh'"
            :maxlength="column.max"
            show-word-limit
            @blur="validateForm(generateValidateKeys(column.prop))"
            :desc="$t('common.pleaseEnter')"
            v-model="item[column.prop]" />
        </el-form-item>
      </div>
      <div class="nd-serial-number" v-if="state.formData.eventList.length > 1">
        <div
          v-for="(item, index) of state.formData.eventList.length"
          :key="item">
          <div @click="deleteRow(index)" class="nd-operate-btn-active fz28">
            <SvgIcon class="c86919d fz16" name="delete1" />
          </div>
        </div>
      </div>
    </el-form>
  </CommonDrawer>
  <ViewConfig @updConfig="updConfig" ref="viewconfigRef" />
</template>

<script setup>
import { nextTick, reactive, ref } from 'vue'
import ViewConfig from './ViewConfig.vue'
import { validIdentifierRegex } from '@/utils/validate'
import { eventTypeListMap } from '@/enumeration/data-management/event'
import { cloneDeep, debounce } from 'lodash-es'
import { asyncAddCustomEvent } from '@/api/modules/data-management/event'
import { ElMessage } from 'element-plus'
import useEventStore from '@/store/modules/event.js'
import { recordBehavior } from '@/utils/record-behavior.js'
import { t } from '@/locales/i18n'

const eventStore = useEventStore()
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

const columns = [
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
  {
    label: t('dataManagement.eventType'),
    prop: 'eventType',
    disabled: true,
    type: true,
  },
]

const props = defineProps({
  size: {
    type: String,
    default: '930px',
  },
})

const emit = defineEmits(['getData'])
const state = reactive(initVal())
const formRef = ref(null)
const viewconfigRef = ref(null)

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

const updConfig = (data) => {
  state.formData.eventList[data.currentIndex].virtualEventParam =
    data.virtualEventParam
}

const close = () => {
  Object.assign(state, initVal())
}
const submit = () => {
  formRef.value.validate(async (valid) => {
    if (!valid) return
    recordBehavior({
      moduleName: '数据管理',
      submoduleName: '事件管理',
      operate: '复制粘贴事件',
    })
    state.operateLoading = true
    const { code } = await asyncAddCustomEvent(state.formData).finally((_) => {
      state.operateLoading = false
    })
    if (code === 200) {
      state.showOperate = false
      ElMessage.success(t('dataManagement.pasteSuccessful'))
      emit('getData')
      await eventStore.getEventsAbout(sessionStorage.getItem('appId'))
    }
  })
}

const open = (val = []) => {
  state.formData.eventList = val
  state.showOperate = true
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
