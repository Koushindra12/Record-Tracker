// ============================================================
// api.js — REST API client
// All calls go to Flask backend at /api/*
// ============================================================

const API = (() => {
  const BASE = '/api';

  async function request(method, path, body = null) {
    startProgress();
    const opts = {
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    if (body) opts.body = JSON.stringify(body);
    try {
      const res = await fetch(BASE + path, opts);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      return data;
    } finally {
      endProgress();
    }
  }

  return {
    /** GET /api/records → Array of enriched records */
    getRecords:    ()            => request('GET',    '/records'),
    /** POST /api/records */
    createRecord:  (record)      => request('POST',   '/records', record),
    /** GET /api/records/:id */
    getRecord:     (id)          => request('GET',    `/records/${id}`),
    /** PUT /api/records/:id */
    updateRecord:  (id, record)  => request('PUT',    `/records/${id}`, record),
    /** DELETE /api/records/:id */
    deleteRecord:  (id)          => request('DELETE', `/records/${id}`),
    /** GET /api/stats */
    getStats:      ()            => request('GET',    '/stats'),
    /** GET /api/health */
    health:        ()            => request('GET',    '/health'),
    /** POST /api/reset — wipe all records and restore 12 demo records */
    resetData:     ()            => request('POST',   '/reset'),
  };
})();
