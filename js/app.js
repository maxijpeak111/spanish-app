(function () {
'use strict';
const ES = window.ES, h = ES.h;
const svg = d => { const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('fill', 'none'); s.setAttribute('stroke', 'currentColor'); s.setAttribute('stroke-width', '2'); s.setAttribute('stroke-linecap', 'round'); s.setAttribute('stroke-linejoin', 'round'); s.innerHTML = d; return s; };
const TABS = [
  ['today', 'Hoy', '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'],
  ['path', 'Path', '<path d="M4 19c4 0 4-6 8-6s4-6 8-6"/><circle cx="4" cy="19" r="2"/><circle cx="20" cy="7" r="2"/>'],
  ['library', 'Library', '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/>'],
  ['practise', 'Practise', '<rect x="3" y="5" width="13" height="16" rx="2"/><path d="M8 3h11a2 2 0 0 1 2 2v13"/>']
];
const TAB_OF = { today: 'today', path: 'path', week: 'path', library: 'library', folder: 'library', s: 'library', rule: 'library', practise: 'practise' };
let last = '';
ES.render = function () {
  const [view, arg] = (location.hash || '#today').slice(1).split('/');
  const name = ES.views[view] ? view : 'today';
  const app = document.getElementById('app');
  const y = window.scrollY;
  if (name !== 'run') document.body.classList.remove('running');
  ES.views[name](app, arg ? decodeURIComponent(arg) : undefined);
  const tab = TAB_OF[name];
  const badge = id => id === 'today' ? ES.dueIds().length + ES.newIds(ES.newLeft()).length : id === 'library' ? ES.inbox().length : 0;
  ES.fill(document.getElementById('nav'), name === 'run' ? null : TABS.map(([id, label, icon]) => {
    const n = badge(id);
    return h('a', { href: '#' + id, class: id === tab ? 'on' : '' }, svg(icon), label, n ? h('i', {}, n > 99 ? '99+' : n) : null);
  }));
  const fab = document.getElementById('fab');
  if (fab) fab.style.display = name === 'run' ? 'none' : '';
  if (location.hash === last) window.scrollTo(0, y);
  last = location.hash;
};
window.addEventListener('hashchange', () => { if (!location.hash.startsWith('#run')) ES.closeAll(); ES.render(); window.scrollTo(0, 0); });
let day = ES.today();
document.addEventListener('visibilitychange', () => { if (!document.hidden && ES.today() !== day) { day = ES.today(); ES.render(); } });
document.body.append(h('button', { id: 'fab', class: 'fab', onclick: () => ES.quickAdd(), 'aria-label': 'Add Spanish' }, '+'));
ES.render();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
})();
