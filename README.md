# MCP 演示demo
## 使用方法
将 example.env 重命名为 .env，将里面各个值填充上。

运行 npm run inspect:stdout ，可以启动本地标准输出服务。打开浏览器后，就可以验证 tools 函数是否工作正常。

运行 npm run streamable ，可以启动 http 流式输出服务。然后运行 npm run client ，可以连接这个流式服务进行问答，里面包含了一条演示用的提示词，运行成功后可以打印当前所在位置的天气描述。