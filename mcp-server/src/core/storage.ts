// Shared in-memory storage for todos
export interface Todo {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

class TodoStorage {
  private todos: Map<string, Todo> = new Map();

  create(todo: Todo): Todo {
    this.todos.set(todo.id, todo);
    return todo;
  }

  getAll(): Todo[] {
    return Array.from(this.todos.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  getById(id: string): Todo | undefined {
    return this.todos.get(id);
  }

  update(id: string, updates: Partial<Todo>): Todo | null {
    const todo = this.todos.get(id);
    if (!todo) return null;

    const updatedTodo = {
      ...todo,
      ...updates,
      id: todo.id, // Prevent ID changes
      updatedAt: new Date().toISOString(),
    };

    this.todos.set(id, updatedTodo);
    return updatedTodo;
  }

  delete(id: string): boolean {
    return this.todos.delete(id);
  }
}

export const todoStorage = new TodoStorage();


