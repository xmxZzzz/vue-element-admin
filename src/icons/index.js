import Vue from 'vue'
import SvgIcon from '@/components/SvgIcon'// svg component

// register globally
Vue.component('svg-icon', SvgIcon)

// req是指去加载svg目录中的模块的函数
const req = require.context('./svg', false, /\.svg$/)
// 定义函数：map传入一个函数，遍历数组中的每个对象，被webpack自动进行导入
const requireAll = requireContext => requireContext.keys().map(requireContext)
// 执行函数进行加载svg模块
requireAll(req)

// 等价于
// req.keys().map(req)
