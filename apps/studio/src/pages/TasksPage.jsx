import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';
import LoadingSkeleton from '../components/LoadingSkeleton.jsx';
import UserAvatar from '@kumocoders/ui/UserAvatar.jsx';

const STATUSES = ['backlog', 'todo', 'in_progress', 'review', 'done'];
const PRIORITIES = { low: '#94a3b8', medium: '#f59e0b', high: '#ef4444', urgent: '#dc2626' };

export default function TasksPage({ teamId }) {
  const { token, user } = useAuth();
  const { showToast } = useToast();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', status: 'todo', priority: 'medium', assigneeId: '' });

  function fetchTasks() {
    if (!token) return;
    fetch(`/api/studio/teams/${teamId}/tasks`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => { if (!r.ok) throw new Error('Failed'); return r.json(); })
      .then((data) => { if (Array.isArray(data)) setTasks(data); })
      .catch(() => {}).finally(() => setLoading(false));
  }

  useEffect(() => { fetchTasks(); }, [teamId, token]);

  async function handleCreate(e) {
    e.preventDefault();
    try {
      const body = {};
      for (const [k, v] of Object.entries(form)) { if (v !== '') body[k] = v; }
      const res = await fetch(`/api/studio/teams/${teamId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setShowCreate(false);
        setForm({ title: '', description: '', status: 'todo', priority: 'medium', assigneeId: '' });
        fetchTasks();
        showToast('Task created', 'success');
      }
    } catch { showToast('Failed to create task', 'error'); }
  }

  async function handleUpdate(id, updates) {
    try {
      const res = await fetch(`/api/studio/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(updates),
      });
      if (res.ok) { fetchTasks(); showToast('Task updated', 'success'); }
    } catch { showToast('Failed to update task', 'error'); }
  }

  async function handleDelete(id) {
    try {
      const res = await fetch(`/api/studio/tasks/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) { fetchTasks(); showToast('Task deleted', 'success'); }
      else { const err = await res.json().catch(() => ({ error: 'Delete failed' })); showToast(err.error, 'error'); }
    } catch (e) { showToast('Network error', 'error'); }
  }

  function getTasksByStatus(status) {
    return tasks.filter((t) => t.status === status);
  }

  if (loading) return <LoadingSkeleton.Page />;

  return (
    <div className="studio-page">
      <div className="studio-page-header">
        <h1><span className="nf nf-fa-list_check" style={{ color: '#777' }} /> Tasks</h1>
        <button className="studio-btn studio-btn--primary" onClick={() => setShowCreate(true)}>
          <span className="nf nf-fa-plus" /> Add Task
        </button>
      </div>

      <div className="studio-kanban">
        {STATUSES.map((status) => (
          <div key={status} className="studio-kanban-col">
            <div className="studio-kanban-col-header">
              <h3>{status.replace('_', ' ').toUpperCase()}</h3>
              <span className="studio-badge">{getTasksByStatus(status).length}</span>
            </div>
            <div className="studio-kanban-cards"
              onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('studio-kanban-cards--drag-over'); }}
              onDragLeave={(e) => { e.currentTarget.classList.remove('studio-kanban-cards--drag-over'); }}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.classList.remove('studio-kanban-cards--drag-over');
                const id = e.dataTransfer.getData('taskId');
                if (id) handleUpdate(id, { status });
              }}
            >
              {getTasksByStatus(status).map((task) => (
                <div key={task.id} className="studio-kanban-card glass" draggable
                  onDragStart={(e) => e.dataTransfer.setData('taskId', task.id)}
                  onDragOver={(e) => e.stopPropagation()}
                >
                  <div className="studio-kanban-card-header">
                    <span className="studio-priority-dot" style={{ background: PRIORITIES[task.priority] }} />
                    {task.priority}
                  </div>
                  <h4>{task.title}</h4>
                  {task.description && <p className="studio-text-muted">{task.description}</p>}
                  <div className="studio-kanban-card-footer">
                    {task.assignee_username && (
                      <span className="studio-avatar-xs">
                        <UserAvatar user={{ username: task.assignee_username, display_name: task.assignee_display_name, avatar_url: task.assignee_avatar_url }} />
                      </span>
                    )}
                    <div className="studio-kanban-card-actions">
                      <button className="studio-btn studio-btn--icon" onClick={() => setEditingTask(task)}>
                        <span className="nf nf-fa-pen" />
                      </button>
                      <button className="studio-btn studio-btn--icon" onClick={() => handleDelete(task.id)}>
                        <span className="nf nf-fa-trash" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {showCreate && (
        <>
          <div className="studio-backdrop" onClick={() => setShowCreate(false)} />
          <div className="studio-modal">
            <div className="studio-modal-header">
              <h2>Add Task</h2>
              <button className="studio-btn studio-btn--ghost" onClick={() => setShowCreate(false)}>
                <span className="nf nf-fa-xmark" /></button>
            </div>
            <form onSubmit={handleCreate} className="studio-form">
              <label className="studio-label">
                Title <input className="studio-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              </label>
              <label className="studio-label">
                Description <textarea className="studio-input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
              </label>
              <div className="studio-form-row">
                <label className="studio-label">
                  Status <select className="studio-select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                  </select>
                </label>
                <label className="studio-label">
                  Priority <select className="studio-select" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                    {Object.keys(PRIORITIES).map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </label>
              </div>
              <div className="studio-form-actions">
                <button type="submit" className="studio-btn studio-btn--primary">Create</button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}