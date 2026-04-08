import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line, Legend, ReferenceLine, ComposedChart, Area,
} from 'recharts';
import api from '../api';

const COLORS = ['#7c6be6', '#34d399', '#4da8da', '#f97316', '#fbbf24', '#ec4899', '#22d3ee', '#9b8afa', '#fb7185', '#60a5fa'];

const TABS = [
  { id: 'overview', label: '📊 Overview' },
  { id: 'trends', label: '📈 Trends' },
  { id: 'regression', label: '📐 Regression' },
  { id: 'correlation', label: '🔗 Correlation' },
  { id: 'statistics', label: '🧮 Statistics' },
  { id: 'sampling', label: '🔍 Sampling' },
];

const CATEGORY_EMOJIS = {
  food: '🍕', travel: '✈️', rent: '🏠', entertainment: '🎬',
  shopping: '🛒', utilities: '💡', groceries: '🥬', health: '💊', other: '📦',
};

export default function Analytics() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState('overview');
  const [summary, setSummary] = useState(null);
  const [regression, setRegression] = useState(null);
  const [correlation, setCorrelation] = useState(null);
  const [mle, setMle] = useState(null);
  const [ttest, setTtest] = useState(null);
  const [groupInfo, setGroupInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getAnalyticsSummary(id),
      api.getAnalyticsRegression(id),
      api.getAnalyticsCorrelation(id),
      api.getAnalyticsMLE(id),
      api.getAnalyticsTTest(id),
      api.getGroup(id),
    ])
      .then(([s, r, c, m, t, g]) => {
        setSummary(s);
        setRegression(r);
        setCorrelation(c);
        setMle(m);
        setTtest(t);
        setGroupInfo(g);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="loading-page">
        <div className="spinner" />
        <div className="loading-text">Crunching numbers...</div>
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
        ← Back to Group
      </button>
      <h1 className="page-title">Analytics Dashboard</h1>
      <p className="page-subtitle">
        Deep insights from {summary?.expense_count || 0} expenses
        {summary?.total_expenses ? ` totaling ₹${summary.total_expenses.toFixed(0)}` : ''}
      </p>

      {/* Tabs */}
      <div className="pill-tabs mb-24" style={{ overflowX: 'auto' }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`pill-tab ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && <OverviewTab summary={summary} />}
      {tab === 'trends' && <TrendsTab summary={summary} />}
      {tab === 'regression' && <RegressionTab regression={regression} />}
      {tab === 'correlation' && <CorrelationTab correlation={correlation} />}
      {tab === 'statistics' && <StatisticsTab mle={mle} ttest={ttest} />}
      {tab === 'sampling' && <SamplingTab groupId={id} groupInfo={groupInfo} />}
    </motion.div>
  );
}

/* ═══════════════ OVERVIEW TAB ═══════════════ */
function OverviewTab({ summary }) {
  if (!summary) return null;

  return (
    <div>
      {/* Stats Grid */}
      <div className="grid-3 mb-24">
        <motion.div className="stat-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="stat-label">Total Expenses</div>
          <div className="stat-value" style={{ background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            ₹{summary.total_expenses?.toFixed(0)}
          </div>
          <div className="stat-sub">{summary.expense_count} transactions</div>
        </motion.div>
        <motion.div className="stat-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <div className="stat-label">Categories</div>
          <div className="stat-value" style={{ color: 'var(--accent)' }}>
            {summary.category_breakdown?.length || 0}
          </div>
          <div className="stat-sub">expense types</div>
        </motion.div>
        <motion.div className="stat-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="stat-label">Avg Expense</div>
          <div className="stat-value" style={{ color: 'var(--success)' }}>
            ₹{summary.expense_count ? (summary.total_expenses / summary.expense_count).toFixed(0) : 0}
          </div>
          <div className="stat-sub">per transaction</div>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid-2 mb-24">
        <motion.div className="glass-card chart-card no-hover" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <div className="chart-title">Expense by Category</div>
          <div className="chart-subtitle">Distribution of spending across categories</div>
          <div className="chart-container">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={summary.category_breakdown}
                  dataKey="amount"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  innerRadius={50}
                  paddingAngle={3}
                  stroke="none"
                >
                  {summary.category_breakdown?.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => `₹${value.toFixed(2)}`}
                  contentStyle={{ background: 'rgba(15,15,36,0.95)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '0.75rem' }}
                  formatter={(value) => <span style={{ color: 'var(--text-secondary)' }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div className="glass-card chart-card no-hover" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className="chart-title">Member Contributions</div>
          <div className="chart-subtitle">Who paid the most</div>
          <div className="chart-container">
            <ResponsiveContainer>
              <BarChart data={summary.member_contributions}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 12 }} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 12 }} />
                <Tooltip
                  formatter={(value) => `₹${value.toFixed(2)}`}
                  contentStyle={{ background: 'rgba(15,15,36,0.95)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }}
                />
                <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                  {summary.member_contributions?.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Category Breakdown Table */}
      <motion.div className="glass-card no-hover" style={{ padding: '24px' }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
        <div className="chart-title mb-16">Category Breakdown</div>
        {summary.category_breakdown?.map((cat, i) => (
          <div key={cat.category} style={{
            display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0',
            borderBottom: i < summary.category_breakdown.length - 1 ? '1px solid var(--border-subtle)' : 'none',
          }}>
            <span className={`badge badge-${cat.category}`} style={{ minWidth: '90px', justifyContent: 'center' }}>
              {CATEGORY_EMOJIS[cat.category] || '📦'} {cat.category}
            </span>
            <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.04)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${cat.percentage}%`, background: COLORS[i % COLORS.length], borderRadius: '3px', transition: 'width 0.6s ease' }} />
            </div>
            <span style={{ fontWeight: 700, fontSize: '0.9rem', minWidth: '80px', textAlign: 'right' }}>₹{cat.amount.toFixed(0)}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', minWidth: '40px', textAlign: 'right' }}>{cat.percentage}%</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

/* ═══════════════ TRENDS TAB ═══════════════ */
function TrendsTab({ summary }) {
  if (!summary?.monthly_trends?.length) {
    return <EmptyAnalytics message="Not enough data for trend analysis" />;
  }

  return (
    <motion.div className="glass-card chart-card no-hover" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="chart-title">Monthly Spending Trends</div>
      <div className="chart-subtitle">Track how your group spending changes over time</div>
      <div style={{ width: '100%', height: '350px' }}>
        <ResponsiveContainer>
          <ComposedChart data={summary.monthly_trends}>
            <defs>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7c6be6" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#7c6be6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
            <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 12 }} />
            <YAxis tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 12 }} />
            <Tooltip
              formatter={(value) => `₹${value.toFixed(2)}`}
              contentStyle={{ background: 'rgba(15,15,36,0.95)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }}
            />
            <Area type="monotone" dataKey="amount" fill="url(#areaGrad)" stroke="none" />
            <Line
              type="monotone"
              dataKey="amount"
              stroke="#7c6be6"
              strokeWidth={3}
              dot={{ fill: '#7c6be6', strokeWidth: 2, r: 5 }}
              activeDot={{ r: 7, fill: '#9b8afa' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}

/* ═══════════════ REGRESSION TAB ═══════════════ */
function RegressionTab({ regression }) {
  const slr = regression?.slr;
  const mlr = regression?.mlr;

  return (
    <div>
      {/* SLR */}
      <motion.div className="glass-card chart-card mb-24 no-hover" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="chart-title">Simple Linear Regression (SLR)</div>
        <div className="chart-subtitle">Time vs Spending — predicting future expenses</div>
        {slr ? (
          <>
            <div className="stats-grid mb-24">
              <div className="stat-block">
                <div className="stat-block-title">R² Value</div>
                <div className="stat-block-value" style={{ color: slr.r_squared > 0.5 ? 'var(--success)' : 'var(--warning)' }}>
                  {slr.r_squared}
                </div>
                <div className="stat-block-desc">
                  {slr.r_squared > 0.7 ? 'Strong fit' : slr.r_squared > 0.4 ? 'Moderate fit' : 'Weak fit'}
                </div>
              </div>
              <div className="stat-block">
                <div className="stat-block-title">Slope</div>
                <div className="stat-block-value" style={{ color: slr.slope > 0 ? '#fb7185' : 'var(--success)' }}>
                  {slr.slope > 0 ? '↑' : '↓'} ₹{Math.abs(slr.slope).toFixed(0)}/mo
                </div>
                <div className="stat-block-desc">
                  Spending is {slr.slope > 0 ? 'increasing' : 'decreasing'}
                </div>
              </div>
              <div className="stat-block">
                <div className="stat-block-title">Next Month</div>
                <div className="stat-block-value" style={{ color: 'var(--primary-light)' }}>
                  ₹{slr.next_month_prediction?.toFixed(0)}
                </div>
                <div className="stat-block-desc">Predicted expense</div>
              </div>
            </div>

            <div style={{ width: '100%', height: '300px' }}>
              <ResponsiveContainer>
                <LineChart>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                  <XAxis
                    dataKey="month"
                    type="category"
                    allowDuplicatedCategory={false}
                    tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }}
                  />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 12 }} />
                  <Tooltip contentStyle={{ background: 'rgba(15,15,36,0.95)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }} />
                  <Line
                    data={slr.months.map((m, i) => ({ month: m, actual: slr.actual[i] }))}
                    type="monotone"
                    dataKey="actual"
                    stroke="#7c6be6"
                    strokeWidth={3}
                    dot={{ fill: '#7c6be6', r: 5 }}
                    name="Actual"
                  />
                  <Line
                    data={slr.months.map((m, i) => ({ month: m, predicted: slr.predicted[i] }))}
                    type="monotone"
                    dataKey="predicted"
                    stroke="#f97316"
                    strokeWidth={2}
                    strokeDasharray="8 4"
                    dot={false}
                    name="Predicted"
                  />
                  <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        ) : (
          <EmptyAnalytics message="Not enough months for SLR (need 3+)" />
        )}
      </motion.div>

      {/* MLR — with actual vs predicted chart */}
      <motion.div className="glass-card no-hover" style={{ padding: '24px' }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div className="chart-title">Multiple Linear Regression (MLR)</div>
        <div className="chart-subtitle">How each category predicts total spending</div>
        {mlr ? (
          <div>
            <div style={{
              padding: '16px',
              background: 'rgba(124, 107, 230, 0.06)',
              borderRadius: '12px',
              border: '1px solid rgba(124, 107, 230, 0.12)',
              fontFamily: 'monospace',
              fontSize: '0.82rem',
              color: 'var(--text-accent)',
              marginBottom: '20px',
              overflowX: 'auto',
            }}>
              {mlr.formula}
            </div>

            {/* MLR Actual vs Predicted Chart */}
            <div style={{ width: '100%', height: '280px', marginBottom: '20px' }}>
              <ResponsiveContainer>
                <LineChart data={mlr.months.map((m, i) => ({
                  month: m,
                  actual: mlr.actual[i],
                  predicted: mlr.predicted[i],
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }} />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 12 }} />
                  <Tooltip
                    formatter={(value) => `₹${value.toFixed(2)}`}
                    contentStyle={{ background: 'rgba(15,15,36,0.95)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }}
                  />
                  <Line type="monotone" dataKey="actual" stroke="#7c6be6" strokeWidth={3} dot={{ fill: '#7c6be6', r: 4 }} name="Actual" />
                  <Line type="monotone" dataKey="predicted" stroke="#34d399" strokeWidth={2} strokeDasharray="6 3" dot={{ fill: '#34d399', r: 3 }} name="MLR Predicted" />
                  <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Coefficient Bar Chart */}
            <div className="chart-subtitle" style={{ marginTop: '8px' }}>Category Coefficients — Impact on Total Spending</div>
            <div style={{ width: '100%', height: '200px', marginBottom: '16px' }}>
              <ResponsiveContainer>
                <BarChart data={Object.entries(mlr.coefficients).map(([cat, coeff]) => ({ category: cat, coefficient: coeff }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="category" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }} />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 12 }} />
                  <Tooltip contentStyle={{ background: 'rgba(15,15,36,0.95)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }} />
                  <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" />
                  <Bar dataKey="coefficient" radius={[4, 4, 0, 0]}>
                    {Object.entries(mlr.coefficients).map(([, coeff], i) => (
                      <Cell key={i} fill={coeff >= 0 ? '#34d399' : '#fb7185'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="stats-grid">
              <div className="stat-block">
                <div className="stat-block-title">R² Value</div>
                <div className="stat-block-value" style={{ color: mlr.r_squared > 0.7 ? 'var(--success)' : 'var(--warning)' }}>
                  {mlr.r_squared}
                </div>
              </div>
              {Object.entries(mlr.coefficients).map(([cat, coeff]) => (
                <div className="stat-block" key={cat}>
                  <div className="stat-block-title">{CATEGORY_EMOJIS[cat] || '📦'} {cat}</div>
                  <div className="stat-block-value" style={{ fontSize: '1.1rem' }}>
                    {coeff > 0 ? '+' : ''}{coeff.toFixed(3)}
                  </div>
                  <div className="stat-block-desc">coefficient</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <EmptyAnalytics message="Not enough data for MLR (need 3+ months, 2+ categories)" />
        )}
      </motion.div>
    </div>
  );
}

/* ═══════════════ CORRELATION TAB ═══════════════ */
function CorrelationTab({ correlation }) {
  const corrData = correlation?.correlation;
  const partialData = correlation?.partial_correlation;

  return (
    <div>
      <motion.div className="glass-card no-hover" style={{ padding: '24px', marginBottom: '20px' }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="chart-title">Pearson Correlation Matrix</div>
        <div className="chart-subtitle">How spending categories relate to each other</div>
        {corrData ? (
          <CorrelationMatrix categories={corrData.categories} matrix={corrData.matrix} />
        ) : (
          <EmptyAnalytics message="Not enough data for correlation analysis" />
        )}
      </motion.div>

      <motion.div className="glass-card no-hover" style={{ padding: '24px' }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div className="chart-title">Partial Correlation Matrix</div>
        <div className="chart-subtitle">Category relationships controlling for other variables</div>
        {partialData ? (
          <CorrelationMatrix categories={partialData.categories} matrix={partialData.matrix} isPartial />
        ) : (
          <EmptyAnalytics message="Not enough data for partial correlation (need 4+ months, 3+ categories)" />
        )}
      </motion.div>
    </div>
  );
}

function CorrelationMatrix({ categories, matrix, isPartial }) {
  const getColor = (val) => {
    const v = typeof val === 'object' ? val.r || val : val;
    const abs = Math.abs(v);
    if (v > 0.5) return `rgba(52, 211, 153, ${0.15 + abs * 0.35})`;
    if (v > 0) return `rgba(77, 168, 218, ${0.08 + abs * 0.3})`;
    if (v > -0.5) return `rgba(249, 115, 22, ${0.08 + abs * 0.3})`;
    return `rgba(239, 68, 68, ${0.15 + abs * 0.35})`;
  };

  return (
    <div style={{ overflowX: 'auto' }}>
      <div
        className="corr-matrix"
        style={{
          gridTemplateColumns: `80px repeat(${categories.length}, 1fr)`,
          minWidth: `${80 + categories.length * 60}px`,
        }}
      >
        <div className="corr-cell" />
        {categories.map((c) => (
          <div key={c} className="corr-cell corr-header">{c}</div>
        ))}
        {categories.map((row) => (
          <div key={row} style={{ display: 'contents' }}>
            <div className="corr-cell corr-header" style={{ justifyContent: 'flex-end', paddingRight: '8px' }}>
              {row}
            </div>
            {categories.map((col) => {
              const val = isPartial ? matrix[row]?.[col] : matrix[row]?.[col]?.r;
              return (
                <div
                  key={`${row}-${col}`}
                  className="corr-cell"
                  style={{ background: getColor(val || 0) }}
                  title={`${row} × ${col}: ${(val || 0).toFixed(4)}`}
                >
                  {(val || 0).toFixed(2)}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════ STATISTICS TAB ═══════════════ */
function StatisticsTab({ mle, ttest }) {
  return (
    <div>
      {/* MLE */}
      <motion.div className="glass-card no-hover" style={{ padding: '24px', marginBottom: '20px' }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="chart-title">Maximum Likelihood Estimation (MLE)</div>
        <div className="chart-subtitle">Best-fit distributions for your expense data</div>
        {mle && !mle.message ? (
          <div className="stats-grid">
            <div className="stat-block">
              <div className="stat-block-title">📊 Normal Distribution</div>
              <div className="stat-block-value" style={{ fontSize: '1.1rem', color: '#7c6be6' }}>
                N(₹{mle.normal.mu}, ₹{mle.normal.sigma})
              </div>
              <div className="stat-block-desc">{mle.normal.description}</div>
            </div>
            <div className="stat-block">
              <div className="stat-block-title">⏱ Exponential Distribution</div>
              <div className="stat-block-value" style={{ fontSize: '1.1rem', color: '#4da8da' }}>
                λ = {mle.exponential.lambda}
              </div>
              <div className="stat-block-desc">{mle.exponential.description}</div>
            </div>
            <div className="stat-block">
              <div className="stat-block-title">🔢 Poisson Distribution</div>
              <div className="stat-block-value" style={{ fontSize: '1.1rem', color: '#34d399' }}>
                λ = {mle.poisson.lambda}
              </div>
              <div className="stat-block-desc">{mle.poisson.description}</div>
            </div>
          </div>
        ) : (
          <EmptyAnalytics message={mle?.message || "Not enough data for MLE"} />
        )}

        {/* Amount Histogram */}
        {mle?.amount_histogram?.length > 0 && (
          <div style={{ marginTop: '24px' }}>
            <div className="chart-subtitle">Expense Amount Distribution</div>
            <div style={{ width: '100%', height: '250px' }}>
              <ResponsiveContainer>
                <BarChart data={mle.amount_histogram}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="bin" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 10 }} angle={-30} textAnchor="end" height={60} />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 12 }} />
                  <Tooltip contentStyle={{ background: 'rgba(15,15,36,0.95)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }} />
                  <Bar dataKey="count" fill="#7c6be6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </motion.div>

      {/* T-Tests with GRAPHS */}
      <motion.div className="glass-card no-hover" style={{ padding: '24px' }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div className="chart-title">T-Test Analysis</div>
        <div className="chart-subtitle">Statistical significance testing</div>
        {ttest && !ttest.message ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* ── Paired T-Test with Bar Chart ── */}
            {ttest.paired && (
              <div className="stat-block">
                <div className="flex-between mb-8">
                  <div className="stat-block-title" style={{ margin: 0 }}>📊 Paired T-Test</div>
                  <span className={`sig-badge ${ttest.paired.significant ? 'significant' : 'not-significant'}`}>
                    {ttest.paired.significant ? '✓ Significant' : '✗ Not Significant'}
                  </span>
                </div>
                <div className="stat-block-desc mb-8">{ttest.paired.description}</div>

                {/* Side-by-side bar chart */}
                <div style={{ width: '100%', height: '220px', marginBottom: '16px' }}>
                  <ResponsiveContainer>
                    <BarChart data={[
                      ...ttest.paired.first_period.months.map((m, i) => ({
                        month: m,
                        'First Half': ttest.paired.first_period.values[i],
                      })),
                    ].map((item, i) => ({
                      ...item,
                      'Second Half': ttest.paired.second_period.values[i] || 0,
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                      <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 10 }} />
                      <YAxis tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 12 }} />
                      <Tooltip
                        formatter={(value) => `₹${value.toFixed(0)}`}
                        contentStyle={{ background: 'rgba(15,15,36,0.95)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }}
                      />
                      <Bar dataKey="First Half" fill="#7c6be6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Second Half" fill="#4da8da" radius={[4, 4, 0, 0]} />
                      <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
                      <ReferenceLine y={ttest.paired.first_period.mean} stroke="#7c6be6" strokeDasharray="4 4" label={{ value: `μ₁ = ₹${ttest.paired.first_period.mean.toFixed(0)}`, fill: '#9b8afa', fontSize: 10 }} />
                      <ReferenceLine y={ttest.paired.second_period.mean} stroke="#4da8da" strokeDasharray="4 4" label={{ value: `μ₂ = ₹${ttest.paired.second_period.mean.toFixed(0)}`, fill: '#4da8da', fontSize: 10 }} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="ttest-comparison">
                  <div className="ttest-group">
                    <div className="ttest-group-label">First Period</div>
                    <div className="ttest-group-mean" style={{ color: '#7c6be6' }}>₹{ttest.paired.first_period.mean.toFixed(0)}</div>
                    <div className="ttest-group-detail">{ttest.paired.first_period.months.length} months</div>
                  </div>
                  <div className="ttest-group">
                    <div className="ttest-group-label">Second Period</div>
                    <div className="ttest-group-mean" style={{ color: '#4da8da' }}>₹{ttest.paired.second_period.mean.toFixed(0)}</div>
                    <div className="ttest-group-detail">{ttest.paired.second_period.months.length} months</div>
                  </div>
                </div>
                <div className="ttest-pvalue">
                  t = {ttest.paired.t_statistic} &nbsp;|&nbsp; p = {ttest.paired.p_value}
                </div>
              </div>
            )}

            {/* ── Independent T-Test with Bar Chart ── */}
            {ttest.independent && (
              <div className="stat-block">
                <div className="flex-between mb-8">
                  <div className="stat-block-title" style={{ margin: 0 }}>⚖️ Independent T-Test</div>
                  <span className={`sig-badge ${ttest.independent.significant ? 'significant' : 'not-significant'}`}>
                    {ttest.independent.significant ? '✓ Significant' : '✗ Not Significant'}
                  </span>
                </div>
                <div className="stat-block-desc mb-8">{ttest.independent.description}</div>

                {/* Category comparison bar chart */}
                <div style={{ width: '100%', height: '180px', marginBottom: '16px' }}>
                  <ResponsiveContainer>
                    <BarChart data={[
                      {
                        name: ttest.independent.group1.category,
                        mean: ttest.independent.group1.mean,
                        fill: '#7c6be6',
                      },
                      {
                        name: ttest.independent.group2.category,
                        mean: ttest.independent.group2.mean,
                        fill: '#f97316',
                      },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                      <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 12 }} />
                      <YAxis tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 12 }} />
                      <Tooltip
                        formatter={(value) => `₹${value.toFixed(0)}`}
                        contentStyle={{ background: 'rgba(15,15,36,0.95)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }}
                      />
                      <Bar dataKey="mean" radius={[6, 6, 0, 0]} name="Mean Expense">
                        <Cell fill="#7c6be6" />
                        <Cell fill="#f97316" />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="ttest-comparison">
                  <div className="ttest-group">
                    <div className="ttest-group-label">{CATEGORY_EMOJIS[ttest.independent.group1.category] || '📦'} {ttest.independent.group1.category}</div>
                    <div className="ttest-group-mean" style={{ color: '#7c6be6' }}>₹{ttest.independent.group1.mean.toFixed(0)}</div>
                    <div className="ttest-group-detail">n = {ttest.independent.group1.n} expenses</div>
                  </div>
                  <div className="ttest-group">
                    <div className="ttest-group-label">{CATEGORY_EMOJIS[ttest.independent.group2.category] || '📦'} {ttest.independent.group2.category}</div>
                    <div className="ttest-group-mean" style={{ color: '#f97316' }}>₹{ttest.independent.group2.mean.toFixed(0)}</div>
                    <div className="ttest-group-detail">n = {ttest.independent.group2.n} expenses</div>
                  </div>
                </div>
                <div className="ttest-pvalue">
                  t = {ttest.independent.t_statistic} &nbsp;|&nbsp; p = {ttest.independent.p_value}
                </div>
              </div>
            )}
          </div>
        ) : (
          <EmptyAnalytics message={ttest?.message || "Not enough data for t-tests"} />
        )}
      </motion.div>
    </div>
  );
}

/* ═══════════════ SAMPLING TAB ═══════════════ */
function SamplingTab({ groupId, groupInfo }) {
  const [category, setCategory] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [member, setMember] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [results, setResults] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.getAnalyticsCategories(groupId).then(data => {
      setCategories(data.categories || []);
    }).catch(console.error);
  }, [groupId]);

  const applyFilters = async () => {
    setLoading(true);
    try {
      const params = {};
      if (category) params.category = category;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      if (member) params.member = member;
      if (minAmount) params.min_amount = minAmount;
      if (maxAmount) params.max_amount = maxAmount;
      const data = await api.getAnalyticsSampling(groupId, params);
      setResults(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setCategory('');
    setStartDate('');
    setEndDate('');
    setMember('');
    setMinAmount('');
    setMaxAmount('');
    setResults(null);
  };

  const filteredTotal = results?.expenses?.reduce((s, e) => s + e.amount, 0) || 0;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="glass-card no-hover" style={{ padding: '24px', marginBottom: '20px' }}>
        <div className="chart-title">Sampling Engine</div>
        <div className="chart-subtitle mb-16">Filter expenses by category, date, member, or amount range</div>

        <div className="filter-panel">
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Category</label>
            <select className="form-select" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">All Categories</option>
              {categories.map(c => (
                <option key={c} value={c}>{CATEGORY_EMOJIS[c] || '📦'} {c}</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Start Date</label>
            <input
              type="date"
              className="form-input"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">End Date</label>
            <input
              type="date"
              className="form-input"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Member</label>
            <select className="form-select" value={member} onChange={(e) => setMember(e.target.value)}>
              <option value="">All Members</option>
              {groupInfo?.members?.map(m => (
                <option key={m.user_id} value={m.user_id}>{m.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Min Amount (₹)</label>
            <input
              type="number"
              className="form-input"
              placeholder="0"
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Max Amount (₹)</label>
            <input
              type="number"
              className="form-input"
              placeholder="∞"
              value={maxAmount}
              onChange={(e) => setMaxAmount(e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
          <motion.button
            className="btn btn-primary"
            onClick={applyFilters}
            disabled={loading}
            whileTap={{ scale: 0.96 }}
          >
            {loading ? 'Filtering...' : '🔍 Apply Filters'}
          </motion.button>
          <button className="btn btn-ghost" onClick={clearFilters}>Clear</button>

          {results && (
            <span className="filter-result-count" style={{ marginLeft: 'auto' }}>
              Showing {results.filtered_count} of {results.total_count} expenses
            </span>
          )}
        </div>
      </div>

      {/* Results */}
      {results && (
        <motion.div
          className="glass-card no-hover"
          style={{ padding: '24px' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {/* Summary Stats */}
          <div className="grid-3 mb-24">
            <div className="stat-block">
              <div className="stat-block-title">Filtered Count</div>
              <div className="stat-block-value" style={{ color: 'var(--primary-light)' }}>{results.filtered_count}</div>
            </div>
            <div className="stat-block">
              <div className="stat-block-title">Filtered Total</div>
              <div className="stat-block-value" style={{ color: 'var(--success)' }}>₹{filteredTotal.toFixed(0)}</div>
            </div>
            <div className="stat-block">
              <div className="stat-block-title">Avg Amount</div>
              <div className="stat-block-value" style={{ color: 'var(--accent)' }}>
                ₹{results.filtered_count > 0 ? (filteredTotal / results.filtered_count).toFixed(0) : 0}
              </div>
            </div>
          </div>

          {/* Results Table */}
          {results.expenses.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table className="sample-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Amount</th>
                    <th>Paid By</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {results.expenses.map((exp) => (
                    <tr key={exp.id}>
                      <td>{exp.title}</td>
                      <td>
                        <span className={`badge badge-${exp.category}`}>
                          {CATEGORY_EMOJIS[exp.category] || '📦'} {exp.category}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>₹{exp.amount.toFixed(2)}</td>
                      <td>{exp.payer_name}</td>
                      <td>{new Date(exp.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyAnalytics message="No expenses match your filters" />
          )}
        </motion.div>
      )}
    </motion.div>
  );
}

function EmptyAnalytics({ message }) {
  return (
    <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-tertiary)' }}>
      <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>📭</div>
      <div style={{ fontSize: '0.85rem' }}>{message}</div>
    </div>
  );
}
