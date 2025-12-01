# MCP Todo Server

A dual-transport MCP (Model Context Protocol) server for todo management.

## Features

- ✅ **4 MCP Tools**: `todo_create`, `todo_list`, `todo_update`, `todo_delete`
- 🔌 **Dual Transport Support**:
  - **stdio** - For Claude Desktop and MCP clients
  - **HTTP** - For Next.js UI and web clients
- 📝 **JSON Schema** validation for all tools
- 💾 **In-memory storage** (shared between both transports)
- 🔧 **TypeScript** for type safety

## Installation

```bash
npm install
```

## Usage

### For Cursor (stdio mode) - Recommended ✨

Test directly in your IDE!

1. Build the server:
```bash
npm run build
```

2. Configure Cursor:
   - See [CURSOR_SETUP.md](./CURSOR_SETUP.md) for detailed instructions

3. Restart Cursor and start chatting with the AI!

### For Claude Desktop (stdio mode)

Alternative LLM client testing.

1. Build the server:
```bash
npm run build
```

2. Configure Claude Desktop:
   - See [CLAUDE_DESKTOP_SETUP.md](./CLAUDE_DESKTOP_SETUP.md) for detailed instructions

3. Restart Claude Desktop and start chatting!

### For Next.js UI (HTTP mode)

1. Start the HTTP server:
```bash
npm run dev:http
```

The server will run on `http://localhost:3001`

## Development

### stdio mode (for Claude Desktop):
```bash
npm run dev
```

### HTTP mode (for Next.js UI):
```bash
npm run dev:http
```

## MCP Tools

### 1. `todo_create`
Create a new todo item.

**Input:**
```json
{
  "title": "string (required)",
  "description": "string (optional)"
}
```

**Example with Claude:**
```
"Create a todo to buy milk"
```

### 2. `todo_list`
List all todos with optional filtering.

**Input:**
```json
{
  "completed": "boolean (optional)"
}
```

**Example with Claude:**
```
"Show me all my incomplete todos"
```

### 3. `todo_update`
Update an existing todo.

**Input:**
```json
{
  "id": "string (required)",
  "title": "string (optional)",
  "description": "string (optional)",
  "completed": "boolean (optional)"
}
```

**Example with Claude:**
```
"Mark the first todo as completed"
```

### 4. `todo_delete`
Delete a todo by ID.

**Input:**
```json
{
  "id": "string (required)"
}
```

**Example with Claude:**
```
"Delete the todo about buying milk"
```

## Architecture

```
┌──────────────────┐                    ┌─────────────────────┐
│  Claude Desktop  │──── stdio MCP ───→ │                     │
│   (MCP Client)   │                    │   MCP Server        │
└──────────────────┘                    │                     │
                                        │   Core Logic:       │
┌──────────────────┐                    │   - todo_create     │
│   Next.js UI     │──── HTTP API ────→ │   - todo_list       │
│  (Web Client)    │                    │   - todo_update     │
└──────────────────┘                    │   - todo_delete     │
                                        │                     │
                                        │   Shared Storage    │
                                        └─────────────────────┘
```

## Project Structure

```
mcp-server/
├── src/
│   ├── index.ts              # stdio MCP server (for Claude Desktop)
│   ├── http-server.ts        # HTTP wrapper (for Next.js UI)
│   └── core/
│       ├── tools.ts          # Shared tool implementations
│       └── storage.ts        # Shared in-memory storage
├── package.json
├── tsconfig.json
├── README.md
└── CLAUDE_DESKTOP_SETUP.md   # Claude Desktop setup guide
```

## Testing

### With Claude Desktop (Recommended)
1. Follow the [Claude Desktop Setup Guide](./CLAUDE_DESKTOP_SETUP.md)
2. Chat with Claude to manage your todos
3. Claude will use the MCP tools automatically

### With Next.js UI
1. Start the HTTP server: `npm run dev:http`
2. Start the Next.js UI (in the `mcp-ui` directory)
3. Use the web interface

### Manual Testing (HTTP)
```bash
curl -X POST http://localhost:3001/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list"
  }'
```

## Tech Stack

- **@modelcontextprotocol/sdk** - Official MCP SDK
- **Express.js** - HTTP server
- **TypeScript** - Type safety
- **UUID** - Unique ID generation

## License

MIT
