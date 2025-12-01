'use client';

import { useState } from 'react';

interface TodoFormProps {
  onAdd: (title: string, description: string) => Promise<void>;
}

export default function TodoForm({ onAdd }: TodoFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showDescription, setShowDescription] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) return;

    setIsLoading(true);
    try {
      await onAdd(title, description);
      setTitle('');
      setDescription('');
      setShowDescription(false);
    } catch (error) {
      console.error('Failed to add todo:', error);
      alert('Failed to add todo. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Add a task..."
        className="w-full text-base text-gray-900 placeholder-gray-400 bg-transparent border-none outline-none mb-2"
        disabled={isLoading}
        required
      />
      
      {showDescription ? (
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description"
          rows={2}
          className="w-full text-sm text-gray-600 placeholder-gray-400 bg-transparent border-none outline-none resize-none mb-3"
          disabled={isLoading}
        />
      ) : (
        <button
          type="button"
          onClick={() => setShowDescription(true)}
          className="text-sm text-gray-500 hover:text-gray-700 mb-3"
        >
          + Add description
        </button>
      )}

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={isLoading || !title.trim()}
          className="px-4 py-1.5 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white text-sm font-medium rounded transition-colors disabled:cursor-not-allowed"
        >
          {isLoading ? 'Adding...' : 'Add task'}
        </button>
        {(showDescription || description) && (
          <button
            type="button"
            onClick={() => {
              setShowDescription(false);
              setDescription('');
            }}
            className="px-4 py-1.5 text-sm text-gray-600 hover:text-gray-900"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
