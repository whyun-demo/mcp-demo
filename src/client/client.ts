import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import OpenAI from "openai";
import { ChatCompletionMessageParam } from "openai/resources.mjs";

const config = {
	apiKey: process.env.API_KEY,
	aiBaseURL: process.env.BASE_URL,
	model: process.env.MODEL as string,
    mcpBaseURL: (process.env.MCP_BASE_URL as string) || 'http://localhost:3000/mcp',
};

const client = new OpenAI({
	apiKey: config.apiKey,
	baseURL: config.aiBaseURL,
});
class McpClient {
    private mcp: Client = new Client({
        name: 'mcp-client',
        version: '0.0.1'
    });
    public tools: any[] = [];
    public async connectToServer() {
        const baseUrl = new URL(config.mcpBaseURL);
        const transport = new StreamableHTTPClientTransport(baseUrl);
        await this.mcp.connect(transport);
        const toolsResult = await this.mcp.listTools();
        this.tools = toolsResult.tools.map((tool) => {
            return {
                type: 'function',
                function: {
                    name: tool.name,
                    type: 'function',
                    description: tool.description,
                    input_schema: tool.parameters,
                    parameters: tool.inputSchema,
                }
            }
        });
    }
    public async processQuery(_messages: ChatCompletionMessageParam[] | string): Promise<string|null> {
        let messages: ChatCompletionMessageParam[] = [];
        if (!Array.isArray(_messages)) {
            messages = [
                {
                    role: 'user',
                    content: _messages as string
                },
            ];
        } else {
            messages = _messages;
        }
        const completion = await client.chat.completions.create({
            model: config.model,
            messages: messages,
            tools: this.tools,
            tool_choice: 'auto'
        });
        const content = completion.choices[0];
        console.log('first',JSON.stringify(content, null, 2))
        messages.push(content.message);
        if (content.finish_reason === 'tool_calls') {
			// 如何是需要使用工具，就解析工具
			for (const toolCall of content.message.tool_calls!) {
				const toolName = toolCall.function.name;
                const args = toolCall.function.arguments;
				const toolArgs = typeof (args) === 'string' ?
                  JSON.parse(args):
                  args;

				// 调用工具
				const result = await this.mcp.callTool({
					name: toolName,
					arguments: toolArgs || {}
				}) as {
                    content: Array<{
                        type: 'text',
                        text: string
                    }>
                };
                const content = result.content[0];
				messages.push({
					role: 'tool', // 工具消息的角色应该是 tool
					content: content.text, //工具返回的结果， 国内部分大模型不支持对象，所以需要转换为字符串
					tool_call_id: toolCall.id,
					// name: toolName,
				});
			}
            // console.log('sencond', JSON.stringify(messages, null, 2))
            return await this.processQuery(messages);
		}

        // const response = await client.chat.completions.create({
		// 	model: config.model,
		// 	messages, // 这里需要传入工具调用的结果
		// 	tools: this.tools, // 这里需要传入工具列表，这里必填
		// });
        return content.message.content;

    }
}

const mcpClient = new McpClient();


async function main() {
    await mcpClient.connectToServer();
    const response = await mcpClient.processQuery('现在的天气');
    console.log('response', response);
}

main();

