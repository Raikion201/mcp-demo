// MCP Client for communicating with the MCP Todo Server

const MCP_SERVER_URL = process.env.NEXT_PUBLIC_MCP_SERVER_URL || 'http://localhost:3001/mcp';

export interface Todo {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

interface MCPRequest {
  jsonrpc: '2.0';
  id: number | string;
  method: string;
  params?: any;
}

interface MCPResponse {
  jsonrpc: '2.0';
  id: number | string;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

class MCPClient {
  private requestId = 0;

  private async sendRequest(request: MCPRequest): Promise<MCPResponse> {
    try {
      const response = await fetch(MCP_SERVER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

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

  async listTools() {
    const response = await this.sendRequest({
      jsonrpc: '2.0',
      id: ++this.requestId,
      method: 'tools/list',
    });

    return response.result?.tools || [];
  }

  async createTodo(title: string, description?: string): Promise<Todo> {
    const response = await this.sendRequest({
      jsonrpc: '2.0',
      id: ++this.requestId,
      method: 'tools/call',
      params: {
        name: 'todo_create',
        arguments: {
          title,
          description,
        },
      },
    });

    const content = response.result?.content?.[0]?.text;
    return JSON.parse(content);
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

    const content = response.result?.content?.[0]?.text;
    return JSON.parse(content);
  }

  async updateTodo(
    id: string,
    updates: { title?: string; description?: string; completed?: boolean }
  ): Promise<Todo> {
    const response = await this.sendRequest({
      jsonrpc: '2.0',
      id: ++this.requestId,
      method: 'tools/call',
      params: {
        name: 'todo_update',
        arguments: {
          id,
          ...updates,
        },
      },
    });

    const content = response.result?.content?.[0]?.text;
    return JSON.parse(content);
  }

  async deleteTodo(id: string): Promise<void> {
    await this.sendRequest({
      jsonrpc: '2.0',
      id: ++this.requestId,
      method: 'tools/call',
      params: {
        name: 'todo_delete',
        arguments: { id },
      },
    });
  }
}

export const mcpClient = new MCPClient();


