// 监听文件变化
const chokidar = require('chokidar')
// 解析传入的请求体并返回 json格式的数据。
const bodyParser = require('body-parser')
// chalk 是一个可以修改终端输出字符样式的 npm 包。
const chalk = require('chalk')
const path = require('path')
const Mock = require('mockjs')

// (process.cwd()：返回当前执行node命令时的的工作目录
// __dirname：是被执行的js文件的所在目录
const mockDir = path.join(process.cwd(), 'mock')
// console.log('process.cwd()：', process.cwd())  //  ...\vue-element-admin
// console.log('__dirname：', __dirname)          // ...\vue-element-admin\mock

// 注册路由，Express相关
function registerRoutes(app) {
  let mockLastIndex
  const { mocks } = require('./index.js')
  const mocksForServer = mocks.map(route => {
    return responseFake(route.url, route.type, route.response)
  })
  for (const mock of mocksForServer) {
    app[mock.type](mock.url, mock.response)
    mockLastIndex = app._router.stack.length
  }
  const mockRoutesLength = Object.keys(mocksForServer).length
  return {
    mockRoutesLength: mockRoutesLength,
    mockStartIndex: mockLastIndex - mockRoutesLength
  }
}

function unregisterRoutes() {
  Object.keys(require.cache).forEach(i => {
    if (i.includes(mockDir)) {
      delete require.cache[require.resolve(i)]
    }
  })
}

// for mock server 统一处理结果，并注册
const responseFake = (url, type, respond) => {
  return {
    url: new RegExp(`${process.env.VUE_APP_BASE_API}${url}`),
    type: type || 'get',
    response(req, res) {
      console.log('request invoke:' + req.path)
      /*
      * webpack注册，示例：
      *   devServer.
      *     before: function(app,server,compiler){
      *       app.get('/some/path',function(req,res){
      *         res.json({ custom: 'response'});
      *       })
      *     }
      * */
      res.json(Mock.mock(respond instanceof Function ? respond(req, res) : respond))
    }
  }
}

module.exports = app => {
  // parse app.body
  // https://expressjs.com/en/4x/api.html#req.body
  app.use(bodyParser.json())
  // 解析URL-encode数据，extended:true;表示使用qs库来解析
  app.use(bodyParser.urlencoded({
    extended: true
  }))

  const mockRoutes = registerRoutes(app)
  var mockRoutesLength = mockRoutes.mockRoutesLength
  var mockStartIndex = mockRoutes.mockStartIndex

  // watch files, hot reload mock server
  chokidar.watch(mockDir, {
    // 所要忽略监听的文件或者文件夹
    ignored: /mock-server/,
    // 忽略对增加文件或者增加文件夹的时候进行发送事件，即程序初始化运行时，就不会触发add/addDir事件
    ignoreInitial: true
    // all：监听除了ready、raw and error之外所有的事件类型
  }).on('all', (event, path) => {
    // 文件内容改变、或者新增文件时 触发
    if (event === 'change' || event === 'add') {
      try {
        // remove mock routes stack
        app._router.stack.splice(mockStartIndex, mockRoutesLength)

        // clear routes cache 清理路由，清理了require的缓存
        unregisterRoutes()
        // 重新注册路由
        const mockRoutes = registerRoutes(app)
        mockRoutesLength = mockRoutes.mockRoutesLength
        mockStartIndex = mockRoutes.mockStartIndex

        // 控制台使用亮品红（看起来是亮紫色）的颜色打印提示信息
        console.log(chalk.magentaBright(`\n > Mock Server hot reload success! changed  ${path}`))
      } catch (error) {
        // 控制台使用亮红的颜色打印错误信息
        console.log(chalk.redBright(error))
      }
    }
  })
}
