import { v4 as uuidv4 } from 'uuid';
import { todoStorage } from '../core/storage.js';
import todoCreateSchema from './schemas/todo-create.schema.json' with { type: 'json' };

export const todoCreateTool = todoCreateSchema;

export async function todoCreate(args: {
  title: string;
  description?: string;
}) {
  const { title, description } = args;

  if (!title || title.trim().length === 0) {
    throw new Error('Title is required');
  }

  const newTodo = {
    id: uuidv4(),
    title: title.trim(),
    description: description?.trim() || '',
    completed: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const created = todoStorage.create(newTodo);

  return created;
}
