<script setup>
import { onMounted, reactive, ref, useAttrs } from 'vue'
import { VAceEditor } from 'vue3-ace-editor'
import 'ace-builds/src-noconflict/mode-mysql'
import 'ace-builds/src-noconflict/theme-chrome'
import 'ace-builds/src-noconflict/ext-beautify'
import 'ace-builds/src-noconflict/snippets/mysql'
import 'ace-builds/src-noconflict/ext-static_highlight'
import { format } from 'sql-formatter'
import { t } from '@/locales/i18n'

const attrs = useAttrs()

const state = reactive({
  exampleList: [
    {
      title: t('analysis.sqlquery.userTableExample'),
      sql: "select __fid,__reg,__first_start_time,__first_version from {user} where to_char(__first_start_time,'yyyy-mm-dd') ='2021-07-07' limit 10",
    },
    {
      title: t('analysis.sqlquery.eventTableExample'),
      sql: "select __fid,__reg,__first_start_time,__current_version from {event} where __pt_date='2021-07-07' limit 10",
    },
    {
      title: t('analysis.sqlquery.dynamicTimeExample'),
      sql: "select  __pt_date,COALESCE(__reg,'null') as __reg,count(1) as num from {event} where __event_name = 'eventName' and __pt_date::date <current_date -  7 GROUP BY __pt_date,COALESCE(__reg,'null') order by __pt_date,num desc limit 100",
    },
    {
      title: t('analysis.sqlquery.linkedTableExample'),
      sql: "SELECT COALESCE(count(1), 0) total, EVENT.__pt_date FROM {event} EVENT LEFT JOIN ( SELECT __fid, __reg, __properties_update_time FROM {user} users WHERE __properties_update_time > '2021-12-21 00:00:00' :: TIMESTAMP + '-7 day' ) users ON EVENT.__fid = users.__fid WHERE EVENT.__event_name = 'launch' AND users.__reg IN('us', 'gb') AND ( users.__properties_update_time :: date - CURRENT_DATE ) BETWEEN 0 AND 1 AND EVENT.__pt_date >= '2021-12-21' AND EVENT.__pt_date <= '2021-12-28' GROUP BY EVENT.__pt_date ORDER BY total DESC LIMIT 1000",
    },
    {
      title: t('analysis.sqlquery.timestampExample'),
      sql: 'to_timestamp(__event_time)::date',
    },
  ],
  visible: false,
})

onMounted(() => {
  state.exampleList.forEach((item) => {
    item.sql = getFormatSQL(item.sql)
  })
})

const open = () => {
  state.visible = true
}

/**
 * @description: 格式化SQL
 * @return {*}
 */
const getFormatSQL = (value) => {
  return format(value.trim(), {
    language: 'mysql',
    tabWidth: 4,
    keywordCase: 'upper',
    linesBetweenQueries: 2,
  })
}

defineExpose({ open })

defineOptions({
  name: 'ExampleDrawer',
})
</script>
<template>
  <CommonDrawer
    size="600px"
    v-model="state.visible"
    :needFooter="false"
    :title="$t('common.example')">
    <div class="flex-column">
      <div v-for="(item, index) in state.exampleList" :key="index">
        <div class="mt20 mb20 txt-bold">
          {{ $t('analysis.sqlquery.exampleIndex', [index + 1]) }}：{{
            item.title
          }}
        </div>
        <VAceEditor
          v-model:value="state.exampleList[index].sql"
          v-bind="attrs"
          class="w100-percentage"
          lang="mysql"
          :options="{
            enableBasicAutocompletion: false,
            enableSnippets: true,
            enableLiveAutocompletion: true,
            tabSize: 6,
            fontSize: 14,
            maxLines: 30,
            minLines: 5,
            wrap: true,
            readOnly: true,
            showPrintMargin: false,
          }" />
      </div>
    </div>
  </CommonDrawer>
</template>
<style lang="scss" scoped></style>
