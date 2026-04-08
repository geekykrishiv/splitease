import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../api';

export default function SettleUp() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [settling, setSettling] = useState(null);

  const loadData = async () => {
    try {
      const [g, s] = await Promise.all([
        api.getGroup(id),
        api.getSettlements(id),
      ]);
      setGroup(g);
      setSettlements(s);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleSettle = async (debt) => {
    setSettling(debt);
    try {
      await api.settleUp(id, debt.from_id, debt.to_id, debt.amount);
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setSettling(null);
    }
  };

  if (loading) {
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
      transition={{ duration: 0.4 }}
    >
      <button className="btn btn-ghost mb-16" onClick={() => navigate(`/groups/${id}`)}>
        ← Back to {group?.name}
      </button>
      <h1 className="page-title">Settle Up</h1>
      <p className="page-subtitle">Resolve outstanding balances in {group?.name}</p>

      {/* Outstanding Debts */}
      <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
        <div className="section-title">Outstanding Settlements</div>
        {group?.simplified_debts?.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '32px',
            color: 'var(--text-secondary)',
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🎉</div>
            <div style={{ fontWeight: 600 }}>All settled up!</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
              No outstanding balances in this group
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {group?.simplified_debts?.map((debt, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '16px',
                  background: 'rgba(0, 0, 0, 0.2)',
                  borderRadius: '14px',
                }}
              >
                <div className="avatar" style={{
                  background: group.members.find(m => m.user_id === debt.from_id)?.avatar_color || '#666',
                }}>
                  {debt.from_name?.charAt(0)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                    {debt.from_name} → {debt.to_name}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    owes ₹{debt.amount.toFixed(2)}
                  </div>
                </div>
                <motion.button
                  className="btn btn-success btn-sm"
                  onClick={() => handleSettle(debt)}
                  disabled={settling !== null}
                  whileTap={{ scale: 0.95 }}
                >
                  {settling === debt ? '...' : '✓ Settle'}
                </motion.button>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Settlement History */}
      {settlements.length > 0 && (
        <div className="glass-card" style={{ padding: '24px' }}>
          <div className="section-title">Settlement History</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {settlements.map((s) => (
              <div
                key={s.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  background: 'rgba(0, 184, 148, 0.06)',
                  borderRadius: '12px',
                }}
              >
                <div style={{ fontSize: '1.2rem' }}>✅</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, fontSize: '0.85rem' }}>
                    {s.payer_name} paid {s.payee_name}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                    {new Date(s.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>
                <div style={{ fontWeight: 700, color: 'var(--success)' }}>
                  ₹{s.amount.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
