import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api';
import { useAuth } from '../auth';

const CATEGORY_EMOJIS = {
  food: '🍕', travel: '✈️', rent: '🏠', entertainment: '🎬',
  shopping: '🛒', utilities: '💡', groceries: '🥬', health: '💊', other: '📦',
};

export default function GroupDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [group, setGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const wsRef = useRef(null);

  const loadData = async () => {
    try {
      const [g, e] = await Promise.all([
        api.getGroup(id),
        api.getExpenses(id),
      ]);
      setGroup(g);
      setExpenses(e);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // WebSocket for real-time updates
    wsRef.current = api.connectWebSocket(id, () => {
      loadData(); // Reload on any update
    });

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [id]);

  const handleDeleteExpense = async (expenseId) => {
    if (!confirm('Delete this expense?')) return;
    try {
      await api.deleteExpense(expenseId);
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="loading-page">
        <div className="spinner" />
        <div className="loading-text">Loading group...</div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">❌</div>
        <div className="empty-state-text">Group not found</div>
        <button className="btn btn-primary mt-16" onClick={() => navigate('/')}>Go Home</button>
      </div>
    );
  }

  const currentMember = group.members.find((m) => m.user_id === user?.id);
  const yourBalance = currentMember?.balance || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <button className="btn btn-ghost mb-16" onClick={() => navigate('/')}>
        ← Dashboard
      </button>

      {/* Header */}
      <div className="flex-between mb-24">
        <div>
          <h1 className="page-title">{group.name}</h1>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span className="badge badge-type">{group.type}</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {group.members.length} members
            </span>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Your balance</div>
          <div className={`${yourBalance >= 0 ? 'balance-positive' : 'balance-negative'}`}
            style={{ fontSize: '1.5rem', fontWeight: 800 }}
          >
            {yourBalance >= 0 ? '+' : ''}₹{yourBalance.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Members */}
      <div className="glass-card" style={{ padding: '20px', marginBottom: '20px' }}>
        <div className="section-title">Members</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {group.members.map((m) => (
            <div key={m.user_id} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div className="avatar" style={{ background: m.avatar_color }}>{m.name.charAt(0)}</div>
              <div style={{ flex: 1 }}>
                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                  {m.name}{m.user_id === user?.id ? ' (you)' : ''}
                </span>
              </div>
              <span
                className={m.balance > 0 ? 'balance-positive' : m.balance < 0 ? 'balance-negative' : 'balance-zero'}
                style={{ fontWeight: 700 }}
              >
                {m.balance >= 0 ? '+' : ''}₹{m.balance.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Simplified Debts */}
      {group.simplified_debts.length > 0 && (
        <div className="glass-card" style={{ padding: '20px', marginBottom: '20px' }}>
          <div className="section-title">Settlements Needed</div>
          {group.simplified_debts.map((debt, i) => (
            <div key={i} className="debt-item">
              <div className="avatar avatar-sm" style={{
                background: group.members.find(m => m.user_id === debt.from_id)?.avatar_color || '#666'
              }}>
                {debt.from_name?.charAt(0)}
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{debt.from_name}</span>
              <span className="debt-arrow">→</span>
              <div className="avatar avatar-sm" style={{
                background: group.members.find(m => m.user_id === debt.to_id)?.avatar_color || '#666'
              }}>
                {debt.to_name?.charAt(0)}
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{debt.to_name}</span>
              <span className="debt-amount">₹{debt.amount.toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <motion.button
          className="btn btn-primary"
          onClick={() => navigate(`/groups/${id}/add-expense`)}
          whileTap={{ scale: 0.96 }}
        >
          ＋ Add Expense
        </motion.button>
        <motion.button
          className="btn btn-success"
          onClick={() => navigate(`/groups/${id}/settle`)}
          whileTap={{ scale: 0.96 }}
        >
          🤝 Settle Up
        </motion.button>
        <motion.button
          className="btn btn-secondary"
          onClick={() => navigate(`/groups/${id}/analytics`)}
          whileTap={{ scale: 0.96 }}
        >
          📊 Analytics
        </motion.button>
        <motion.button
          className="btn btn-export"
          onClick={async () => {
            try {
              await api.exportGroupCSV(id);
            } catch (err) {
              console.error('Export failed:', err);
            }
          }}
          whileTap={{ scale: 0.96 }}
        >
          📤 Export CSV
        </motion.button>
      </div>

      {/* Expenses */}
      <div className="section-title">Expenses ({expenses.length})</div>
      {expenses.length === 0 ? (
        <div className="glass-card empty-state">
          <div className="empty-state-icon">🧾</div>
          <div className="empty-state-text">No expenses yet</div>
          <div className="empty-state-sub">Add your first expense to start tracking</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <AnimatePresence>
            {expenses.map((exp, i) => (
              <motion.div
                key={exp.id}
                className="glass-card clickable"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2, delay: i * 0.03 }}
                style={{ padding: '16px 20px', cursor: 'pointer' }}
                onClick={() => navigate(`/groups/${id}/expenses/${exp.id}`)}
              >
                <div className="flex-between">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{
                      width: '42px', height: '42px', borderRadius: '12px',
                      background: 'rgba(0,0,0,0.3)', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem',
                    }}>
                      {CATEGORY_EMOJIS[exp.category] || '📦'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '2px' }}>
                        {exp.title}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <span>Paid by <strong>{exp.payer_name}</strong></span>
                        <span className={`badge badge-${exp.category}`}>{exp.category}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>₹{exp.amount.toFixed(2)}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
                        {new Date(exp.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </div>
                    </div>
                    <div style={{ color: 'var(--text-tertiary)', paddingLeft: '8px' }}>
                      ›
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
