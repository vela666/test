<template>
  <CommonDialog
    className="nd-user-data-detail-dialog"
    v-model="state.visible"
    fullscreen
    :show-close="false"
    :needFooter="false">
    <template #header>
      <DialogFullScreenHeader
        @close="handleClose"
        :title="$t('analysis.component.eventDetails')" />
    </template>

    <CommonLayout v-loading="state.loading">
      <div class="flex-column h100-percentage">
        <div class="flex-center mt20">
          <template v-if="!state.event?.aliasEdited">
            {{ state.event?.events?.eventNameZh ?? ''
            }}{{
              state.event?.eventFields?.analysisDesc
                ? `的${state.event?.eventFields?.propertyNameDisplay ?? ''}${
                    state.event?.eventFields?.analysisDesc ?? ''
                  }`
                : ''
            }}
          </template>
          <template v-else>
            {{ state.event?.alias }}
          </template>

          <el-tooltip
            :content="
              state.show
                ? $t('analysis.event.collapse')
                : $t('analysis.event.expand')
            "
            placement="right">
            <el-link :underline="false" class="ml10">
              <el-icon
                @click="state.show = !state.show"
                class="arrow-icon"
                :class="{ up: !state.show }">
                <CaretTop />
              </el-icon>
            </el-link>
          </el-tooltip>

          <el-text style="margin-left: 260px">
            {{ $t('analysis.event.filterTimePeriod') }}：{{ state.filterDate }}
          </el-text>
        </div>

        <el-collapse-transition>
          <div class="event-detail-container" v-show="state.show">
            <AnalysisIndexItem
              index="event"
              :class="['analysis_item', 'p10', 'nd-condition-disabled']"
              v-model:formula="state.event.code"
              v-model:event-data="state.event.events"
              v-model:event-fields="state.event.eventFields"
              v-model:event-filters="state.event.eventFilters"
              :eventFieldsList="state.event.eventFieldsData"
              :fieldsList="state.event.fieldsList"
              :customizable="state.event.customizable"
              anyEvent>
              <span></span>
            </AnalysisIndexItem>

            <AnalysisGlobalFilter
              v-if="state.globalFilters?.filters.length > 0"
              v-model="state.globalFilters"
              disabled>
            </AnalysisGlobalFilter>
          </div>
        </el-collapse-transition>

        <header class="flex flex-between mt20 mb20">
          <CustomField
            v-model="state.checkedValue"
            :data="state.customFieldData"
            :default-props="{ label: 'fZh', value: 'fEn' }"
            value-key
            @submit="confirmField" />
          <el-button
            type="primary"
            @click="downloadData"
            :loading="state.downloading"
            :disabled="state.pageData.length === 0">
            <svg-icon name="download" class="mr5 fz16" />
            {{ $t('analysis.component.download') }}
          </el-button>
        </header>

        <el-table class="nd-table-custom" :data="state.pageData" border>
          <el-table-column
            v-for="item in state.columns"
            :key="item.prop"
            :label="item.label"
            :prop="item.prop"
            show-overflow-tooltip
            v-bind="{ ...item }"
            :min-width="180"
            sortable
            :fixed="['__fid', '__did'].includes(item.prop)">
            <template #default="{ row }">
              <el-text
                type="primary"
                v-if="['__fid', '__did'].includes(item.prop)"
                @click="showSquenceDetail(row)"
                style="cursor: pointer">
                {{ row[item.prop] }}
              </el-text>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <template #footer>
        <Pagination
          v-model:limit="pageInfo.pageSize"
          v-model:page="pageInfo.pageNum"
          :total="pageInfo.total"
          @getData="getList" />
      </template>
    </CommonLayout>
  </CommonDialog>

  <UserSequence ref="userSequenceRef" />
</template>

<script setup>
import { reactive, ref, inject, toRef } from 'vue'
import {
  getEventSequence,
  exportEventSequence,
} from '@/api/modules/analysis/index'
import { cloneDeep } from 'lodash-es'
import UserSequence from '@/views/user/components/UserSequence/index.vue'
import useAanlysisUtils from '@/views/analysis/hooks/useAanlysisUtils.js'
import { CaretTop } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { t } from '@/locales/i18n'

defineOptions({
  name: 'EventDetail',
})

const { setIndexDisplay, setGlobalFiltersDisplay } = useAanlysisUtils()
const appId = toRef(inject('appId', sessionStorage.getItem('appId')))

const state = reactive({
  visible: false,
  loading: false,
  show: true,
  customFieldData: [],
  checkedValue: [],
  columns: [],
  pageData: [],
  paramsData: {},
  event: {},
})

const pageInfo = reactive({
  pageSize: 20,
  pageNum: 1,
  total: 0,
})

const userSequenceRef = ref(null)

const handleClose = () => {
  state.visible = false
}

const getList = () => {
  const params = {
    ...state.paramsData,
    page: pageInfo.pageNum,
    size: pageInfo.pageSize,
  }
  state.loading = true
  getEventSequence(params)
    .then((res) => {
      const { list, other, page } = res.data
      state.pageData = list
      pageInfo.total = page.totalCount
      getDefaultColumns(other.columMeta)
    })
    .finally(() => {
      state.loading = false
    })
}

/**
 * @description: 设置默认选中的列
 * @return {*}
 */
const getDefaultColumns = (obj) => {
  // 用户ID 访客ID置顶
  const defaultColumn = ['__fid', '__did', '__event_name']

  const data = []
  Object.keys(obj).forEach((key) => {
    data.push({
      fZh: obj[key],
      fEn: key,
    })
  })

  const defaultField = data
    .filter((item) => ['__fid', '__did', '__event_name'].includes(item.fEn))
    .map((item) => {
      item.disabled = true
      return item
    })

  const preAttrs = [] // 预置属性
  const customAttr = [] //自定义属性
  const preAttrNames = []
  const customAttrNames = []
  for (const item of data) {
    if (item?.fEn?.startsWith('__')) {
      if (!['__fid', '__did', '__event_name'].includes(item.fEn)) {
        preAttrs.push(item)
        preAttrNames.push(item.fEn)
      }
    } else {
      customAttr.push(item)
      customAttrNames.push(item.fEn)
    }
  }
  state.allAttrNames = [
    ...new Set([...defaultColumn, ...preAttrNames, ...customAttrNames]),
  ]

  state.customFieldData = [...defaultField, ...preAttrs, ...customAttr]

  state.checkedValue = [...new Set([...defaultColumn, ...customAttrNames])]

  // 设置默认列
  const customTableColumn = []
  const column = [...customAttr]
  const tmp = customTableColumn.length
    ? column.reduce((p, c) => {
        customTableColumn.forEach((item) => {
          if (c.fEn === item) {
            p.push(c)
          }
        })
        return p
      }, [])
    : column

  // 设置默认列
  formateColumns([...defaultField, ...tmp])
}

const formateColumns = (list) => {
  state.columns = list.map((item) => ({
    label: item.fZh,
    prop: item.fEn,
  }))
}

/**
 * @description: 自定义列
 * @return {*}
 */
const confirmField = (data) => {
  formateColumns(data)
}

/**
 * @description: 用户行为序列
 * @return {*}
 */
const showSquenceDetail = (row) => {
  userSequenceRef.value.open(row, state.pageData)
}

/**
 * @description: 导出数据
 * @return {*}
 */
const downloadData = () => {
  state.downloading = true
  let params = { ...state.paramsData }
  params['columnList'] = cloneDeep(state.allAttrNames)
  exportEventSequence(params)
    .then(() => {
      ElMessage.success(t('analysis.dataExportSuccessful'))
    })
    .finally(() => {
      state.downloading = false
    })
}

/**
 * @description: 事件详情
 * @return {*}
 */
const open = async (params) => {
  state.visible = true
  state.show = true
  pageInfo.pageNum = 1
  pageInfo.pageSize = 20
  state.paramsData = cloneDeep({ ...params, appId: appId.value })
  state.filterDate = params.endDate
    ? `${params.startDate}${t('common.to')}${params.endDate}`
    : params.startDate
  getList()

  const { events, globalFilts } = JSON.parse(params.qp)
  const eventIndex = params.eventIndex
  const res = await setIndexDisplay([events[eventIndex]])

  state.event = res[0]
  state.globalFilters = setGlobalFiltersDisplay(globalFilts)
}

defineExpose({
  open,
})
</script>

<style lang="scss" scoped>
.event-detail-container {
  :deep() {
    .nd-condition-disabled {
      opacity: 1;
      cursor: initial;
    }
    .formula {
      border: unset;
    }
  }
}
.arrow-icon {
  transition: all 0.2s;
  &.up {
    transform: rotateZ(180deg);
  }
}
</style>
