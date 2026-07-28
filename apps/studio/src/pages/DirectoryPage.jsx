import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';
import UserAvatar from '@kumocoders/ui/UserAvatar.jsx';

export default function DirectoryPage({ teamId }) {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [members, setMembers] = useState([]);
  const [search, setSearch] = useState('');

  function fetchMembers() {
    if (!token) return;
    fetch(`/api/studio/teams/${teamId}/members`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : []).then(d => { if (Array.isArray(d)) setMembers(d); }).catch(() => {});
  }

  useEffect(() => { fetchMembers(); }, [teamId, token]);

  async function handleRole(member, role) {
    await fetch(`/api/studio/teams/${teamId}/members/${member.user_id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ role }),
    });
    fetchMembers();
    showToast('Role updated', 'success');
  }

  const filtered = members.filter(m => {
    const q = search.toLowerCase();
    return (m.display_name || m.username || '').toLowerCase().includes(q) || (m.email || '').toLowerCase().includes(q);
  });

  return (
    <div className="studio-page">
      <div className="studio-page-header">
        <h1><span className="nf nf-fa-address_card" /> Directory</h1>
        <input className="studio-input" placeholder="Search members..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 260 }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {filtered.map(m => (
          <div key={m.user_id} className="glass" style={{ padding: 16, borderRadius: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="studio-avatar" style={{ width: 44, height: 44, fontSize: 18, flexShrink: 0 }}>
              <UserAvatar user={m} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <strong>{m.display_name || m.username}</strong>
              <div className="studio-text-muted" style={{ fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.email}</div>
              <span className="studio-badge" style={{ fontSize: 11, marginTop: 4, display: 'inline-block' }}>{m.role || 'member'}</span>
            </div>
            <select className="studio-input" style={{ width: 'auto', padding: '4px 8px', fontSize: 12 }} value={m.role || 'member'} onChange={e => handleRole(m, e.target.value)}>
              <option value="member">Member</option>
              <option value="admin">Admin</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="studio-empty" style={{ gridColumn: '1 / -1' }}>
            <span className="nf nf-fa-address_card studio-empty-icon" />
            <h3>No members found</h3>
          </div>
        )}
      </div>
    </div>
  );
}
