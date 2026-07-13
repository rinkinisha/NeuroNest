/**
 * components/topics/TopicForm.jsx
 * Create/Edit form for topics with tag management.
 */

import { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import Button from '../ui/Button';
import { toInputDate } from '../../utils/dateHelpers';

const defaultForm = {
  title: '',
  description: '',
  subject: '',
  tags: [],
  dateLearnerd: toInputDate(),
  difficulty: 3,
  notes: '',
};

const TopicForm = ({ initialData = null, onSubmit, onCancel, loading = false }) => {
  const [form, setForm] = useState({ ...defaultForm });
  const [tagInput, setTagInput] = useState('');

  // Pre-fill form for editing
  useEffect(() => {
    if (initialData) {
      setForm({
        title: initialData.title || '',
        description: initialData.description || '',
        subject: initialData.subject || '',
        tags: initialData.tags || [],
        dateLearnerd: toInputDate(initialData.dateLearnerd),
        difficulty: initialData.difficulty || 3,
        notes: initialData.notes || '',
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !form.tags.includes(tag) && form.tags.length < 10) {
      setForm((prev) => ({ ...prev, tags: [...prev.tags, tag] }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    setForm((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tagToRemove),
    }));
  };

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...form,
      difficulty: parseInt(form.difficulty),
    });
  };

  const difficultyLabels = {
    1: '⭐ Easy',
    2: '⭐⭐ Moderate',
    3: '⭐⭐⭐ Medium',
    4: '⭐⭐⭐⭐ Hard',
    5: '⭐⭐⭐⭐⭐ Very Hard',
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-dark-300 mb-1.5">
          Topic Title <span className="text-red-400">*</span>
        </label>
        <input
          name="title"
          value={form.title}
          onChange={handleChange}
          placeholder="e.g. Binary Search Trees"
          className="input-field"
          required
        />
      </div>

      {/* Subject */}
      <div>
        <label className="block text-sm font-medium text-dark-300 mb-1.5">Subject / Category</label>
        <input
          name="subject"
          value={form.subject}
          onChange={handleChange}
          placeholder="e.g. Data Structures, Mathematics, History"
          className="input-field"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-dark-300 mb-1.5">Description</label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Brief summary of what you learned..."
          rows={3}
          className="input-field resize-none"
        />
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-dark-300 mb-1.5">
          Tags <span className="text-dark-600 text-xs">(max 10)</span>
        </label>
        <div className="flex gap-2">
          <input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            placeholder="Add tag and press Enter"
            className="input-field flex-1"
          />
          <button
            type="button"
            onClick={addTag}
            className="px-4 py-3 rounded-xl bg-primary-600/20 border border-primary-500/30 text-primary-400 hover:bg-primary-600/30 transition-colors"
          >
            <Plus size={16} />
          </button>
        </div>
        {form.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {form.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary-500/20 text-primary-300 border border-primary-500/30 text-xs font-medium"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="hover:text-white transition-colors ml-0.5"
                >
                  <X size={10} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Date + Difficulty Row */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-dark-300 mb-1.5">Date Learned</label>
          <input
            type="date"
            name="dateLearnerd"
            value={form.dateLearnerd}
            onChange={handleChange}
            className="input-field"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-dark-300 mb-1.5">Difficulty</label>
          <select
            name="difficulty"
            value={form.difficulty}
            onChange={handleChange}
            className="input-field"
          >
            {Object.entries(difficultyLabels).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-dark-300 mb-1.5">Notes</label>
        <textarea
          name="notes"
          value={form.notes}
          onChange={handleChange}
          placeholder="Any additional notes, formulas, or key points..."
          rows={3}
          className="input-field resize-none"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button type="submit" variant="primary" loading={loading} className="flex-1">
          {initialData ? 'Update Topic' : '🚀 Create Topic'}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
};

export default TopicForm;
