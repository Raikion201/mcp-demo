# MCP-UI Todo Application

A modern MCP (Model Context Protocol) Todo application demonstrating **MCP-UI** integration - serving interactive UI components directly from an MCP server.

## ✨ Features

- **MCP-UI Server SDK**: Server generates interactive HTML UI resources using `@mcp-ui/server`
- **MCP-UI Client SDK**: Client renders UI resources using `UIResourceRenderer` from `@mcp-ui/client`
- **Streamable HTTP Transport**: Modern MCP transport with session management
- **Embedded Interactive UI**: Full todo interface served as MCP UIResource
- **Bi-directional Communication**: UI actions sent via postMessage, handled by host

## 📁 Project Structure

```
├── mcp-server/          # MCP Backend with MCP-UI
│   └── src/
│       ├── http-server.ts   # Streamable HTTP server with UI generation
│       ├── core/storage.ts  # In-memory todo storage
│       └── tools/           # Tool implementations
└── mcp-ui/              # Next.js Frontend with MCP-UI Client
    └── app/
        └── page.tsx     # UIResourceRenderer integration
```

## 🚀 Quick Start

### 1. Install & Start the MCP Server

```bash
cd mcp-server
npm install
npm run dev:http
```

Server runs at `http://localhost:3001/mcp`

### 2. Install & Start the UI

```bash
cd mcp-ui
npm install
npm run dev
```

UI runs at `http://localhost:3000`

### 3. Connect Cursor to MCP Server (Optional)

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
Show me the todo UI
Create a todo called "Buy groceries"
List all my todos
Mark the todo as completed
Delete the todo
```

## 🔧 MCP Tools

| Tool | Description |
|------|-------------|
| `todo_ui` | Display interactive Todo application UI (returns UIResource) |
| `todo_create` | Create a new todo (returns updated UI) |
| `todo_list` | List all todos |
| `todo_update` | Update a todo (returns updated UI) |
| `todo_delete` | Delete a todo (returns updated UI) |

## 🎨 MCP-UI Architecture

### Server Side (`@mcp-ui/server`)

```typescript
import { createUIResource } from '@mcp-ui/server';

const uiResource = createUIResource({
  uri: 'ui://todo-app/main',
  content: { type: 'rawHtml', htmlString: htmlContent },
  encoding: 'text',
  metadata: {
    title: 'Todo Application',
    preferredFrameSize: ['700px', '800px'],
  },
});
```

### Client Side (`@mcp-ui/client`)

```tsx
import { UIResourceRenderer } from '@mcp-ui/client';

<UIResourceRenderer
  resource={resource}
  onUIAction={handleUIAction}
  htmlProps={{
    autoResizeIframe: true,
  }}
/>
```

### Communication Flow

1. Client calls `todo_ui` tool → Server returns UIResource with HTML
2. Client renders UIResource in sandboxed iframe via `UIResourceRenderer`
3. User interacts with embedded UI → postMessage sent to parent
4. Client receives action → calls appropriate MCP tool
5. Server processes action → returns updated UIResource
6. Client updates rendered UI

## 📚 Key Concepts

### UIResource Structure

```typescript
{
  type: 'resource',
  resource: {
    uri: 'ui://todo-app/main',
    mimeType: 'text/html',
    text: '<html>...</html>'
  }
}
```

### Intent Messages (UI → Host)

```javascript
window.parent.postMessage({
  type: 'intent',
  payload: {
    intent: 'todo_create',
    params: { title: 'New task', description: '...' }
  }
}, '*');
```

## 📦 Dependencies

### Server
- `@modelcontextprotocol/sdk` - MCP SDK
- `@mcp-ui/server` - MCP-UI Server SDK
- `express` - HTTP server
- `uuid` - ID generation

### Client
- `@mcp-ui/client` - MCP-UI Client SDK
- `next` - React framework
- `react` - UI library

## License

MIT
