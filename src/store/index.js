import Vue from 'vue'
import Vuex from 'vuex'
import getters from './getters'

Vue.use(Vuex)

// https://webpack.js.org/guides/dependency-management/#requirecontext
/*
   1、require.context(directory, useSubdirectories = false, regExp = /^\.\//)
        directory: 要搜索的文件夹目录
        useSubdirectories: 是否还应该搜索它的子目录，
        regExp: 以及一个匹配文件的正则表达式。
        返回值有三个属性： resolve/keys/id
           resolve是一个函数，返回已解析请求的模块id
           keys是一个函数，它返回上下文模块可以处理的所有可能请求的数组
  2、引入modules/*.js多个组件
 */
const modulesFiles = require.context('./modules', true, /\.js$/)

// you do not need `import app from './modules/app'`
// it will auto require all vuex module from modules file
// reduce(function, initData): 累计
const modules = modulesFiles.keys().reduce((modules, modulePath) => {
  // set './app.js' => 'app'
  const moduleName = modulePath.replace(/^\.\/(.*)\.\w+$/, '$1')
  const value = modulesFiles(modulePath)
  modules[moduleName] = value.default
  return modules
}, {})

// 若只是加载模块
// modulesFiles.keys().map(modulesFiles)

const store = new Vuex.Store({
  modules,
  getters
})

export default store
