
## Project Structure

```
mcp-ui/
├── app/
│   ├── page.tsx          # Main todo app page
│   ├── layout.tsx        # App layout
│   └── globals.css       # Global styles
├── components/
│   ├── TodoForm.tsx      # Form to add new todos
│   ├── TodoItem.tsx      # Individual todo item
│   └── TodoList.tsx      # List of todos
├── lib/
│   └── mcp-client.ts     # MCP protocol client
└── .env.local            # Environment variables
```

## MCP Integration

The app communicates with the MCP server using JSON-RPC 2.0 protocol:

### Available MCP Tools:
- `todo_create` - Creates a new todo
- `todo_list` - Lists all todos
- `todo_update` - Updates a todo
- `todo_delete` - Deletes a todo

```

## Usage

1. **Start the MCP Server** (in `mcp-server` directory):
   ```bash
   npm run dev
   ```

2. **Start the Frontend** (in `mcp-ui` directory):
   ```bash
   npm run dev
   ```

3. **Open your browser** to `http://localhost:3000`

4. **Add a todo** using the form on the left
5. **Manage todos** in the list on the right
   - Click checkbox to toggle completion
   - Click "Edit" to modify
   - Click "Delete" to remove

