export const fmt = (n) => {
  if (n === null || n === undefined) return '0';
  return n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e3 ? (n / 1e3).toFixed(1) + 'K' : '' + n;
};

export const ago = (t) => {
  if (!t) return 'just now';
  const date = new Date(t);
  const diff = (new Date() - date) / 60000;
  const m = Math.floor(diff);
  return m < 1 ? 'just now' : m < 60 ? m + 'm ago' : m < 1440 ? Math.floor(m / 60) + 'h ago' : Math.floor(m / 1440) + 'd ago';
};

export const ini = (n) => n ? n[0].toUpperCase() : '?';

export const esc = (s) => {
  if (s == null) return '';
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
};

export const tier = (peks) => {
  const tiers = [
    { lv: 1, name: 'Newcomer', min: 0, max: 499, color: '#6B7280' },
    { lv: 2, name: 'Chatter', min: 500, max: 1999, color: '#3B82F6' },
    { lv: 3, name: 'Active', min: 2000, max: 7999, color: '#10B981' },
    { lv: 4, name: 'Advisor', min: 8000, max: 24999, color: '#0D9488' },
    { lv: 5, name: 'Steward', min: 25000, max: 74999, color: '#7C3AED' },
    { lv: 6, name: 'Scholar', min: 75000, max: 199999, color: '#E8531F' },
    { lv: 7, name: 'Legend', min: 200000, max: Infinity, color: '#F5A623' }
  ];
  return tiers.find(t => peks >= t.min && peks <= t.max) || tiers[0];
};

export const circ = (circles, id) => {
  return circles?.find(c => c.id === id) || { name: id, icon: '🏘️' };
};