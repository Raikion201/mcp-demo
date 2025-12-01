import { todoStorage } from '../core/storage.js';
import todoDeleteSchema from './schemas/todo-delete.schema.json' with { type: 'json' };

export const todoDeleteTool = todoDeleteSchema;

export async function todoDelete(args: { id: string }) {
  const { id } = args;

  if (!id) {
    throw new Error('Todo ID is required');
  }

  const deleted = todoStorage.delete(id);

  if (!deleted) {
    throw new Error(`Todo with ID ${id} not found`);
  }

  return { success: true, id };
}
