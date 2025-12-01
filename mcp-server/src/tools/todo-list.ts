import { todoStorage } from '../core/storage.js';
import todoListSchema from './schemas/todo-list.schema.json' with { type: 'json' };

export const todoListTool = todoListSchema;

export async function todoList(args?: { completed?: boolean }) {
  let todos = todoStorage.getAll();

  if (args?.completed !== undefined) {
    todos = todos.filter((todo) => todo.completed === args.completed);
  }

  return todos;
}
