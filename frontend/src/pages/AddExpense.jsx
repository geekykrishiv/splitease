import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../api';
import { useAuth } from '../auth';

const CATEGORY_EMOJIS = {
  food: '🍕', travel: '✈️', rent: '🏠', entertainment: '🎬',
  shopping: '🛒', utilities: '💡', groceries: '🥬', health: '💊', other: '📦',
};

export default function AddExpense() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [group, setGroup] = useState(null);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [splitType, setSplitType] = useState('equal');
  const [splits, setSplits] = useState([]);
  const [includedInEqual, setIncludedInEqual] = useState({});
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getGroup(id).then((g) => {
      setGroup(g);
      if (user) setPaidBy(user.id);
      setSplits(g.members.map((m) => ({ user_id: m.user_id, amount: 0, percentage: 0 })));

      const initialIncluded = {};
      g.members.forEach(m => { initialIncluded[m.user_id] = true; });
      setIncludedInEqual(initialIncluded);
    });
  }, [id, user]);

  // ── Percentage validation ──────────────────────────────
  const percentageTotal = splits.reduce((sum, s) => sum + (s.percentage || 0), 0);
  const isPercentageValid = Math.abs(percentageTotal - 100) < 0.01;
  const canSubmit = () => {
    if (!title.trim() || !amount || !paidBy) return false;
    if (splitType === 'percentage' && !isPercentageValid) return false;
    return true;
  };

  const getPctColor = () => {
    if (percentageTotal === 0) return '#fb7185';
    if (percentageTotal < 90) return '#fb7185';
    if (percentageTotal < 100) return '#fbbf24';
    if (Math.abs(percentageTotal - 100) < 0.01) return '#34d399';
    return '#fb7185';
  };

  const getPctClass = () => {
    if (Math.abs(percentageTotal - 100) < 0.01) return 'valid';
    if (percentageTotal > 90 && percentageTotal < 100) return 'warning';
    return 'invalid';
  };

  // ── AI-predicted category ──────────────────────────────
  const predictCategory = (text) => {
    const lower = text.toLowerCase();
    const categories = {
      food: ['pizza', 'dinner', 'lunch', 'breakfast', 'cafe', 'restaurant', 'coffee', 'burger', 'biryani', 'chai', 'swiggy', 'zomato', 'food', 'meal', 'snack', 'momos', 'dominos'],
      travel: ['uber', 'ola', 'flight', 'train', 'bus', 'taxi', 'metro', 'petrol', 'fuel', 'cab', 'travel', 'hotel'],
      rent: ['rent', 'deposit', 'maintenance', 'flat', 'apartment'],
      entertainment: ['movie', 'netflix', 'spotify', 'game', 'concert', 'party', 'club', 'drinks', 'beer'],
      shopping: ['amazon', 'flipkart', 'clothes', 'shoes', 'phone', 'laptop', 'shopping'],
      utilities: ['electricity', 'water', 'wifi', 'internet', 'bill', 'recharge', 'gas', 'repair'],
      groceries: ['grocery', 'vegetables', 'fruits', 'milk', 'bigbasket', 'blinkit', 'dmart'],
      health: ['medicine', 'doctor', 'hospital', 'gym', 'pharmacy', 'medical'],
    };
    for (const [cat, keywords] of Object.entries(categories)) {
      for (const kw of keywords) {
        if (lower.includes(kw)) return cat;
      }
    }
    return 'other';
  };

  const predictedCategory = title ? predictCategory(title) : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit()) return;

    setLoading(true);
    setError('');
    let finalSplits = splits;
    if (splitType === 'equal') {
      finalSplits = Object.keys(includedInEqual)
        .filter(uid => includedInEqual[uid])
        .map(uid => ({ user_id: parseInt(uid) }));
    }

    try {
      await api.createExpense(id, {
        title,
        amount: parseFloat(amount),
        paid_by: parseInt(paidBy),
        split_type: splitType,
        splits: finalSplits,
        date,
        notes,
      });
      navigate(`/groups/${id}`);
    } catch (err) {
      setError(err.message || 'Failed to add expense');
    } finally {
      setLoading(false);
    }
  };

  const updateSplitAmount = (userId, value) => {
    setSplits((prev) =>
      prev.map((s) => (s.user_id === userId ? { ...s, amount: parseFloat(value) || 0 } : s))
    );
  };

  const updateSplitPercentage = (userId, value) => {
    setSplits((prev) =>
      prev.map((s) => (s.user_id === userId ? { ...s, percentage: parseFloat(value) || 0 } : s))
    );
  };

  const toggleIncludedInEqual = (userId) => {
    setIncludedInEqual(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  if (!group) {
    return (
      <div className="loading-page">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <button className="btn btn-ghost mb-16" onClick={() => navigate(`/groups/${id}`)}>
        ← Back to {group.name}
      </button>
      <h1 className="page-title">Add Expense</h1>
      <p className="page-subtitle">Split a new expense in {group.name}</p>

      {error && <div className="auth-error mb-16">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="glass-card no-hover" style={{ padding: '28px', marginBottom: '20px' }}>
          <div className="form-group">
            <label className="form-label">What's this for?</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g., Dinner, Uber, Movie tickets"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            {/* AI Category Prediction Badge */}
            {predictedCategory && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                style={{
                  marginTop: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.82rem',
                  color: 'var(--text-accent)',
                }}
              >
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '5px 12px',
                  background: 'rgba(124, 107, 230, 0.1)',
                  borderRadius: 'var(--radius-pill)',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                }}>
                  🤖 {CATEGORY_EMOJIS[predictedCategory] || '📦'} {predictedCategory}
                </span>
                <span style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>AI auto-classify</span>
              </motion.div>
            )}
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Amount (₹)</label>
              <input
                type="number"
                className="form-input"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="0"
                step="0.01"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Date</label>
              <input
                type="date"
                className="form-input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Paid by</label>
            <select
              className="form-select"
              value={paidBy}
              onChange={(e) => setPaidBy(e.target.value)}
              required
            >
              <option value="">Select who paid</option>
              {group.members.map((m) => (
                <option key={m.user_id} value={m.user_id}>
                  {m.name}{m.user_id === user?.id ? ' (you)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="glass-card no-hover" style={{ padding: '28px', marginBottom: '20px' }}>
          <div className="form-group">
            <label className="form-label">Split Type</label>
            <div className="pill-tabs" style={{ marginBottom: '16px' }}>
              {['equal', 'exact', 'percentage'].map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`pill-tab ${splitType === t ? 'active' : ''}`}
                  onClick={() => setSplitType(t)}
                >
                  {t === 'equal' ? '⚖️ Equal' : t === 'exact' ? '💲 Exact' : '📊 Percentage'}
                </button>
              ))}
            </div>
          </div>

          {/* ── Equal Split ──────────────────────── */}
          {splitType === 'equal' && (() => {
            const numIncluded = Object.values(includedInEqual).filter(Boolean).length;
            const perPerson = amount && numIncluded > 0 ? (parseFloat(amount) / numIncluded).toFixed(2) : '0.00';

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{
                  padding: '14px',
                  background: 'rgba(52, 211, 153, 0.06)',
                  borderRadius: '12px',
                  border: '1px solid rgba(52, 211, 153, 0.12)',
                  fontSize: '0.85rem',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  ⚖️ Splitting equally among {numIncluded} selected members
                  {amount && numIncluded > 0 && (
                    <span style={{ color: 'var(--success)', fontWeight: 700, marginLeft: 'auto' }}>
                      ₹{perPerson} each
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {group.members.map((m) => (
                    <label key={m.user_id} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '6px 0' }}>
                      <input
                        type="checkbox"
                        checked={!!includedInEqual[m.user_id]}
                        onChange={() => toggleIncludedInEqual(m.user_id)}
                        style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }}
                      />
                      <div className="avatar avatar-sm" style={{ background: m.avatar_color, opacity: includedInEqual[m.user_id] ? 1 : 0.4 }}>{m.name.charAt(0)}</div>
                      <span style={{ flex: 1, fontSize: '0.9rem', fontWeight: 500, color: includedInEqual[m.user_id] ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
                        {m.name}
                      </span>
                      {includedInEqual[m.user_id] && amount && numIncluded > 0 && (
                        <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>₹{perPerson}</span>
                      )}
                    </label>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* ── Exact Split ──────────────────────── */}
          {splitType === 'exact' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {group.members.map((m) => (
                <div key={m.user_id} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div className="avatar avatar-sm" style={{ background: m.avatar_color }}>{m.name.charAt(0)}</div>
                  <span style={{ flex: 1, fontSize: '0.85rem', fontWeight: 500 }}>{m.name}</span>
                  <input
                    type="number"
                    className="form-input"
                    style={{ width: '120px' }}
                    placeholder="₹0.00"
                    step="0.01"
                    onChange={(e) => updateSplitAmount(m.user_id, e.target.value)}
                  />
                </div>
              ))}
            </div>
          )}

          {/* ── Percentage Split with LIVE validation ── */}
          {splitType === 'percentage' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Live Indicator */}
              <motion.div
                className={`pct-indicator ${getPctClass()}`}
                layout
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              >
                <span>Total: {percentageTotal.toFixed(1)}%</span>
                <div className="pct-bar">
                  <div
                    className="pct-bar-fill"
                    style={{
                      width: `${Math.min(percentageTotal, 100)}%`,
                      background: getPctColor(),
                    }}
                  />
                </div>
                <span style={{ fontSize: '1.1rem' }}>
                  {isPercentageValid ? '✅' : percentageTotal > 100 ? '🚫' : '❌'}
                </span>
              </motion.div>

              {group.members.map((m) => {
                const pct = splits.find(s => s.user_id === m.user_id)?.percentage || 0;
                const calcAmount = amount ? (parseFloat(amount) * pct / 100).toFixed(2) : '0.00';

                return (
                  <div key={m.user_id} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div className="avatar avatar-sm" style={{ background: m.avatar_color }}>{m.name.charAt(0)}</div>
                    <span style={{ flex: 1, fontSize: '0.85rem', fontWeight: 500 }}>{m.name}</span>
                    <input
                      type="number"
                      className="form-input"
                      style={{ width: '90px' }}
                      placeholder="%"
                      step="0.1"
                      max="100"
                      value={pct || ''}
                      onChange={(e) => updateSplitPercentage(m.user_id, e.target.value)}
                    />
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', width: '20px' }}>%</span>
                    {amount && pct > 0 && (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-accent)', fontWeight: 600, minWidth: '70px', textAlign: 'right' }}>
                        ₹{calcAmount}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="glass-card no-hover" style={{ padding: '28px', marginBottom: '20px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Notes (optional)</label>
            <textarea
              className="form-input"
              placeholder="Any additional details..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows="3"
              style={{ resize: 'vertical' }}
            />
          </div>
        </div>

        <motion.button
          className="btn btn-primary btn-block"
          type="submit"
          disabled={loading || !canSubmit()}
          style={{
            padding: '16px',
            fontSize: '1rem',
            opacity: loading || !canSubmit() ? 0.5 : 1,
          }}
          whileTap={{ scale: 0.96 }}
        >
          {loading ? 'Adding...' : '✓ Add Expense'}
        </motion.button>
      </form>
    </motion.div>
  );
}
