// MCP Client for communicating with the MCP Todo Server

const API_BASE_URL = process.env.NEXT_PUBLIC_MCP_SERVER_URL?.replace('/mcp', '') || 'http://localhost:3001';

export interface Todo {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

// Resource type matching MCP-UI format
export interface MCPResource {
  uri: string;
  mimeType?: string;
  text?: string;
  blob?: string;
}

interface ToolResult {
  content: Array<{
    type: string;
    text?: string;
    resource?: MCPResource;
  }>;
}

class MCPClient {
  private initialized = false;

  async initialize(): Promise<void> {
    // Verify connection by fetching tools list
    try {
      const response = await fetch(`${API_BASE_URL}/api/tools`);
      if (!response.ok) {
        throw new Error(`Failed to connect: ${response.status}`);
      }
      this.initialized = true;
      console.log('✅ MCP Client initialized');
    } catch (error) {
      console.error('Failed to initialize MCP client:', error);
      throw error;
    }
  }

  private async callTool(toolName: string, args: Record<string, unknown> = {}): Promise<ToolResult> {
    const response = await fetch(`${API_BASE_URL}/api/tools/${toolName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(args),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Tool call failed: ${response.status}`);
    }

    return response.json();
  }

  private extractResource(result: ToolResult): MCPResource | undefined {
    const resourceContent = result.content.find(c => c.type === 'resource');
    return resourceContent?.resource;
  }

  private extractText(result: ToolResult): string | undefined {
    const textContent = result.content.find(c => c.type === 'text');
    return textContent?.text;
  }

  async listTools() {
    const response = await fetch(`${API_BASE_URL}/api/tools`);
    const data = await response.json();
    return data.tools;
  }

  async getTodoUI(): Promise<{
    resource: MCPResource;
    textContent?: string;
  }> {
    const result = await this.callTool('todo_ui');
    const resource = this.extractResource(result);
    
    if (!resource) {
      throw new Error('No UI resource in response');
    }

    return {
      resource,
      textContent: this.extractText(result),
    };
  }

  async createTodo(title: string, description?: string): Promise<{
    todo: Todo;
    resource?: MCPResource;
  }> {
    const result = await this.callTool('todo_create', { title, description });
    const textContent = this.extractText(result);

    return {
      todo: textContent ? JSON.parse(textContent) : null,
      resource: this.extractResource(result),
    };
  }

  async listTodos(completed?: boolean): Promise<Todo[]> {
    const result = await this.callTool('todo_list', completed !== undefined ? { completed } : {});
    const textContent = this.extractText(result);
    return textContent ? JSON.parse(textContent) : [];
  }

  async updateTodo(
    id: string,
    updates: { title?: string; description?: string; completed?: boolean }
  ): Promise<{
    todo: Todo;
    resource?: MCPResource;
  }> {
    const result = await this.callTool('todo_update', { id, ...updates });
    const textContent = this.extractText(result);

    return {
      todo: textContent ? JSON.parse(textContent) : null,
      resource: this.extractResource(result),
    };
  }

  async deleteTodo(id: string): Promise<{
    message: string;
    resource?: MCPResource;
  }> {
    const result = await this.callTool('todo_delete', { id });
    const textContent = this.extractText(result);

    return {
      message: textContent || 'Deleted',
      resource: this.extractResource(result),
    };
  }
}

export const mcpClient = new MCPClient();
