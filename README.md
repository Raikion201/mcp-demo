# MCP Todo - Interactive Todo Management with MCP-UI

A minimal MCP (Model Context Protocol) implementation featuring an interactive Todo application with AI-powered chat interface using DeepSeek AI.

## 🌟 Features

- **MCP Server**: Exposes 5 tools (`todo_ui`, `todo_create`, `todo_list`, `todo_update`, `todo_delete`)
- **AI Chat Interface**: Natural language interaction using Google Gemini with function calling
- **MCP-UI Integration**: Interactive UI resources rendered directly in the chat
- **Real-time Updates**: Changes reflect immediately in the embedded UI

## 📁 Project Structure

```
mcp/
├── mcp-server/          # MCP Server with todo tools
│   ├── src/
│   │   ├── http-server.ts   # Main HTTP/MCP server
│   │   └── core/storage.ts  # In-memory todo storage
│   └── package.json
│
├── mcp-ui/              # Next.js Chat Interface
│   ├── app/page.tsx     # Main chat page with Gemini AI
│   ├── lib/mcp-client.ts # MCP client for tool calls
│   └── package.json
│
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or pnpm

### 1. Install Dependencies

```bash
# Install server dependencies
cd mcp-server
npm install

# Install client dependencies
cd ../mcp-ui
npm install
```

### 2. Start the MCP Server

```bash
cd mcp-server
npm install
npm run dev
```

The server will start at `http://localhost:3001/mcp`

### 3. Start the Chat UI

```bash
cd mcp-ui
npm run dev
```

The UI will be available at `http://localhost:3000`

## 🔧 MCP Tools

| Tool | Description |
|------|-------------|
| `todo_ui` | Display the interactive Todo application UI |
| `todo_create` | Create a new todo with title and optional description |
| `todo_list` | List all todos, optionally filter by completion status |
| `todo_update` | Update a todo's title, description, or completion status |
| `todo_delete` | Delete a todo by ID |

## 💬 Chat Examples

Try these commands in the chat:

- "Show me my todos"
- "Create a todo: Buy groceries"
- "Add a task to finish the report by Friday"
- "Show me the todo UI"
- "Mark all my todos as completed"

## 🔑 Configuration

### Environment Variables

Create `.env.local` in the `mcp-ui` folder:

```env
# DeepSeek API Key
NEXT_PUBLIC_DEEPSEEK_API_KEY=your_deepseek_api_key_here

# MCP Server URL  
NEXT_PUBLIC_MCP_SERVER_URL=http://localhost:3001/mcp
```

Get your DeepSeek API key from: https://platform.deepseek.com/

## 🏗️ Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│   Chat UI       │────▶│  Gemini AI      │────▶│  MCP Server     │
│   (Next.js)     │     │  (Function      │     │  (Express +     │
│                 │◀────│   Calling)      │◀────│   MCP SDK)      │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                                               │
        │           ┌─────────────────┐                 │
        └──────────▶│   MCP-UI        │◀────────────────┘
                    │   Resource      │
                    │   Renderer      │
                    └─────────────────┘
```

### Flow

1. User sends message in chat
2. Gemini AI determines which MCP tool to call
3. Chat UI calls MCP server with tool parameters
4. MCP server executes tool and returns UI resource
5. UI resource is rendered in chat using `UIResourceRenderer`
6. User can interact with embedded UI (creates, updates, deletes)
7. Actions are sent back to MCP server

## 📦 Dependencies

### Server
- `@modelcontextprotocol/sdk` - MCP SDK
- `@mcp-ui/server` - UI resource creation
- `express` - HTTP server
- `zod` - Schema validation

### Client
- `@mcp-ui/client` - UI resource rendering
- `openai` - OpenAI-compatible SDK (for DeepSeek)
- `next` - React framework
- `react` - UI library

## 🔒 Security Notes

- The Google API key is exposed client-side (NEXT_PUBLIC_*). For production, use a backend proxy
- MCP server has CORS enabled for development. Restrict in production
- In-memory storage resets on server restart

## 📝 License

MIT

## 🙏 Acknowledgments

- [MCP-UI](https://github.com/idosal/mcp-ui) by Ido Salomon
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [DeepSeek AI](https://deepseek.com/)
