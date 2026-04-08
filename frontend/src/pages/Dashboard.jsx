import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../auth';
import api from '../api';

const GROUP_TYPE_ICONS = {
  trip: '✈️',
  roommates: '🏠',
  project: '📚',
  custom: '👥',
};

export default function Dashboard() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.getGroups().then(setGroups).catch(console.error).finally(() => setLoading(false));
  }, []);

  const totalOwed = groups.reduce((sum, g) => (g.your_balance > 0 ? sum + g.your_balance : sum), 0);
  const totalOwe = groups.reduce((sum, g) => (g.your_balance < 0 ? sum + Math.abs(g.your_balance) : sum), 0);
  const netBalance = totalOwed - totalOwe;

  if (loading) {
    return (
      <div className="loading-page">
        <div className="spinner" />
        <div className="loading-text">Loading your groups...</div>
      </div>
    );
  }

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Welcome back, {user?.name} 👋</p>
      </motion.div>

      {/* Balance Summary */}
      <motion.div
        className="glass-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        style={{ padding: '28px', marginBottom: '28px' }}
      >
        <div className="grid-3" style={{ textAlign: 'center' }}>
          <div>
            <div className="stat-label">You are owed</div>
            <div className="stat-value balance-positive">₹{totalOwed.toFixed(2)}</div>
          </div>
          <div>
            <div className="stat-label">You owe</div>
            <div className="stat-value balance-negative">₹{totalOwe.toFixed(2)}</div>
          </div>
          <div>
            <div className="stat-label">Net balance</div>
            <div className={`stat-value ${netBalance >= 0 ? 'balance-positive' : 'balance-negative'}`}>
              {netBalance >= 0 ? '+' : ''}₹{netBalance.toFixed(2)}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Groups */}
      <div className="flex-between mb-16">
        <h2 className="section-title" style={{ margin: 0 }}>Your Groups</h2>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
          {groups.length} group{groups.length !== 1 ? 's' : ''}
        </span>
      </div>

      {groups.length === 0 ? (
        <motion.div
          className="glass-card empty-state"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="empty-state-icon">📂</div>
          <div className="empty-state-text">No groups yet</div>
          <div className="empty-state-sub">Create your first group to start splitting expenses</div>
        </motion.div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {groups.map((group, i) => (
            <motion.div
              key={group.id}
              className="glass-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.15 + i * 0.05 }}
              style={{ padding: '20px', cursor: 'pointer' }}
              onClick={() => navigate(`/groups/${group.id}`)}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <div className="flex-between">
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '14px',
                    background: 'var(--gradient-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.4rem',
                  }}>
                    {GROUP_TYPE_ICONS[group.type] || '👥'}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: '2px' }}>
                      {group.name}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', gap: '12px' }}>
                      <span>{group.member_count} members</span>
                      <span>•</span>
                      <span>₹{group.total_expenses.toFixed(0)} total</span>
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className={`${group.your_balance >= 0 ? 'balance-positive' : 'balance-negative'}`}
                    style={{ fontWeight: 700, fontSize: '1.1rem' }}
                  >
                    {group.your_balance >= 0 ? '+' : ''}₹{group.your_balance.toFixed(2)}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                    {group.your_balance >= 0 ? 'you are owed' : 'you owe'}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* FAB */}
      <motion.button
        className="fab"
        onClick={() => navigate('/groups/create')}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.5 }}
      >
        ＋
      </motion.button>
    </div>
  );
}
