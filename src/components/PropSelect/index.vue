<script setup>
import { pick, cloneDeep, isObject, isEmpty } from 'lodash-es'
import { ref, watch, nextTick, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useScroll } from '@vueuse/core'
import {
  tableTypeArr,
  tableKeysArr,
  titleMap,
  tableTypeBase,
  paramKey,
} from '@/enumeration'
import { anchorPointScrollHandler, descShowHandler } from '@/utils'
import { getTableType } from '@/utils/dataProcessing'
import { getHideFieldInfo } from '@/api/modules/analysis/common.js'
import { Close } from '@element-plus/icons-vue'
import { createPopper } from '@popperjs/core'
import { t } from '@/locales/i18n'

defineOptions({
  name: 'PropSelect',
  inheritAttrs: false,
})

const props = defineProps({
  list: {
    type: Object,
    require: true,
  },
  // 数据更新时保留modelValue的数据
  reserveValue: {
    type: Boolean,
    default: false,
  },
  modelValue: {
    type: Object,
    default: () => ({}),
  },
  limit: {
    //控制展示哪些属性分类（事件属性、用户属性、分群、标签）
    type: Array,
    default: () => tableKeysArr,
  },
  // 没有值时的描述
  desc: {
    type: String,
    default: '',
  },
  groups: {
    //分析模型中的分组项中控制每个属性只能选择一次
    type: Array,
    default: () => [],
  },
  // 区分是否是在分析模型的分组中使用
  isGroup: {
    type: Boolean,
    default: false,
  },
  // 用来过滤掉属性中的 '__fid', '__bid', '__did'
  filterable: {
    type: Boolean,
    default: false,
  },
  clearable: {
    type: Boolean,
    default: false,
  },
  height: {
    type: String,
    default: '',
  },
  className: {
    type: String,
    default: '',
  },
  appId: {
    type: [String, Number],
    default: null,
  },
  // 1 根据应用ID查询 2 不根据应用ID查询
  queryType: {
    type: [String, Number],
    default: 1,
  },
})
const omitAttr = ['__fid', '__bid', '__did']
const emit = defineEmits(['change', 'clear', 'update:modelValue'])

// 数值类型
const isNumricType = (fType) => ['int', 'double'].includes(fType)
// 日期类型格式
const isTimeDateType = (fType) => ['datetime', 'timestamp'].includes(fType)

const isManual = ref(false)

//过滤掉属性中的 '__fid', '__bid', '__did'
const sourceData = computed(() => {
  const temp = {}
  for (const key of props.limit) {
    if (Array.isArray(props.list?.[key])) {
      temp[key] = props.filterable
        ? props.list?.[key]?.filter((el) => !omitAttr.includes(el.fEn))
        : props.list[key]
    }
  }
  return temp
})

// 判断是否在分组项中已经被选中
const isDisabled = (item, key, parent) => {
  const tableType = getTableType(key, item)
  const find = props.groups.find((el) => {
    let flag = item.fEn === el.fEn && tableType === el.tableType
    if (key === 'customTableList') {
      const subFlag = parent.fEn === el.customTableName
      flag = flag && subFlag
    }
    return flag
  })
  return find !== undefined
}

// 获取属性的（中文）显示名
const getPropsDisplayName = () => {
  let fZh = ''
  const label = tableTypeArr[props.modelValue?.tableType]
  const data = sourceData.value[label]
  if (Array.isArray(data) && props.limit.includes(label)) {
    let temp = null
    if (label === 'customTableList') {
      const res = data.find(
        (item) => item.fEn === props.modelValue.customTableName
      )
      temp = (Array.isArray(res?.fieldInfoList) ? res.fieldInfoList : []).find(
        (item) => item.fEn === props.modelValue.fEn
      )
    } else {
      temp = data.find((item) => item.fEn === props.modelValue.fEn)
    }
    if (temp) {
      fZh = temp.fZh
    }
  }
  return fZh
}

const displayName = computed(() => {
  return getPropsDisplayName()
})

const propsTitleMap = computed(() => {
  const temp = {}
  for (const item of props.limit) {
    if (sourceData.value?.[item] && titleMap[item]) {
      temp[item] = titleMap[item]
    }
  }
  return temp
})

const links = computed(() => {
  return Object.keys(propsTitleMap.value)
})

/**
 * @description 判断是否已经选中
 * @param {object} item 属性
 */
const isSlected = (item, key, parent) => {
  const tableType = getTableType(key, item)
  return isSameAttr(item, tableType, parent)
}

/**
 * @description 判断当前已经选中的属性和要选择的属性是否相同
 * @param {object} attr 要选择的属性
 * @param {number} tableType 属性对应的表类型
 */
const isSameAttr = (attr, tableType, parent) => {
  let flag =
    attr.fEn === props.modelValue.fEn &&
    tableType === props.modelValue.tableType
  if (tableType === tableTypeBase['customTableList']) {
    const subFlag = parent.fEn === props.modelValue.customTableName
    flag = flag && subFlag
  }
  return flag
}
/* tableType
0:用户属性,1:事件属性,2:用户维度表,3:事件维度表,
4:用户分群,5:用户标签,6:事件虚拟属性,7:用户虚拟属性
*/
const pickPropsNames = ['timeType', 'range']
const propSelect = ref(null)
const selectedChange = (item, key, parent) => {
  if (item.permissionStatus === false) return
  const tableType = getTableType(key, item)
  if (isSameAttr(item, tableType, parent) || isDisabled(item, key, parent))
    return
  let attr = { ...cloneDeep(item), tableType, name: item.fZh }
  if (key === 'customTableList') {
    attr = {
      ...attr,
      customTableName: parent.fEn,
      customTableId: parent.fId,
    }
  }
  if (props?.modelValue?.id) {
    attr['id'] = props.modelValue.id
  }
  if (props.isGroup) {
    let temp = pick(props.modelValue, pickPropsNames)
    if (temp?.timeType) {
      temp.timeType = isTimeDateType(item.fType) ? 'day' : ''
    }
    if (temp?.range) {
      temp.range = {
        propertyRange: isNumricType(item.fType) ? [0] : [],
        propertyRangeType: isNumricType(item.fType) ? 0 : 1,
      }
    }
    attr = { ...attr, ...temp }
  }

  isManual.value = true
  propSelect.value?.handleClose()

  const value = props.reserveValue
    ? {
        ...props.modelValue,
        ...attr,
      }
    : attr
  emit('update:modelValue', value)
  emit('change', value)
}

// 属性类型 type 类型：1:预置属性 2:自定义属性 3:维度属性 4:虚拟属性
const propTypes = {
  1: t('dataManagement.presetAttributes'),
  2: t('dataManagement.customAttributes'),
  3: t('dataManagement.dimensionAttributes'),
  4: t('dataManagement.virtualAttributes'),
}
const createTypeMap = {
  1: t('user.conditionGroup'),
  2: t('user.idGroup'),
  3: t('user.resultGroup'),
  4: t('user.conditionTag'),
  5: t('user.firstAndLastFeatureTag'),
  6: t('user.indicatorValueTag'),
  7: 'ID标签',
  8: t('user.customSqlGroup'),
  9: t('user.sqlTag'),
}
const propsTypeMap = {
  int: t('dataManagement.numeral'),
  string: t('common.text'),
  double: t('dataManagement.numeral'),
  datetime: t('common.timeDate'),
  timestamp: t('dataManagement.timeTimestamp'),
  array: t('dataManagement.array'),
  boolean: t('dataManagement.boolean'),
  enum: t('dataManagement.numeral'),
  group: t('user.group'),
}

/**
 * @description 获取属性类型 1:预置属性 2:自定义属性 3:维度属性 4:虚拟属性
 * @param {object} hoverItem
 */
const getShowProsType = (hoverItem) => {
  const label = hoverItem.kind
  let msg = ''
  switch (label) {
    case 'eventField':
    case 'userField':
      if (hoverItem.filedType !== undefined) {
        msg = propTypes[hoverItem.filedType]
      } else {
        msg = t('dataManagement.presetAttributes')
      }
      break
    case 'userCluster':
    case 'userLabel':
      if (hoverItem.createType !== undefined) {
        msg = createTypeMap[hoverItem.createType]
      }
      break
    default:
  }
  return msg
}
const groupRefreshTypes = {
  0: t('user.manualUpdate'),
  1: t('user.automaticUpdate'),
  2: t('user.noUpdate'),
}

/**
 * @description 获取分群、标签 更新方式
 * @param {object} hoverItem
 */
const getGroupRefreshType = (hoverItem) => {
  const label = hoverItem.kind
  let msg = ''
  switch (label) {
    case 'userCluster':
    case 'userLabel':
      if (hoverItem.refreshType !== undefined) {
        msg = groupRefreshTypes[hoverItem.refreshType]
      }
      break
    default:
  }
  return msg
}

//sql分群、条件分群自动更新方式
const accumulation = { 0: t('user.cover'), 1: t('user.increment') }

const getGroupAccumulation = (hoverItem) => {
  let msg = ''
  if (
    hoverItem.kind == 'userCluster' &&
    hoverItem.refreshType == 1 &&
    [1, 8].includes(hoverItem.createType)
  ) {
    msg = accumulation[hoverItem.accumulation]
  }
  return msg
}

const search = ref('')
const showMenu = ref(false)
const scrollEle = ref(null)

const activeName = ref(links.value[0])
let isClick = false

/**
 * @description 区分点击标签和鼠标拖动滚动条
 */
const { isScrolling } = useScroll(scrollEle)
watch(isScrolling, (val) => {
  if (!val && isClick) {
    isClick = false
  }
})

/**
 * @description 滚动事件监听处理
 */
const scrollHandler = () => {
  if (isClick) {
    return
  }
  const containerRect = scrollEle.value?.getBoundingClientRect()
  const res = anchorPointScrollHandler(links.value, containerRect)
  res && (activeName.value = res.link)
}

/**
 * @description el-dropdown下拉框出现/隐藏时触发
 * @param {boolean} val
 */
const visibleChange = (val) => {
  if (val) {
    nextTick(() => {
      scrollEle.value?.addEventListener('scroll', scrollHandler, true)
      // 滚动条定位到已选中属性的位置
      const ele = document.querySelector(
        '.prop-panel-content__right .is-selected'
      )
      if (ele) {
        const container = document.querySelector('.prop-panel-content__right')
        const top = ele.offsetTop - container.offsetTop - 150
        isClick = true
        scrollEle.value.scrollTo({ top })
        activeName.value =
          ele?.parentElement?.parentElement?.id || links.value[0]
      }
    })
  } else {
    scrollEle.value?.removeEventListener('scroll', scrollHandler)
    search.value = ''
    hoverItem.value = {}
  }
  showMenu.value = val
}

/**
 * @description 左侧导航栏点击操作
 * @param {*} item
 */
const selectPanelNav = (item) => {
  activeName.value = item
  isClick = true
  const ele = document.getElementById(item)
  ele.scrollIntoView({ behavior: 'smooth' })
}

const hoverItem = ref({})
const easPanelPopverRef = ref()
/**
 * @description 展示属性详情
 */
const showDesc = (e, item, key, parent) => {
  let tempProps = { ...item, kind: key }
  if (key === 'customTableList') {
    tempProps = { ...tempProps, parent }
  }
  hoverItem.value = tempProps
  createPopper(e.target, easPanelPopverRef.value, {
    // strategy: 'fixed',
    placement: 'right',
    modifiers: [
      {
        name: 'flip',
        options: {
          fallbackPlacements: ['top', 'right'],
        },
      },
      {
        name: 'offset',
        options: {
          offset: [0, 22],
        },
      },
      {
        name: 'preventOverflow',
        options: {
          padding: 8,
        },
      },
    ],
  })
}
// 展示搜索内容
const searchContent = computed(() => {
  const temp = {}
  for (const key of props.limit) {
    if (!sourceData.value?.[key]) continue
    const children = cloneDeep(sourceData.value?.[key])
    let arr = []
    const searchAttr = (item) =>
      item?.fZh?.toLowerCase()?.indexOf(search.value.toLowerCase()) !== -1 ||
      item?.fEn?.toLowerCase()?.indexOf(search.value.toLowerCase()) !== -1

    const callBack =
      key === 'customTableList'
        ? (data) => {
            const fieldInfoList = cloneDeep(data?.fieldInfoList ?? [])
            data['fieldInfoList'] = fieldInfoList.filter(searchAttr)
            return data['fieldInfoList']?.length > 0
          }
        : searchAttr

    if (Array.isArray(children)) {
      arr = children.filter(callBack)
      if (arr.length > 0) temp[key] = cloneDeep(arr)
    }
  }
  return temp
})
watch(search, () => (hoverItem.value = {}))

const routesMap = {
  eventField: '/data-management/event-attr',
  userField: '/data-management/user',
  userCluster: '/user/user-group',
  userLabel: '/user/user-tag',
}

const router = useRouter()

// 跳转到对应页面
const goTo = (hoverItem) => {
  const path = routesMap[hoverItem.kind]
  if (path) {
    const routeData = router.resolve({
      path,
      query: {
        [paramKey]: hoverItem.fEn,
        virtualAppId: props.appId || sessionStorage.getItem('appId'),
      },
    })
    window.open(routeData.href, '_blank')
  }
}

//是否展示跳转链接
const showJumpLink = (hoverItem) =>
  hoverItem.kind &&
  hoverItem.kind !== 'customTableList' &&
  getShowProsType(hoverItem) !== t('dataManagement.presetAttributes') &&
  props.queryType !== 2

//查找属性，判断属性是否被隐藏、删除、禁用等
async function searchPropStatus(val) {
  const propsData = cloneDeep(props.modelValue)
  const dataList = cloneDeep(val)
  if (propsData?.fEn) {
    const typeFlag = [0, 2, 7].includes(propsData?.tableType)
      ? 2
      : [1, 3, 6].includes(propsData?.tableType)
        ? 1
        : ''
    const label = tableTypeArr[propsData?.tableType]
    let find
    // 查找自定义表属性
    if (propsData?.tableType === tableTypeBase['customTableList']) {
      const data = (dataList?.[label] ?? [])?.find(
        (item) => item.fEn === propsData.customTableName
      )
      find = (data?.fieldInfoList ?? []).find(
        (item) => item.fEn === propsData.fEn
      )
    } else {
      find = (dataList?.[label] ?? [])?.find(
        (item) => item.fEn === propsData.fEn
      )
    }

    if (!find) {
      //查找不存在的属性
      let valData = {}
      if (typeFlag !== '') {
        try {
          const res = await getHideFieldInfo([
            {
              appId: props.appId || sessionStorage.getItem('appId'),
              field: propsData.fEn,
              type: typeFlag,
            },
          ])
          if (res.code === 200 && res.data) {
            const resData = res.data?.[0]
            const bool = dataList?.[label]?.some((v) => v.fEn === propsData.fEn)
            valData = {
              // name: resData?.fieldDisplayName || propsData.name,
              name: bool ? resData?.fieldDisplayName : propsData.name,
              // 先判断存不存对应的事件、用户属性可选项等
              // permissionStatus: !!dataList?.[label] && resData.status === 0,
              permissionStatus: bool && resData.status === 0,
            }

            isManual.value = true
            emit('update:modelValue', valData)
          }
        } catch (error) {
          console.log(error)
        }
      }

      valData = { ...propsData, permissionStatus: false, ...valData }
      isManual.value = true
      emit('update:modelValue', valData)

      return false
    } else if (find?.permissionStatus === false) {
      isManual.value = true
      emit('update:modelValue', {
        ...propsData,
        permissionStatus: find.permissionStatus,
      })

      return false
    }
  }
  return true
}

const clear = () => {
  emit('update:modelValue', {})
  emit('change', {})
  emit('clear')
}
watch(
  () => props.list,
  async (val) => {
    if (isObject(val) && Object.keys(val).length > 0) {
      if (!isManual.value) {
        const status = await searchPropStatus(val)
        if (!status) return
      }
      isManual.value = false
    }
  },
  { deep: true, immediate: true }
)

//设置每一子项属性的class
function setItemClass(data, key, parent) {
  const classArr = ['panel-data-item']
  // 被选中的class类名
  if (isSlected(data, key, parent)) {
    classArr.push('is-selected')
  }
  // 禁止选中的class类名
  if (isDisabled(data, key, parent)) {
    classArr.push('is-disabled')
  }
  // 无权限、被隐藏等的class类名
  if (data.permissionStatus === false) {
    classArr.push('no-permission')
  }
  return classArr
}
</script>

<template>
  <div :class="['eas-prop-select', className]">
    <el-dropdown
      trigger="click"
      popper-class="eas-prop-popper"
      placement="bottom-start"
      @visible-change="visibleChange"
      ref="propSelect">
      <div
        :class="[
          'eas-drop-box flex-center',
          { 'active-border': showMenu },
          { 'no-permission': modelValue?.permissionStatus === false },
        ]"
        :title="displayName || modelValue?.name || desc"
        :style="height && `height:${height}`">
        <span
          :class="[
            'w100-percentage overflow-hidden ellipsis',
            !(displayName || modelValue?.name) && 'c8a8a8a',
          ]"
          >{{ displayName || modelValue?.name || desc }}</span
        >
        <el-icon
          v-if="clearable && (displayName || modelValue?.name)"
          class="fz16 c86919d ml5 elem-hover nd-clear-data"
          @click.stop="clear">
          <Close />
        </el-icon>
      </div>
      <template #dropdown>
        <div class="eas-drop-panel">
          <CommonInput v-model="search" :desc="$t('common.search')" />
          <div class="prop-panel-content" v-if="showMenu">
            <div v-if="search" class="search-content">
              <div
                class="panel-data"
                v-for="key in Object.keys(searchContent)"
                :key="`search_content_${key}`">
                <div class="panel-data__title">
                  {{ propsTitleMap[key] }}
                </div>
                <div class="panel-data-list">
                  <div v-if="key === 'customTableList'">
                    <div
                      v-for="(data, i) in searchContent[key]"
                      :key="`${i}_${key}`">
                      <div class="panel-data-table">{{ data?.fZh }}</div>
                      <div class="panel-data-table__container">
                        <div
                          :class="setItemClass(subData, key, data)"
                          v-for="(subData, j) in data?.fieldInfoList"
                          :key="`${j}_${key}_${data?.fEn}_${subData.fEn}`"
                          @mouseenter="showDesc($event, subData, key, data)"
                          @click="selectedChange(subData, key, data)">
                          <!--                          <div class="property-title" v-showTips>-->
                          <div
                            class="property-title ellipsis"
                            :title="subData.fZh">
                            {{ subData.fZh }}
                          </div>
                          <div class="property-type">
                            {{ propsTypeMap[subData.fType] }}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div
                    v-else
                    :class="setItemClass(data, key)"
                    v-for="(data, i) in searchContent[key]"
                    :key="`${i}_${key}`"
                    @mouseenter="showDesc($event, data, key)"
                    @click="selectedChange(data, key)">
                    <!--                    <div class="property-title" v-showTips>-->
                    <div class="property-title ellipsis" :title="data.fZh">
                      {{ data.fZh }}
                    </div>
                    <div class="property-type">
                      {{ propsTypeMap[data.fType] }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <template v-else>
              <div class="prop-panel-content__left">
                <div
                  :class="['panel-nav', { active: key === activeName }]"
                  v-for="key in Object.keys(propsTitleMap)"
                  :key="key"
                  @click="selectPanelNav(key)">
                  <div class="panel-nav__tilte">{{ propsTitleMap[key] }}</div>
                  <div class="panel-nav__count">
                    {{ sourceData[key]?.length }}
                  </div>
                </div>
              </div>
              <div class="prop-panel-content__right" ref="scrollEle">
                <div
                  class="panel-data"
                  v-for="key in Object.keys(propsTitleMap)"
                  :key="key"
                  :id="key">
                  <div class="panel-data__title">
                    {{ propsTitleMap[key] }}
                  </div>
                  <div class="panel-data-list">
                    <div v-if="key === 'customTableList'">
                      <div
                        v-for="(data, i) in sourceData[key]"
                        :key="`${i}_${key}`">
                        <div class="panel-data-table">{{ data?.fZh }}</div>
                        <div class="panel-data-table__container">
                          <div
                            :class="setItemClass(subData, key, data)"
                            v-for="(subData, j) in data?.fieldInfoList"
                            :key="`${j}_${key}_${data?.fEn}_${subData.fEn}`"
                            @mouseenter="showDesc($event, subData, key, data)"
                            @click="selectedChange(subData, key, data)">
                            <!--                            <div class="property-title" v-showTips>-->
                            <div
                              class="property-title ellipsis"
                              :title="subData.fZh">
                              {{ subData.fZh }}
                            </div>
                            <div class="property-type">
                              {{ propsTypeMap[subData.fType] }}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div
                      v-else
                      :class="setItemClass(data, key)"
                      v-for="(data, i) in sourceData[key]"
                      :key="`${i}_${key}`"
                      @mouseenter="showDesc($event, data, key)"
                      @click="selectedChange(data, key)">
                      <!--                      <div class="property-title" v-showTips>-->
                      <div class="property-title ellipsis" :title="data.fZh">
                        {{ data.fZh }}
                      </div>
                      <div class="property-type">
                        {{ propsTypeMap[data.fType] }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </div>
          <div
            v-show="!isEmpty(hoverItem)"
            ref="easPanelPopverRef"
            class="eas-panel-popver">
            <div class="popver-info-item">
              <div class="popver-info-item__left">{{ hoverItem.fZh }}</div>
              <div
                class="popver-info-item__right"
                v-if="showJumpLink(hoverItem)">
                <el-tooltip
                  effect="dark"
                  :content="$t('common.viewDetail')"
                  placement="top"
                  :hide-after="0">
                  <div style="display: inline-flex">
                    <svg-icon name="share" @click="goTo(hoverItem)" />
                  </div>
                </el-tooltip>
              </div>
            </div>
            <div class="attribute-en-name">{{ hoverItem.fEn }}</div>
            <div class="attribute-other">
              <div class="attribute-category">
                {{
                  hoverItem.kind === 'customTableList'
                    ? hoverItem.relationFieldOrNot
                      ? $t('analysis.interval.relatedAttributes')
                      : ''
                    : getShowProsType(hoverItem)
                }}
              </div>
              <div class="attribute-update">
                <div>{{ getGroupRefreshType(hoverItem) }}</div>
                <div class="attribute-update-method">
                  {{ getGroupAccumulation(hoverItem) }}
                </div>
              </div>
            </div>
            <div class="attribute-remark">
              {{ $t('common.remark') }}：{{ hoverItem.fDesc || '--' }}
            </div>
          </div>
        </div>
      </template>
    </el-dropdown>
  </div>
</template>

<style scoped lang="scss">
.active-border {
  border-color: var(--eas-color-primary);
}
.eas-prop-select {
  margin-right: 8px;
  :deep(.el-dropdown) {
    display: flex;
  }
}
:deep(.el-dropdown-menu__item) {
  &.active {
    color: var(--eas-color-primary);
  }
}
.eas-drop-panel {
  width: 620px;
  height: 420px;
  :deep(.el-input__wrapper) {
    box-shadow: none;
    padding: 5px 10px;
  }
}
.prop-panel-content {
  width: 100%;
  height: calc(100% - 40px);
  display: flex;
  border-top: 1px solid var(--eas-border-color);
  &__left {
    width: 141px;
    height: 100%;
    border-right: 1px solid var(--eas-border-color);
  }
  &__right {
    width: calc(100% - 141px);
    margin: 10px 0px 10px 10px;
    padding-right: 10px;
    overflow: auto;
  }
}
.panel-nav {
  width: 100%;
  height: 40px;
  display: flex;
  position: relative;
  padding: 11px 8px 10px 10px;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  &.active {
    &::after {
      content: '';
      top: 0px;
      left: 0px;
      position: absolute;
      width: 4px;
      height: 100%;
      background-color: var(--eas-color-primary);
      border-radius: var(--eas-border-radius);
    }
    .panel-nav__tilte {
      color: var(--eas-color-primary);
    }
    background-color: var(--eas-color-primary-light-1);
  }
  &:hover:not(.active) {
    .panel-nav__tilte {
      color: var(--eas-color-primary);
    }
    background-color: var(--eas-hover-color);
  }
  &__tilte {
    font-size: var(--eas-font-size-base);
    color: var(--eas-text-color-primary);
  }
  &__count {
    min-width: 20px;
    height: 16px;
    padding: 0px 3px;
    line-height: 16px;
    text-align: center;
    font-size: var(--eas-font-size-small);
    color: var(--eas-text-color-light);
    background-color: var(--eas-hover-color-1);
  }
}
.panel-data {
  &:not(:last-child) {
    margin-bottom: 10px;
  }
  &__title {
    padding-left: 10px;
    position: relative;
    font-size: var(--eas-font-size-small);
    font-weight: bold;
    color: var(--eas-text-color-light-1);
    /*&::after {
      content: '';
      top: 2px;
      left: 0px;
      position: absolute;
      width: 4px;
      height: 16px;
      background-color: var(--eas-color-primary);
      border-radius: 3px;
    }*/
  }
  &-list {
    margin-top: 9px;
  }
  &-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 32px;
    padding: 7px 10px 6px;
    font-size: var(--eas-font-size-base);
    border-radius: var(--eas-border-radius-4);
    cursor: pointer;
    &:not(:last-child) {
      margin-bottom: 4px;
    }
    &:hover:not(.is-selected) {
      background-color: var(--eas-hover-color);
    }
    &.no-permission {
      cursor: not-allowed;
      .property-title,
      .property-type {
        color: var(--eas-text-color-light-1);
      }
    }
  }
  &-table {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 32px;
    padding: 7px 10px 6px;
    font-size: var(--eas-font-size-small);
    color: var(--eas-text-color-light);
    &__container {
      padding: 0px 0px 0px 15px;
      margin: 5px 0px;
    }
  }
}
.property-title {
  width: 318px;
  color: var(--eas-text-color-primary);
}
.property-type {
  font-size: var(--eas-font-size-small);
  color: var(--eas-text-color-light);
}
.is-selected {
  background-color: var(--eas-color-primary-light-1);
  .property-title {
    color: var(--eas-color-primary);
  }
}
.is-disabled {
  &:not(.is-selected) {
    cursor: not-allowed;
    opacity: 0.5;
  }
}
.search-content {
  width: calc(100% - 10px);
  margin: 10px 0px 10px 10px;
  padding-right: 10px;
  overflow: auto;
}
.nd-clear-data {
  display: none;
}
.eas-drop-box {
  &:hover {
    .nd-clear-data {
      display: block;
    }
  }
}
</style>
