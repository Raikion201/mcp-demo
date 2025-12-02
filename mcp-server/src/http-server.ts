// HTTP server for MCP-UI integration using official MCP SDK
import express from 'express';
import cors from 'cors';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { createUIResource } from '@mcp-ui/server';
import { todoStorage, Todo } from './core/storage.js';
import { randomUUID } from 'crypto';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'mcp-session-id'],
  exposedHeaders: ['Mcp-Session-Id'],
}));
app.use(express.json());

// Map to store transports by session ID
const transports: { [sessionId: string]: StreamableHTTPServerTransport } = {};

// Health check
app.get('/', (req, res) => {
  res.json({
    name: 'MCP Todo Server with MCP-UI',
    version: '2.0.0',
    status: 'running',
    features: ['mcp-ui', 'streamable-http'],
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Generate interactive HTML for the Todo UI
function generateTodoListHTML(todos: Todo[]): string {
  const incompleteTodos = todos.filter(t => !t.completed);
  const completedTodos = todos.filter(t => t.completed);
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Todo List</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%);
      color: #e8e8e8;
      min-height: 100vh;
      padding: 20px;
    }
    
    .container {
      max-width: 600px;
      margin: 0 auto;
    }
    
    header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }
    
    h1 {
      font-size: 2.5rem;
      font-weight: 300;
      letter-spacing: 3px;
      color: #00d9ff;
      text-shadow: 0 0 20px rgba(0,217,255,0.3);
      margin-bottom: 8px;
    }
    
    .subtitle {
      color: #888;
      font-size: 0.9rem;
    }
    
    .stats {
      display: flex;
      justify-content: center;
      gap: 20px;
      margin-top: 15px;
    }
    
    .stat {
      background: rgba(255,255,255,0.05);
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 0.85rem;
    }
    
    .stat-value {
      color: #00d9ff;
      font-weight: 600;
    }
    
    /* Form Styles */
    .todo-form {
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 16px;
      padding: 20px;
      margin-bottom: 25px;
    }
    
    .form-row {
      display: flex;
      gap: 10px;
      margin-bottom: 10px;
    }
    
    input[type="text"], textarea {
      flex: 1;
      background: rgba(0,0,0,0.3);
      border: 1px solid rgba(255,255,255,0.15);
      border-radius: 10px;
      padding: 12px 16px;
      color: #fff;
      font-size: 1rem;
      transition: all 0.3s ease;
    }
    
    input[type="text"]:focus, textarea:focus {
      outline: none;
      border-color: #00d9ff;
      box-shadow: 0 0 15px rgba(0,217,255,0.2);
    }
    
    input::placeholder, textarea::placeholder {
      color: #666;
    }
    
    textarea {
      resize: none;
      min-height: 60px;
    }
    
    .btn {
      background: linear-gradient(135deg, #00d9ff 0%, #00b4d8 100%);
      color: #0f0f23;
      border: none;
      padding: 12px 24px;
      border-radius: 10px;
      font-size: 0.95rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    
    .btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 20px rgba(0,217,255,0.4);
    }
    
    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
    }
    
    .btn-secondary {
      background: rgba(255,255,255,0.1);
      color: #e8e8e8;
    }
    
    .btn-secondary:hover {
      background: rgba(255,255,255,0.15);
      box-shadow: none;
    }
    
    /* Todo List */
    .section-title {
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: #666;
      margin-bottom: 12px;
      padding-left: 5px;
    }
    
    .todo-list {
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 16px;
      overflow: hidden;
      margin-bottom: 20px;
    }
    
    .todo-item {
      display: flex;
      align-items: flex-start;
      gap: 15px;
      padding: 16px 20px;
      border-bottom: 1px solid rgba(255,255,255,0.05);
      transition: all 0.3s ease;
    }
    
    .todo-item:last-child {
      border-bottom: none;
    }
    
    .todo-item:hover {
      background: rgba(255,255,255,0.03);
    }
    
    .checkbox {
      width: 22px;
      height: 22px;
      border: 2px solid rgba(255,255,255,0.3);
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
      flex-shrink: 0;
      margin-top: 2px;
    }
    
    .checkbox:hover {
      border-color: #00d9ff;
    }
    
    .checkbox.checked {
      background: #00d9ff;
      border-color: #00d9ff;
    }
    
    .checkbox.checked::after {
      content: '✓';
      color: #0f0f23;
      font-size: 12px;
      font-weight: bold;
    }
    
    .todo-content {
      flex: 1;
      min-width: 0;
    }
    
    .todo-title {
      font-size: 1rem;
      color: #e8e8e8;
      margin-bottom: 4px;
      word-break: break-word;
    }
    
    .todo-item.completed .todo-title {
      text-decoration: line-through;
      color: #666;
    }
    
    .todo-description {
      font-size: 0.85rem;
      color: #888;
      word-break: break-word;
    }
    
    .todo-item.completed .todo-description {
      text-decoration: line-through;
      color: #555;
    }
    
    .todo-actions {
      display: flex;
      gap: 8px;
      opacity: 0;
      transition: opacity 0.2s ease;
    }
    
    .todo-item:hover .todo-actions {
      opacity: 1;
    }
    
    .action-btn {
      background: none;
      border: none;
      color: #666;
      cursor: pointer;
      padding: 5px;
      border-radius: 5px;
      transition: all 0.2s ease;
    }
    
    .action-btn:hover {
      color: #00d9ff;
      background: rgba(0,217,255,0.1);
    }
    
    .action-btn.delete:hover {
      color: #ff6b6b;
      background: rgba(255,107,107,0.1);
    }
    
    .empty-state {
      text-align: center;
      padding: 50px 20px;
      color: #666;
    }
    
    .empty-icon {
      font-size: 3rem;
      margin-bottom: 15px;
      opacity: 0.5;
    }
    
    /* Animations */
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    .todo-item {
      animation: fadeIn 0.3s ease;
    }
    
    /* Completed section */
    .completed-section {
      opacity: 0.7;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>TODOS</h1>
      <p class="subtitle">Powered by MCP-UI</p>
      <div class="stats">
        <div class="stat"><span class="stat-value">${incompleteTodos.length}</span> active</div>
        <div class="stat"><span class="stat-value">${completedTodos.length}</span> completed</div>
      </div>
    </header>
    
    <!-- Add Todo Form -->
    <div class="todo-form">
      <div class="form-row">
        <input type="text" id="title" placeholder="What needs to be done?" />
      </div>
      <div class="form-row">
        <textarea id="description" placeholder="Add a description (optional)"></textarea>
      </div>
      <div class="form-row">
        <button class="btn" onclick="createTodo()">Add Task</button>
      </div>
    </div>
    
    <!-- Active Todos -->
    ${incompleteTodos.length > 0 ? `
      <div class="section-title">Active Tasks</div>
      <div class="todo-list">
        ${incompleteTodos.map(todo => `
          <div class="todo-item" data-id="${todo.id}">
            <div class="checkbox" onclick="toggleTodo('${todo.id}', true)"></div>
            <div class="todo-content">
              <div class="todo-title">${escapeHtml(todo.title)}</div>
              ${todo.description ? `<div class="todo-description">${escapeHtml(todo.description)}</div>` : ''}
            </div>
            <div class="todo-actions">
              <button class="action-btn" onclick="editTodo('${todo.id}')" title="Edit">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
              <button class="action-btn delete" onclick="deleteTodo('${todo.id}')" title="Delete">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                  <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    ` : ''}
    
    <!-- Completed Todos -->
    ${completedTodos.length > 0 ? `
      <div class="completed-section">
        <div class="section-title">Completed</div>
        <div class="todo-list">
          ${completedTodos.map(todo => `
            <div class="todo-item completed" data-id="${todo.id}">
              <div class="checkbox checked" onclick="toggleTodo('${todo.id}', false)"></div>
              <div class="todo-content">
                <div class="todo-title">${escapeHtml(todo.title)}</div>
                ${todo.description ? `<div class="todo-description">${escapeHtml(todo.description)}</div>` : ''}
              </div>
              <div class="todo-actions">
                <button class="action-btn delete" onclick="deleteTodo('${todo.id}')" title="Delete">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    ` : ''}
    
    <!-- Empty State -->
    ${todos.length === 0 ? `
      <div class="empty-state">
        <div class="empty-icon">📋</div>
        <p>No tasks yet. Add your first task above!</p>
      </div>
    ` : ''}
  </div>
  
  <script>
    function sendAction(action, params) {
      window.parent.postMessage({
        type: 'intent',
        payload: {
          intent: action,
          params: params
        }
      }, '*');
    }
    
    function createTodo() {
      const titleInput = document.getElementById('title');
      const descInput = document.getElementById('description');
      const title = titleInput.value.trim();
      const description = descInput.value.trim();
      
      if (!title) {
        titleInput.focus();
        return;
      }
      
      sendAction('todo_create', { title, description });
      titleInput.value = '';
      descInput.value = '';
    }
    
    function toggleTodo(id, completed) {
      sendAction('todo_update', { id, completed });
    }
    
    function deleteTodo(id) {
      if (confirm('Delete this task?')) {
        sendAction('todo_delete', { id });
      }
    }
    
    function editTodo(id) {
      const item = document.querySelector('.todo-item[data-id="' + id + '"]');
      const titleEl = item.querySelector('.todo-title');
      const descEl = item.querySelector('.todo-description');
      
      const currentTitle = titleEl.textContent;
      const currentDesc = descEl ? descEl.textContent : '';
      
      const newTitle = prompt('Edit title:', currentTitle);
      if (newTitle === null) return;
      
      const newDesc = prompt('Edit description:', currentDesc);
      if (newDesc === null) return;
      
      sendAction('todo_update', { 
        id, 
        title: newTitle.trim() || currentTitle,
        description: newDesc.trim()
      });
    }
    
    // Handle Enter key in title input
    document.getElementById('title').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        createTodo();
      }
    });
    
    // Notify parent about size changes
    const resizeObserver = new ResizeObserver((entries) => {
      entries.forEach((entry) => {
        window.parent.postMessage({
          type: 'ui-size-change',
          payload: { height: entry.contentRect.height + 40 }
        }, '*');
      });
    });
    resizeObserver.observe(document.body);
    
    // Signal ready
    window.parent.postMessage({ type: 'ui-lifecycle-iframe-ready' }, '*');
  </script>
</body>
</html>
  `.trim();
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Create MCP server instance with tool handlers
function createMCPServer(): McpServer {
  const server = new McpServer({
    name: 'mcp-todo-server',
    version: '2.0.0',
  });

  // Register todo_ui tool
  server.registerTool(
    'todo_ui',
    {
      description: 'Display the interactive Todo application UI. Returns a UIResource that renders the full todo list with create, update, and delete capabilities.',
    },
    async () => {
      const todos = todoStorage.getAll();
      const htmlContent = generateTodoListHTML(todos);
      
      const uiResource = createUIResource({
        uri: 'ui://todo-app/main',
        content: { type: 'rawHtml', htmlString: htmlContent },
        encoding: 'text',
      });

      return {
        content: [uiResource] as any,
      };
    }
  );

  // Register todo_create tool
  server.registerTool(
    'todo_create',
    {
      description: 'Create a new todo item with title and optional description',
    },
    async (args: any) => {
      console.log('📝 todo_create called with args:', JSON.stringify(args));
      const { title, description } = args as { title: string; description?: string };
      
      if (!title || title.trim().length === 0) {
        throw new Error('Title is required');
      }

      const newTodo = {
        id: randomUUID(),
        title: title.trim(),
        description: description?.trim() || '',
        completed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const created = todoStorage.create(newTodo);
      
      // Return updated UI
      const todos = todoStorage.getAll();
      const uiResource = createUIResource({
        uri: 'ui://todo-app/main',
        content: { type: 'rawHtml', htmlString: generateTodoListHTML(todos) },
        encoding: 'text',
      });

      return {
        content: [
          { type: 'text', text: JSON.stringify(created, null, 2) },
          uiResource,
        ] as any,
      };
    }
  );

  // Register todo_list tool
  server.registerTool(
    'todo_list',
    {
      description: 'List all todos, optionally filter by completion status',
    },
    async (args: any) => {
      const { completed } = (args as { completed?: boolean }) || {};
      let todos = todoStorage.getAll();
      
      if (completed !== undefined) {
        todos = todos.filter(todo => todo.completed === completed);
      }

      return {
        content: [
          { type: 'text', text: JSON.stringify(todos, null, 2) },
        ] as any,
      };
    }
  );

  // Register todo_update tool
  server.registerTool(
    'todo_update',
    {
      description: 'Update a todo item by ID with new title, description, or completion status',
    },
    async (args: any) => {
      const { id: todoId, title, description, completed } = args as {
        id: string;
        title?: string;
        description?: string;
        completed?: boolean;
      };

      const updates: Partial<Todo> = {};
      if (title !== undefined) updates.title = title.trim();
      if (description !== undefined) updates.description = description.trim();
      if (completed !== undefined) updates.completed = completed;

      const updated = todoStorage.update(todoId, updates);
      
      if (!updated) {
        throw new Error(`Todo not found: ${todoId}`);
      }

      // Return updated UI
      const todos = todoStorage.getAll();
      const uiResource = createUIResource({
        uri: 'ui://todo-app/main',
        content: { type: 'rawHtml', htmlString: generateTodoListHTML(todos) },
        encoding: 'text',
      });

      return {
        content: [
          { type: 'text', text: JSON.stringify(updated, null, 2) },
          uiResource,
        ] as any,
      };
    }
  );

  // Register todo_delete tool
  server.registerTool(
    'todo_delete',
    {
      description: 'Delete a todo item by ID',
    },
    async (args: any) => {
      const { id: todoId } = args as { id: string };
      const deleted = todoStorage.delete(todoId);
      
      if (!deleted) {
        throw new Error(`Todo not found: ${todoId}`);
      }

      // Return updated UI
      const todos = todoStorage.getAll();
      const uiResource = createUIResource({
        uri: 'ui://todo-app/main',
        content: { type: 'rawHtml', htmlString: generateTodoListHTML(todos) },
        encoding: 'text',
      });

      return {
        content: [
          { type: 'text', text: `Todo ${todoId} deleted` },
          uiResource,
        ] as any,
      };
    }
  );

  return server;
}

// Handle POST requests for client-to-server communication
app.post('/mcp', async (req, res) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  let transport: StreamableHTTPServerTransport;

  if (sessionId && transports[sessionId]) {
    // A session already exists; reuse the existing transport
    transport = transports[sessionId];
  } else if (!sessionId && isInitializeRequest(req.body)) {
    // This is a new initialization request. Create a new transport
    transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: (sid) => {
        transports[sid] = transport;
        console.log(`✅ MCP Session initialized: ${sid}`);
      },
    });

    // Clean up the transport from our map when the session closes
    transport.onclose = () => {
      if (transport.sessionId) {
        console.log(`🔌 MCP Session closed: ${transport.sessionId}`);
        delete transports[transport.sessionId];
      }
    };
    
    // Create a new server instance for this specific session
    const server = createMCPServer();
  
    // Connect the server instance to the transport for this session
    await server.connect(transport);
  } else {
    // Session ID provided but not found, or no session ID - create/recreate session
    console.log(sessionId ? `⚠️  Unknown session ID (${sessionId}), creating new session` : '⚠️  Request without session ID, creating new session');
    transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => sessionId || randomUUID(),
      onsessioninitialized: (sid) => {
        transports[sid] = transport;
        console.log(`✅ MCP Session initialized: ${sid}`);
      },
    });

    transport.onclose = () => {
      if (transport.sessionId) {
        console.log(`🔌 MCP Session closed: ${transport.sessionId}`);
        delete transports[transport.sessionId];
      }
    };
    
    const server = createMCPServer();
    await server.connect(transport);
  }

  // Handle the client's request using the session's transport
  await transport.handleRequest(req, res, req.body);
});

// A separate, reusable handler for GET and DELETE requests
const handleSessionRequest = async (req: express.Request, res: express.Response) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  if (!sessionId || !transports[sessionId]) {
    return res.status(404).send('Session not found');
  }
  
  const transport = transports[sessionId];
  await transport.handleRequest(req, res);
};

// GET handles the long-lived stream for server-to-client messages
app.get('/mcp', handleSessionRequest);

// DELETE handles explicit session termination from the client
app.delete('/mcp', handleSessionRequest);

app.listen(PORT, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║     🚀 MCP Todo Server with MCP-UI Running      ║');
  console.log('╚══════════════════════════════════════════════════╝');
  console.log('');
  console.log(`   📡 MCP Endpoint: http://localhost:${PORT}/mcp`);
  console.log('');
  console.log('   🎨 Features:');
  console.log('      • Official MCP SDK with Streamable HTTP');
  console.log('      • MCP-UI Integration');
  console.log('      • Interactive Todo UI Resources');
  console.log('      • Session Management');
  console.log('');
  console.log('   📋 Available Tools:');
  console.log('      • todo_ui: Display interactive Todo UI');
  console.log('      • todo_create: Create a new todo');
  console.log('      • todo_list: List all todos');
  console.log('      • todo_update: Update a todo');
  console.log('      • todo_delete: Delete a todo');
  console.log('');
  console.log('═══════════════════════════════════════════════════');
});
