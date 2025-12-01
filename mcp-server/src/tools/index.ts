// Export all tools
import { todoCreateTool, todoCreate } from './todo-create.js';
import { todoListTool, todoList } from './todo-list.js';
import { todoUpdateTool, todoUpdate } from './todo-update.js';
import { todoDeleteTool, todoDelete } from './todo-delete.js';

export const TOOLS = [
  todoCreateTool,
  todoListTool,
  todoUpdateTool,
  todoDeleteTool,
];

export async function executeTool(name: string, args: any): Promise<any> {
  switch (name) {
    case 'todo_create':
      return todoCreate(args);
    case 'todo_list':
      return todoList(args);
    case 'todo_update':
      return todoUpdate(args);
    case 'todo_delete':
      return todoDelete(args);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}


