import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function PermissionsPage({ teamId }) {
  const { token } = useAuth();
  const [members, setMembers] = useState([]);
  const [apps, setApps] = useState([]);
  const [perms, setPerms] = useState({});
  const [loading, setLoading] = useState({});

  function fetchMembers() {
    if (!token) return;
    fetch(`/api/studio/teams/${teamId}/members`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : []).then(d => { if (Array.isArray(d)) setMembers(d); }).catch(() => {});
  }

  function fetchApps() {
    if (!token) return;
    fetch(`/api/studio/teams/${teamId}/apps`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : []).then(d => { if (Array.isArray(d)) setApps(d); }).catch(() => {});
  }

  useEffect(() => { fetchMembers(); fetchApps(); }, [teamId, token]);

  async function handleChange(memberId, appId, role) {
    const key = `${memberId}-${appId}`;
    setLoading({ ...loading, [key]: true });
    try {
      await fetch(`/api/studio/teams/${teamId}/apps/${appId}/permissions`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ userId: memberId, role }),
      });
      setPerms({ ...perms, [key]: role });
    } catch {}
    setLoading({ ...loading, [key]: false });
  }

  function getPerm(memberId, appId) {
    const key = `${memberId}-${appId}`;
    return perms[key] || 'none';
  }

  if (members.length === 0 || apps.length === 0) {
    return (
      <div className="studio-page">
        <div className="studio-page-header"><h1><span className="nf nf-fa-shield" /> Permissions</h1></div>
        <div className="studio-empty"><span className="nf nf-fa-shield studio-empty-icon" /><h3>Loading...</h3></div>
      </div>
    );
  }

  return (
    <div className="studio-page">
      <div className="studio-page-header"><h1><span className="nf nf-fa-shield" /> Permissions</h1></div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '8px 12', borderBottom: '1px solid var(--border-color)' }}>Member</th>
              {apps.map(a => <th key={a.id} style={{ textAlign: 'center', padding: '8px 12', borderBottom: '1px solid var(--border-color)' }}>{a.name || a.app_key || a.id}</th>)}
            </tr>
          </thead>
          <tbody>
            {members.map(m => (
              <tr key={m.user_id}>
                <td style={{ padding: '6px 12', borderBottom: '1px solid var(--border-color)' }}>
                  <strong>{m.display_name || m.username}</strong>
                  <div className="studio-text-muted" style={{ fontSize: 11 }}>{m.email}</div>
                </td>
                {apps.map(a => {
                  const key = `${m.user_id}-${a.id}`;
                  return (
                    <td key={a.id} style={{ textAlign: 'center', padding: '6px 12', borderBottom: '1px solid var(--border-color)' }}>
                      <select className="studio-input" style={{ width: 'auto', padding: '4px 6px', fontSize: 12, opacity: loading[key] ? 0.6 : 1 }} value={getPerm(m.user_id, a.id)} onChange={e => handleChange(m.user_id, a.id, e.target.value)}>
                        <option value="none">None</option>
                        <option value="view">View</option>
                        <option value="edit">Edit</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="studio-text-muted" style={{ marginTop: 12, fontSize: 12, fontStyle: 'italic' }}>
        Changes are saved immediately on selection.
      </div>
    </div>
  );
}
