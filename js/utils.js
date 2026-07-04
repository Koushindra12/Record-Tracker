// ============================================================
// utils.js — Shared utility functions
// ============================================================

// ── Top Progress Bar ──────────────────────────────────────
let _progressTimer = null;
let _progressWidth = 0;

function startProgress() {
  const bar = document.getElementById('progressBar');
  if (!bar) return;
  clearTimeout(_progressTimer);
  _progressWidth = 0;
  bar.style.transition = 'none';
  bar.style.width = '0%';
  bar.style.opacity = '1';
  requestAnimationFrame(() => {
    bar.style.transition = 'width 0.4s ease';
    bar.style.width = '70%';
  });
}

function endProgress() {
  const bar = document.getElementById('progressBar');
  if (!bar) return;
  bar.style.transition = 'width 0.25s ease';
  bar.style.width = '100%';
  _progressTimer = setTimeout(() => {
    bar.style.opacity = '0';
    setTimeout(() => { bar.style.width = '0%'; }, 300);
  }, 280);
}

// ── Date helpers ─────────────────────────────────────────────
function daysFromToday(dateStr) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const expiry = new Date(dateStr); expiry.setHours(0, 0, 0, 0);
  return Math.round((expiry - today) / (1000 * 60 * 60 * 24));
}

function getStatus(days) {
  if (days < 0)   return 'expired';
  if (days <= 7)  return 'critical';
  if (days <= 30) return 'warning';
  return 'active';
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function daysLabel(days) {
  if (days == null) return '—';
  if (days < 0)  return `${Math.abs(days)}d overdue`;
  if (days === 0) return 'Expires today!';
  return `${days}d left`;
}

function initials(name) {
  if (!name) return '??';
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

// ── HTML builders ─────────────────────────────────────────────
function badgeHTML(status) {
  const labels = { expired: 'Expired', critical: 'Critical', warning: 'Warning', active: 'Active' };
  return `<span class="badge badge-${status}"><span class="badge-dot"></span>${labels[status] || status}</span>`;
}

function daysCellHTML(days, status) {
  return `<span class="days-cell days-${status}">${daysLabel(days)}</span>`;
}

// ── Skeleton table rows ───────────────────────────────────────
function skeletonRows(count = 6, cols = 8) {
  const row = `<tr class="skeleton-row">${Array(cols).fill(
    `<td><span class="skeleton sk sk-md"></span></td>`
  ).join('')}</tr>`;
  return Array(count).fill(row).join('');
}

// ── Toast notification system ─────────────────────────────────
function showToast(message, type = 'success', duration = 3500) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  const icons = { success: 'ti-circle-check', error: 'ti-circle-x', warning: 'ti-alert-triangle', info: 'ti-info-circle' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<i class="ti ${icons[type] || icons.info}"></i><span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('hide');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
  }, duration);
}

// ── Sidebar (hamburger) logic ─────────────────────────────────
function initSidebar() {
  const hamburger = document.getElementById('hamburger');
  const sidebar   = document.querySelector('.sidebar');
  const overlay   = document.getElementById('sidebar-overlay');
  if (!hamburger || !sidebar) return;

  hamburger.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    overlay.classList.toggle('show');
  });
  overlay.addEventListener('click', () => {
    sidebar.classList.remove('open');
    overlay.classList.remove('show');
  });

  // Close sidebar when a nav item is clicked on mobile
  sidebar.querySelectorAll('.nav-item').forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth <= 768) {
        sidebar.classList.remove('open');
        overlay.classList.remove('show');
      }
    });
  });
}

// ── Dark mode toggle ──────────────────────────────────────────
function initTheme() {
  const saved = localStorage.getItem('rg_theme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);
  return saved;
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('rg_theme', next);
  return next;
}

// ── Alert banner ──────────────────────────────────────────────
function renderAlertBanner(containerId, counts) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const urgent = (counts.expired || 0) + (counts.critical || 0);
  if (urgent > 0) {
    el.innerHTML = `<i class="ti ti-bell-ringing"></i>
      <span><strong>${urgent} record${urgent > 1 ? 's' : ''}</strong> need immediate attention —
      ${counts.expired} expired, ${counts.critical} expiring within 7 days.</span>`;
    el.style.display = 'flex';
  } else {
    el.innerHTML = '';
    el.style.display = 'none';
  }
}

// ── Animated counter ──────────────────────────────────────────
function animateCount(el, target, duration = 700) {
  const start = performance.now();
  const from  = parseInt(el.textContent, 10) || 0;
  function step(now) {
    const progress = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(from + (target - from) * ease);
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// ── Profile loader — updates sidebar name + avatar on every page ─────────────
function loadProfile() {
  try {
    const profile = JSON.parse(localStorage.getItem('rg_profile') || '{}');
    // Update sidebar name
    const nameEl = document.getElementById('userName');
    if (nameEl && profile.name) nameEl.textContent = profile.name;
    // Update sidebar avatar initials
    const avatarEl = document.getElementById('userAvatar');
    if (avatarEl && profile.name) avatarEl.textContent = initials(profile.name);
    // Update sidebar role
    const roleEl = document.getElementById('userRole');
    if (roleEl && profile.role) roleEl.textContent = profile.role;
  } catch(e) { /* ignore localStorage parse errors */ }
}

// ── On-page init ──────────────────────────────────────────────
// Apply theme immediately to prevent FOUC — done via inline script in HTML.
// This runs as a DOMContentLoaded fallback.
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initSidebar();
  loadProfile();
});
