(function () {
  const D = window.DATA;
  const root = document.getElementById('root');
  const tip = document.getElementById('tooltip');

  // ---------- утилиты ----------
  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const num = (v, d = 1) => Number(v).toLocaleString('ru-RU', { maximumFractionDigits: d });
  const pct = (v) => Math.round(v * 100) + '%';
  const date = (d) => (d ? d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—');
  const dateShort = (d) => d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  const daysBetween = (a, b) => Math.round((b - a) / 86400000);
  const initials = (n) => n.split(' ').map((w) => w[0]).slice(0, 2).join('');
  const plural = (n, one, few, many) => {
    const m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return one;
    if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few;
    return many;
  };

  const STATUS = {
    done: { name: 'Завершено', color: 'var(--st-done)', hex: '#1E9E6A' },
    work: { name: 'В работе', color: 'var(--st-work)', hex: '#F29A0B' },
    late: { name: 'Отставание', color: 'var(--st-late)', hex: '#E5484D' },
    none: { name: 'Не начато', color: 'var(--st-none)', hex: '#c3c9d5' },
  };

  const I = {
    map: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z"/><path d="M9 4v14M15 6v14"/></svg>',
    list: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>',
    users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>',
    left: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>',
    right: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>',
    back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>',
    doc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/></svg>',
    flask: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3h6M10 3v6L4 20h16L14 9V3"/></svg>',
    alert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M12 7v6M12 17h.01"/></svg>',
    logout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>',
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>',
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z"/></svg>',
  };

  // ---------- сессия ----------
  const store = {
    get(k) { try { return JSON.parse(sessionStorage.getItem(k)); } catch { return null; } },
    set(k, v) { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch {} },
    del(k) { try { sessionStorage.removeItem(k); } catch {} },
  };

  const ROLES = [
    { id: 'customer', name: 'Заказчик', desc: 'Просмотр всего объекта' },
    { id: 'supervision', name: 'Технадзор', desc: 'Замечания и предписания' },
    { id: 'contractor', name: 'Подрядчик', desc: 'Свой участок трассы' },
    { id: 'geodesy', name: 'Геодезия', desc: 'Съёмки и акты' },
  ];

  const state = {
    user: store.get('ws_user'),
    view: 'overview',
    pk: null,
    filter: 'all',
    contractor: 'all',
    layer: null,
  };

  // ---------- маршрутизация ----------
  function readHash() {
    const h = location.hash.replace(/^#\/?/, '');
    const [view, pkPart] = h.split('/');
    state.view = ['overview', 'pickets', 'contractors'].includes(view) ? view : 'overview';
    const m = /^pk-(\d+)$/.exec(pkPart || '');
    state.pk = m && D.pickets[+m[1]] ? +m[1] : null;
  }
  function go(view, pk = null) {
    const h = '#/' + view + (pk !== null ? '/pk-' + pk : '');
    if (location.hash !== h) location.hash = h;
    else render();
  }
  window.addEventListener('hashchange', () => { readHash(); render(); });

  // ================= ВХОД =================
  function contours(w, h, n, stroke) {
    let out = '';
    for (let k = 0; k < n; k++) {
      const y = (h / n) * k + 20;
      const a = 18 + (k % 4) * 9;
      out += `<path d="M -20 ${y} C ${w * 0.2} ${y - a}, ${w * 0.35} ${y + a * 1.6}, ${w * 0.55} ${y + a * 0.3} S ${w * 0.85} ${y - a * 1.4}, ${w + 20} ${y + a * 0.5}" fill="none" stroke="${stroke}" stroke-width="1.2"/>`;
    }
    return out;
  }

  function renderLogin() {
    let role = 'customer';
    root.innerHTML = `
      <div class="login">
        <section class="login-brand">
          <svg class="contours" viewBox="0 0 800 900" preserveAspectRatio="none" aria-hidden="true">${contours(800, 900, 22, '#fff')}</svg>
          <div class="brand"><img src="assets/logo.png" alt="">WESTSURVEY</div>
          <div>
            <h1>Контроль строительства автодороги</h1>
            <p>Ход работ по каждому пикету: конструкция и объёмы, подрядчики, техника, геодезические съёмки и лабораторные испытания. ${esc(D.project.region)}.</p>
          </div>
          <div class="login-stats">
            <div><b>${D.project.length} км</b><span>протяжённость трассы</span></div>
            <div><b>${D.N}</b><span>пикетов под контролем</span></div>
            <div><b>${D.CONTRACTORS.length}</b><span>подрядные организации</span></div>
          </div>
        </section>
        <section class="login-form-wrap">
          <form class="login-form" novalidate>
            <h2>Вход в платформу</h2>
            <p class="sub">Используйте учётную запись, выданную администратором проекта.</p>
            <label class="field"><span>Электронная почта</span><input name="email" type="email" autocomplete="username" placeholder="name@company.kz" value="demo@westsurvey.kz"></label>
            <label class="field"><span>Пароль</span><input name="password" type="password" autocomplete="current-password" placeholder="••••••••" value="demo-access"></label>
            <span class="field"><span>Роль</span></span>
            <div class="roles" role="group" aria-label="Роль">
              ${ROLES.map((r) => `<button type="button" class="role" data-role="${r.id}" aria-pressed="${r.id === role}">${r.name}<small>${r.desc}</small></button>`).join('')}
            </div>
            <div class="err" aria-live="polite"></div>
            <button class="btn" type="submit">Войти</button>
            <p class="proto-note">Прототип: вход проверяется только в браузере. В рабочей версии будет серверная авторизация и права по ролям.</p>
          </form>
        </section>
      </div>`;
    const form = $('.login-form');
    $$('.role', form).forEach((b) => b.addEventListener('click', () => {
      role = b.dataset.role;
      $$('.role', form).forEach((x) => x.setAttribute('aria-pressed', x === b));
    }));
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = form.email.value.trim();
      const pass = form.password.value;
      const err = $('.err', form);
      if (!/^\S+@\S+\.\S+$/.test(email)) { err.textContent = 'Введите корректный адрес почты'; return; }
      if (pass.length < 4) { err.textContent = 'Введите пароль'; return; }
      const r = ROLES.find((x) => x.id === role);
      const name = email.startsWith('demo@') ? 'Демо пользователь' : email.split('@')[0];
      state.user = { email, name, role: r.id, roleName: r.name };
      store.set('ws_user', state.user);
      render();
    });
  }

  // ================= ПРИЛОЖЕНИЕ =================
  function renderApp() {
    const u = state.user;
    root.innerHTML = `
      <div class="mobile-bar">
        <button class="icon-btn" id="menuBtn" aria-label="Меню">${I.menu}</button>
        <div class="brand"><img src="assets/logo.png" alt="">WESTSURVEY</div>
      </div>
      <div class="app">
        <aside class="sidebar" id="sidebar">
          <div class="brand"><img src="assets/logo.png" alt="">WESTSURVEY</div>
          <div>
            <nav class="nav">
              <button data-view="overview" ${state.view === 'overview' ? 'aria-current="page"' : ''}>${I.map}Схема трассы</button>
              <button data-view="pickets" ${state.view === 'pickets' ? 'aria-current="page"' : ''}>${I.list}Пикеты</button>
              <button data-view="contractors" ${state.view === 'contractors' ? 'aria-current="page"' : ''}>${I.users}Подрядчики</button>
            </nav>
          </div>
          <div class="side-project">
            <b>${esc(D.project.name)}</b>
            ${esc(D.project.region)}, ПК 0 – ПК ${D.N}, ${D.project.length} км
          </div>
          <div class="user">
            <div class="avatar">${esc(initials(u.name).toUpperCase())}</div>
            <div class="meta"><b>${esc(u.name)}</b><span>${esc(u.roleName)}</span></div>
            <button class="icon-btn" id="logout" aria-label="Выйти" title="Выйти">${I.logout}</button>
          </div>
        </aside>
        <main class="main" id="main"></main>
      </div>`;
    $$('.nav button').forEach((b) => b.addEventListener('click', () => go(b.dataset.view)));
    $('#logout').addEventListener('click', () => { store.del('ws_user'); state.user = null; go('overview'); render(); });
    $('#menuBtn').addEventListener('click', () => $('#sidebar').classList.toggle('open'));

    const main = $('#main');
    if (state.view === 'overview') renderOverview(main);
    if (state.view === 'pickets') renderPicketsView(main);
    if (state.view === 'contractors') renderContractors(main);

    if (state.pk !== null) openPicket(state.pk);
  }

  function topbar(title, crumbs) {
    return `
      <div class="topbar">
        <div><div class="crumbs">${crumbs}</div><h1>${title}</h1></div>
        <div class="spacer"></div>
        <form class="search" id="pkSearch" role="search">
          ${I.search}<input inputmode="numeric" placeholder="Перейти к пикету, например 100" aria-label="Номер пикета">
        </form>
      </div>`;
  }
  function bindSearch() {
    const f = $('#pkSearch');
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      const n = parseInt(f.querySelector('input').value.replace(/\D/g, ''), 10);
      if (!isNaN(n) && D.pickets[n]) go(state.view, n);
      else f.querySelector('input').value = '';
    });
  }

  // ---------- сводка ----------
  function totals(list = D.pickets) {
    const t = { done: 0, work: 0, late: 0, none: 0, prog: 0, mach: 0, workers: 0, vol: 0, volDesign: 0 };
    list.forEach((p) => {
      t[p.status]++;
      t.prog += p.progress;
      t.mach += p.machinery.length;
      t.workers += p.workers;
      t.vol += p.doneVolume;
      t.volDesign += p.designVolume;
    });
    t.prog /= list.length || 1;
    return t;
  }

  function renderOverview(main) {
    const t = totals();
    main.innerHTML = `
      ${topbar('Схема трассы', `${esc(D.project.region)} · обновлено ${date(D.TODAY)}`)}
      <div class="kpis">
        <div class="kpi accent"><span>Общая готовность</span><b class="num">${pct(t.prog)}</b><div class="bar"><i style="width:${pct(t.prog)}"></i></div></div>
        <div class="kpi"><span>Завершено</span><b class="num">${t.done}</b><small>из ${D.N} пикетов</small></div>
        <div class="kpi"><span>В работе</span><b class="num">${t.work + t.late}</b><small>${t.late} с отставанием</small></div>
        <div class="kpi"><span>Объём земляных работ</span><b class="num">${num(t.vol / 1000, 0)}<small> тыс. м³</small></b><small>из ${num(t.volDesign / 1000, 0)} тыс. м³ по проекту</small></div>
        <div class="kpi"><span>Техника на объекте</span><b class="num">${t.mach}</b><small>единиц сегодня</small></div>
        <div class="kpi"><span>Рабочие</span><b class="num">${t.workers}</b><small>человек на смене</small></div>
      </div>
      <div class="grid-2">
        <section class="card">
          <div class="card-head">
            <h2>Трасса ПК 0 – ПК ${D.N}</h2>
            <div class="spacer"></div>
            ${filterControls()}
          </div>
          <div class="map-wrap" id="mapWrap"></div>
        </section>
        <section class="card">
          <div class="card-head">
            <h2>Линейный график: готовность слоёв по пикетам</h2>
            <div class="spacer"></div>
            <div class="scale-legend">0% <i></i> 100%</div>
          </div>
          <div class="ribbon-scroll" id="ribbon"></div>
        </section>
      </div>`;
    bindSearch();
    bindFilters(() => { drawMap(); drawRibbon(); });
    drawMap();
    drawRibbon();
  }

  function filterControls() {
    const opts = [['all', 'Все', null], ['done', 'Завершено', 'done'], ['work', 'В работе', 'work'], ['late', 'Отставание', 'late'], ['none', 'Не начато', 'none']];
    return `
      <div class="seg" role="group" aria-label="Статус">
        ${opts.map(([id, name, st]) => `<button data-filter="${id}" aria-pressed="${state.filter === id}">${st ? `<span class="dot" style="background:${STATUS[st].color}"></span>` : ''}${name}</button>`).join('')}
      </div>
      <select class="select" id="contrSel" aria-label="Подрядчик">
        <option value="all">Все подрядчики</option>
        ${D.CONTRACTORS.map((c) => `<option value="${c.id}" ${state.contractor === c.id ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}
      </select>`;
  }
  function bindFilters(redraw) {
    $$('[data-filter]').forEach((b) => b.addEventListener('click', () => {
      state.filter = b.dataset.filter;
      $$('[data-filter]').forEach((x) => x.setAttribute('aria-pressed', x === b));
      redraw();
    }));
    $('#contrSel').addEventListener('change', (e) => { state.contractor = e.target.value; redraw(); });
  }
  const matches = (p) =>
    (state.filter === 'all' || p.status === state.filter) && (state.contractor === 'all' || p.contractor.id === state.contractor);

  // ---------- схема дороги (вместо Mapbox в прототипе) ----------
  const ROAD_D = 'M 70 470 C 190 480, 250 400, 360 385 S 540 420, 640 330 S 760 170, 900 190 S 1060 150, 1130 70';
  let roadPts = null;
  function roadPoints() {
    if (roadPts) return roadPts;
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.style.cssText = 'position:absolute;width:0;height:0;visibility:hidden';
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', ROAD_D);
    svg.appendChild(path);
    document.body.appendChild(svg);
    const L = path.getTotalLength();
    const pts = [];
    const steps = D.N * 4;
    for (let k = 0; k <= steps; k++) {
      const q = path.getPointAtLength((L * k) / steps);
      pts.push([+q.x.toFixed(1), +q.y.toFixed(1)]);
    }
    svg.remove();
    return (roadPts = pts);
  }

  function drawMap() {
    const wrap = $('#mapWrap');
    if (!wrap) return;
    const pts = roadPoints();
    const seg = (i) => pts.slice(i * 4, i * 4 + 5).map((p) => p.join(',')).join(' ');
    const at = (i) => pts[Math.min(i * 4, pts.length - 1)];

    const segs = D.pickets.map((p) => {
      const on = matches(p);
      return `<polyline points="${seg(p.i)}" stroke="${STATUS[p.status].hex}" stroke-width="9" fill="none" stroke-linecap="butt" class="${on ? '' : 'dim'}"/>`;
    }).join('');
    const hits = D.pickets.map((p) => `<polyline class="pk-hit" data-pk="${p.i}" points="${seg(p.i)}" stroke="transparent" stroke-width="26" fill="none"/>`).join('');

    const ticks = [];
    for (let i = 0; i <= D.N; i += 10) {
      const [x, y] = at(i);
      const major = i % 50 === 0;
      ticks.push(`<g transform="translate(${x},${y})"><circle r="${major ? 6 : 4}" fill="#fff" stroke="#16181d" stroke-width="2"/>${
        major || i % 20 === 0 ? `<text y="-14" text-anchor="middle" font-size="12" font-weight="700" fill="#16181d" paint-order="stroke" stroke="#eef1e8" stroke-width="4">ПК ${i}</text>` : ''}</g>`);
    }
    const bounds = D.CONTRACTORS.map((c) => {
      const [x, y] = at(Math.round((c.from + c.to) / 2));
      return `<g transform="translate(${x},${y + 30})" class="${state.contractor === 'all' || state.contractor === c.id ? '' : 'dim'}">
        <rect x="-78" y="-13" width="156" height="26" rx="13" fill="#fff" stroke="${c.color}" stroke-width="2"/>
        <text text-anchor="middle" y="4.5" font-size="12" font-weight="700" fill="#16181d">${esc(c.short)}</text></g>`;
    }).join('');
    const dividers = D.CONTRACTORS.slice(1).map((c) => {
      const [x, y] = at(c.from);
      return `<line x1="${x}" y1="${y - 22}" x2="${x}" y2="${y + 22}" stroke="#16181d" stroke-width="2" stroke-dasharray="3 3"/>`;
    }).join('');

    wrap.innerHTML = `
      <svg viewBox="0 0 1200 560" role="img" aria-label="Схема трассы с пикетами">
        <defs>
          <pattern id="grass" width="22" height="22" patternUnits="userSpaceOnUse"><path d="M3 18l2-5M10 20l1-6M16 17l2-4" stroke="#d3d9c2" stroke-width="1.2"/></pattern>
        </defs>
        <rect width="1200" height="560" fill="#eef1e8"/>
        <rect width="1200" height="560" fill="url(#grass)"/>
        <g opacity=".55">${contours(1200, 560, 14, '#cfd6bd')}</g>
        <path d="M 0 120 C 160 150, 260 90, 420 140 S 600 250, 520 360 S 520 520, 640 570" fill="none" stroke="#a9cbe8" stroke-width="7" stroke-linecap="round"/>
        <text x="300" y="112" font-size="11" fill="#5e86ab" font-style="italic">р. Илек (условно)</text>
        <g transform="translate(980,410)"><rect x="-34" y="-22" width="68" height="44" rx="8" fill="#e3d7bf" stroke="#b9a37a"/><text text-anchor="middle" y="4" font-size="11" font-weight="700" fill="#7d6640">Карьер №1</text></g>
        <g transform="translate(250,250)"><rect x="-26" y="-18" width="52" height="36" rx="6" fill="#dde3ee" stroke="#9aa6bd"/><text text-anchor="middle" y="4" font-size="11" font-weight="700" fill="#4a5875">АБЗ</text></g>
        <path d="${ROAD_D}" stroke="#fff" stroke-width="17" fill="none" stroke-linecap="round"/>
        <path d="${ROAD_D}" stroke="#9aa1ad" stroke-width="13" fill="none" stroke-linecap="round"/>
        ${segs}
        ${dividers}
        ${ticks.join('')}
        ${bounds}
        <g transform="translate(70,470)"><text x="0" y="34" text-anchor="middle" font-size="12" font-weight="700" fill="#0B41C7">Начало трассы</text></g>
        <g transform="translate(1130,70)"><text x="0" y="-16" text-anchor="end" font-size="12" font-weight="700" fill="#0B41C7">Конец трассы</text></g>
        <g transform="translate(1150,500)"><path d="M0 -26 L8 0 L0 -6 L-8 0Z" fill="#16181d"/><text y="16" text-anchor="middle" font-size="12" font-weight="700">С</text></g>
        <g transform="translate(40,530)"><rect width="80" height="5" fill="#16181d"/><rect width="40" height="5" fill="#fff" stroke="#16181d"/><text y="-6" font-size="11" fill="#16181d">0</text><text x="80" y="-6" font-size="11" text-anchor="end" fill="#16181d">1 км</text></g>
        ${hits}
      </svg>
      <div class="map-note">Схема для прототипа. В рабочей версии здесь будет карта Mapbox: спутник, рельеф и трасса из KML.</div>
      <div class="map-legend">
        ${Object.entries(STATUS).map(([, s]) => `<div><span class="dot" style="background:${s.color}"></span>${s.name}</div>`).join('')}
      </div>`;

    $$('.pk-hit', wrap).forEach((el) => {
      const p = D.pickets[+el.dataset.pk];
      el.addEventListener('mousemove', (e) => showTip(e, p));
      el.addEventListener('mouseleave', hideTip);
      el.addEventListener('click', () => { hideTip(); go(state.view, p.i); });
    });
  }

  function showTip(e, p) {
    tip.hidden = false;
    tip.innerHTML = `<b>${p.label}</b><span>${esc(p.contractor.short)} · ${STATUS[p.status].name} · ${pct(p.progress)}</span>`;
    tip.style.left = e.clientX + 'px';
    tip.style.top = e.clientY + 'px';
  }
  function hideTip() { tip.hidden = true; }

  // ---------- линейный график ----------
  function drawRibbon() {
    const el = $('#ribbon');
    if (!el) return;
    const rows = [...D.LAYERS].reverse();
    const rh = 22, W = 1000, cw = W / D.N;
    let cells = '';
    rows.forEach((L, r) => {
      D.pickets.forEach((p) => {
        const f = p.layers.find((x) => x.id === L.id).frac;
        const on = matches(p);
        const fill = f <= 0 ? '#e9ecf3' : mix('#bcd0f7', '#0B41C7', f);
        cells += `<rect class="cell" x="${p.i * cw}" y="${r * rh + 1}" width="${cw + 0.2}" height="${rh - 2}" fill="${fill}" opacity="${on ? 1 : 0.2}"/>`;
      });
    });
    const late = D.pickets.filter((p) => p.status === 'late').map((p) => `<rect x="${p.i * cw}" y="${rows.length * rh + 2}" width="${cw}" height="5" fill="#F95D51" opacity="${matches(p) ? 1 : .2}"/>`).join('');
    let axis = '';
    for (let i = 0; i <= D.N; i += 10) {
      axis += `<line x1="${i * cw}" x2="${i * cw}" y1="0" y2="${rows.length * rh}" stroke="#fff" stroke-width="${i % 50 ? 0.6 : 1.6}"/>`;
    }
    const hits = D.pickets.map((p) => `<rect class="col-hit" data-pk="${p.i}" x="${p.i * cw}" y="0" width="${cw}" height="${rows.length * rh + 8}"/>`).join('');
    const H = rows.length * rh + 10;
    const labels = [];
    for (let i = 0; i <= D.N; i += 20) labels.push(`<span style="position:absolute;left:${(i / D.N) * 100}%;transform:translateX(${i === 0 ? '0' : i === D.N ? '-100%' : '-50%'})">ПК ${i}</span>`);
    el.innerHTML = `
      <div class="ribbon">
        <div class="labels">${rows.map((L) => `<div>${esc(L.short)}</div>`).join('')}<div style="height:10px;color:var(--red);font-size:11px">отставание</div></div>
        <div>
          <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" style="height:${H}px">${cells}${axis}${late}${hits}</svg>
          <div style="position:relative;height:20px;font-size:11.5px;color:var(--muted);font-weight:600;margin-top:4px">${labels.join('')}</div>
        </div>
      </div>`;
    $$('.col-hit', el).forEach((r) => {
      const p = D.pickets[+r.dataset.pk];
      r.addEventListener('mousemove', (e) => showTip(e, p));
      r.addEventListener('mouseleave', hideTip);
      r.addEventListener('click', () => { hideTip(); go(state.view, p.i); });
    });
  }
  function mix(a, b, t) {
    const pa = a.match(/\w\w/g).map((h) => parseInt(h, 16));
    const pb = b.match(/\w\w/g).map((h) => parseInt(h, 16));
    return '#' + pa.map((v, k) => Math.round(v + (pb[k] - v) * t).toString(16).padStart(2, '0')).join('');
  }

  // ---------- список пикетов ----------
  function renderPicketsView(main) {
    main.innerHTML = `
      ${topbar('Пикеты', `${D.N} пикетов · шаг 100 м`)}
      <section class="card">
        <div class="card-head"><div class="spacer"></div>${filterControls()}</div>
        <div class="table-wrap" id="tbl"></div>
      </section>`;
    bindSearch();
    const draw = () => {
      const rows = D.pickets.filter(matches);
      $('#tbl').innerHTML = rows.length ? `
        <table class="list">
          <thead><tr><th>Пикет</th><th>Км</th><th>Подрядчик</th><th>Статус</th><th>Готовность</th><th>Текущий этап</th><th>Выполнено</th><th>След. съёмка</th></tr></thead>
          <tbody>${rows.map((p) => `
            <tr data-pk="${p.i}" tabindex="0">
              <td><b>${p.label}</b></td>
              <td class="num">${num(p.km)}</td>
              <td>${esc(p.contractor.short)}</td>
              <td><span class="pill ${p.status}">${STATUS[p.status].name}</span></td>
              <td class="num"><span class="mini-bar"><i style="width:${pct(p.progress)}"></i></span>${pct(p.progress)}</td>
              <td>${p.current === -1 ? 'Все этапы выполнены' : esc(p.stages[p.current].name)}</td>
              <td class="num">${num(p.doneVolume, 0)} м³</td>
              <td class="num">${date(p.nextSurvey)}</td>
            </tr>`).join('')}</tbody>
        </table>` : '<p class="empty">Нет пикетов по выбранным условиям.</p>';
      $$('tbody tr').forEach((tr) => {
        const open = () => go(state.view, +tr.dataset.pk);
        tr.addEventListener('click', open);
        tr.addEventListener('keydown', (e) => { if (e.key === 'Enter') open(); });
      });
    };
    bindFilters(draw);
    draw();
  }

  // ---------- подрядчики ----------
  function renderContractors(main) {
    main.innerHTML = `
      ${topbar('Подрядчики', `${D.CONTRACTORS.length} подрядные организации`)}
      <div class="contractors">${D.CONTRACTORS.map((c) => {
        const list = D.pickets.filter((p) => p.contractor.id === c.id);
        const t = totals(list);
        return `
          <section class="card contractor-card">
            <h3>${esc(c.name)}</h3>
            <div class="muted">Участок ПК ${c.from} – ПК ${c.to} · ${num((c.to - c.from) / 10)} км</div>
            <div class="seg-line"><i style="left:${(c.from / D.N) * 100}%;width:${((c.to - c.from) / D.N) * 100}%;background:${c.color}"></i></div>
            <div class="stat-row">
              <div><b class="num">${pct(t.prog)}</b><span>готовность</span></div>
              <div><b class="num">${t.mach}</b><span>ед. техники</span></div>
              <div><b class="num">${t.workers}</b><span>рабочих</span></div>
            </div>
            <div class="chips" style="margin-bottom:14px">
              <span class="pill done">${t.done} завершено</span>
              <span class="pill work">${t.work} в работе</span>
              ${t.late ? `<span class="pill late">${t.late} отставание</span>` : ''}
            </div>
            <div class="people" style="grid-template-columns:1fr">${c.team.map(personHTML).join('')}</div>
            <div style="margin-top:14px;display:flex;gap:8px;flex-wrap:wrap">
              <button class="btn sm" data-contract="${c.id}">${I.doc}Договор</button>
              <button class="btn sm ghost" data-goto="${c.id}">Пикеты участка</button>
            </div>
          </section>`;
      }).join('')}</div>`;
    bindSearch();
    $$('[data-contract]').forEach((b) => b.addEventListener('click', () => openContract(D.CONTRACTORS.find((c) => c.id === b.dataset.contract))));
    $$('[data-goto]').forEach((b) => b.addEventListener('click', () => { state.contractor = b.dataset.goto; state.filter = 'all'; go('pickets'); }));
  }

  function personHTML(p) {
    return `<div class="person"><div class="avatar">${esc(initials(p.name))}</div><div class="meta"><b>${esc(p.name)}</b><span>${esc(p.role)}</span><a href="tel:${p.phone.replace(/\s/g, '')}">${esc(p.phone)}</a></div></div>`;
  }

  // ================= ОКНО ПИКЕТА =================
  let modalKeyHandler = null;

  function openPicket(i) {
    closeModal(true);
    const p = D.pickets[i];
    state.layer = state.layer && p.layers.some((L) => L.id === state.layer) ? state.layer : (p.layers.slice().reverse().find((L) => L.frac > 0 && L.frac < 1) || p.layers.slice().reverse().find((L) => L.frac >= 1) || p.layers[0]).id;

    const m = document.createElement('div');
    m.className = 'pk-modal';
    m.setAttribute('role', 'dialog');
    m.setAttribute('aria-modal', 'true');
    m.setAttribute('aria-label', p.label);
    m.innerHTML = `
      <header class="pk-head">
        <button class="btn ghost sm" data-close>${I.back}<span>К трассе</span></button>
        <div class="title"><small>${esc(p.contractor.name)}</small><b>ПК ${p.i}+00 — ПК ${p.i + 1}+00</b></div>
        <span class="pill ${p.status}">${STATUS[p.status].name}</span>
        <div class="spacer"></div>
        <span class="kbd"><kbd>←</kbd> <kbd>→</kbd> соседний пикет · <kbd>Esc</kbd> закрыть</span>
        <button class="icon-btn" data-nav="-1" ${i === 0 ? 'disabled' : ''} aria-label="Предыдущий пикет">${I.left}</button>
        <button class="icon-btn" data-nav="1" ${i === D.N - 1 ? 'disabled' : ''} aria-label="Следующий пикет">${I.right}</button>
        <button class="icon-btn" data-close aria-label="Закрыть">${I.close}</button>
      </header>
      <div class="pk-body">
        <aside class="struct">${structHTML(p)}</aside>
        <div class="info">${infoHTML(p)}</div>
      </div>`;
    document.body.appendChild(m);
    document.body.style.overflow = 'hidden';

    $$('[data-close]', m).forEach((b) => b.addEventListener('click', () => go(state.view)));
    $$('[data-nav]', m).forEach((b) => b.addEventListener('click', () => go(state.view, i + +b.dataset.nav)));
    bindStruct(m, p);
    $('[data-contract]', m)?.addEventListener('click', () => openContract(p.contractor));
    $$('[data-photo]', m).forEach((b) => b.addEventListener('click', () => openPhoto(p, +b.dataset.photo)));
    $$('[data-doc]', m).forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); openDoc(p, a.dataset.doc); }));

    modalKeyHandler = (e) => {
      if ($('.drawer')) { if (e.key === 'Escape') closeDrawer(); return; }
      if (e.key === 'Escape') go(state.view);
      if (e.key === 'ArrowLeft' && i > 0) go(state.view, i - 1);
      if (e.key === 'ArrowRight' && i < D.N - 1) go(state.view, i + 1);
    };
    document.addEventListener('keydown', modalKeyHandler);
    $('[data-close]', m).focus({ preventScroll: true });
  }

  function closeModal(silent) {
    $('.pk-modal')?.remove();
    closeDrawer();
    document.body.style.overflow = '';
    if (modalKeyHandler) document.removeEventListener('keydown', modalKeyHandler);
    modalKeyHandler = null;
  }

  // ---------- левая колонка: шкала конструкции ----------
  function patternDefs() {
    return `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
      ${D.LAYERS.map((L) => {
        const c = L.color;
        const body = {
          hatch: `<rect width="12" height="12" fill="${c}"/><path d="M-3 3l6-6M0 12L12 0M9 15l6-6" stroke="#3b2a1a" stroke-opacity=".45" stroke-width="1.4"/>`,
          hatch2: `<rect width="12" height="12" fill="${c}"/><path d="M-3 9l6 6M0 0l12 12M9-3l6 6" stroke="#3b2a1a" stroke-opacity=".4" stroke-width="1.4"/>`,
          wave: `<rect width="16" height="10" fill="${c}"/><path d="M0 5 Q4 1 8 5 T16 5" fill="none" stroke="#5a3e22" stroke-opacity=".45" stroke-width="1.3"/>`,
          wave2: `<rect width="16" height="10" fill="${c}"/><path d="M0 5 Q4 1 8 5 T16 5" fill="none" stroke="#5a3e22" stroke-opacity=".35" stroke-width="1.1"/><circle cx="4" cy="8" r=".9" fill="#5a3e22" fill-opacity=".35"/>`,
          dots: `<rect width="14" height="14" fill="${c}"/><circle cx="3" cy="3" r="1.8" fill="#2c3340"/><circle cx="10" cy="6" r="1.4" fill="#2c3340"/><circle cx="5" cy="11" r="1.6" fill="#2c3340"/><circle cx="12" cy="12" r="1" fill="#e6e9ef"/>`,
          solid: `<rect width="10" height="10" fill="${c}"/>`,
          diag: `<rect width="10" height="10" fill="${c}"/><path d="M-2 2l4-4M0 10L10 0M8 12l4-4" stroke="#8d99b3" stroke-width="1.2"/>`,
        }[L.pattern];
        const size = { wave: '16 10', wave2: '16 10', dots: '14 14', solid: '10 10', diag: '10 10' }[L.pattern] || '12 12';
        const [w, h] = size.split(' ');
        return `<pattern id="pat-${L.id}" width="${w}" height="${h}" patternUnits="userSpaceOnUse">${body}</pattern>`;
      }).join('')}
      <pattern id="pat-ground" width="16" height="16" patternUnits="userSpaceOnUse"><rect width="16" height="16" fill="#e7dccb"/><path d="M0 16 L16 0" stroke="#9b8466" stroke-width="1.2"/><path d="M4 16 L4 12 M12 8 L12 4" stroke="#9b8466" stroke-width="1"/></pattern>
      <pattern id="pat-rest" width="8" height="8" patternUnits="userSpaceOnUse"><rect width="8" height="8" fill="#f4f5f8"/><path d="M-2 2l4-4M0 8L8 0M6 10l4-4" stroke="#d9dde6" stroke-width="1"/></pattern>
    </defs></svg>`;
  }

  function structHTML(p) {
    const top = [...p.layers].reverse();
    // откосы: полуширина растёт от 50 до 108 по высоте насыпи
    const W = 260, topHalf = 50, groundH = 30;
    const slope = 58 / top.reduce((s, L) => s + L.h, 0);
    let y = 0;
    const polys = top.map((L) => {
      const y0 = y, y1 = y + L.h;
      const h0 = topHalf + slope * y0, h1 = topHalf + slope * y1;
      const cx = W / 2;
      y = y1;
      return { L, y0, y1, xl: cx - h1, xr: cx + h1, ym: (y0 + y1) / 2, rx: cx + (h0 + h1) / 2,
        pts: `${cx - h0},${y0} ${cx + h0},${y0} ${cx + h1},${y1} ${cx - h1},${y1}` };
    });
    const H = y;
    const paveEnd = polys.filter((x) => x.L.group === 'pave').pop().y1;
    const done = p.layers.filter((L) => L.frac >= 1).length;

    const shapes = polys.map(({ L, pts, xl, xr, y0, y1, ym, rx }) => {
      const fx = xl + (xr - xl) * L.frac;
      return `
        <g class="xs-layer ${state.layer === L.id ? 'sel' : ''}" data-layer="${L.id}">
          <clipPath id="clip-${L.id}"><polygon points="${pts}"/></clipPath>
          <polygon points="${pts}" fill="url(#pat-rest)"/>
          <rect clip-path="url(#clip-${L.id})" x="${xl}" y="${y0}" width="${Math.max(0, fx - xl)}" height="${y1 - y0}" fill="url(#pat-${L.id})"/>
          ${L.frac > 0 && L.frac < 1 ? `<line clip-path="url(#clip-${L.id})" x1="${fx}" x2="${fx}" y1="${y0}" y2="${y1}" stroke="var(--work)" stroke-width="3"/>` : ''}
          <polygon class="xs-outline" points="${pts}" fill="none"/>
          <line x1="${rx + 4}" x2="${W}" y1="${ym}" y2="${ym}" class="xs-leader"/>
          <circle cx="${rx + 4}" cy="${ym}" r="2.2" class="xs-dot"/>
        </g>`;
    }).join('');

    return `
      ${patternDefs()}
      <section class="xs-panel">
        <div class="xs-head">
          <div>
            <h2>Поперечный профиль</h2>
            <p>${done} из ${p.layers.length} слоёв выполнено</p>
          </div>
          <div class="xs-pct num">${Math.round(p.progress * 100)}<span>%</span></div>
        </div>
        <div class="xs-body">
          <svg class="xs-svg" viewBox="0 0 ${W} ${H + groundH}" preserveAspectRatio="none" style="height:${H + groundH}px" role="img" aria-label="Поперечный профиль насыпи по слоям">
            <line x1="0" x2="${W}" y1="${paveEnd}" y2="${paveEnd}" class="xs-split"/>
            <text class="xs-group" transform="translate(12 ${paveEnd / 2}) rotate(-90)" text-anchor="middle">дорожная одежда</text>
            <text class="xs-group" transform="translate(12 ${(paveEnd + H) / 2}) rotate(-90)" text-anchor="middle">земляное полотно</text>
            ${shapes}
            <rect x="0" y="${H}" width="${W}" height="${groundH}" fill="url(#pat-ground)"/>
            <line x1="0" x2="${W}" y1="${H}" y2="${H}" stroke="var(--ink)" stroke-width="1.6"/>
          </svg>
          <div class="xs-labels">
            ${top.map((L) => `
              <button class="xs-label ${state.layer === L.id ? 'sel' : ''}" data-layer="${L.id}" style="height:${L.h}px">
                <span class="t"><b>${esc(L.short === 'Основание' ? 'Основание' : L.name.replace('Насыпь, слой', 'Слой'))}</b><span class="num">${num(L.done)} из ${num(L.design)} ${L.unit}</span></span>
                <span class="p num ${L.frac >= 1 ? 'full' : L.frac <= 0 ? 'zero' : 'part'}">${pct(L.frac)}</span>
              </button>`).join('')}
            <div class="xs-ground" style="height:${groundH}px">Естественный грунт</div>
          </div>
        </div>
        <div class="layer-detail" id="layerDetail">${layerDetailHTML(p)}</div>
      </section>`;
  }

  function layerDetailHTML(p) {
    const L = p.layers.find((x) => x.id === state.layer);
    const k = p.layers.indexOf(L);
    const ev = p.events.find((e) => e.text.startsWith(L.name));
    const lab = L.group === 'earth' && L.frac >= 1 ? p.events.find((e) => e.type === 'lab') : null;
    const statusTxt = L.frac >= 1 ? 'Выполнен' : L.frac > 0 ? 'В работе' : k > 0 && p.layers[k - 1].frac < 1 ? 'Ожидает нижний слой' : 'Не начат';
    return `
      <h4>${esc(L.name)}</h4>
      <dl class="kv">
        <dt>Статус</dt><dd>${statusTxt}</dd>
        <dt>Проектный объём</dt><dd class="num">${num(L.design)} ${L.unit}</dd>
        <dt>Выполнено</dt><dd class="num">${num(L.done)} ${L.unit} · ${pct(L.frac)}</dd>
        <dt>Остаток</dt><dd class="num">${num(L.design - L.done)} ${L.unit}</dd>
        ${ev ? `<dt>${L.frac >= 1 ? 'Дата завершения' : 'Обновлено'}</dt><dd>${date(ev.date)}</dd>` : ''}
        ${lab ? `<dt>Контроль качества</dt><dd>${esc(lab.text.replace('Лаборатория: ', ''))}</dd>` : ''}
      </dl>`;
  }

  function bindStruct(m, p) {
    $$('[data-layer]', m).forEach((b) => b.addEventListener('click', () => {
      state.layer = b.dataset.layer;
      $$('[data-layer]', m).forEach((x) => x.classList.toggle('sel', x.dataset.layer === state.layer));
      $('#layerDetail', m).innerHTML = layerDetailHTML(p);
    }));
  }

  // ---------- правая колонка: информация ----------
  function infoHTML(p) {
    const c = p.contractor;
    const daysToNext = daysBetween(D.TODAY, p.nextSurvey);
    const nextTxt = daysToNext < 0 ? `просрочена на ${-daysToNext} ${plural(-daysToNext, 'день', 'дня', 'дней')}` : daysToNext === 0 ? 'сегодня' : `через ${daysToNext} ${plural(daysToNext, 'день', 'дня', 'дней')}`;
    const cur = p.current === -1 ? null : p.stages[p.current];
    const doneStages = p.stages.filter((s) => s.done).length;
    const nowTitle = !p.started ? 'Работы не начаты' : cur ? cur.name : 'Работы завершены';
    const nowNote = !p.started
      ? `Плановое начало ${date(p.startDate)}`
      : cur ? `Этап ${p.current + 1} из ${p.stages.length}` : 'Все этапы приняты';
    const nowCls = !p.started ? 'none' : !cur ? 'done' : p.delayed ? 'late' : 'work';

    return `
      <section class="sheet">
        <div class="sheet-title">
          <div>
            <h1 class="chain">ПК ${p.i}<span>+00</span> — ПК ${p.i + 1}<span>+00</span></h1>
            <p>${num(p.i / 10)}–${num(p.km)} км трассы, участок ${esc(c.name)}</p>
          </div>
          <dl class="smr"><dt>${p.started ? 'Начало СМР' : 'Начало СМР по плану'}</dt><dd class="num">${date(p.startDate)}</dd></dl>
        </div>

        <div class="now ${nowCls}">
          <div class="now-main">
            <span class="now-label">Текущий статус</span>
            <strong>${esc(nowTitle)}</strong>
            <span class="now-note">${nowNote}</span>
          </div>
          <div class="now-side">
            <div class="segbar" aria-hidden="true">${p.stages.map((s, k) => `<i class="${s.done ? 'on' : k === p.current && p.started ? 'cur' : ''}"></i>`).join('')}</div>
            <span class="num">${doneStages} из ${p.stages.length} этапов</span>
            ${p.delayed ? '<span class="pill late">Отставание от графика</span>' : ''}
          </div>
        </div>

        <div class="sheet-row contractor-row">
          <div>
            <span class="cell-label">Подрядная организация</span>
            <h3>${esc(c.name)}</h3>
            <p>Задействован на ПК ${c.from} – ПК ${c.to}, ${num((c.to - c.from) / 10)} км</p>
          </div>
          <button class="btn" data-contract>${I.doc}Посмотреть договор</button>
        </div>
        <div class="sheet-row people">${c.team.map(personHTML).join('')}${D.SUPERVISION.map(personHTML).join('')}</div>

        <div class="cells c4">
          <div class="cell">
            <span class="cell-label">Техника на пикете</span>
            <b class="num">${p.machinery.length}</b>
            ${p.machinery.length ? `<div class="chips">${p.machinery.map((x) => `<span class="chip">${esc(x)}</span>`).join('')}</div>` : `<small>${p.progress >= 1 ? 'Работы завершены' : 'Техника не выставлена'}</small>`}
          </div>
          <div class="cell">
            <span class="cell-label">Рабочая сила</span>
            <b class="num">${p.workers}</b>
            <small>${p.workers ? plural(p.workers, 'человек', 'человека', 'человек') + ' на смене' : 'Нет людей на смене'}</small>
          </div>
          <div class="cell">
            <span class="cell-label">Последняя геодезическая съёмка</span>
            <b class="num">${date(p.lastSurvey)}</b>
            <small>${p.lastSurvey ? daysBetween(p.lastSurvey, D.TODAY) + ' дн. назад' : 'Съёмок ещё не было'}</small>
          </div>
          <div class="cell ${daysToNext < 0 ? 'warn' : ''}">
            <span class="cell-label">Следующая геодезическая съёмка</span>
            <b class="num">${date(p.nextSurvey)}</b>
            <small>${nextTxt}</small>
          </div>
        </div>

        <div class="cells c2">
          <div class="cell">
            <span class="cell-label">Объём выполненных работ, грунт и щебень</span>
            <b class="num">${num(p.doneVolume, 1)} м³</b>
            <small>из ${num(p.designVolume, 1)} м³ по проекту</small>
            <div class="bar"><i style="width:${pct(p.doneVolume / p.designVolume)}"></i></div>
          </div>
          <div class="cell">
            <span class="cell-label">Покрытие</span>
            ${['bitumen', 'recycler'].map((id) => {
              const L = p.layers.find((x) => x.id === id);
              return `<div class="cover-row"><span>${L.short}</span><b class="num">${num(L.done)} из ${num(L.design)} ${L.unit}</b></div><div class="bar"><i style="width:${pct(L.frac)}"></i></div>`;
            }).join('')}
          </div>
        </div>
      </section>

      <section class="sheet cells c3">
        <div class="cell docs">
          <h3>Геодезия</h3>
          ${docsHTML(p.docsGeo, 'geo')}
        </div>
        <div class="cell docs">
          <h3>Лаборатория</h3>
          ${docsHTML(p.docsLab, 'lab')}
        </div>
        <div class="cell docs">
          <h3>Примечание и фото</h3>
          ${p.note ? `<p class="note ${p.delayed ? '' : 'ok'}">${esc(p.note)}</p>` : ''}
          ${p.photos.length ? `<div class="photos">${p.photos.map((ph, k) => `<button class="photo" data-photo="${k}" aria-label="${esc(ph.caption)}">${photoSVG(ph, p)}<span>${dateShort(ph.date)}</span></button>`).join('')}</div>` : '<p class="empty">Фото появятся после первого выезда на пикет.</p>'}
        </div>
      </section>

      <section class="sheet">
        <div class="sheet-row log-head"><h3>Журнал работ</h3><span class="muted">${p.events.length} ${plural(p.events.length, 'запись', 'записи', 'записей')}</span></div>
        <div class="sheet-row">
        ${p.events.length ? `<ol class="timeline">${p.events.map((e) => `
          <li><span class="d num">${date(e.date)}</span><span class="ico ${e.type}">${{ geo: I.pin, work: I.check, progress: I.pin, lab: I.flask, warn: I.alert }[e.type]}</span>
          <div class="t">${esc(e.text)}<span>${esc(e.who)}</span></div></li>`).join('')}</ol>` : `<p class="empty">Записей пока нет. Работы на пикете начнутся ${date(p.startDate)}.</p>`}
        </div>
      </section>`;
  }

  function docsHTML(list, kind) {
    if (!list.length) return '<p class="empty">Документов пока нет.</p>';
    return list.map((d, k) => {
      const ext = d.name.split('.').pop();
      return `<a class="doc" href="#" data-doc="${kind}:${k}"><span class="ext ${ext}">${ext.toUpperCase()}</span><span class="meta"><b>${esc(d.name.replace(/\.\w+$/, ''))}</b><span>${date(d.date)} · ${d.size}</span></span></a>`;
    }).join('');
  }

  function photoSVG(ph, p, big) {
    const skies = [['#cfe3f7', '#eef5fb'], ['#f6dcc0', '#fbefe2'], ['#d9e6f2', '#f3f6fa'], ['#e4ecf6', '#fafcff']];
    const [s1, s2] = skies[ph.tone];
    const top = p.layers.slice().reverse().find((L) => L.frac > 0) || p.layers[0];
    const id = 'g' + p.i + '-' + ph.tone + (big ? 'b' : '');
    return `<svg viewBox="0 0 160 120" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${s1}"/><stop offset="1" stop-color="${s2}"/></linearGradient></defs>
      <rect width="160" height="120" fill="url(#${id})"/>
      <path d="M0 70 Q40 60 80 66 T160 62 V120 H0Z" fill="#cdbf98"/>
      <path d="M50 120 L76 64 L92 64 L130 120Z" fill="${top.color}"/>
      <path d="M84 70 L84 78 M85 86 L86 98 M87 106 L88 118" stroke="#fff" stroke-width="1.6" opacity=".7"/>
      ${ph.tone % 2 ? '<g transform="translate(104 74)"><rect width="26" height="12" rx="2" fill="#f5a524"/><rect x="18" y="-8" width="9" height="9" rx="1.5" fill="#f5a524"/><circle cx="6" cy="13" r="4" fill="#333"/><circle cx="21" cy="13" r="4" fill="#333"/></g>' : '<g transform="translate(26 72)"><path d="M0 26 L8 0 L16 26" stroke="#333" stroke-width="1.5" fill="none"/><rect x="4" y="-6" width="8" height="7" fill="#f5a524"/></g>'}
    </svg>`;
  }

  // ---------- боковые панели ----------
  function openDrawer(html) {
    closeDrawer();
    const bg = document.createElement('div');
    bg.className = 'drawer-bg';
    const d = document.createElement('aside');
    d.className = 'drawer';
    d.setAttribute('role', 'dialog');
    d.innerHTML = `<div style="display:flex;align-items:flex-start;gap:12px"><div style="flex:1">${html.head}</div><button class="icon-btn" data-dclose aria-label="Закрыть">${I.close}</button></div>${html.body}`;
    bg.addEventListener('click', closeDrawer);
    document.body.append(bg, d);
    $('[data-dclose]', d).addEventListener('click', closeDrawer);
    $('[data-dclose]', d).focus();
    if (!modalKeyHandler) {
      const h = (e) => { if (e.key === 'Escape') { closeDrawer(); document.removeEventListener('keydown', h); } };
      document.addEventListener('keydown', h);
    }
  }
  function closeDrawer() { $('.drawer')?.remove(); $('.drawer-bg')?.remove(); }

  function openContract(c) {
    const k = c.contract;
    openDrawer({
      head: `<div class="muted" style="font-size:12px;font-weight:600">ДОГОВОР ПОДРЯДА</div><h2>${esc(k.no)}</h2>`,
      body: `
        <dl class="kv">
          <dt>Подрядчик</dt><dd>${esc(c.name)}</dd>
          <dt>Предмет</dt><dd>${esc(k.subject)}</dd>
          <dt>Дата договора</dt><dd>${date(new Date(k.date))}</dd>
          <dt>Срок окончания</dt><dd>${date(new Date(k.until))}</dd>
          <dt>Сумма</dt><dd>${esc(k.sum)}</dd>
          <dt>Участок</dt><dd>ПК ${c.from} – ПК ${c.to} (${num((c.to - c.from) / 10)} км)</dd>
        </dl>
        <a class="doc" href="#" onclick="return false"><span class="ext pdf">PDF</span><span class="meta"><b>Договор ${esc(k.no)}</b><span>демо-файл, в рабочей версии откроется скан договора</span></span></a>
        <div style="margin-top:18px" class="people">${c.team.map(personHTML).join('')}</div>`,
    });
  }

  function openPhoto(p, k) {
    const ph = p.photos[k];
    openDrawer({
      head: `<div class="muted" style="font-size:12px;font-weight:600">${p.label} · ${date(ph.date)}</div><h2>${esc(ph.caption)}</h2>`,
      body: `<div class="big-photo">${photoSVG(ph, p, true)}</div><p class="muted" style="font-size:12.5px">Иллюстрация-заглушка. В рабочей версии здесь будут фото с объекта и ортофотоплан с дрона, привязанные к пикету.</p>`,
    });
  }

  function openDoc(p, ref) {
    const [kind, k] = ref.split(':');
    const d = (kind === 'geo' ? p.docsGeo : p.docsLab)[+k];
    openDrawer({
      head: `<div class="muted" style="font-size:12px;font-weight:600">${kind === 'geo' ? 'ГЕОДЕЗИЯ' : 'ЛАБОРАТОРИЯ'} · ${p.label}</div><h2>${esc(d.name)}</h2>`,
      body: `<dl class="kv"><dt>Дата</dt><dd>${date(d.date)}</dd><dt>Размер</dt><dd>${d.size}</dd><dt>Загрузил</dt><dd>${kind === 'geo' ? 'WestSurvey' : 'Лаборатория подрядчика'}</dd></dl>
        <p class="muted" style="font-size:12.5px">Демо-документ. В рабочей версии файл откроется для просмотра и скачивания.</p>`,
    });
  }

  // ---------- старт ----------
  function render() {
    hideTip();
    if (!state.user) { closeModal(); renderLogin(); return; }
    // перерисовываем только окно пикета, если меняется лишь пикет
    const curView = $('.nav button[aria-current="page"]')?.dataset.view;
    if (curView === state.view && $('#main')) {
      if (state.pk !== null) openPicket(state.pk);
      else closeModal();
      return;
    }
    closeModal();
    renderApp();
  }

  readHash();
  render();
})();
