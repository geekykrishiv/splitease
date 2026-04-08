import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api';
import { useAuth } from '../auth';

const CATEGORY_EMOJIS = {
  food: '🍕', travel: '✈️', rent: '🏠', entertainment: '🎬',
  shopping: '🛒', utilities: '💡', groceries: '🥬', health: '💊', other: '📦',
};

export default function ExpenseDetails() {
  const { id, expenseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [expense, setExpense] = useState(null);
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [g, expenses] = await Promise.all([
          api.getGroup(id),
          api.getExpenses(id)
        ]);
        setGroup(g);
        const exp = expenses.find(e => e.id === parseInt(expenseId));
        setExpense(exp);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id, expenseId]);

  if (loading) {
    return (
      <div className="loading-page">
        <div className="spinner" />
      </div>
    );
  }

  if (!expense || !group) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">❌</div>
        <div className="empty-state-text">Expense not found</div>
        <button className="btn btn-primary mt-16" onClick={() => navigate(`/groups/${id}`)}>Back to Group</button>
      </div>
    );
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this expense?')) return;
    try {
      await api.deleteExpense(expense.id);
      navigate(`/groups/${id}`);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
    >
      <button className="btn btn-ghost mb-16" onClick={() => navigate(`/groups/${id}`)}>
        ← Back to {group.name}
      </button>

      <div className="glass-card" style={{ padding: '32px', marginBottom: '24px', textAlign: 'center' }}>
        <div style={{
          width: '64px', height: '64px', borderRadius: '16px',
          background: 'rgba(255,255,255,0.05)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', fontSize: '2rem',
          margin: '0 auto 16px'
        }}>
          {CATEGORY_EMOJIS[expense.category] || '📦'}
        </div>
        <h1 className="page-title" style={{ marginBottom: '8px' }}>{expense.title}</h1>
        <div style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '16px' }}>
          ₹{expense.amount.toFixed(2)}
        </div>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '24px' }}>
          <span className={`badge badge-${expense.category}`}>{expense.category}</span>
          <span className="badge badge-type">{expense.split_type} split</span>
        </div>
        
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Paid by <strong style={{ color: 'var(--text)' }}>{expense.payer_name}</strong> on {new Date(expense.date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
        <div className="section-title">People Included</div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {expense.splits.map(split => {
            const isPayer = split.user_id === expense.paid_by;
            const owesPayer = isPayer ? 0 : split.amount_owed;
            const m = group.members.find(member => member.user_id === split.user_id);
            
            return (
              <div key={split.user_id} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
                <div className="avatar" style={{ background: m?.avatar_color || '#333' }}>{split.user_name.charAt(0)}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{split.user_name} {split.user_id === user?.id ? '(you)' : ''}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                    {isPayer ? `Paid ₹${expense.amount.toFixed(2)}` : `Owes ${expense.payer_name}`}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem', color: isPayer ? 'var(--text)' : 'var(--text-secondary)' }}>
                    ₹{split.amount_owed.toFixed(2)}
                  </div>
                  {isPayer && (
                    <div className="balance-positive" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                      gets back ₹{(expense.amount - split.amount_owed).toFixed(2)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {expense.notes && (
        <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
          <div className="section-title" style={{ fontSize: '0.9rem', color: 'var(--text-tertiary)' }}>Notes</div>
          <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{expense.notes}</div>
        </div>
      )}

      <button className="btn btn-block" style={{ backgroundColor: 'rgba(255, 60, 60, 0.1)', color: '#ff4d4d' }} onClick={handleDelete}>
        Delete Transaction
      </button>

    </motion.div>
  );
}
