import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../api';

const GROUP_TYPES = [
  { value: 'trip', label: 'Trip', icon: '✈️' },
  { value: 'roommates', label: 'Roommates', icon: '🏠' },
  { value: 'project', label: 'Project', icon: '📚' },
  { value: 'custom', label: 'Custom', icon: '👥' },
];

export default function CreateGroup() {
  const [name, setName] = useState('');
  const [type, setType] = useState('custom');
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.getUsers().then(setUsers).catch(console.error);
  }, []);

  const toggleUser = (userId) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      const group = await api.createGroup(name, type, selectedUsers);
      navigate(`/groups/${group.id}`);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <button className="btn btn-ghost mb-16" onClick={() => navigate(-1)}>
        ← Back
      </button>
      <h1 className="page-title">Create Group</h1>
      <p className="page-subtitle">Set up a new expense sharing group</p>

      <form onSubmit={handleSubmit}>
        <div className="glass-card" style={{ padding: '28px', marginBottom: '20px' }}>
          <div className="form-group">
            <label className="form-label">Group Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g., Goa Trip 2025"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Group Type</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {GROUP_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  className={`pill-tab ${type === t.value ? 'active' : ''}`}
                  onClick={() => setType(t.value)}
                  style={{ padding: '10px 20px' }}
                >
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '28px', marginBottom: '20px' }}>
          <label className="form-label">Add Members</label>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginBottom: '16px' }}>
            You will be added automatically. Select other members:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {users.map((u) => (
              <motion.div
                key={u.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => toggleUser(u.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  background: selectedUsers.includes(u.id)
                    ? 'rgba(108, 92, 231, 0.15)'
                    : 'rgba(0, 0, 0, 0.2)',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  border: `1px solid ${
                    selectedUsers.includes(u.id)
                      ? 'rgba(108, 92, 231, 0.4)'
                      : 'transparent'
                  }`,
                  transition: 'all 0.2s ease',
                }}
              >
                <div
                  className="avatar"
                  style={{ background: u.avatar_color, width: 36, height: 36 }}
                >
                  {u.name.charAt(0)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{u.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{u.email}</div>
                </div>
                <div style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '6px',
                  border: selectedUsers.includes(u.id)
                    ? 'none'
                    : '2px solid var(--border-subtle)',
                  background: selectedUsers.includes(u.id) ? 'var(--primary)' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '0.7rem',
                }}>
                  {selectedUsers.includes(u.id) && '✓'}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <button
          className="btn btn-primary btn-block"
          type="submit"
          disabled={loading || !name.trim()}
          style={{ padding: '16px', fontSize: '1rem' }}
        >
          {loading ? 'Creating...' : `Create Group (${selectedUsers.length + 1} members)`}
        </button>
      </form>
    </motion.div>
  );
}
