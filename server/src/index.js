const app = require('./app')
const config = require('./config')

// 初始化数据库
require('./db')

// 启动服务器
app.listen(config.PORT, config.HOST, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   Her Auth Server                                         ║
║                                                           ║
║   Server running at: http://${config.HOST}:${config.PORT}              ║
║   Admin panel: http://${config.HOST}:${config.PORT}/admin              ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `)
})
