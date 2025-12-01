// HTTP + SSE server for Cursor MCP integration
import express from 'express';
import cors from 'cors';
import { TOOLS, executeTool } from './tools/index.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept', 'Cache-Control'],
}));
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.json({
    name: 'MCP Todo Server',
    version: '1.0.0',
    status: 'running',
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// SSE endpoint for MCP - Cursor connects here for server-sent events
app.get('/mcp', (req, res) => {
  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  console.log('📡 SSE connection established');

  // Keep connection alive with comments (not data)
  const keepAlive = setInterval(() => {
    res.write(': keepalive\n\n');
  }, 30000);

  req.on('close', () => {
    console.log('📡 SSE connection closed');
    clearInterval(keepAlive);
  });
});

// MCP JSON-RPC endpoint
app.post('/mcp', async (req, res) => {
  try {
    const { jsonrpc, id, method, params } = req.body;

    console.log('📨 MCP Request:', method, id ? `(id: ${id})` : '(notification)');

    // Handle notifications (no response needed)
    if (method === 'notifications/initialized') {
      console.log('✅ Client initialized notification received');
      // Notifications don't get a response
      return res.status(204).send();
    }

    // Handle initialize
    if (method === 'initialize') {
      return res.json({
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: '2024-11-05',
          serverInfo: {
            name: 'mcp-todo-server',
            version: '1.0.0',
          },
          capabilities: {
            tools: {},
          },
        },
      });
    }

    // Handle tool listing
    if (method === 'tools/list') {
      console.log('📋 Returning tools:', TOOLS.map(t => t.name));
      return res.json({
        jsonrpc: '2.0',
        id,
        result: {
          tools: TOOLS,
        },
      });
    }

    // Handle tool execution
    if (method === 'tools/call') {
      const { name, arguments: args } = params;
      console.log(`🔧 Executing tool: ${name}`, args);

      try {
        const result = await executeTool(name, args || {});
        console.log('✅ Tool result:', result);

        return res.json({
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2),
              },
            ],
          },
        });
      } catch (error: any) {
        console.error('❌ Tool error:', error.message);
        return res.json({
          jsonrpc: '2.0',
          id,
          error: {
            code: -32603,
            message: error.message || 'Tool execution failed',
          },
        });
      }
    }

    // Handle ping
    if (method === 'ping') {
      return res.json({
        jsonrpc: '2.0',
        id,
        result: {},
      });
    }

    // Unknown method
    console.log('❓ Unknown method:', method);
    return res.json({
      jsonrpc: '2.0',
      id,
      error: {
        code: -32601,
        message: `Method not found: ${method}`,
      },
    });
  } catch (error: any) {
    console.error('❌ Server error:', error);
    res.status(500).json({
      jsonrpc: '2.0',
      id: req.body?.id || null,
      error: {
        code: -32603,
        message: error.message || 'Internal server error',
      },
    });
  }
});

app.listen(PORT, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════╗');
  console.log('║     🚀 MCP Todo Server Running          ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log('');
  console.log(`   📡 URL: http://localhost:${PORT}/mcp`);
  console.log('');
  console.log('   📋 Available Tools:');
  TOOLS.forEach(tool => {
    console.log(`      • ${tool.name}: ${tool.description}`);
  });
  console.log('');
  console.log('═══════════════════════════════════════════');
});
