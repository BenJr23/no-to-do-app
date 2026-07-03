'use client';

import { useState, useEffect, useCallback } from 'react';

interface Category {
  id: string;
  name: string;
  color: string;
  _count?: { tasks: number };
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  categoryId: string | null;
  category: Category | null;
}

type SortOption = 'createdAt' | 'dueDate' | 'priority';

const PRIORITY_COLORS = {
  LOW: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  MEDIUM: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  HIGH: 'bg-red-500/20 text-red-300 border-red-500/30',
};

const STATUS_COLORS = {
  PENDING: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  IN_PROGRESS: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  COMPLETED: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
};

const STATUS_LABELS = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
};

const NEXT_STATUS: Record<Task['status'], Task['status']> = {
  PENDING: 'IN_PROGRESS',
  IN_PROGRESS: 'COMPLETED',
  COMPLETED: 'PENDING',
};

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterPriority, setFilterPriority] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortOption>('createdAt');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showCategorySection, setShowCategorySection] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#6366f1');
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM' as Task['priority'],
    status: 'PENDING' as Task['status'],
    dueDate: '',
    categoryId: '',
  });

  const fetchTasks = useCallback(async () => {
    const params = new URLSearchParams();
    if (filterStatus) params.set('status', filterStatus);
    if (filterPriority) params.set('priority', filterPriority);
    if (filterCategory) params.set('categoryId', filterCategory);
    if (sortBy) params.set('sortBy', sortBy);
    const res = await fetch(`/api/tasks?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      setTasks(data);
    }
  }, [filterStatus, filterPriority, filterCategory, sortBy]);

  const fetchCategories = async () => {
    const res = await fetch('/api/categories');
    if (res.ok) {
      const data = await res.json();
      setCategories(data);
    }
  };

  useEffect(() => {
    Promise.all([fetchTasks(), fetchCategories()]).then(() => setLoading(false));
  }, [fetchTasks]);

  useEffect(() => {
    fetchTasks();
  }, [filterStatus, filterPriority, filterCategory, sortBy, fetchTasks]);

  const openCreateModal = () => {
    setEditingTask(null);
    setTaskForm({ title: '', description: '', priority: 'MEDIUM', status: 'PENDING', dueDate: '', categoryId: '' });
    setShowTaskModal(true);
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setTaskForm({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      status: task.status,
      dueDate: task.dueDate ? task.dueDate.slice(0, 10) : '',
      categoryId: task.categoryId || '',
    });
    setShowTaskModal(true);
  };

  const handleSaveTask = async () => {
    if (!taskForm.title.trim()) return;
    const body: Record<string, unknown> = {
      title: taskForm.title.trim(),
      description: taskForm.description.trim() || null,
      priority: taskForm.priority,
      status: taskForm.status,
      dueDate: taskForm.dueDate ? new Date(taskForm.dueDate).toISOString() : null,
      categoryId: taskForm.categoryId || null,
    };

    if (editingTask) {
      const res = await fetch(`/api/tasks/${editingTask.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        await fetchTasks();
        setShowTaskModal(false);
      }
    } else {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        await fetchTasks();
        setShowTaskModal(false);
      }
    }
  };

  const handleDeleteTask = async (id: string) => {
    const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
    if (res.ok) {
      await fetchTasks();
      setShowTaskModal(false);
    }
  };

  const handleToggleStatus = async (task: Task) => {
    const nextStatus = NEXT_STATUS[task.status];
    const res = await fetch(`/api/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus }),
    });
    if (res.ok) {
      await fetchTasks();
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newCategoryName.trim(), color: newCategoryColor }),
    });
    if (res.ok) {
      await fetchCategories();
      setNewCategoryName('');
      setNewCategoryColor('#6366f1');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
    if (res.ok) {
      await fetchCategories();
      await fetchTasks();
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      {/* Header */}
      <header className="text-center mb-8 animate-fade-in">
        <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent animate-gradient mb-2">
          No To-Do
        </h1>
        <p className="text-white/50 text-lg">Your tasks, beautifully organized</p>
      </header>

      {/* Action Bar */}
      <div className="max-w-6xl mx-auto mb-6 flex flex-wrap gap-3 items-center justify-between animate-fade-in">
        <div className="flex flex-wrap gap-2 items-center">
          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="glass rounded-lg px-3 py-2 text-sm text-white/80 bg-transparent focus:outline-none focus:ring-2 focus:ring-purple-500/50 cursor-pointer"
          >
            <option value="" className="bg-gray-900">All Status</option>
            <option value="PENDING" className="bg-gray-900">Pending</option>
            <option value="IN_PROGRESS" className="bg-gray-900">In Progress</option>
            <option value="COMPLETED" className="bg-gray-900">Completed</option>
          </select>

          {/* Priority Filter */}
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="glass rounded-lg px-3 py-2 text-sm text-white/80 bg-transparent focus:outline-none focus:ring-2 focus:ring-purple-500/50 cursor-pointer"
          >
            <option value="" className="bg-gray-900">All Priority</option>
            <option value="LOW" className="bg-gray-900">Low</option>
            <option value="MEDIUM" className="bg-gray-900">Medium</option>
            <option value="HIGH" className="bg-gray-900">High</option>
          </select>

          {/* Category Filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="glass rounded-lg px-3 py-2 text-sm text-white/80 bg-transparent focus:outline-none focus:ring-2 focus:ring-purple-500/50 cursor-pointer"
          >
            <option value="" className="bg-gray-900">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id} className="bg-gray-900">{cat.name}</option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="glass rounded-lg px-3 py-2 text-sm text-white/80 bg-transparent focus:outline-none focus:ring-2 focus:ring-purple-500/50 cursor-pointer"
          >
            <option value="createdAt" className="bg-gray-900">Newest First</option>
            <option value="dueDate" className="bg-gray-900">Due Date</option>
            <option value="priority" className="bg-gray-900">Priority</option>
          </select>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowCategorySection(!showCategorySection)}
            className="glass rounded-lg px-4 py-2 text-sm text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200"
          >
            Categories
          </button>
          <button
            onClick={openCreateModal}
            className="rounded-lg px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-200 hover:scale-105"
          >
            + New Task
          </button>
        </div>
      </div>

      {/* Category Management */}
      {showCategorySection && (
        <div className="max-w-6xl mx-auto mb-6 animate-slide-up">
          <div className="glass-strong rounded-xl p-5">
            <h2 className="text-lg font-semibold text-white/90 mb-4">Manage Categories</h2>
            <div className="flex flex-wrap gap-3 mb-4">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center gap-2 glass rounded-lg px-3 py-2 group"
                >
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="text-sm text-white/80">{cat.name}</span>
                  <span className="text-xs text-white/40">({cat._count?.tasks ?? 0})</span>
                  <button
                    onClick={() => handleDeleteCategory(cat.id)}
                    className="ml-1 text-red-400/60 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                    aria-label={`Delete category ${cat.name}`}
                  >
                    ×
                  </button>
                </div>
              ))}
              {categories.length === 0 && (
                <p className="text-white/40 text-sm">No categories yet</p>
              )}
            </div>
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateCategory()}
                placeholder="New category name..."
                className="glass rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 bg-transparent focus:outline-none focus:ring-2 focus:ring-purple-500/50 flex-1 max-w-xs"
              />
              <input
                type="color"
                value={newCategoryColor}
                onChange={(e) => setNewCategoryColor(e.target.value)}
                className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border border-white/20"
                title="Category color"
              />
              <button
                onClick={handleCreateCategory}
                className="rounded-lg px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 transition-all duration-200"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tasks Grid */}
      <div className="max-w-6xl mx-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin" />
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-20 animate-fade-in">
            <div className="text-6xl mb-4">✨</div>
            <h2 className="text-2xl font-semibold text-white/60 mb-2">No tasks yet</h2>
            <p className="text-white/40 mb-6">Create your first task to get started</p>
            <button
              onClick={openCreateModal}
              className="rounded-lg px-6 py-3 font-semibold text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-lg shadow-purple-500/25 transition-all duration-200 hover:scale-105"
            >
              + Create Task
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tasks.map((task, index) => (
              <div
                key={task.id}
                className={`glass-strong rounded-xl p-5 hover:bg-white/10 hover:shadow-xl hover:shadow-purple-500/5 transition-all duration-300 hover:-translate-y-1 cursor-pointer group animate-slide-up`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Card Header: Priority + Status */}
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${PRIORITY_COLORS[task.priority]}`}>
                    {task.priority}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleToggleStatus(task); }}
                    className={`text-xs font-medium px-2 py-0.5 rounded-full border transition-all hover:scale-110 ${STATUS_COLORS[task.status]}`}
                    title="Click to toggle status"
                  >
                    {STATUS_LABELS[task.status]}
                  </button>
                </div>

                {/* Task Title - Hero Element */}
                <h3
                  className={`text-xl font-bold mb-2 leading-tight transition-colors ${
                    task.status === 'COMPLETED'
                      ? 'line-through text-white/40'
                      : 'text-white group-hover:text-purple-200'
                  }`}
                  onClick={() => openEditModal(task)}
                >
                  {task.title}
                </h3>

                {/* Description */}
                {task.description && (
                  <p className="text-sm text-white/50 mb-3 line-clamp-2">{task.description}</p>
                )}

                {/* Footer: Category + Due Date + Actions */}
                <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/5">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {task.category && (
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: task.category.color }}
                        />
                        <span className="text-xs text-white/40 truncate">{task.category.name}</span>
                      </div>
                    )}
                    {task.dueDate && (
                      <span className="text-xs text-white/40 flex-shrink-0">
                        📅 {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); openEditModal(task); }}
                      className="text-white/40 hover:text-blue-400 transition-colors p-1 text-sm"
                      aria-label="Edit task"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id); }}
                      className="text-white/40 hover:text-red-400 transition-colors p-1 text-sm"
                      aria-label="Delete task"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Task Modal */}
      {showTaskModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowTaskModal(false)}
        >
          <div
            className="glass-strong rounded-2xl p-6 w-full max-w-lg animate-modal-in"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold text-white mb-5 bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
              {editingTask ? 'Edit Task' : 'New Task'}
            </h2>

            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-white/60 mb-1">Title *</label>
                <input
                  type="text"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  placeholder="What needs to be done?"
                  className="w-full glass rounded-lg px-4 py-3 text-white text-lg placeholder-white/30 bg-transparent focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  autoFocus
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-white/60 mb-1">Description</label>
                <textarea
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  placeholder="Add some details..."
                  rows={3}
                  className="w-full glass rounded-lg px-4 py-3 text-white placeholder-white/30 bg-transparent focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none"
                />
              </div>

              {/* Priority + Status Row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-white/60 mb-1">Priority</label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value as Task['priority'] })}
                    className="w-full glass rounded-lg px-3 py-2 text-white bg-transparent focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  >
                    <option value="LOW" className="bg-gray-900">Low</option>
                    <option value="MEDIUM" className="bg-gray-900">Medium</option>
                    <option value="HIGH" className="bg-gray-900">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/60 mb-1">Status</label>
                  <select
                    value={taskForm.status}
                    onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value as Task['status'] })}
                    className="w-full glass rounded-lg px-3 py-2 text-white bg-transparent focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  >
                    <option value="PENDING" className="bg-gray-900">Pending</option>
                    <option value="IN_PROGRESS" className="bg-gray-900">In Progress</option>
                    <option value="COMPLETED" className="bg-gray-900">Completed</option>
                  </select>
                </div>
              </div>

              {/* Category + Due Date Row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-white/60 mb-1">Category</label>
                  <select
                    value={taskForm.categoryId}
                    onChange={(e) => setTaskForm({ ...taskForm, categoryId: e.target.value })}
                    className="w-full glass rounded-lg px-3 py-2 text-white bg-transparent focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  >
                    <option value="" className="bg-gray-900">None</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id} className="bg-gray-900">{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/60 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={taskForm.dueDate}
                    onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                    className="w-full glass rounded-lg px-3 py-2 text-white bg-transparent focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/10">
              <div>
                {editingTask && (
                  <button
                    onClick={() => handleDeleteTask(editingTask.id)}
                    className="text-sm text-red-400/70 hover:text-red-400 transition-colors"
                  >
                    Delete Task
                  </button>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowTaskModal(false)}
                  className="px-4 py-2 text-sm text-white/60 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveTask}
                  disabled={!taskForm.title.trim()}
                  className="px-5 py-2 text-sm font-semibold text-white rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-lg shadow-purple-500/25 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:from-purple-600 disabled:hover:to-pink-600"
                >
                  {editingTask ? 'Save Changes' : 'Create Task'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
