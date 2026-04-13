'use client';

import { useState } from 'react';

interface CreatePriorityFormProps {
  onSubmit: (name: string) => Promise<void>;
  onCancel: () => void;
}

export default function CreatePriorityForm({
  onSubmit,
  onCancel,
}: CreatePriorityFormProps) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Priority name is required');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(name);
      setName('');
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to create priority');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2 mt-3">
      {error && (
        <div className="p-2 bg-red-50 border border-red-200 text-red-700 text-xs rounded">
          {error}
        </div>
      )}
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Priority name..."
        className="w-full px-3 py-2 text-sm border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
        autoFocus
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-3 py-1 text-sm bg-primary text-white rounded-md hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loading ? 'Adding...' : 'Add'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-3 py-1 text-sm border border-border rounded-md hover:bg-bg-light transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
