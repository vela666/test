// https://prettier.io/docs/en/options#print-width
export default {
  // printWidth: 150,
  semi: false, // 行尾不需要分号
  singleQuote: true, // 使用单引号
  bracketSpacing: true, // 对象文字中括号之间的空格
  quoteProps: 'as-needed', // 对象的 key 仅在必要时用引号
  trailingComma: 'es5', //是否在多行逗号分隔语法中，在最后一个元素后面加逗号
  endOfLine: 'auto', // 换行符使用
  // 将多行HTML（HTML、JSX、Vue、Angular）元素的>放在最后一行的末尾，而不是单独放在下一行（不适用于自关闭元素）。
  bracketSameLine: true,
}
