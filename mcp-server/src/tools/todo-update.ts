import { todoStorage } from '../core/storage.js';
import todoUpdateSchema from './schemas/todo-update.schema.json' with { type: 'json' };

export const todoUpdateTool = todoUpdateSchema;

export async function todoUpdate(args: {
  id: string;
  title?: string;
  description?: string;
  completed?: boolean;
}) {
  const { id, title, description, completed } = args;

  if (!id) {
    throw new Error('Todo ID is required');
  }

  const updates: any = {};
  if (title !== undefined) updates.title = title.trim();
  if (description !== undefined) updates.description = description.trim();
  if (completed !== undefined) updates.completed = completed;

  const updated = todoStorage.update(id, updates);

  if (!updated) {
    throw new Error(`Todo with ID ${id} not found`);
  }

  return updated;
}
