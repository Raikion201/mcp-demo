'use client';

import { useEffect, useState } from 'react';
import { mcpClient, Todo } from '@/lib/mcp-client';
import TodoForm from '@/components/TodoForm';
import TodoList from '@/components/TodoList';

export default function Home() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTodos = async () => {
    try {
      setError(null);
      const fetchedTodos = await mcpClient.listTodos();
      setTodos(fetchedTodos);
    } catch (err) {
      console.error('Failed to load todos:', err);
      setError('Failed to connect to MCP server. Make sure it\'s running on http://localhost:3001');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTodos();
  }, []);

  const handleAddTodo = async (title: string, description: string) => {
    const newTodo = await mcpClient.createTodo(title, description);
    setTodos([newTodo, ...todos]);
  };

  const handleUpdateTodo = async (
    id: string,
    updates: { title?: string; description?: string; completed?: boolean }
  ) => {
    const updatedTodo = await mcpClient.updateTodo(id, updates);
    setTodos(todos.map((todo) => (todo.id === id ? updatedTodo : todo)));
  };

  const handleDeleteTodo = async (id: string) => {
    await mcpClient.deleteTodo(id);
    setTodos(todos.filter((todo) => todo.id !== id));
  };

  const stats = {
    total: todos.length,
    active: todos.filter(t => !t.completed).length,
    completed: todos.filter(t => t.completed).length,
  };

  return (
    <div className="min-h-screen bg-white flex justify-center">
      <div className="w-full px-4 py-8 max-w-3xl">
        {/* Header */}
        <header className="border-b border-gray-200 pb-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">
                Today
              </h1>
              <p className="text-sm text-gray-500">
                {stats.active} {stats.active === 1 ? 'task' : 'tasks'}
              </p>
            </div>
            <button
              onClick={loadTodos}
              disabled={isLoading}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:cursor-not-allowed"
            >
              <svg className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </header>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <p className="text-sm text-red-700">{error}</p>
                <button
                  onClick={loadTodos}
                  className="mt-1 text-sm text-red-600 hover:underline"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div>
          {/* Add Todo Form */}
          <div className="mb-6">
            <TodoForm onAdd={handleAddTodo} />
          </div>

          {/* Todo List */}
          <div>
            {isLoading ? (
              <div className="text-center py-12">
                <div className="inline-block w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mb-4"></div>
                <p className="text-sm text-gray-500">Loading...</p>
              </div>
            ) : (
              <TodoList
                todos={todos}
                onUpdate={handleUpdateTodo}
                onDelete={handleDeleteTodo}
              />
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t border-gray-200 text-center">
        </footer>
      </div>
    </div>
  );
}
