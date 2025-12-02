// MCP Client for communicating with the MCP Todo Server using MCP-UI

const MCP_SERVER_URL = process.env.NEXT_PUBLIC_MCP_SERVER_URL || 'http://localhost:3001/mcp';

export interface Todo {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

// Resource type matching MCP SDK's EmbeddedResource['resource']
export interface MCPResource {
  uri: string;
  mimeType?: string;
  text?: string;
  blob?: string;
}

interface MCPRequest {
  jsonrpc: '2.0';
  id: number | string;
  method: string;
  params?: Record<string, unknown>;
}

interface MCPResponse {
  jsonrpc: '2.0';
  id: number | string;
  result?: {
    content?: Array<{
      type: string;
      text?: string;
      resource?: MCPResource;
      uri?: string;
      mimeType?: string;
      blob?: string;
    }>;
    tools?: Array<{
      name: string;
      description: string;
      inputSchema: Record<string, unknown>;
    }>;
  };
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

class MCPClient {
  private requestId = 0;
  private sessionId: string | null = null;

  private async sendRequest(request: MCPRequest): Promise<MCPResponse> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (this.sessionId) {
        headers['mcp-session-id'] = this.sessionId;
      }

      const response = await fetch(MCP_SERVER_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify(request),
      });

      // Capture session ID from response
      const newSessionId = response.headers.get('mcp-session-id');
      if (newSessionId) {
        this.sessionId = newSessionId;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: MCPResponse = await response.json();

      if (data.error) {
        throw new Error(data.error.message || 'MCP request failed');
      }

      return data;
    } catch (error) {
      console.error('MCP request failed:', error);
      throw error;
    }
  }

  async initialize(): Promise<void> {
    await this.sendRequest({
      jsonrpc: '2.0',
      id: ++this.requestId,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        clientInfo: {
          name: 'mcp-ui-client',
          version: '2.0.0',
        },
        capabilities: {},
      },
    });
  }

  async listTools() {
    const response = await this.sendRequest({
      jsonrpc: '2.0',
      id: ++this.requestId,
      method: 'tools/list',
    });

    return response.result?.tools || [];
  }

  async getTodoUI(): Promise<{
    resource: MCPResource;
    textContent?: string;
  }> {
    const response = await this.sendRequest({
      jsonrpc: '2.0',
      id: ++this.requestId,
      method: 'tools/call',
      params: {
        name: 'todo_ui',
        arguments: {},
      },
    });

    const content = response.result?.content || [];
    
    // Find the UI resource in the response
    const uiContent = content.find(c => c.type === 'resource' && c.resource);
    const textContent = content.find(c => c.type === 'text')?.text;

    if (uiContent && uiContent.resource) {
      return {
        resource: uiContent.resource,
        textContent,
      };
    }

    throw new Error('No UI resource in response');
  }

  async createTodo(title: string, description?: string): Promise<{
    todo: Todo;
    resource?: MCPResource;
  }> {
    const response = await this.sendRequest({
      jsonrpc: '2.0',
      id: ++this.requestId,
      method: 'tools/call',
      params: {
        name: 'todo_create',
        arguments: { title, description },
      },
    });

    const content = response.result?.content || [];
    const textContent = content.find(c => c.type === 'text')?.text;
    const uiContent = content.find(c => c.type === 'resource' && c.resource);

    return {
      todo: textContent ? JSON.parse(textContent) : null,
      resource: uiContent?.resource,
    };
  }

  async listTodos(completed?: boolean): Promise<Todo[]> {
    const response = await this.sendRequest({
      jsonrpc: '2.0',
      id: ++this.requestId,
      method: 'tools/call',
      params: {
        name: 'todo_list',
        arguments: completed !== undefined ? { completed } : {},
      },
    });

    const content = response.result?.content || [];
    const textContent = content.find(c => c.type === 'text')?.text;
    
    return textContent ? JSON.parse(textContent) : [];
  }

  async updateTodo(
    id: string,
    updates: { title?: string; description?: string; completed?: boolean }
  ): Promise<{
    todo: Todo;
    resource?: MCPResource;
  }> {
    const response = await this.sendRequest({
      jsonrpc: '2.0',
      id: ++this.requestId,
      method: 'tools/call',
      params: {
        name: 'todo_update',
        arguments: { id, ...updates },
      },
    });

    const content = response.result?.content || [];
    const textContent = content.find(c => c.type === 'text')?.text;
    const uiContent = content.find(c => c.type === 'resource' && c.resource);

    return {
      todo: textContent ? JSON.parse(textContent) : null,
      resource: uiContent?.resource,
    };
  }

  async deleteTodo(id: string): Promise<{
    message: string;
    resource?: MCPResource;
  }> {
    const response = await this.sendRequest({
      jsonrpc: '2.0',
      id: ++this.requestId,
      method: 'tools/call',
      params: {
        name: 'todo_delete',
        arguments: { id },
      },
    });

    const content = response.result?.content || [];
    const textContent = content.find(c => c.type === 'text')?.text;
    const uiContent = content.find(c => c.type === 'resource' && c.resource);

    return {
      message: textContent || 'Deleted',
      resource: uiContent?.resource,
    };
  }
}

export const mcpClient = new MCPClient();
