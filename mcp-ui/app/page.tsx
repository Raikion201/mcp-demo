'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { UIResourceRenderer, UIActionResult } from '@mcp-ui/client';
import { mcpClient, MCPResource } from '@/lib/mcp-client';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'tool';
  content: string;
  resource?: MCPResource;
  toolName?: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize MCP client
  useEffect(() => {
    const init = async () => {
      try {
        await mcpClient.initialize();
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize MCP client:', error);
      }
    };
    init();
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle UI actions from embedded resources
  const handleUIAction = useCallback(async (action: UIActionResult): Promise<{ status: string }> => {
    console.log('UI Action received:', action);
    
    try {
      if (action.type === 'intent' && action.payload) {
        const { intent, params } = action.payload as { intent: string; params: Record<string, unknown> };
        
        let result: { resource?: MCPResource } = {};
        
        switch (intent) {
          case 'todo_create': {
            const { title, description } = params as { title: string; description?: string };
            result = await mcpClient.createTodo(title, description);
            break;
          }
          case 'todo_update': {
            const { id, ...updates } = params as { id: string; title?: string; description?: string; completed?: boolean };
            result = await mcpClient.updateTodo(id, updates);
            break;
          }
          case 'todo_delete': {
            const { id } = params as { id: string };
            result = await mcpClient.deleteTodo(id);
            break;
          }
        }
        
        // Update the last assistant message with new resource
        if (result.resource) {
          setMessages(prev => {
            const lastAssistantIdx = prev.findLastIndex(m => m.resource);
            if (lastAssistantIdx >= 0) {
              const updated = [...prev];
              updated[lastAssistantIdx] = { ...updated[lastAssistantIdx], resource: result.resource };
              return updated;
            }
            return prev;
          });
        }
      }
      
      return { status: 'handled' };
    } catch (err) {
      console.error('Action failed:', err);
      return { status: 'error' };
    }
  }, []);

  // Execute MCP tool
  const executeTool = async (toolName: string, args: Record<string, unknown>): Promise<{ text: string; resource?: MCPResource }> => {
    console.log(`Executing tool: ${toolName}`, args);
    
    switch (toolName) {
      case 'todo_ui': {
        const result = await mcpClient.getTodoUI();
        return { text: 'Here is your todo list:', resource: result.resource };
      }
      case 'todo_create': {
        const result = await mcpClient.createTodo(args.title as string, args.description as string | undefined);
        return { 
          text: `Created todo: "${result.todo?.title || args.title}"`, 
          resource: result.resource 
        };
      }
      case 'todo_list': {
        const todos = await mcpClient.listTodos(args.completed as boolean | undefined);
        if (todos.length === 0) {
          return { text: 'No todos found. Would you like to create one?' };
        }
        const todoList = todos.map(t => `- ${t.completed ? '✅' : '⬜'} ${t.title}`).join('\n');
        return { text: `Here are your todos:\n${todoList}` };
      }
      case 'todo_update': {
        const { id, ...updates } = args as { id: string; title?: string; description?: string; completed?: boolean };
        const result = await mcpClient.updateTodo(id, updates);
        return { 
          text: `Updated todo: "${result.todo?.title || id}"`, 
          resource: result.resource 
        };
      }
      case 'todo_delete': {
        const result = await mcpClient.deleteTodo(args.id as string);
        return { text: result.message, resource: result.resource };
      }
      default:
        return { text: `Unknown tool: ${toolName}` };
    }
  };

  // Send message to AI via API route
  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Build conversation history for DeepSeek
      const conversationHistory = [
        ...messages.map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
        { role: 'user', content: userMessage.content },
      ];

      // Call our API route (avoids CORS issues)
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: conversationHistory }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const responseMessage = await response.json();

      // Check for tool calls
      if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
        for (const toolCall of responseMessage.tool_calls) {
          const toolName = toolCall.function.name;
          const toolArgs = JSON.parse(toolCall.function.arguments || '{}');
          
          const toolResult = await executeTool(toolName, toolArgs);
          
          const assistantMessage: Message = {
            id: Date.now().toString(),
            role: 'assistant',
            content: toolResult.text,
            resource: toolResult.resource,
            toolName: toolName,
          };
          
          setMessages(prev => [...prev, assistantMessage]);
        }
      } else if (responseMessage.content) {
        // Regular text response
        const assistantMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: responseMessage.content,
        };
        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-container">
      {/* Header */}
      <header className="chat-header">
        <div className="header-content">
          <div className="logo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              <path d="M9 12l2 2 4-4" />
            </svg>
          </div>
          <div>
            <h1>MCP Todo Chat</h1>
            <p>Powered by DeepSeek AI + MCP-UI</p>
          </div>
        </div>
        <div className={`status ${isInitialized ? 'connected' : 'disconnected'}`}>
          <span className="status-dot"></span>
          {isInitialized ? 'Connected' : 'Connecting...'}
        </div>
      </header>

      {/* Messages */}
      <div className="messages-container">
        {messages.length === 0 && (
          <div className="welcome-message">
            <h2>Welcome to MCP Todo Chat! 👋</h2>
            <p>I can help you manage your todos. Try saying:</p>
            <ul>
              <li onClick={() => setInput('Show me my todos')}>
                "Show me my todos"
              </li>
              <li onClick={() => setInput('Create a todo to buy groceries')}>
                "Create a todo to buy groceries"
              </li>
              <li onClick={() => setInput('Add a task: finish the report')}>
                "Add a task: finish the report"
              </li>
              <li onClick={() => setInput('Show me the todo UI')}>
                "Show me the todo UI"
              </li>
            </ul>
          </div>
        )}
        
        {messages.map((message) => (
          <div key={message.id} className={`message ${message.role}`}>
            <div className="message-content">
              {message.toolName && (
                <div className="tool-badge">
                  🔧 {message.toolName}
                </div>
              )}
              <p>{message.content}</p>
              
              {/* Render MCP-UI Resource */}
              {message.resource && (
                <div className="ui-resource-wrapper">
                  <UIResourceRenderer
                    resource={message.resource}
                    onUIAction={handleUIAction}
                    htmlProps={{
                      autoResizeIframe: true,
                      style: {
                        width: '100%',
                        minHeight: '400px',
                        border: 'none',
                        borderRadius: '12px',
                      },
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="message assistant">
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="input-container">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
          placeholder="Ask me about your todos..."
          disabled={isLoading || !isInitialized}
        />
        <button onClick={sendMessage} disabled={isLoading || !isInitialized || !input.trim()}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
          </svg>
        </button>
      </div>

      <style jsx>{`
        .chat-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #0f0f1a 100%);
          display: flex;
          flex-direction: column;
        }

        .chat-header {
          background: rgba(255, 255, 255, 0.03);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          padding: 16px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .header-content {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .logo {
          width: 44px;
          height: 44px;
          background: linear-gradient(135deg, #00a67e 0%, #00d9a0 100%);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 20px rgba(0, 166, 126, 0.3);
        }

        .logo svg {
          width: 24px;
          height: 24px;
          color: white;
        }

        .chat-header h1 {
          font-size: 1.25rem;
          font-weight: 600;
          color: #fff;
          margin: 0;
        }

        .chat-header p {
          font-size: 0.8rem;
          color: #666;
          margin: 4px 0 0 0;
        }

        .status {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.85rem;
          color: #666;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #666;
        }

        .status.connected .status-dot {
          background: #22c55e;
          box-shadow: 0 0 8px rgba(34, 197, 94, 0.5);
        }

        .status.connected {
          color: #22c55e;
        }

        .messages-container {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .welcome-message {
          text-align: center;
          padding: 60px 20px;
          color: #888;
        }

        .welcome-message h2 {
          font-size: 1.5rem;
          color: #fff;
          margin-bottom: 16px;
        }

        .welcome-message ul {
          list-style: none;
          padding: 0;
          margin-top: 20px;
        }

        .welcome-message li {
          background: rgba(255, 255, 255, 0.05);
          padding: 12px 20px;
          border-radius: 8px;
          margin: 8px auto;
          max-width: 300px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .welcome-message li:hover {
          background: rgba(0, 166, 126, 0.2);
          transform: translateX(4px);
        }

        .message {
          display: flex;
          max-width: 85%;
        }

        .message.user {
          align-self: flex-end;
        }

        .message.assistant {
          align-self: flex-start;
        }

        .message-content {
          padding: 12px 16px;
          border-radius: 16px;
          max-width: 100%;
        }

        .message.user .message-content {
          background: linear-gradient(135deg, #00a67e 0%, #00d9a0 100%);
          color: white;
          border-bottom-right-radius: 4px;
        }

        .message.assistant .message-content {
          background: rgba(255, 255, 255, 0.05);
          color: #e8e8e8;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-bottom-left-radius: 4px;
        }

        .message-content p {
          margin: 0;
          white-space: pre-wrap;
          line-height: 1.5;
        }

        .tool-badge {
          font-size: 0.75rem;
          color: #00d9a0;
          margin-bottom: 8px;
          font-weight: 500;
        }

        .ui-resource-wrapper {
          margin-top: 12px;
          border-radius: 12px;
          overflow: hidden;
          background: rgba(0, 0, 0, 0.2);
        }

        .typing-indicator {
          display: flex;
          gap: 4px;
          padding: 4px 0;
        }

        .typing-indicator span {
          width: 8px;
          height: 8px;
          background: #666;
          border-radius: 50%;
          animation: bounce 1.4s infinite ease-in-out both;
        }

        .typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
        .typing-indicator span:nth-child(2) { animation-delay: -0.16s; }

        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }

        .input-container {
          background: rgba(255, 255, 255, 0.03);
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          padding: 16px 24px;
          display: flex;
          gap: 12px;
        }

        .input-container input {
          flex: 1;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 14px 18px;
          color: #fff;
          font-size: 1rem;
          outline: none;
          transition: all 0.2s;
        }

        .input-container input:focus {
          border-color: #00a67e;
          box-shadow: 0 0 0 3px rgba(0, 166, 126, 0.2);
        }

        .input-container input::placeholder {
          color: #666;
        }

        .input-container button {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #00a67e 0%, #00d9a0 100%);
          border: none;
          border-radius: 12px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .input-container button:hover:not(:disabled) {
          transform: scale(1.05);
          box-shadow: 0 0 20px rgba(0, 166, 126, 0.4);
        }

        .input-container button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .input-container button svg {
          width: 20px;
          height: 20px;
          color: white;
        }
      `}</style>
    </div>
  );
}
