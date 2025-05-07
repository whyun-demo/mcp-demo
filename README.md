# MCP 演示demo
教程 [mcp协议的前世今生](https://blog.whyun.com/posts/mcp-history/) 配套代码。
## 使用方法
### 配置
项目启动依赖于若干环境变量，具体配置项写在了 example.env 中。运行前需要将 example.env 重命名为 .env，将里面各个值填充上。
### 运行
#### 服务器端调试
运行 `npm run inspect:stdout` ，可以启动本地标准输出服务。打开浏览器后，就可以验证 tools 函数是否工作正常。
#### 客户端、服务器端联调
运行 `npm run streamable` ，可以启动 http 流式输出服务。然后运行 `npm run client` ，可以连接这个流式服务进行问答，里面包含了一条演示用的提示词，运行成功后可以打印当前所在位置的天气描述。