// ============================================================
// dashboard.js — Async dashboard with Flask API
// ============================================================

let allRecords  = [];
let deleteTargetId = null;

async function init() {
  showTableSkeleton();
  try {
    const [records, stats] = await Promise.all([API.getRecords(), API.getStats()]);
    allRecords = records;
    renderMetrics(stats);
    renderAlertBanner('alertBanner', stats);
    filterRecords();
  } catch (err) {
    showTableError(err.message);
    showToast('Failed to load records — is the server running?', 'error');
  }
}

// ── Metrics ───────────────────────────────────────────────────
function renderMetrics(counts) {
  ['Expired', 'Critical', 'Warning', 'Active'].forEach(key => {
    const el = document.getElementById(`count${key}`);
    if (el) animateCount(el, counts[key.toLowerCase()] || 0);
  });
}

// ── Filters ───────────────────────────────────────────────────
function filterByStatus(status) {
  const sel = document.getElementById('filterStatus');
  sel.value = sel.value === status ? 'all' : status;
  filterRecords();
}

function resetFilters() {
  document.getElementById('filterStatus').value    = 'all';
  document.getElementById('filterCategory').value  = 'all';
  document.getElementById('sortBy').value          = 'expiry';
  document.getElementById('globalSearch').value    = '';
  filterRecords();
}

function filterRecords() {
  const q  = document.getElementById('globalSearch').value.toLowerCase();
  const fs = document.getElementById('filterStatus').value;
  const fc = document.getElementById('filterCategory').value;
  const sb = document.getElementById('sortBy').value;

  let rows = [...allRecords];
  if (q)         rows = rows.filter(r => ((r.name||'')+(r.vendor||'')+(r.owner||'')).toLowerCase().includes(q));
  if (fs !== 'all') rows = rows.filter(r => r.status === fs);
  if (fc !== 'all') rows = rows.filter(r => r.cat === fc);

  if (sb === 'expiry') rows.sort((a, b) => (a.days ?? 9999) - (b.days ?? 9999));
  else if (sb === 'name') rows.sort((a, b) => a.name.localeCompare(b.name));
  else if (sb === 'status') {
    const order = { expired: 0, critical: 1, warning: 2, active: 3 };
    rows.sort((a, b) => (order[a.status] ?? 9) - (order[b.status] ?? 9));
  }

  renderTable(rows);

  // Update table count badge
  const countEl = document.getElementById('tableCount');
  if (countEl) countEl.textContent = rows.length;
}

// ── Table render ──────────────────────────────────────────────
function renderTable(rows) {
  const tbody = document.getElementById('recordsTable');
  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="8">
      <div class="empty-state">
        <i class="ti ti-mood-empty"></i>
        <h3>No records found</h3>
        <p>Try adjusting your filters or <a href="/pages/add.html" style="color:var(--primary)">add a new record</a></p>
      </div>
    </td></tr>`;
    return;
  }
  tbody.innerHTML = rows.map(r => `
    <tr>
      <td>
        <div class="record-name" title="${escHtml(r.name)}">${escHtml(r.name)}</div>
      </td>
      <td><span class="cat-tag">${escHtml(r.cat)}</span></td>
      <td style="white-space:nowrap;font-size:13px;color:var(--text-secondary)">${escHtml(r.owner || '—')}</td>
      <td style="font-size:13px;color:var(--text-secondary)">${escHtml(r.vendor || '—')}</td>
      <td style="white-space:nowrap;font-size:13px">${formatDate(r.expiry)}</td>
      <td>${badgeHTML(r.status)}</td>
      <td>${daysCellHTML(r.days, r.status)}</td>
      <td>
        <div class="action-btns">
          <button class="icon-btn edit" title="Edit" onclick="location.href='/pages/add.html?id=${r.id}'">
            <i class="ti ti-edit"></i>
          </button>
          <button class="icon-btn danger" title="Delete" onclick="openDeleteModal('${r.id}')">
            <i class="ti ti-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function escHtml(str) {
  return String(str || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function showTableSkeleton() {
  const tbody = document.getElementById('recordsTable');
  if (tbody) tbody.innerHTML = skeletonRows(6, 8);
}

function showTableError(msg) {
  const tbody = document.getElementById('recordsTable');
  if (tbody) tbody.innerHTML = `<tr><td colspan="8">
    <div class="empty-state">
      <i class="ti ti-cloud-off"></i>
      <h3>Could not load records</h3>
      <p>${escHtml(msg)}</p>
    </div>
  </td></tr>`;
}

// ── Delete modal ──────────────────────────────────────────────
function openDeleteModal(id) {
  deleteTargetId = id;
  document.getElementById('deleteModal').style.display = 'flex';
}
function closeDeleteModal() {
  deleteTargetId = null;
  document.getElementById('deleteModal').style.display = 'none';
}
async function confirmDelete() {
  if (!deleteTargetId) return;
  const btn = document.getElementById('confirmDeleteBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Deleting…';
  try {
    await API.deleteRecord(deleteTargetId);
    closeDeleteModal();
    showToast('Record deleted successfully', 'success');
    await init();
  } catch (err) {
    showToast('Delete failed: ' + err.message, 'error');
    btn.disabled = false;
    btn.innerHTML = '<i class="ti ti-trash"></i> Yes, Delete';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('deleteModal');
  if (modal) modal.addEventListener('click', e => { if (e.target === modal) closeDeleteModal(); });
  init();
});
