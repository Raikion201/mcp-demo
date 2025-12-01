# MCP Todo Application

A minimal MCP (Model Context Protocol) server with 4 todo tools, tested with Cursor IDE.

## 📁 Project Structure

```
├── mcp-server/          # MCP Backend (HTTP mode)
│   └── src/tools/       # Tool implementations with JSON schemas
└── mcp-ui/              # Next.js Frontend
```

## 🚀 Quick Start

### 1. Install & Start the MCP Server

```bash
cd mcp-server
npm install
npm run dev:http
```

Server runs at `http://localhost:3001/mcp`

### 2. Install & Start the UI (Optional)

```bash
cd mcp-ui
npm install
npm run dev
```

UI runs at `http://localhost:3000`

### 3. Connect Cursor to MCP Server

Create/edit `C:\Users\<YOUR_USER>\.cursor\mcp.json`:

```json
{
  "mcpServers": {
    "todo": {
      "url": "http://localhost:3001/mcp"
    }
  }
}
```

Then **reload Cursor** (`Ctrl+Shift+P` → "Developer: Reload Window")

### 4. Test in Cursor Chat

Try these commands:

```
Create a todo called "Buy groceries"
List all my todos
Mark the todo as completed
Delete the todo
```

## 🔧 MCP Tools

| Tool | Description |
|------|-------------|
| `todo_create` | Create a new todo |
| `todo_list` | List all todos |
| `todo_update` | Update a todo |
| `todo_delete` | Delete a todo |

## 📋 JSON Schemas

Located in `mcp-server/src/tools/schemas/`:
- `todo-create.schema.json`
- `todo-list.schema.json`
- `todo-update.schema.json`
- `todo-delete.schema.json`

## License

MIT
