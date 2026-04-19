'use client';

import { useState } from 'react';
import { Priority, Group } from '@/types/index';

interface CreateTaskFormProps {
  priorities: Priority[];
  groups: Group[];
  onSubmit: (title: string, priorityId: string, groupId: string, startTime?: string, endTime?: string) => Promise<void>;
  onCancel: () => void;
}

export default function CreateTaskForm({
  priorities,
  groups,
  onSubmit,
  onCancel,
}: CreateTaskFormProps) {
  const [title, setTitle] = useState('');
  const [priorityId, setPriorityId] = useState(priorities[0]?.id || '');
  const [groupId, setGroupId] = useState(groups[0]?.id || '');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !priorityId || !groupId) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(title, priorityId, groupId, startTime || undefined, endTime || undefined);
      setTitle('');
      setPriorityId(priorities[0]?.id || '');
      setGroupId(groups[0]?.id || '');
      setStartTime('');
      setEndTime('');
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-md">
          {error}
        </div>
      )}

      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Task title..."
        className="w-full px-4 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
        autoFocus
      />

      <div className="grid grid-cols-2 gap-4">
        <select
          value={priorityId}
          onChange={(e) => setPriorityId(e.target.value)}
          className="px-4 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
        >
          {priorities.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        <select
          value={groupId}
          onChange={(e) => setGroupId(e.target.value)}
          className="px-4 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
        >
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-muted mb-1">
            Start Time
          </label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full px-4 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-muted mb-1">
            End Time
          </label>
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="w-full px-4 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-4 py-2 bg-primary text-white font-medium rounded-md hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Task'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 border border-border text-text-dark font-medium rounded-md hover:bg-bg-light transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
