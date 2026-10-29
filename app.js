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
  const pctD = (v) => (v * 100).toFixed(1).replace('.', ',') + '%';
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
    edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>',
    filter: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 5h18M6 12h12M10 19h4"/></svg>',
    mountain: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 20 6-10 4 6 3-4 5 8Z"/></svg>',
    expand: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>',
    down: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M19 12l-7 7-7-7"/></svg>',
    upload: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>',
    chevron: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>',
    eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>',
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
    state.view = ['overview', 'pickets', 'contractors', 'entry'].includes(view) ? view : 'overview';
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

  // Доступ только по приглашению WestSurvey: открытой регистрации нет.
  // Вход по почте и паролю; новый участник отправляет запрос доступа.
  // 3D-рельеф с дорогой: поверхность строится рядами от дальнего к ближнему,
  // дорога рисуется между рядами, поэтому холмы перекрывают её как в перспективе.
  function loginHero() {
    const W = 900, H = 900, cx = 450, horizon = 120, f = 560, d = 1.4, camH = 1.25;
    const roadX = (z) => 0.75 * Math.sin(z * 0.85 + 0.4) - 0.15;
    const g = (x, z, x0, z0, s) => Math.exp(-((x - x0) ** 2 + (z - z0) ** 2) / s);
    const hRaw = (x, z) => 0.55 * g(x, z, 1.5, 3.6, 1.1) + 0.75 * g(x, z, -1.9, 4.8, 1.6) + 0.32 * g(x, z, 0.4, 6.4, 1.4)
      + 0.22 * g(x, z, -1.2, 1.6, 0.6) + 0.05 * Math.sin(x * 3.1 + z * 1.7) + 0.04 * Math.cos(x * 5.3 - z * 2.2);
    // полотно дороги срезано в рельефе: насыпь ровная, склоны плавно переходят в неё
    const h = (x, z) => { const k = Math.exp(-((x - roadX(z)) ** 2) / 0.08); return hRaw(x, z) * (1 - 0.75 * k) + hRaw(roadX(z), z) * 0.25 * k; };
    const P = (x, y, z) => { const s = f / (z + d); return [cx + x * s, horizon + (camH - y) * s]; };
    const fmt = (pts) => pts.map(([a, b]) => `${a.toFixed(1)},${b.toFixed(1)}`).join(' ');

    const zFar = 8, zNear = 0, rows = 40, cols = 70, xSpan = 3.2;
    const zs = Array.from({ length: rows + 1 }, (_, r) => zFar - ((zFar - zNear) * r) / rows);
    let out = '';
    zs.forEach((z, r) => {
      const t = r / rows;
      const row = [];
      for (let c = 0; c <= cols; c++) {
        const x = -xSpan + (2 * xSpan * c) / cols;
        row.push(P(x, h(x, z), z));
      }
      const fill = mixHex('#0d2b86', '#0a1f5c', t);
      out += `<polygon points="${fmt(row)} ${row[row.length - 1][0].toFixed(1)},${H} ${row[0][0].toFixed(1)},${H}" fill="${fill}"/>`;
      out += `<polyline points="${fmt(row)}" fill="none" stroke="rgba(130,170,255,${(0.22 + 0.4 * (1 - t)).toFixed(2)})" stroke-width="${(0.8 + 0.9 * t).toFixed(2)}"/>`;
      // участок дороги между этим и следующим (ближним) рядом
      if (r < rows) {
        const z1 = z, z0 = zs[r + 1], n = 4, w = 0.11;
        const L = [], R = [], C = [];
        for (let k = 0; k <= n; k++) {
          const zz = z1 + ((z0 - z1) * k) / n, xr = roadX(zz), y = h(xr, zz) + 0.012;
          L.push(P(xr - w, y, zz)); R.push(P(xr + w, y, zz)); C.push(P(xr, y + 0.002, zz));
        }
        out += `<polygon points="${fmt(L)} ${fmt(R.reverse())}" fill="#dfe8fb" stroke="#e9f0ff" stroke-width="0.6"/>`;
        if (r % 2 === 0) out += `<polyline points="${fmt(C)}" fill="none" stroke="#0a1f5c" stroke-width="${(0.8 + 2.2 * t).toFixed(2)}" stroke-linecap="round"/>`;
      }
    });
    return `
      <svg class="hero-art" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <defs>
          <linearGradient id="heroFade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#0a1f5c" stop-opacity="0"/>
            <stop offset=".55" stop-color="#0a1f5c" stop-opacity="0"/>
            <stop offset=".86" stop-color="#0a1f5c" stop-opacity=".92"/>
            <stop offset="1" stop-color="#0a1f5c"/>
          </linearGradient>
        </defs>
        <g class="terrain">${out}</g>
        <rect width="${W}" height="${H}" fill="url(#heroFade)"/>
      </svg>`;
  }
  function mixHex(a, b, t) {
    const pa = a.match(/\w\w/g).map((x) => parseInt(x, 16)), pb = b.match(/\w\w/g).map((x) => parseInt(x, 16));
    return '#' + pa.map((v, k) => Math.round(v + (pb[k] - v) * t).toString(16).padStart(2, '0')).join('');
  }

  function renderLogin() {
    root.innerHTML = `
      <div class="auth">
        <section class="auth-hero">
          ${loginHero()}
          <div class="auth-top">
            <div class="logo-plate">
              <img src="assets/logo-ws.png" alt="WestSurvey">
              <span class="logo-sep" aria-hidden="true"></span>
              <img src="assets/logo-kcs.png" alt="Kazcomservice">
            </div>
          </div>
          <div class="auth-hero-copy">
            <h1>Ваш объект под контролем на&nbsp;каждом пикете</h1>
            <p>Карта трассы, объёмы по слоям, подрядчики, геодезия и лаборатория. Данные вносят на объекте, WestSurvey проверяет и показывает их вам.</p>
          </div>
        </section>

        <section class="auth-panel">
          <div class="auth-box" id="authBox"></div>
          <footer class="auth-foot">WestSurvey, геодезическое сопровождение строительства</footer>
        </section>
      </div>`;

    const box = $('#authBox');
    const brand = '';

    const signIn = (role, name) => {
      const r = ROLES.find((x) => x.id === role) || ROLES[0];
      state.user = { email: 'demo@westsurvey.kz', name: name || 'Демо пользователь', role: r.id, roleName: r.name };
      store.set('ws_user', state.user);
      render();
    };

    function showLogin() {
      box.innerHTML = `
        ${brand}
        <h2>Вход в кабинет объекта</h2>
        <p class="sub">Доступ выдаёт WestSurvey. Войдите с данными из приглашения.</p>
        <form class="login-form" novalidate>
          <label class="field"><span>Электронная почта</span><input name="login" type="email" autocomplete="username" placeholder="name@company.kz" value="demo@westsurvey.kz"></label>
          <label class="field pass"><span>Пароль</span><input name="secret" type="password" autocomplete="current-password" placeholder="Пароль" value="demo-access"><button type="button" class="eye" aria-label="Показать пароль">${I.eye}</button></label>
          <button type="button" class="link-btn" id="forgot">Забыли пароль?</button>
          <div class="err" aria-live="polite"></div>
          <button class="btn" type="submit">Войти</button>
        </form>
        <div class="auth-alt">
          <span>Нет доступа к объекту?</span>
          <button type="button" class="link-btn" id="toRequest">Запросить доступ</button>
        </div>
        <div class="demo-row">
          <span>Демо-доступ</span>
          ${ROLES.map((r) => `<button type="button" class="demo-chip" data-demo="${r.id}">${r.name}</button>`).join('')}
        </div>`;

      $$('[data-demo]', box).forEach((b) => b.addEventListener('click', () => signIn(b.dataset.demo)));
      $('#toRequest').addEventListener('click', showRequest);
      $('.eye', box)?.addEventListener('click', (e) => {
        const inp = box.querySelector('input[name=secret]');
        inp.type = inp.type === 'password' ? 'text' : 'password';
        e.currentTarget.setAttribute('aria-label', inp.type === 'password' ? 'Показать пароль' : 'Скрыть пароль');
      });
      $('#forgot').addEventListener('click', showReset);

      const form = $('.login-form', box);
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const err = $('.err', form);
        const login = form.login.value.trim();
        const secret = form.secret.value.trim();
        if (!/^\S+@\S+\.\S+$/.test(login)) { err.textContent = 'Введите почту в формате name@company.kz'; return; }
        if (secret.length < 4) { err.textContent = 'Введите пароль'; return; }
        signIn('customer', login.startsWith('demo@') ? 'Демо пользователь' : login.split('@')[0]);
      });
    }

    function showReset() {
      box.innerHTML = `
        <button type="button" class="link-btn back" id="toLogin">${I.back}Ко входу</button>
        <h2>Восстановление пароля</h2>
        <p class="sub">Укажите почту, на которую пришло приглашение. Мы отправим ссылку, по ней вы зададите новый пароль.</p>
        <form class="login-form" id="resetForm" novalidate>
          <label class="field"><span>Электронная почта</span><input name="email" type="email" autocomplete="username" placeholder="name@company.kz"></label>
          <div class="err" aria-live="polite"></div>
          <button class="btn" type="submit">Отправить ссылку</button>
        </form>`;
      $('#toLogin').addEventListener('click', showLogin);
      $('#resetForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const v = e.target.email.value.trim();
        if (!/^\S+@\S+\.\S+$/.test(v)) { $('.err', e.target).textContent = 'Введите почту в формате name@company.kz'; return; }
        box.innerHTML = `
          <div class="sent">
            <span class="sent-ico">${I.check}</span>
            <h2>Проверьте почту</h2>
            <p class="sub">Если ${esc(v)} есть в списке участников объекта, на неё придёт ссылка для нового пароля.</p>
            <button type="button" class="btn ghost" id="toLogin">Вернуться ко входу</button>
          </div>`;
        $('#toLogin').addEventListener('click', showLogin);
      });
    }

    function showRequest() {
      box.innerHTML = `
        ${brand}
        <button type="button" class="link-btn back" id="toLogin">${I.back}Ко входу</button>
        <h2>Запрос доступа к объекту</h2>
        <p class="sub">WestSurvey проверит запрос и пришлёт приглашение на почту. Обычно в течение рабочего дня.</p>
        <form class="login-form" id="reqForm">
          <label class="field"><span>Фамилия и имя</span><input name="name" autocomplete="name" required></label>
          <label class="field"><span>Организация</span><input name="org" autocomplete="organization" placeholder="Например, Kazcomservice" required></label>
          <label class="field"><span>Роль на объекте</span>
            <select name="role">${ROLES.map((r) => `<option value="${r.id}">${r.name}: ${r.desc.toLowerCase()}</option>`).join('')}</select>
          </label>
          <label class="field"><span>Электронная почта</span><input name="contact" type="email" autocomplete="email" required></label>
          <div class="err" aria-live="polite"></div>
          <button class="btn" type="submit">Отправить запрос</button>
        </form>`;
      $('#toLogin').addEventListener('click', showLogin);
      $('#reqForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const f = e.target;
        if (!f.name.value.trim() || !f.org.value.trim() || !f.contact.value.trim()) { $('.err', f).textContent = 'Заполните все поля'; return; }
        try {
          const list = JSON.parse(localStorage.getItem('ws_access_requests') || '[]');
          list.unshift({ name: f.name.value.trim(), org: f.org.value.trim(), role: f.role.value, contact: f.contact.value.trim(), at: new Date().toISOString() });
          localStorage.setItem('ws_access_requests', JSON.stringify(list));
        } catch {}
        box.innerHTML = `
          ${brand}
          <div class="sent">
            <span class="sent-ico">${I.check}</span>
            <h2>Запрос отправлен</h2>
            <p class="sub">Администратор WestSurvey проверит его и пришлёт приглашение на ${esc(f.contact.value.trim())}. По ссылке из приглашения вы зададите пароль и сразу увидите свой объект.</p>
            <button type="button" class="btn ghost" id="toLogin">Вернуться ко входу</button>
          </div>`;
        $('#toLogin').addEventListener('click', showLogin);
      });
    }

    showLogin();
  }

  // ================= ПРИЛОЖЕНИЕ =================
  const prefs = {
    get(k, d) { try { const v = localStorage.getItem('ws_pref_' + k); return v === null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem('ws_pref_' + k, JSON.stringify(v)); } catch {} },
  };
  const NAV = [
    { view: 'overview', icon: 'map', name: 'Карта и ход работ' },
    { view: 'pickets', icon: 'list', name: 'Пикеты' },
    { view: 'contractors', icon: 'users', name: 'Подрядчики' },
  ];
  const navBtn = (n, pending) => `<button data-view="${n.view}" ${state.view === n.view ? 'aria-current="page"' : ''}>${I[n.icon]}<span>${n.name}</span>${pending ? `<em class="badge">${pending}</em>` : ''}</button>`;
  let mapCtl = null;

  function logosHTML() {
    return `
      <div class="logos">
        <span class="logo-box ws"><img src="assets/logo-ws.png" alt=""><b>WESTSURVEY</b></span>
        <span class="logo-sep" aria-hidden="true"></span>
        <span class="logo-box kcs"><img src="assets/logo-kcs.png" alt="Kazcomservice"></span>
      </div>`;
  }

  function renderApp() {
    const u = state.user;
    const navOpen = prefs.get('nav', window.innerWidth > 960);
    const pending = WS.Store.list().filter((e) => e.status === 'pending').length;
    if (mapCtl) { mapCtl.destroy(); mapCtl = null; }
    root.innerHTML = `
      <header class="appbar">
        <button class="icon-btn ghosty" id="navToggle" aria-label="Показать или скрыть меню" aria-expanded="${navOpen}">${I.menu}</button>
        ${logosHTML()}
        <div class="appbar-project"><b>${esc(D.project.name)}</b><span>${esc(D.project.region)}, ПК 0 – ПК ${D.N}</span></div>
        <div class="spacer"></div>
        <form class="search" id="pkSearch" role="search">${I.search}<input inputmode="numeric" placeholder="Пикет, например 100" aria-label="Номер пикета"></form>
      </header>
      <div class="app ${navOpen ? 'nav-open' : 'nav-closed'}" id="app">
        <aside class="sidebar" id="sidebar">
          <nav class="nav" aria-label="Разделы">${NAV.map((n) => navBtn(n)).join('')}</nav>
          <div class="side-bottom">
            <nav class="nav" aria-label="Данные">${navBtn({ view: 'entry', icon: 'edit', name: 'Ввод данных' }, pending)}</nav>
            <div class="account">
              <div class="avatar">${esc(initials(u.name).toUpperCase())}</div>
              <div class="meta"><b>${esc(u.name)}</b><span>${esc(u.roleName)}</span></div>
              <button class="icon-btn ghosty" id="logout" aria-label="Выйти" title="Выйти">${I.logout}</button>
            </div>
          </div>
        </aside>
        <div class="scrim" id="scrim"></div>
        <main class="main ${state.view === 'overview' ? 'flush' : ''}" id="main"></main>
      </div>`;
    const setNav = (open) => {
      $('#app').classList.toggle('nav-open', open);
      $('#app').classList.toggle('nav-closed', !open);
      $('#navToggle').setAttribute('aria-expanded', open);
      prefs.set('nav', open);
      if (mapCtl) setTimeout(() => mapCtl.resize(), 260);
    };
    $('#navToggle').addEventListener('click', () => setNav(!$('#app').classList.contains('nav-open')));
    $('#scrim').addEventListener('click', () => setNav(false));
    $$('.nav button').forEach((b) => b.addEventListener('click', () => { if (window.innerWidth <= 960) prefs.set('nav', false); go(b.dataset.view); }));
    $('#logout').addEventListener('click', () => { store.del('ws_user'); state.user = null; go('overview'); render(); });
    bindSearch();

    const main = $('#main');
    if (state.view === 'overview') renderOverview(main);
    if (state.view === 'pickets') renderPicketsView(main);
    if (state.view === 'contractors') renderContractors(main);
    if (state.view === 'entry') renderEntry(main);

    if (state.pk !== null) openPicket(state.pk);
  }

  function topbar(title, crumbs) {
    return `<div class="topbar"><div><div class="crumbs">${crumbs}</div><h1>${title}</h1></div></div>`;
  }
  function bindSearch() {
    const f = $('#pkSearch');
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      const n = parseInt(f.querySelector('input').value.replace(/\D/g, ''), 10);
      if (!isNaN(n) && D.pickets[n]) { f.querySelector('input').value = ''; go(state.view, n); }
      else f.querySelector('input').value = '';
    });
  }

  // ---------- сводка ----------
  function totals(list = D.pickets) {
    const t = { done: 0, work: 0, late: 0, none: 0, prog: 0, plan: 0, mach: 0, workers: 0, vol: 0, volDesign: 0 };
    list.forEach((p) => {
      t[p.status]++;
      t.prog += p.progress;
      t.plan += p.plan;
      t.mach += p.machinery.length;
      t.workers += p.workers;
      t.vol += p.doneVolume;
      t.volDesign += p.designVolume;
    });
    t.prog /= list.length || 1;
    t.plan /= list.length || 1;
    return t;
  }

  function renderOverview(main) {
    const t = totals();
    const lag = t.plan - t.prog;
    const hasLib = WSMap.available();
    const opts = [['all', 'Все', null], ['done', 'Завершено', 'done'], ['work', 'В работе', 'work'], ['late', 'Отставание', 'late'], ['none', 'Не начато', 'none']];
    main.innerHTML = `
      <section class="map-hero" id="mapHero">
        <div class="map-canvas" id="mapCanvas" ${hasLib ? '' : 'hidden'}></div>
        <div class="scheme-layer" ${hasLib ? 'hidden' : ''}><div class="map-wrap" id="mapWrap"></div></div>

        <div class="map-toolbar" role="toolbar" aria-label="Фильтры карты">
          <div class="tb-group" role="group" aria-label="Этап работ">
            ${opts.map(([id, name, st]) => `<button class="tb-btn" data-filter="${id}" aria-pressed="${state.filter === id}">${st ? `<span class="dot" style="background:${STATUS[st].color}"></span>` : ''}${name}</button>`).join('')}
          </div>
          <label class="tb-btn tb-select">
            <span class="sr">Подрядчик</span>
            <select id="contrSel" aria-label="Подрядчик">
              <option value="all">Все подрядчики</option>
              ${D.CONTRACTORS.map((c) => `<option value="${c.id}" ${state.contractor === c.id ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}
            </select>
            ${I.chevron}
          </label>
          ${hasLib ? `
          <button class="tb-btn tb-toggle" id="terrainBtn" aria-pressed="false">${I.mountain}3D рельеф<i class="sw" aria-hidden="true"></i></button>
          <button class="tb-btn" id="fitBtn">${I.expand}Вся трасса</button>` : ''}
        </div>

        <button class="scroll-cue" id="scrollCue">Показатели и график${I.down}</button>
      </section>

      <div class="below" id="below">
        <div class="kpis">
          <div class="kpi accent">
            <span>Общая готовность</span>
            <b class="num">${pctD(t.prog)}</b>
            <div class="bar plan"><i style="width:${pct(t.prog)}"></i><em style="left:${pct(t.plan)}"></em></div>
            <small>План на сегодня ${pctD(t.plan)}${lag > 0.002 ? `, отставание ${pctD(lag)}` : ''}</small>
          </div>
          <div class="kpi"><span>Пикетов в работе</span><b class="num">${t.work + t.late}</b><small>из ${D.N}, ещё не начато ${t.none}</small></div>
          <div class="kpi ${t.late ? 'warn' : ''}"><span>С отставанием</span><b class="num">${t.late}</b><small>${plural(t.late, 'пикет', 'пикета', 'пикетов')} отстают от графика</small></div>
          <div class="kpi"><span>Земляные работы</span><b class="num">${num(t.vol / 1000, 1)}<small> тыс. м³</small></b><small>из ${num(t.volDesign / 1000, 0)} тыс. м³ по проекту</small></div>
          <div class="kpi"><span>Техника на объекте</span><b class="num">${t.mach}</b><small>единиц сегодня</small></div>
          <div class="kpi"><span>Рабочие</span><b class="num">${t.workers}</b><small>человек на смене</small></div>
        </div>
        <section class="card">
          <div class="card-head">
            <div>
              <h2>Линейный график работ</h2>
              <p class="card-sub">Слои в порядке выполнения. Нажмите на участок, чтобы открыть пикет.</p>
            </div>
            <div class="spacer"></div>
            <div class="scale-legend"><span>Готовность слоя на пикете</span>0% <i></i> 100%</div>
          </div>
          <div id="ribbonSummary"></div>
          <div class="ribbon-scroll" id="ribbon"></div>
        </section>
      </div>`;

    const redraw = () => { if (mapCtl) mapCtl.update(); drawMap(); drawRibbon(); };
    bindFilters(redraw);
    drawMap();
    drawRibbon();

    if (hasLib) {
      mapCtl = WSMap.mount($('#mapCanvas'), {
        color: (p) => STATUS[p.status].hex,
        matches,
        padding: window.innerWidth < 700 ? { top: 130, bottom: 110, left: 40, right: 40 } : { top: 120, bottom: 120, left: 100, right: 100 },
        onHover: (e, i) => showTip(e, D.pickets[i]),
        onLeave: hideTip,
        onPick: (i) => { hideTip(); go(state.view, i); },
      });
      $('#terrainBtn').addEventListener('click', (e) => {
        const on = e.currentTarget.getAttribute('aria-pressed') !== 'true';
        e.currentTarget.setAttribute('aria-pressed', on);
        mapCtl && mapCtl.terrain(on);
      });
      $('#fitBtn').addEventListener('click', () => mapCtl && mapCtl.fit());
    }
    $('#scrollCue').addEventListener('click', () => $('#below').scrollIntoView({ behavior: 'smooth' }));
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
      <div class="map-scroll"><svg viewBox="0 0 1200 560" role="img" aria-label="Схема трассы с пикетами">
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
      </svg></div>
      <div class="map-swipe">Проведите в сторону, чтобы увидеть всю трассу</div>
      <div class="map-note">Упрощённая схема трассы. Спутник и рельеф: кнопка «Спутник» справа вверху.</div>
`;

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
  // На старте стройки большинство слоёв пустые, поэтому каждая строка несёт
  // свою информацию: начатые показывают готовность по пикетам и объём,
  // не начатые показывают плановую дату старта по графику.
  function drawRibbon() {
    const el = $('#ribbon');
    if (!el) return;
    const list = D.pickets.filter(matches);
    const N = D.N;
    const longDate = (s) => new Date(s).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }).replace(' г.', '');

    const layerStats = D.LAYERS.map((L, k) => {
      const done = list.reduce((s, p) => s + p.layers[k].done, 0);
      const design = list.reduce((s, p) => s + p.layers[k].design, 0);
      const started = list.filter((p) => p.layers[k].frac > 0).length;
      return { L, k, done, design, frac: design ? done / design : 0, started };
    });
    const active = layerStats.filter((s) => s.started > 0 && s.frac < 1);
    const next = layerStats.find((s) => s.started === 0);
    const fronts = list.filter((p) => p.machinery.length);

    $('#ribbonSummary').innerHTML = `
      <div class="rb-summary">
        <div><span>Сейчас в работе</span><b>${active.length ? active.map((s) => s.L.short).join(', ') : 'нет'}</b></div>
        <div><span>Следующий слой по графику</span><b>${next ? `${next.L.short}, с ${longDate(next.L.planStart)}` : 'все слои начаты'}</b></div>
        <div><span>Активные фронты сегодня</span><b>${fronts.length} ${plural(fronts.length, 'пикет', 'пикета', 'пикетов')}</b></div>
      </div>`;

    const cellsSVG = (k) => {
      const cw = 1000 / N;
      return D.pickets.map((p) => {
        const f = p.layers[k].frac;
        if (f <= 0) return '';
        const on = matches(p);
        return `<rect x="${p.i * cw}" y="0" width="${cw + 0.3}" height="100" fill="${mix('#9DB7F2', '#0B41C7', f)}" opacity="${on ? 1 : 0.18}"/>`;
      }).join('');
    };

    const contractorBand = D.CONTRACTORS.map((c) => `
      <div class="rb-contr ${state.contractor === 'all' || state.contractor === c.id ? '' : 'off'}" style="left:${(c.from / N) * 100}%;width:${((c.to - c.from) / N) * 100}%">
        <i style="background:${c.color}"></i><span>${esc(c.short)}</span>
      </div>`).join('');

    const frontMarks = D.pickets.filter((p) => p.machinery.length).map((p) =>
      `<i class="rb-front ${matches(p) ? '' : 'off'}" style="left:${((p.i + 0.5) / N) * 100}%" title="${p.label}"></i>`).join('');

    const rows = layerStats.map((s) => {
      const empty = s.started === 0;
      return `
        <div class="rb-row ${empty ? 'rb-empty' : ''}">
          <div class="rb-label"><b>${esc(s.L.short)}</b><span class="num">${empty ? 'не начат' : s.frac < 0.01 ? '<1%' : pct(s.frac)}</span></div>
          <div class="rb-track" data-track>
            ${empty
              ? `<span class="rb-plan">Начало по графику ${longDate(s.L.planStart)}</span>`
              : `<svg viewBox="0 0 1000 100" preserveAspectRatio="none">${cellsSVG(s.k)}</svg>`}
          </div>
          <div class="rb-val num">${empty ? '—' : `${num(s.done / 1000, 1)} из ${num(s.design / 1000, 1)} тыс. ${s.L.unit}`}</div>
        </div>`;
    }).join('');

    const late = D.pickets.filter((p) => p.status === 'late').map((p) =>
      `<i class="rb-late ${matches(p) ? '' : 'off'}" style="left:${(p.i / N) * 100}%;width:${100 / N}%"></i>`).join('');

    const ticks = [];
    for (let i = 0; i <= N; i += 20) ticks.push(`<span class="${i % 100 === 0 ? 'major' : ''}" style="left:${(i / N) * 100}%">ПК ${i}</span>`);

    el.innerHTML = `
      <div class="ribbon">
        <div class="rb-row rb-meta">
          <div class="rb-label"><span>Подрядчики</span></div>
          <div class="rb-track bare" data-track>${contractorBand}</div><div class="rb-val"></div>
        </div>
        <div class="rb-row rb-meta">
          <div class="rb-label"><span>Фронты работ</span></div>
          <div class="rb-track bare fronts" data-track>${frontMarks}</div><div class="rb-val"></div>
        </div>
        ${rows}
        <div class="rb-row rb-meta">
          <div class="rb-label"><span class="late-txt">Отставание</span></div>
          <div class="rb-track bare lates" data-track>${late}</div><div class="rb-val"></div>
        </div>
        <div class="rb-row rb-axis">
          <div class="rb-label"></div><div class="rb-ticks">${ticks.join('')}</div><div class="rb-val"></div>
        </div>
      </div>`;

    $$('[data-track]', el).forEach((tr) => {
      const at = (e) => {
        const r = tr.getBoundingClientRect();
        return D.pickets[Math.max(0, Math.min(N - 1, Math.floor(((e.clientX - r.left) / r.width) * N)))];
      };
      tr.addEventListener('mousemove', (e) => showTip(e, at(e)));
      tr.addEventListener('mouseleave', hideTip);
      tr.addEventListener('click', (e) => { hideTip(); go(state.view, at(e).i); });
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
          <thead><tr><th>Пикет</th><th class="hide-m">Км</th><th class="hide-m">Подрядчик</th><th>Статус</th><th>Готовность</th><th class="hide-m">Текущий этап</th><th class="hide-m">Выполнено</th><th class="hide-m">След. съёмка</th></tr></thead>
          <tbody>${rows.map((p) => `
            <tr data-pk="${p.i}" tabindex="0">
              <td><b>${p.label}</b></td>
              <td class="num hide-m">${num(p.km)}</td>
              <td class="hide-m">${esc(p.contractor.short)}</td>
              <td><span class="pill ${p.status}">${STATUS[p.status].name}</span></td>
              <td class="num"><span class="mini-bar"><i style="width:${pct(p.progress)}"></i></span>${pct(p.progress)}</td>
              <td class="hide-m">${p.current === -1 ? 'Все этапы выполнены' : esc(p.stages[p.current].name)}</td>
              <td class="num hide-m">${num(p.doneVolume, 0)} м³</td>
              <td class="num hide-m">${date(p.nextSurvey)}</td>
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
              ${t.done ? `<span class="pill done">${t.done} завершено</span>` : ''}
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

  // ================= ВВОД ДАННЫХ =================
  const ENTRY_TABS = [
    { id: 'report', name: 'Отчёт о работах', who: 'Прораб подрядчика' },
    { id: 'survey', name: 'Геодезия', who: 'Геодезист WestSurvey' },
    { id: 'lab', name: 'Лаборатория', who: 'Лаборатория' },
    { id: 'route', name: 'Трасса и проект', who: 'Администратор' },
    { id: 'journal', name: 'Журнал и подтверждение', who: 'Технадзор, заказчик' },
  ];
  const SURVEY_KINDS = ['Исполнительная съёмка', 'Акт разбивки', 'Контрольная съёмка', 'Продольный профиль'];
  const LAB_TESTS = [
    { name: 'Коэффициент уплотнения', hint: 'например 0,96 (норма ≥ 0,95)' },
    { name: 'Влажность грунта', hint: 'например 12 %' },
    { name: 'Гранулометрический состав', hint: 'например соответствует ГОСТ' },
    { name: 'Прочность щебня', hint: 'например М600' },
  ];
  const todayISO = () => D.TODAY.toISOString().slice(0, 10);
  const canApprove = () => ['customer', 'supervision'].includes(state.user.role);
  const fileSize = (b) => (b > 1048576 ? num(b / 1048576, 1) + ' МБ' : num(b / 1024, 0) + ' КБ');

  function toast(msg) {
    $('.toast')?.remove();
    const t = document.createElement('div');
    t.className = 'toast';
    t.setAttribute('role', 'status');
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3200);
  }

  function rangeFields(from = 100, to = 105) {
    return `
      <div class="f-row two">
        <label class="field"><span>С пикета</span><input name="pkFrom" type="number" min="0" max="${D.N - 1}" value="${from}" required></label>
        <label class="field"><span>По пикет</span><input name="pkTo" type="number" min="1" max="${D.N}" value="${to}" required></label>
      </div>`;
  }
  const layerOptions = (sel) => D.LAYERS.map((L) => `<option value="${L.id}" ${L.id === sel ? 'selected' : ''}>${esc(L.name)}</option>`).join('');

  function renderEntry(main) {
    const tab = prefs.get('entryTab', 'report');
    const list = WS.Store.list();
    const pending = list.filter((e) => e.status === 'pending').length;
    main.innerHTML = `
      ${topbar('Ввод данных', 'Всё, что вносится здесь, после подтверждения технадзором попадает на карту, в график и в окна пикетов')}
      <div class="flow">
        <div><b>1. Вносит ответственный</b><span>прораб, геодезист или лаборатория, с телефона на объекте</span></div>
        <div><b>2. Подтверждает технадзор</b><span>или заказчик проверяет объём и документы</span></div>
        <div><b>3. Обновляется платформа</b><span>карта, линейный график, паспорт пикета, журнал</span></div>
      </div>
      <div class="tabs" role="tablist">
        ${ENTRY_TABS.map((t) => `<button role="tab" data-tab="${t.id}" aria-selected="${t.id === tab}">${t.name}${t.id === 'journal' && pending ? `<em class="badge">${pending}</em>` : ''}</button>`).join('')}
      </div>
      <div id="entryBody"></div>`;
    $$('[data-tab]').forEach((b) => b.addEventListener('click', () => { prefs.set('entryTab', b.dataset.tab); renderEntry(main); }));
    $('.tabs [aria-selected="true"]')?.scrollIntoView({ block: 'nearest', inline: 'center' });
    const body = $('#entryBody');
    ({ report: entryReport, survey: entrySurvey, lab: entryLab, route: entryRoute, journal: entryJournal })[tab](body);
  }

  function submitEntry(form, entry) {
    const from = +form.pkFrom.value, to = +form.pkTo.value;
    if (!(to > from)) { toast('Конечный пикет должен быть больше начального'); return false; }
    WS.Store.add({ ...entry, pkFrom: from, pkTo: to, author: `${state.user.name}, ${state.user.roleName}` });
    toast('Отправлено на подтверждение технадзору');
    prefs.set('entryTab', 'journal');
    renderApp();
    return true;
  }

  function entryReport(body) {
    body.innerHTML = `
      <div class="entry-grid">
        <form class="card form" id="fReport">
          <h3>Ежедневный отчёт о выполненных работах</h3>
          ${rangeFields()}
          <label class="field"><span>Слой конструкции</span><select name="layer">${layerOptions('s1')}</select></label>
          <div class="f-row two">
            <label class="field"><span>Объём за смену, <em id="unit">м³</em></span><input name="volume" type="number" min="0" step="0.1" placeholder="0" required></label>
            <label class="field"><span>Дата</span><input name="date" type="date" value="${todayISO()}" max="${todayISO()}" required></label>
          </div>
          <p class="hint" id="remain"></p>
          <fieldset class="field"><legend>Техника на участке</legend>
            <div class="checks">${D.MACHINES.map((m) => `<label class="check"><input type="checkbox" name="mach" value="${m}"><span>${m}</span></label>`).join('')}</div>
          </fieldset>
          <div class="f-row two">
            <label class="field"><span>Рабочих на смене</span><input name="workers" type="number" min="0" placeholder="0"></label>
            <label class="field"><span>Фото с объекта</span><input name="photos" type="file" accept="image/*" multiple capture="environment"></label>
          </div>
          <label class="field"><span>Комментарий</span><textarea name="note" rows="2" placeholder="Например: отсыпка слоя I, вывозка грунта из карьера №1"></textarea></label>
          <button class="btn" type="submit">Отправить отчёт</button>
        </form>
        ${entryAside('report')}
      </div>`;
    const f = $('#fReport');
    const upd = () => {
      const L = D.LAYERS.find((x) => x.id === f.layer.value);
      $('#unit').textContent = L.unit;
      const k = D.LAYERS.indexOf(L);
      const ps = D.pickets.filter((p) => p.i >= +f.pkFrom.value && p.i < +f.pkTo.value);
      const rem = ps.reduce((s, p) => s + Math.max(0, p.layers[k].design - p.layers[k].done), 0);
      const contr = [...new Set(ps.map((p) => p.contractor.short))].join(', ');
      $('#remain').innerHTML = ps.length ? `Остаток по проекту на ПК ${f.pkFrom.value} – ${f.pkTo.value}: <b>${num(rem)} ${L.unit}</b>. Участок: ${esc(contr)}.` : 'Укажите участок пикетов.';
    };
    ['layer', 'pkFrom', 'pkTo'].forEach((n) => f[n].addEventListener('input', upd));
    upd();
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      submitEntry(f, {
        type: 'report', layer: f.layer.value, volume: +f.volume.value, date: f.date.value,
        machinery: $$('input[name=mach]:checked', f).map((x) => x.value), workers: +f.workers.value || 0,
        photos: f.photos.files.length, note: f.note.value.trim(),
      });
    });
  }

  function entrySurvey(body) {
    body.innerHTML = `
      <div class="entry-grid">
        <form class="card form" id="fSurvey">
          <h3>Геодезическая съёмка или акт</h3>
          <label class="field"><span>Вид документа</span><select name="kind">${SURVEY_KINDS.map((k) => `<option>${k}</option>`).join('')}</select></label>
          ${rangeFields(95, 105)}
          <div class="f-row two">
            <label class="field"><span>Дата съёмки</span><input name="date" type="date" value="${todayISO()}" required></label>
            <label class="field"><span>Следующая съёмка</span><input name="next" type="date" value="${new Date(D.TODAY.getTime() + 14 * 86400000).toISOString().slice(0, 10)}"></label>
          </div>
          <label class="field"><span>Файл (DWG, PDF, CSV с точками)</span><input name="file" type="file" accept=".dwg,.dxf,.pdf,.csv,.txt,.kml"></label>
          <button class="btn" type="submit">Загрузить</button>
        </form>
        ${entryAside('survey')}
      </div>`;
    const f = $('#fSurvey');
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      const file = f.file.files[0];
      submitEntry(f, { type: 'survey', kind: f.kind.value, date: f.date.value, next: f.next.value, fileName: file ? file.name : '', fileSize: file ? fileSize(file.size) : '' });
    });
  }

  function entryLab(body) {
    body.innerHTML = `
      <div class="entry-grid">
        <form class="card form" id="fLab">
          <h3>Протокол лабораторного испытания</h3>
          <div class="f-row two">
            <label class="field"><span>Испытание</span><select name="test">${LAB_TESTS.map((t) => `<option>${t.name}</option>`).join('')}</select></label>
            <label class="field"><span>Слой</span><select name="layer">${layerOptions('s1')}</select></label>
          </div>
          ${rangeFields(100, 103)}
          <div class="f-row two">
            <label class="field"><span>Результат</span><input name="value" placeholder="${LAB_TESTS[0].hint}" required></label>
            <label class="field"><span>Дата</span><input name="date" type="date" value="${todayISO()}" required></label>
          </div>
          <div class="seg" role="radiogroup" aria-label="Соответствие норме">
            <label><input type="radio" name="ok" value="1" checked><span>Соответствует норме</span></label>
            <label><input type="radio" name="ok" value="0"><span>Не соответствует</span></label>
          </div>
          <label class="field"><span>Протокол (PDF, фото)</span><input name="file" type="file" accept=".pdf,image/*"></label>
          <button class="btn" type="submit">Отправить протокол</button>
        </form>
        ${entryAside('lab')}
      </div>`;
    const f = $('#fLab');
    f.test.addEventListener('change', () => { f.value.placeholder = LAB_TESTS.find((t) => t.name === f.test.value).hint; });
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      const file = f.file.files[0];
      submitEntry(f, { type: 'lab', test: f.test.value, layer: f.layer.value, value: f.value.value.trim(), ok: f.ok.value === '1', date: f.date.value, fileName: file ? file.name : '', fileSize: file ? fileSize(file.size) : '' });
    });
  }

  function entryRoute(body) {
    const geo = WSMap.geometry();
    const tok = WS.Store.token();
    body.innerHTML = `
      <div class="entry-grid">
        <div class="stack-col">
          <section class="card form">
            <h3>Ось трассы из AutoCAD</h3>
            <p class="hint">Загрузите ось трассы в формате KML или GeoJSON в координатах WGS84. Пикеты расставятся по оси автоматически, через каждые ${window.WS_CONFIG.picketStep} м.</p>
            <div class="route-now">
              <div><span>Сейчас на карте</span><b>${esc(geo.name)}</b></div>
              <div><span>Длина оси</span><b class="num">${num(geo.length / 1000, 2)} км</b></div>
              <div><span>Шаг пикетов</span><b class="num">${num(geo.step, 1)} м</b></div>
            </div>
            <label class="drop" id="drop">
              <input type="file" id="routeFile" accept=".kml,.geojson,.json">
              ${I.upload}<b>Выберите файл KML или GeoJSON</b><span>или перетащите его сюда</span>
            </label>
            <p class="hint">Нет файла под рукой? <a href="templates/example_route.kml" download>Скачайте пример KML</a> и загрузите его, чтобы посмотреть, как работает импорт.</p>
            <div id="routePreview"></div>
            ${geo.imported ? '<button class="btn ghost" id="routeReset" type="button">Вернуть демо-трассу</button>' : ''}
          </section>
          <section class="card form">
            <h3>Проектные объёмы по пикетам</h3>
            <p class="hint">CSV из сметы или ведомости объёмов: одна строка на пикет и слой. Разделитель запятая или точка с запятой.</p>
            <a class="btn ghost sm" href="templates/design_volumes_template.csv" download>${I.doc}Скачать шаблон CSV</a>
            <label class="drop small"><input type="file" id="csvFile" accept=".csv,.txt">${I.upload}<b>Загрузить CSV с объёмами</b></label>
            <div id="csvPreview"></div>
          </section>
        </div>
        <div class="stack-col">
          <section class="card form">
            <h3>Карта Mapbox</h3>
            <p class="hint">Без токена карта работает на бесплатных снимках Esri и открытом рельефе. С токеном Mapbox подключаются снимки Mapbox Satellite. Токен сохраняется только в этом браузере.</p>
            <form id="fToken" class="f-row token-row">
              <label class="field"><span>Публичный токен (pk.…)</span><input name="token" value="${esc(tok)}" placeholder="pk.eyJ1Ijoi…" autocomplete="off" spellcheck="false"></label>
              <button class="btn" type="submit">Сохранить</button>
            </form>
            <p class="hint">Сейчас подложка: <b>${tok ? 'Mapbox Satellite' : 'Esri World Imagery'}</b>.</p>
          </section>
          ${entryAside('route')}
        </div>
      </div>`;

    let parsed = null;
    const file = $('#routeFile');
    const drop = $('#drop');
    const read = (fl) => {
      if (!fl) return;
      const r = new FileReader();
      r.onload = () => {
        try {
          parsed = WSMap.parseRouteFile(String(r.result), fl.name);
          $('#routePreview').innerHTML = `
            <div class="preview">
              ${routeSVG(parsed.coords)}
              <dl class="kv">
                <dt>Файл</dt><dd>${esc(fl.name)}</dd>
                <dt>Длина оси</dt><dd>${num(parsed.length / 1000, 2)} км</dd>
                <dt>Точек оси</dt><dd>${parsed.coords.length}</dd>
                <dt>Точек «ПК» в файле</dt><dd>${parsed.pickets || 'нет'}</dd>
                <dt>Пикетов по 100 м</dt><dd>${Math.floor(parsed.length / 100)}</dd>
              </dl>
              <button class="btn" id="routeApply" type="button">Показать эту трассу на карте</button>
            </div>`;
          $('#routeApply').addEventListener('click', () => {
            WS.Store.setRoute(parsed);
            toast('Трасса обновлена');
            go('overview');
          });
        } catch (err) {
          $('#routePreview').innerHTML = `<p class="error-box">${esc(err.message)}</p>`;
        }
      };
      r.readAsText(fl);
    };
    file.addEventListener('change', () => read(file.files[0]));
    drop.addEventListener('dragover', (e) => { e.preventDefault(); drop.classList.add('over'); });
    drop.addEventListener('dragleave', () => drop.classList.remove('over'));
    drop.addEventListener('drop', (e) => { e.preventDefault(); drop.classList.remove('over'); read(e.dataTransfer.files[0]); });
    $('#routeReset')?.addEventListener('click', () => { WS.Store.clearRoute(); toast('Возвращена демо-трасса'); renderApp(); });

    $('#csvFile').addEventListener('change', (e) => {
      const fl = e.target.files[0];
      if (!fl) return;
      const r = new FileReader();
      r.onload = () => {
        const rows = [], errors = [];
        String(r.result).split(/\r?\n/).forEach((line, n) => {
          const c = line.split(/[;,\t]/).map((x) => x.trim());
          if (!line.trim() || n === 0 && isNaN(+c[0])) return;
          const pk = parseInt(c[0], 10);
          const L = D.LAYERS.find((x) => x.id === c[1] || x.short.toLowerCase() === (c[1] || '').toLowerCase());
          const vol = parseFloat((c[2] || '').replace(',', '.'));
          if (isNaN(pk) || !D.pickets[pk] || !L || isNaN(vol)) errors.push(n + 1);
          else rows.push({ pk, layer: L.id, volume: vol });
        });
        $('#csvPreview').innerHTML = `
          <div class="preview">
            <p>Строк распознано: <b>${rows.length}</b>${errors.length ? `, с ошибками: <b>${errors.length}</b> (строки ${errors.slice(0, 8).join(', ')}${errors.length > 8 ? '…' : ''})` : ''}.</p>
            ${rows.length ? '<button class="btn" id="csvApply" type="button">Отправить на подтверждение</button>' : ''}
          </div>`;
        $('#csvApply')?.addEventListener('click', () => {
          const pks = rows.map((x) => x.pk);
          WS.Store.add({ type: 'design', rows, fileName: fl.name, pkFrom: Math.min(...pks), pkTo: Math.max(...pks) + 1, author: `${state.user.name}, ${state.user.roleName}` });
          toast('Проектные объёмы отправлены на подтверждение');
          prefs.set('entryTab', 'journal');
          renderApp();
        });
      };
      r.readAsText(fl);
    });

    $('#fToken').addEventListener('submit', (e) => {
      e.preventDefault();
      const v = e.target.token.value.trim();
      if (v && !/^pk\./.test(v)) { toast('Нужен публичный токен, он начинается с pk.'); return; }
      WS.Store.setToken(v);
      toast(v ? 'Токен сохранён, карта переключена на Mapbox' : 'Токен удалён');
      renderApp();
    });
  }

  function routeSVG(coords) {
    const xs = coords.map((c) => c[0]), ys = coords.map((c) => c[1]);
    const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
    const k = Math.cos(((y0 + y1) / 2) * Math.PI / 180);
    const w = (x1 - x0) * k || 1e-6, h = y1 - y0 || 1e-6, s = Math.min(280 / w, 120 / h);
    const pts = coords.map(([x, y]) => `${(10 + (x - x0) * k * s).toFixed(1)},${(130 - (y - y0) * s).toFixed(1)}`).join(' ');
    return `<svg class="route-svg" viewBox="0 0 300 140" role="img" aria-label="Предпросмотр оси трассы"><polyline points="${pts}" fill="none" stroke="#0B41C7" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/></svg>`;
  }

  function entryAside(kind) {
    const tips = {
      report: ['Один отчёт на смену и слой. Участок задаётся пикетами: ПК 100 – 105 значит пикеты 100, 101, 102, 103, 104.',
        'Объём распределяется по пикетам пропорционально проектному остатку.',
        'Техника и люди, указанные сегодняшним числом, показываются на карте как активный фронт работ.'],
      survey: ['Исполнительная съёмка обновляет дату последней съёмки на пикетах и ставит дату следующей.',
        'Файл DWG или PDF прикрепляется к каждому пикету участка во вкладке «Геодезия».'],
      lab: ['Результат «Не соответствует» попадает в журнал пикета красным и виден технадзору.',
        'Протокол прикрепляется к пикетам во вкладке «Лаборатория».'],
      route: ['Экспорт из AutoCAD Civil 3D: команда MAPEXPORT в KML или SHP. Затем перепроецирование в WGS84 (EPSG:4326) в QGIS.',
        'Если чертёж в местной системе координат (МСК), без перепроецирования трасса окажется не на своём месте.',
        'Подробно о данных для карты и бэкенде: раздел «Как устроена система» в меню.'],
    };
    return `<aside class="card tips"><h3>Как заполнять</h3><ul>${tips[kind].map((t) => `<li>${esc(t)}</li>`).join('')}</ul></aside>`;
  }

  function entryJournal(body) {
    const list = WS.Store.list();
    const desc = (e) => {
      const L = D.LAYERS.find((x) => x.id === e.layer);
      if (e.type === 'report') return `${L ? L.name : ''}: ${num(e.volume)} ${L ? L.unit : ''}${e.machinery && e.machinery.length ? `, техника: ${e.machinery.join(', ')}` : ''}${e.workers ? `, рабочих ${e.workers}` : ''}`;
      if (e.type === 'survey') return `${e.kind}${e.fileName ? `, файл ${e.fileName}` : ''}${e.next ? `, следующая ${date(new Date(e.next))}` : ''}`;
      if (e.type === 'lab') return `${e.test}: ${e.value}, ${e.ok ? 'соответствует' : 'не соответствует'} (${L ? L.short : ''})`;
      if (e.type === 'design') return `${e.rows.length} строк проектных объёмов из ${e.fileName}`;
      return '';
    };
    const st = { pending: ['work', 'Ожидает подтверждения'], approved: ['done', 'Подтверждено'], rejected: ['late', 'Отклонено'] };
    body.innerHTML = list.length ? `
      <section class="card">
        <div class="card-head"><h3>Внесённые данные</h3><div class="spacer"></div>
          <span class="muted" style="font-size:12.5px">${canApprove() ? 'Вы можете подтверждать записи' : 'Подтверждает технадзор или заказчик'}</span></div>
        <ul class="journal">${list.map((e) => `
          <li>
            <div class="j-main">
              <div class="j-top"><b>${WS.ENTRY_TYPES[e.type]}</b><span class="pill ${st[e.status][0]}">${st[e.status][1]}</span></div>
              <p>ПК ${e.pkFrom} – ${e.pkTo}${e.date ? `, ${date(new Date(e.date))}` : ''}. ${esc(desc(e))}</p>
              ${e.note ? `<p class="muted">${esc(e.note)}</p>` : ''}
              <small class="muted">${esc(e.author || '')}, внесено ${new Date(e.createdAt).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}${e.reviewedBy ? `. Проверил: ${esc(e.reviewedBy)}` : ''}</small>
            </div>
            <div class="j-actions">
              ${e.status === 'pending' && canApprove() ? `<button class="btn sm" data-approve="${e.id}">${I.check}Подтвердить</button><button class="btn ghost sm" data-reject="${e.id}">Отклонить</button>` : ''}
              ${e.status === 'approved' ? `<button class="btn ghost sm" data-open="${e.pkFrom}">Открыть ПК ${e.pkFrom}</button>` : ''}
              ${e.status !== 'approved' ? `<button class="btn ghost sm" data-del="${e.id}">Удалить</button>` : ''}
            </div>
          </li>`).join('')}</ul>
      </section>` : `
      <section class="card empty-state">
        <h3>Записей пока нет</h3>
        <p>Внесите первый отчёт о работах, геодезическую съёмку или протокол лаборатории. Они появятся здесь для подтверждения.</p>
        <button class="btn" id="toReport">Внести отчёт о работах</button>
      </section>`;
    const by = `${state.user.name}, ${state.user.roleName}`;
    $$('[data-approve]').forEach((b) => b.addEventListener('click', () => { WS.Store.setStatus(b.dataset.approve, 'approved', by); WS.refresh(); toast('Подтверждено, данные обновлены на карте и в графике'); renderApp(); }));
    $$('[data-reject]').forEach((b) => b.addEventListener('click', () => { WS.Store.setStatus(b.dataset.reject, 'rejected', by); toast('Запись отклонена'); renderApp(); }));
    $$('[data-del]').forEach((b) => b.addEventListener('click', () => { WS.Store.remove(b.dataset.del); toast('Запись удалена'); renderApp(); }));
    $$('[data-open]').forEach((b) => b.addEventListener('click', () => go('entry', +b.dataset.open)));
    $('#toReport')?.addEventListener('click', () => { prefs.set('entryTab', 'report'); renderApp(); });
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
        <button class="btn ghost sm back-btn" data-close aria-label="К трассе">${I.back}<span>К трассе</span></button>
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
          <polygon points="${pts}" fill="#fff"/>
          <polygon points="${pts}" fill="url(#pat-${L.id})" opacity=".45"/>
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
            <p class="xs-legend"><i class="full"></i>выполнено <i></i>осталось</p>
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
                <span class="t"><b>${esc(L.short === 'Основание' ? 'Основание' : L.name.replace('Насыпь, слой', 'Слой'))}</b><span class="num">${L.frac > 0 ? `${num(L.done)} из ${num(L.design)} ${L.unit}` : `по графику с ${date(new Date(L.planStart))}`}</span></span>
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
        ${L.frac <= 0 ? `<dt>Начало по графику</dt><dd>${date(new Date(L.planStart))}</dd>` : ''}
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
    const nowNote = !p.started ? `Плановое начало ${date(p.startDate)}` : cur ? `Этап ${p.current + 1} из ${p.stages.length}` : 'Все этапы приняты';
    const nowCls = !p.started ? 'none' : !cur ? 'done' : p.delayed ? 'late' : 'work';

    return `
      <section class="card hero-card">
        <div class="hero-top">
          <div>
            <h1 class="chain">ПК ${p.i}<span>+00</span> — ПК ${p.i + 1}<span>+00</span></h1>
            <p class="muted">${num(p.i / 10)}–${num(p.km)} км трассы</p>
          </div>
          <div class="spacer"></div>
          <div class="date-box"><span>${p.started ? 'Дата начала СМР' : 'Начало СМР по плану'}</span><b class="num">${date(p.startDate)}</b></div>
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
      </section>

      <section class="card">
        <div class="contractor-block">
          <div style="flex:1;min-width:220px">
            <span class="cell-label">Подрядная организация</span>
            <h3>${esc(c.name)}</h3>
            <p>Задействован на ПК ${c.from} – ПК ${c.to} (${num((c.to - c.from) / 10)} км)</p>
          </div>
          <button class="btn" data-contract>${I.doc}Посмотреть договор</button>
        </div>
        <div class="people">${c.team.map(personHTML).join('')}${D.SUPERVISION.map(personHTML).join('')}</div>
      </section>

      <div class="facts">
        <div class="fact">
          <span>Техника на пикете</span><b class="num">${p.machinery.length} ${plural(p.machinery.length, 'единица', 'единицы', 'единиц')}</b>
          ${p.machinery.length ? `<div class="chips">${p.machinery.map((x) => `<span class="chip">${esc(x)}</span>`).join('')}</div>` : `<small>${p.started ? 'Сегодня техника не выставлена' : 'Работы не начаты'}</small>`}
        </div>
        <div class="fact"><span>Рабочая сила</span><b class="num">${p.workers} ${plural(p.workers, 'человек', 'человека', 'человек')}</b><small>${p.workers ? 'на текущей смене' : 'нет людей на смене'}</small></div>
        <div class="fact"><span>Последняя геодезическая съёмка</span><b class="num">${date(p.lastSurvey)}</b><small>${p.lastSurvey ? daysBetween(p.lastSurvey, D.TODAY) + ' дн. назад' : 'съёмок ещё не было'}</small></div>
        <div class="fact ${daysToNext < 0 ? 'warn' : ''}"><span>Следующая геодезическая съёмка</span><b class="num">${date(p.nextSurvey)}</b><small>${nextTxt}</small></div>
      </div>

      <div class="facts two">
        <div class="fact"><span>Объём выполненных работ, грунт и щебень</span><b class="num">${num(p.doneVolume, 1)} м³</b><small>из ${num(p.designVolume, 1)} м³ по проекту</small><div class="bar"><i style="width:${pct(p.doneVolume / p.designVolume)}"></i></div></div>
        <div class="fact"><span>Покрытие</span>${['bitumen', 'recycler'].map((id) => {
          const L = p.layers.find((x) => x.id === id);
          return `<div class="cover-row"><span>${L.short}</span><b class="num">${num(L.done)} из ${num(L.design)} ${L.unit}</b></div><div class="bar"><i style="width:${pct(L.frac)}"></i></div>`;
        }).join('')}</div>
      </div>

      <div class="cards-3">
        <section class="card">
          <div class="card-head"><h3>Геодезия</h3></div>
          ${docsHTML(p.docsGeo, 'geo')}
        </section>
        <section class="card">
          <div class="card-head"><h3>Лаборатория</h3></div>
          ${docsHTML(p.docsLab, 'lab')}
        </section>
        <section class="card">
          <div class="card-head"><h3>Примечание (фото)</h3></div>
          ${p.note ? `<div class="note ${p.delayed ? '' : 'ok'}">${esc(p.note)}</div>` : ''}
          ${p.photos.length ? `<div class="photos">${p.photos.map((ph, k) => `<button class="photo" data-photo="${k}" aria-label="${esc(ph.caption)}">${photoSVG(ph, p)}<span>${dateShort(ph.date)}</span></button>`).join('')}</div>` : '<p class="empty">Фото появятся после первого выезда на пикет.</p>'}
        </section>
      </div>

      <section class="card">
        <div class="card-head"><h3>Журнал работ</h3><div class="spacer"></div><span class="muted" style="font-size:12.5px">${p.events.length} ${plural(p.events.length, 'запись', 'записи', 'записей')}</span></div>
        ${p.events.length ? `<ol class="timeline">${p.events.map((e) => `
          <li><span class="d num">${date(e.date)}</span><span class="ico ${e.type}">${{ geo: I.pin, work: I.check, progress: I.pin, lab: I.flask, warn: I.alert }[e.type]}</span>
          <div class="t">${esc(e.text)}<span>${esc(e.who)}</span></div></li>`).join('')}</ol>` : `<p class="empty">Записей пока нет. Работы на пикете начнутся ${date(p.startDate)}.</p>`}
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
