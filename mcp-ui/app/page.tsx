'use client';

import { useEffect, useState, useCallback } from 'react';
import { UIResourceRenderer, UIActionResult } from '@mcp-ui/client';
import { mcpClient, MCPResource } from '@/lib/mcp-client';

export default function Home() {
  const [resource, setResource] = useState<MCPResource | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTodoUI = useCallback(async () => {
    try {
      setError(null);
      setIsLoading(true);
      
      // Initialize connection and get the Todo UI
      await mcpClient.initialize();
      const { resource: uiResource } = await mcpClient.getTodoUI();
      setResource(uiResource);
    } catch (err) {
      console.error('Failed to load Todo UI:', err);
      setError('Failed to connect to MCP server. Make sure it\'s running on http://localhost:3001');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTodoUI();
  }, [loadTodoUI]);

  // Handle UI actions from the embedded iframe
  const handleUIAction = useCallback(async (action: UIActionResult): Promise<{ status: string }> => {
    console.log('UI Action received:', action);
    
    try {
      // Handle intent actions from the embedded UI
      if (action.type === 'intent' && action.payload) {
        const { intent, params } = action.payload as { intent: string; params: Record<string, unknown> };
        
        switch (intent) {
          case 'todo_create': {
            const { title, description } = params as { title: string; description?: string };
            const result = await mcpClient.createTodo(title, description);
            if (result.resource) {
              setResource(result.resource);
            }
            break;
          }
          
          case 'todo_update': {
            const { id, ...updates } = params as { 
              id: string; 
              title?: string; 
              description?: string; 
              completed?: boolean 
            };
            const result = await mcpClient.updateTodo(id, updates);
            if (result.resource) {
              setResource(result.resource);
            }
            break;
          }
          
          case 'todo_delete': {
            const { id } = params as { id: string };
            const result = await mcpClient.deleteTodo(id);
            if (result.resource) {
              setResource(result.resource);
            }
            break;
          }
        }
      }
      
      return { status: 'handled' };
    } catch (err) {
      console.error('Action failed:', err);
      return { status: 'error' };
    }
  }, []);

  return (
    <div className="app-container">
      <div className="app-wrapper">
        {/* Cyberpunk Header */}
        <header className="app-header">
          <div className="header-content">
            <div className="logo-section">
              <div className="logo-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
              </div>
              <div>
                <h1 className="app-title">MCP-UI Todo</h1>
                <p className="app-subtitle">Interactive UI via Model Context Protocol</p>
              </div>
            </div>
            <button
              onClick={loadTodoUI}
              disabled={isLoading}
              className="refresh-btn"
            >
              <svg className={isLoading ? 'spinning' : ''} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </header>

        {/* Error Message */}
        {error && (
          <div className="error-container">
            <div className="error-content">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4m0 4h.01" />
              </svg>
              <div>
                <p className="error-text">{error}</p>
                <button onClick={loadTodoUI} className="retry-btn">
                  Try again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="main-content">
          {isLoading ? (
            <div className="loading-container">
              <div className="loader"></div>
              <p className="loading-text">Loading MCP-UI...</p>
            </div>
          ) : resource ? (
            <div className="ui-renderer-container">
              <UIResourceRenderer
                resource={resource}
                onUIAction={handleUIAction}
                htmlProps={{
                  autoResizeIframe: true,
                  style: {
                    width: '100%',
                    minHeight: '600px',
                    border: 'none',
                    borderRadius: '16px',
                    background: 'transparent',
                  },
                }}
              />
            </div>
          ) : !error ? (
            <div className="empty-state">
              <p>No UI resource available</p>
            </div>
          ) : null}
        </main>

        {/* Footer */}
        <footer className="app-footer">
          <div className="footer-content">
            <span className="footer-badge">MCP-UI</span>
            <span className="footer-divider">•</span>
            <span>Powered by Model Context Protocol</span>
          </div>
        </footer>
      </div>

      <style jsx>{`
        .app-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #0a0a0f 0%, #0f0f1a 50%, #0a0f1a 100%);
          display: flex;
          justify-content: center;
          padding: 20px;
        }

        .app-wrapper {
          width: 100%;
          max-width: 800px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .app-header {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 20px 24px;
          backdrop-filter: blur(10px);
        }

        .header-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .logo-section {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .logo-icon {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #00d9ff 0%, #00b4d8 100%);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 20px rgba(0, 217, 255, 0.3);
        }

        .logo-icon svg {
          width: 28px;
          height: 28px;
          color: #0f0f23;
        }

        .app-title {
          font-size: 1.5rem;
          font-weight: 600;
          color: #ffffff;
          letter-spacing: 0.5px;
          margin: 0;
        }

        .app-subtitle {
          font-size: 0.85rem;
          color: #666;
          margin: 4px 0 0 0;
        }

        .refresh-btn {
          width: 44px;
          height: 44px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }

        .refresh-btn:hover {
          background: rgba(0, 217, 255, 0.1);
          border-color: rgba(0, 217, 255, 0.3);
        }

        .refresh-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .refresh-btn svg {
          width: 20px;
          height: 20px;
          color: #888;
        }

        .refresh-btn:hover svg {
          color: #00d9ff;
        }

        .spinning {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .error-container {
          background: rgba(255, 107, 107, 0.1);
          border: 1px solid rgba(255, 107, 107, 0.3);
          border-radius: 12px;
          padding: 16px 20px;
        }

        .error-content {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }

        .error-content svg {
          width: 20px;
          height: 20px;
          color: #ff6b6b;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .error-text {
          color: #ff8a8a;
          font-size: 0.9rem;
          margin: 0;
        }

        .retry-btn {
          background: none;
          border: none;
          color: #ff6b6b;
          font-size: 0.85rem;
          cursor: pointer;
          padding: 0;
          margin-top: 8px;
          text-decoration: underline;
        }

        .retry-btn:hover {
          color: #ff8a8a;
        }

        .main-content {
          flex: 1;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 80px 20px;
        }

        .loader {
          width: 48px;
          height: 48px;
          border: 3px solid rgba(0, 217, 255, 0.1);
          border-top-color: #00d9ff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .loading-text {
          color: #666;
          margin-top: 16px;
          font-size: 0.9rem;
        }

        .ui-renderer-container {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          overflow: hidden;
        }

        .empty-state {
          text-align: center;
          padding: 80px 20px;
          color: #666;
        }

        .app-footer {
          text-align: center;
          padding: 16px;
        }

        .footer-content {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          font-size: 0.8rem;
          color: #555;
        }

        .footer-badge {
          background: linear-gradient(135deg, #00d9ff 0%, #00b4d8 100%);
          color: #0f0f23;
          padding: 2px 8px;
          border-radius: 4px;
          font-weight: 600;
          font-size: 0.7rem;
          letter-spacing: 0.5px;
        }

        .footer-divider {
          opacity: 0.3;
        }
      `}</style>
    </div>
  );
}
