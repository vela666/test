<template>
  <div>
    <DropDownPopoverSelection>
      <el-button>
        <SvgIcon class="fz16" name="copy2" />
        <i class="ml3 mr5">{{ $t('dataManagement.reuseTo') }}</i>
        <Tooltip>
          <SvgIcon class="fz14" name="help2" />
          <template #content> {{ tipMap[type].desc }} </template>
        </Tooltip>
      </el-button>
      <template #content>
        <el-button
          @click="item.operate"
          v-for="item of btnList"
          :key="item.type"
          class="skip"
          text>
          {{ item.label }}</el-button
        >
      </template>
    </DropDownPopoverSelection>
    <ReuseDrawer :type="type" ref="reuseDrawerRef" />
    <PasteDrawer @paste="paste" :type="type" ref="pasteDrawerRef" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import ReuseDrawer from './ReuseDrawer.vue'
import PasteDrawer from './PasteDrawer.vue'
import handleClipboard from '@/utils/clipboard'
import { encode } from 'js-base64'
import { cloneDeep } from 'lodash-es'
import { filteNotDisplayrDataTypeMap } from '@/enumeration/data-management/event-attr'
import { t } from '@/locales/i18n'

const props = defineProps({
  list: {
    type: Array,
    default: () => [],
  },
  // 1事件管理 2事件属性管理 3用户属性管理
  type: {
    type: String,
    default: '1',
  },
})
const emit = defineEmits(['paste'])
const reuseDrawerRef = ref(null)
const pasteDrawerRef = ref(null)
const tipMap = {
  1: {
    desc: t('dataManagement.event.reuseTips'),
    copy: t('dataManagement.event.copyTips'),
  },
  2: {
    desc: t('dataManagement.eventAttr.reuseTips'),
    copy: t('dataManagement.event.copyTips'),
  },
  3: {
    desc: t('dataManagement.userAttr.reuseTips'),
    copy: t('dataManagement.event.copyTips'),
  },
}

const open = () => {
  if (!props.list.length) {
    ElMessage.info(t('dataManagement.checkReuse'))
    return
  }
  reuseDrawerRef.value.open(props.list)
}

const filtetCopyData = async (data) => {
  return new Promise((resolve, reject) => {
    const fn = {
      1() {
        // 不支持复制预置事件
        if (data.every((item) => item.eventType === 2)) {
          return reject(t('dataManagement.checkPresetCopy'))
        }
        return resolve(
          data.filter((item) => {
            item.eventId = ''
            return item.eventType !== 2
          })
        )
      },
      2() {
        // 不支持复制预置和维度
        const mark = [1, 3]
        if (data.every((item) => mark.includes(item.type))) {
          return reject(t('dataManagement.checkAttrCopy'))
        }
        return resolve(
          data.filter((item) => {
            item.dimensionList = []
            item.children = []
            item.referField = ''
            item.fId = ''
            item.fType =
              item.type === 4 || filteNotDisplayrDataTypeMap[item.newFtype]
                ? item.newFtype
                : ''
            return !mark.includes(item.type)
          })
        )
      },
      3() {
        // 不支持复制维度
        const mark = 3
        if (data.every((item) => mark === item.type)) {
          return reject(t('dataManagement.checkDimensionCopy'))
        }
        return resolve(
          data.filter((item) => {
            item.dimensionList = []
            item.children = []
            item.referField = ''
            item.fId = ''
            item.fType =
              item.type === 4 || filteNotDisplayrDataTypeMap[item.newFtype]
                ? item.newFtype
                : ''
            return mark !== item.type
          })
        )
      },
    }[props.type]()
  })
}

const copy = async (event) => {
  if (!props.list.length) {
    ElMessage.info(t('dataManagement.confirmCopy'))
    return
  }
  try {
    let data = await filtetCopyData(cloneDeep(props.list))
    data = encode(
      JSON.stringify({
        type: props.type,
        data: data,
      })
    )
    handleClipboard(
      /*encode(
        JSON.stringify({
          type: props.type,
          data: data,
        })
      ),*/
      data,
      event,
      null,
      null,
      tipMap[props.type].copy
    )
  } catch (e) {
    ElMessage.warning(e)
  }
}

const paste = (data) => {
  if (data) {
    emit('paste', data)
    return
  }
  pasteDrawerRef.value.open()
  /*  // 只能在https和本地下使用
    let data = await navigator.clipboard.readText()
    data = JSON.parse(decode(data))
    if (!isObject(data)) {
      throw new Error('')
    }
    console.log(data)*/
  // emit('paste', data)
}
const btnList = [
  {
    type: 1,
    label: t('dataManagement.reuseTo'),
    operate: open,
  },
  {
    type: 2,
    label: t('btn.copy'),
    operate: copy,
  },
  {
    type: 3,
    label: t('btn.paste'),
    operate: () => paste(),
  },
]

defineOptions({
  name: 'ReuseToButton',
})
</script>
