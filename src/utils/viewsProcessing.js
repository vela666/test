const defaultPath = '/src/views/'
const defaultMobilePath = '/mobile/src/views/'

// const routeAllPathToCompMap = import.meta.glob(`../../views/**/*.vue`)
// import.meta.glob( '@/views/!(reolad|login|error)**/(index*).vue')
// import.meta.glob('../../views/**/!(Test|404).vue'),
// 过滤4|5开头的文件
// const dynamicRoutesModules = import.meta.glob('../../../views/**/!(4|5).vue')
// 过滤reolad|login|error等这些文件夹
/*const dynamicRoutesModules = import.meta.glob(
    '@/views/!(reolad|login|error)**!/!*.vue',
)*/

// 获取views下 过滤reolad|login|error等这些文件夹下 index.vue文件
const dynamicRoutesModules = import.meta.glob(
  '@/views/!(reolad|login|error)**/index.vue'
)

// 剔除components文件夹下的组件
for (const key in dynamicRoutesModules) {
  if (key.includes('components')) {
    Reflect.deleteProperty(dynamicRoutesModules, key)
  }
}

const dynamicMobileRoutesModules = import.meta.glob(
  '@mobile/views/!(reolad|login|error)**/index.vue'
)

// 剔除components文件夹下的组件
for (const key in dynamicMobileRoutesModules) {
  if (key.includes('components')) {
    Reflect.deleteProperty(dynamicMobileRoutesModules, key)
  }
}

// 获取每个页面下routeMeta.js导出的配置
// 配置项看src/router/routes.js下说明
/*const metaModules = import.meta.glob(
  '@/views/!(reolad|login|error)**!/routeMeta.js',
  {
    eager: true,
    import: 'default',
  }
)*/

export {
  dynamicRoutesModules,
  dynamicMobileRoutesModules,
  defaultPath,
  defaultMobilePath,
}
