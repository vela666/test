<template>
  <CommonDropdown
    @visible-change="(val) => visibleChange(val, 'isShowSaveDialog')"
    width="320px"
    ref="commonDropdownRef">
    <template #content>
      <el-button
        class="nd-operate-btn-active ml5 mr5 fz28"
        text
        :class="state.isShowSaveDialog ? 'visible' : ''"
        @click="showSaveDialog">
        <Tooltip>
          <SvgIcon class="fz20" name="template-save" />
          <template #content>{{
            $t('analysis.component.saveAsTemplate')
          }}</template>
        </Tooltip>
      </el-button>
    </template>
    <template #title>
      <div>{{ $t('analysis.component.saveAsTemplate') }}</div>
    </template>
    <template #container>
      <el-form
        ref="formRef"
        label-width="80px"
        label-position="top"
        :model="state.formData"
        :rules="rules">
        <el-form-item
          :label="$t('analysis.component.templateName')"
          prop="filterName">
          <CommonInput
            :prefixSlot="false"
            v-model="state.formData.filterName"
            maxlength="50"
            show-word-limit />
        </el-form-item>
      </el-form>
    </template>
    <template #buttom>
      <div>
        <el-button text class="skip mr10" @click="closeSaveDialog">
          {{ $t('btn.cancel') }}
        </el-button>
        <el-button type="primary" class="m0" @click="asyncSaveConditions">
          {{ $t('btn.confirm') }}
        </el-button>
      </div>
    </template>
  </CommonDropdown>

  <CommonDropdown
    className="nd-select-template"
    v-if="filterConditionsList.length"
    @visible-change="(val) => visibleChange(val, 'isShow')"
    width="290px"
    ref="selectTemplateRef">
    <template #content>
      <span>
        <Tooltip>
          <el-button
            :class="state.isShow ? 'visible' : ''"
            class="n-preset-template nd-operate-btn-active fz28 ml5 mr5"
            text
            @click="showTemplate">
            <SvgIcon class="fz20 n-preset-template" name="template-select" />
          </el-button>
          <template #content>{{
            $t('analysis.component.selectTemplate')
          }}</template>
        </Tooltip>
      </span>
    </template>
    <template #container>
      <div class="condition-template-content">
        <div
          v-for="item of filterConditionsList"
          :key="item.id"
          class="condition-template-list">
          <span
            :title="item.filterName"
            class="template-name ellipsis"
            @click="applyTemplate(item)">
            {{ item.filterName }}</span
          >
          <template v-if="+item.showPublic !== 2">
            <el-popconfirm
              :teleported="false"
              width="180px"
              popper-class="n-preset-template"
              :title="
                $t('analysis.component.checkRemoveTemplate', [item.filterName])
              "
              @confirm="asyncDelCondition(item.id)">
              <template #reference>
                <el-button type="primary" text class="ml20 n-preset-template">
                  {{ $t('btn.delete') }}
                </el-button>
              </template>
            </el-popconfirm>
            <Tooltip :showTips="+item.showPublic !== 1">
              <el-button
                type="primary"
                class="ml5"
                text
                @click="updPublic(item)">
                {{
                  +item.showPublic === 1
                    ? $t('analysis.component.unpublish')
                    : $t('analysis.component.publish')
                }}
              </el-button>
              <template #content>{{
                `${item.showPublic === 1 ? '' : $t('analysis.component.publishTip')}`
              }}</template>
            </Tooltip>
          </template>

          <Tooltip v-else>
            <el-button disabled text class="ml10 p0">
              {{ $t('analysis.component.published') }}
            </el-button>
            <template #content>{{
              $t('analysis.component.publishedByOthers')
            }}</template>
          </Tooltip>
        </div>
      </div>
    </template>
  </CommonDropdown>
  <Tooltip v-else>
    <span class="ml5 mr5 disabled nd-template-operate">
      <SvgIcon class="fz20" name="template-select" />
    </span>
    <template #content
      >{{ $t('analysis.component.attributeNoTemplate') }}
    </template>
  </Tooltip>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import {
  asyncDeleteTemplate,
  asyncSaveTemplate,
  asyncSetPublicTemplate,
} from '@/api/modules/common.js'
import { debounce } from 'lodash-es'
import { ElMessage } from 'element-plus'
import useCommonStore from '@/store/modules/common.js'
import { propsConfig } from '@/enumeration'
import { t } from '@/locales/i18n'

const props = defineProps({
  data: {
    type: Object,
    require: true,
  },
  item: {
    type: Object,
    default: () => {
      return {}
    },
  },
  index: {
    type: Number,
    default: null,
  },
  appId: {
    type: [String, Number],
    default: null,
  },
})

const emit = defineEmits(['updFilter'])
const rules = {
  filterName: [
    { required: true, message: t('common.pleaseEnter'), trigger: 'blur' },
  ],
}

const config = computed(() => {
  return props.data?.config || propsConfig
})

const condition = computed(() => {
  return props.item[props.index]
})

const commonDropdownRef = ref(null)
const selectTemplateRef = ref(null)
const formRef = ref(null)
const state = reactive({
  formData: {
    filterName: '',
  },
  isShow: false,
  loading: false,
  isShowSaveDialog: false,
})
let isReq = false

const useCommon = useCommonStore()

const filterConditionsList = computed(() => {
  // 兼容1.0只存在attributeType
  const tableType1 = condition.value.tableType
  const propName = condition.value.fEn
  return useCommon.conditionsTemplateList.filter((item) => {
    const filterContent = JSON.parse(item.filterContent)
    const tableType2 = filterContent.tableType
    return tableType1 === tableType2 && item.propName === propName
  })
  /*  // 兼容1.0只存在attributeType
  const tableType1 =
    condition.value.tableType || condition.value.tableType === 0
      ? condition.value.tableType
      : userAttrDimensionsTypeListLabelMap[condition.value.attributeType]
  const propName = condition.value.fEn
  return useCommon.conditionsTemplateList.filter((item) => {
    const filterContent = JSON.parse(item.filterContent)
    const tableType2 =
      filterContent.tableType || filterContent.tableType === 0
        ? filterContent.tableType
        : userAttrDimensionsTypeListLabelMap[filterContent.attributeType]
    return tableType1 === tableType2 && item.propName === propName
  })*/
})

const asyncGetConditionsList = async () => {
  await useCommon.getSaveConditionsTemplate(props.appId)
}

const visibleChange = (val, key) => {
  state[key] = val
}

const showTemplate = () => {
  selectTemplateRef.value.handleOpen()
}
const showSaveDialog = () => {
  commonDropdownRef.value.handleOpen()
  state.formData.filterName = (
    condition.value.name +
      config.value[condition.value?.fType]?.[condition.value?.equation] || ''
  ).replace(/\s+/g, '')
}

const closeSaveDialog = () => {
  commonDropdownRef.value.handleClose()
  state.formData.filterName = ''
}

const applyTemplate = (item) => {
  emit('updFilter', JSON.parse(item.filterContent))
  selectTemplateRef.value.handleClose()
}

const asyncSaveConditions = () => {
  formRef.value.validate(async (valid) => {
    if (!valid || isReq) return
    isReq = true
    const params = {
      filterContent: JSON.stringify(condition.value),
      filterName: state.formData.filterName,
      propName: condition.value.fEn,
      showPublic: 0,
      type: 1,
    }
    const { code } = await asyncSaveTemplate(params).finally((_) => {
      let setTimer = setTimeout(() => {
        isReq = false
        clearTimeout(setTimer)
        setTimer = null
      }, 300)
    })
    if (code === 200) {
      commonDropdownRef.value.handleClose()
      asyncGetConditionsList()
      ElMessage.success(t('analysis.report.successfullySaved'))
    }
  })
}
const asyncDelCondition = async (id) => {
  const { code } = await asyncDeleteTemplate({ id })
  if (code === 200) {
    useCommon.getSaveConditionsTemplate(props.appId)
    ElMessage.success(t('common.deleteSuccessfully'))
  }
}

const updPublic = debounce(async (item) => {
  if (isReq) return
  isReq = true
  const { code } = await asyncSetPublicTemplate({
    id: item.id,
    showPublic: item.showPublic === 0 ? 1 : 0,
  }).finally((_) => {
    isReq = false
  })
  if (code === 200) {
    asyncGetConditionsList()
    ElMessage.success(t('common.operationSuccessfully'))
  }
}, 300)

asyncGetConditionsList()
defineOptions({
  name: 'ConditionTemplate',
})
</script>

<style lang="scss">
.nd-select-template {
  .container-content {
    padding: 0;
  }
  .el-scrollbar {
    overflow: visible;
  }
  .el-popper__arrow {
    display: none;
  }
}
</style>
<style scoped lang="scss">
.visible {
  visibility: visible;
}

.condition-template-content {
  display: flex;
  flex-direction: column;
  max-height: 225px;
  overflow-y: auto;

  > .condition-template-list {
    display: flex;
    align-items: center;
    padding: 10px;
    height: 32px;
    font-size: 12px;
    color: var(--eas-text-color-2);
    &:hover {
      background-color: #f5f7fa;
      .template-name {
        color: var(--eas-color-primary);
      }
    }

    .template-name {
      cursor: pointer !important;
      flex: 1;
    }
  }
}

.nd-template-operate {
  &.disabled {
    cursor: not-allowed;
    display: flex;
  }
  &:not(.disabled) {
    .svg-icon {
      color: var(--eas-text-color-light);
      &:hover {
        color: var(--eas-color-primary);
      }
    }
  }
}
</style>
