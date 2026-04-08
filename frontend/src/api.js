const API_BASE = 'http://localhost:8000';

class ApiClient {
  constructor() {
    this.baseUrl = API_BASE;
  }

  getToken() {
    return localStorage.getItem('token');
  }

  async request(path, options = {}) {
    const token = this.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Request failed' }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Auth
  register(name, email, password) {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
  }

  login(email, password) {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  getMe() {
    return this.request('/api/auth/me');
  }

  // Users
  getUsers() {
    return this.request('/api/users/');
  }

  // Groups
  getGroups() {
    return this.request('/api/groups/');
  }

  createGroup(name, type, memberIds) {
    return this.request('/api/groups/', {
      method: 'POST',
      body: JSON.stringify({ name, type, member_ids: memberIds }),
    });
  }

  getGroup(groupId) {
    return this.request(`/api/groups/${groupId}`);
  }

  deleteGroup(groupId) {
    return this.request(`/api/groups/${groupId}`, { method: 'DELETE' });
  }

  // Expenses
  getExpenses(groupId) {
    return this.request(`/api/groups/${groupId}/expenses`);
  }

  createExpense(groupId, data) {
    return this.request(`/api/groups/${groupId}/expenses`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  deleteExpense(expenseId) {
    return this.request(`/api/expenses/${expenseId}`, { method: 'DELETE' });
  }

  // Settlements
  getSettlements(groupId) {
    return this.request(`/api/groups/${groupId}/settlements`);
  }

  settleUp(groupId, payerId, payeeId, amount) {
    return this.request(`/api/groups/${groupId}/settle`, {
      method: 'POST',
      body: JSON.stringify({ payer_id: payerId, payee_id: payeeId, amount }),
    });
  }

  // Analytics
  getAnalyticsSummary(groupId) {
    return this.request(`/api/groups/${groupId}/analytics/summary`);
  }

  getAnalyticsRegression(groupId) {
    return this.request(`/api/groups/${groupId}/analytics/regression`);
  }

  getAnalyticsCorrelation(groupId) {
    return this.request(`/api/groups/${groupId}/analytics/correlation`);
  }

  getAnalyticsMLE(groupId) {
    return this.request(`/api/groups/${groupId}/analytics/mle`);
  }

  getAnalyticsTTest(groupId) {
    return this.request(`/api/groups/${groupId}/analytics/ttest`);
  }

  getAnalyticsSampling(groupId, params = {}) {
    const query = new URLSearchParams();
    if (params.category) query.set('category', params.category);
    if (params.start_date) query.set('start_date', params.start_date);
    if (params.end_date) query.set('end_date', params.end_date);
    if (params.member) query.set('member', params.member);
    if (params.min_amount) query.set('min_amount', params.min_amount);
    if (params.max_amount) query.set('max_amount', params.max_amount);
    const qs = query.toString();
    return this.request(`/api/groups/${groupId}/analytics/sampling${qs ? '?' + qs : ''}`);
  }

  getAnalyticsCategories(groupId) {
    return this.request(`/api/groups/${groupId}/analytics/categories`);
  }

  // CSV Export — triggers browser download
  async exportGroupCSV(groupId) {
    const token = this.getToken();
    const response = await fetch(`${this.baseUrl}/api/groups/${groupId}/export/csv`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
    if (!response.ok) {
      const err = await response.text();
      throw new Error(err || 'Export failed');
    }
    const blob = await response.blob();
    const csvBlob = new Blob([blob], { type: 'text/csv;charset=utf-8;' });

    // Try to get filename from header, fallback to default
    let filename = `group_${groupId}_export.csv`;
    try {
      const disposition = response.headers.get('Content-Disposition');
      if (disposition) {
        // Match filename="..." or filename=...
        const match = disposition.match(/filename[^;=\n]*=["']?([^"';\n]*)["']?/);
        if (match && match[1]) filename = match[1];
      }
    } catch (e) {
      // ignore header parse errors
    }

    const url = window.URL.createObjectURL(csvBlob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    // Small delay before cleanup to ensure download starts
    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 100);
  }

  // WebSocket
  connectWebSocket(groupId, onMessage) {
    const ws = new WebSocket(`ws://localhost:8000/ws/${groupId}`);
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      onMessage(data);
    };
    ws.onerror = (err) => console.error('WebSocket error:', err);
    return ws;
  }
}

const api = new ApiClient();
export default api;

