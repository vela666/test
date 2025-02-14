<template>
  <el-form-item :label="$t('user.userTag.tagValueConfig')">
    <div class="w100-percentage nd-label-value-config">
      <el-button
        v-if="!disabled"
        :disabled="qp.length === 20"
        text
        class="p0"
        type="primary"
        @click="addLabelValue">
        <SvgIcon name="add1" class="fz16 mr3" />
        {{ $t('user.userTag.addTagValue') }}({{ qp.length }}/20)
      </el-button>
      <div class="flex flex-warp gap20 nd-label-value-container">
        <label
          class="nd-label-value-content"
          v-for="(item, index) of qp"
          :key="index">
          <CommonInput
            maxlength="24"
            :clearable="false"
            show-word-limit
            v-if="item.edit"
            @blur="item.edit = false"
            :prefixSlot="false"
            v-model="item.tagValue" />
          <div
            @click="selectNode(index)"
            :class="{ active: current === index }"
            class="nd-label-value-item"
            v-else>
            <div class="nd-label-value" v-showTips>
              {{ item.tagValue }}
            </div>
            <div class="flex-center gap10" v-if="!disabled">
              <SvgIcon name="edit1" @click.stop="item.edit = true" />
              <SvgIcon
                v-if="qp.length < 20"
                name="copy2"
                class="fz16"
                @click.stop="copyNode(item, index)" />
              <SvgIcon
                v-if="qp.length > 1"
                name="delete1"
                @click.stop="removeNode(index)" />
            </div>
          </div>
        </label>
      </div>

      <template v-for="(item, index) of qp" :key="index">
        <div class="mt16" v-show="index === current">
          <el-form-item :label="$t('common.remark')">
            <CommonInput
              desc=""
              :disabled="disabled"
              maxlength="50"
              show-word-limit
              :prefixSlot="false"
              v-model="item.tagValueRemark" />
          </el-form-item>

          <Condition
            :disabled="disabled"
            :ref="(el) => setRefs(el, index)"
            :groupDefine="item.tagDef" />
        </div>
      </template>
    </div>
  </el-form-item>
</template>

<script setup>
import { ref } from 'vue'
import { cloneDeep } from 'lodash-es'
import { ElMessage } from 'element-plus'
import Condition from '@/views/user/components/Condition/index.vue'
import { useI18n } from 'vue-i18n'
const { t } = useI18n() // 使用useI18n钩子获取国际化t函数

const conditionRef = ref({})
const props = defineProps({
  disabled: {
    type: Boolean,
    default: false,
  },
})

const current = ref(0)
const qp = defineModel({
  type: Array,
  default() {
    return []
  },
})
const setRefs = (el, type) => {
  conditionRef.value[type] = el
}

const selectNode = (index) => {
  current.value = index
}

const getNum = () => {
  const maxLabel = Math.max(
    ...qp.value.map((item) => {
      const num = item.tagValue.replace(/[^0-9]/g, '')
      return num ? Number(num) : 0
    })
  )
  return qp.value.length ? maxLabel + 1 : 1
}

const copyNode = async (item, index) => {
  const params = cloneDeep(item)
  const label = getNum()
  const groupDefine = await conditionRef.value[index].getResult('notValidate')
  params.tagValue = `${t('user.userTag.tagValue')}${label}`
  params.tagDef = groupDefine
  qp.value.push(params)
  current.value = qp.value.length - 1
}

const removeNode = (index) => {
  qp.value.splice(index, 1)
  current.value = qp.value.length - 1
}

// 新增标签
const addLabelValue = () => {
  if (qp.value.length > 19) {
    ElMessage.warning(t('user.userTag.upToTagValues'))
    return
  }
  qp.value.push({
    tagValue: `${t('user.userTag.tagValue')}${getNum()}`,
    tagValueRemark: '',
    tagDef: {},
  })
  current.value = qp.value.length - 1
}

// 重复标签名
const getRepeatLabelName = () => {
  const seen = new Map() // 用于存储元素及其索引
  const duplicates = [] // 存储重复元素的索引

  qp.value.forEach((item, index) => {
    if (seen.has(item.tagValue)) {
      // 如果已经见过这个元素，且它的索引不在duplicates中，就添加进去
      if (!duplicates.includes(seen.get(item.tagValue))) {
        duplicates.push(seen.get(item.tagValue))
      }
      duplicates.push(index) // 添加当前的重复项索引
    } else {
      // 如果是第一次见到这个元素，记录它的索引
      seen.set(item.tagValue, index)
    }
  })
  return duplicates.length
    ? t('user.userTag.tagValueNameDuplicate', [
        duplicates
          .sort((a, b) => a - b)
          .map((i) => i + 1)
          .join('、'),
      ])
    : null
}

const getResult = async () => {
  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (resolve, reject) => {
    const result = []
    const hasRepeatLabelName = getRepeatLabelName()
    if (hasRepeatLabelName) {
      reject(hasRepeatLabelName)
      return
    }

    for (let i = 0; i < qp.value.length; i++) {
      try {
        const groupDefine = await conditionRef.value[i].getResult()
        if (!groupDefine.events.length && !groupDefine.users.length) {
          throw t('user.userTag.tagValueNoEmpty')
        }
        if (!qp.value[i].tagValue) {
          // ElMessage.warning(`第${i + 1}项标签值名称为空，请填写`)
          reject(t('user.userTag.tagValueFillIn', [i + 1]))
          return
        }
        result.push({
          tagValue: qp.value[i].tagValue,
          tagValueRemark: qp.value[i].tagValueRemark,
          tagDef: groupDefine,
        })
      } catch (err) {
        reject(t('user.userTag.tagValueError', [i + 1, err]))
        // ElMessage.warning(`第${i + 1}项标签值中，${err}`)
        return
      }
    }

    return resolve(result)
  })
}
defineExpose({
  getResult,
  addLabelValue,
})
defineOptions({
  name: 'LabelValueConfig',
})
</script>

<style scoped lang="scss">
.nd-label-value-config {
  border-radius: 4px;
  border: 1px solid var(--eas-border-color);
  padding: 16px 20px;
}

.nd-label-value-container {
  padding-bottom: 16px;
  border-bottom: 1px solid var(--eas-border-color);
}

.nd-label-value-content {
  height: 32px;
  > div {
    width: 383px;
  }
}
.nd-label-value-item {
  display: flex;
  align-content: center;
  justify-content: space-between;
  height: 32px;
  border-radius: 4px;
  background-color: var(--eas-hover-color-1);
  border: 1px solid transparent;
  padding: 0 10px;
  color: var(--eas-text-color-primary);
  .svg-icon {
    display: none;
    cursor: pointer;
    color: var(--eas-color-primary);
  }
  &:hover {
    .svg-icon {
      display: block;
    }
    border-color: var(--eas-color-primary);
  }
}

.active {
  background-color: var(--eas-color-primary);
  color: #fff;
  .svg-icon {
    color: #fff;
  }
}
.nd-label-value {
  max-width: 150px;
}
</style>
