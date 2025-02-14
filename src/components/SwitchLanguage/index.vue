<template>
  <DropSelectorSingle
    v-bind="$attrs"
    v-model="locale"
    :data="languageTypeList"
    @change="changeLocale">
    <template #default v-if="$slots.default">
      <slot />
    </template>
  </DropSelectorSingle>
</template>

<script setup>
import { useLocaleHooks } from './localeHooks'

defineOptions({
  name: 'SwitchLanguage',
})

const { languageTypeList, changeLocale, locale } = useLocaleHooks()
</script>
