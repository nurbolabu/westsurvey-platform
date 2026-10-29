/*
  Слой данных прототипа.
  Сейчас записи хранятся в браузере (localStorage). В рабочей версии те же
  операции идут в Supabase: таблицы work_reports, surveys, lab_tests,
  design_volumes и route (см. docs/ARCHITECTURE.md и supabase/migrations).
  Интерфейс Store одинаков для обоих вариантов, поэтому экраны менять не придётся.
*/
(function () {
  const D = window.DATA;
  const KEY = 'ws_entries_v1';
  const ROUTE_KEY = 'ws_route_v1';
  const TOKEN_KEY = 'ws_mapbox_token';

  const ls = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } },
    del(k) { try { localStorage.removeItem(k); } catch {} },
  };

  const Store = {
    list() { return ls.get(KEY, []); },
    add(entry) {
      const list = this.list();
      const e = { ...entry, id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), createdAt: new Date().toISOString(), status: 'pending' };
      list.unshift(e);
      ls.set(KEY, list);
      return e;
    },
    setStatus(id, status, by) {
      const list = this.list().map((e) => (e.id === id ? { ...e, status, reviewedBy: by, reviewedAt: new Date().toISOString() } : e));
      ls.set(KEY, list);
    },
    remove(id) { ls.set(KEY, this.list().filter((e) => e.id !== id)); },
    route() { return ls.get(ROUTE_KEY, null); },
    setRoute(r) { return ls.set(ROUTE_KEY, r); },
    clearRoute() { ls.del(ROUTE_KEY); },
    token() { return ls.get(TOKEN_KEY, '') || (window.WS_CONFIG && window.WS_CONFIG.mapboxToken) || ''; },
    setToken(t) { if (t) ls.set(TOKEN_KEY, t); else ls.del(TOKEN_KEY); },
  };

  const ENTRY_TYPES = {
    report: 'Отчёт о работах',
    survey: 'Геодезическая съёмка',
    lab: 'Лабораторное испытание',
    design: 'Проектные объёмы',
  };

  const fmt = (v) => Number(v).toLocaleString('ru-RU', { maximumFractionDigits: 1 });
  const range = (e) => D.pickets.filter((p) => p.i >= e.pkFrom && p.i < Math.max(e.pkTo, e.pkFrom + 1));
  const day = (s) => new Date(s + 'T12:00:00');

  function applyReport(e) {
    const k = D.LAYERS.findIndex((L) => L.id === e.layer);
    if (k < 0) return;
    const ps = range(e);
    const remaining = ps.reduce((s, p) => s + Math.max(0, p.layers[k].design - p.layers[k].done), 0);
    const vol = Math.min(+e.volume || 0, remaining);
    const isToday = e.date === D.TODAY.toISOString().slice(0, 10);
    ps.forEach((p) => {
      const L = p.layers[k];
      const share = remaining ? (Math.max(0, L.design - L.done) / remaining) * vol : 0;
      L.done = +(L.done + share).toFixed(1);
      p.events.push({ date: day(e.date), type: 'work', text: `${L.name}: +${fmt(share)} ${L.unit} по отчёту`, who: e.author || 'Подрядчик' });
      if (isToday) {
        p.machinery = e.machinery && e.machinery.length ? e.machinery : p.machinery;
        p.workers = e.workers ? Math.max(1, Math.round(e.workers / ps.length)) : p.workers;
      }
      if (e.photos) for (let n = 0; n < e.photos; n++) p.photos.unshift({ date: day(e.date), caption: e.note || L.short, tone: n % 4 });
      if (e.note) p.note = e.note;
      D.recompute(p);
    });
  }

  function applySurvey(e) {
    range(e).forEach((p) => {
      p.lastSurvey = day(e.date);
      if (e.next) p.nextSurvey = day(e.next);
      p.docsGeo.unshift({ name: e.fileName || `${e.kind} ПК ${p.i}.pdf`, date: day(e.date), size: e.fileSize || '—' });
      p.events.push({ date: day(e.date), type: 'geo', text: e.kind, who: e.author || 'WestSurvey' });
      D.recompute(p);
    });
  }

  function applyLab(e) {
    const L = D.LAYERS.find((x) => x.id === e.layer);
    range(e).forEach((p) => {
      p.docsLab.unshift({ name: e.fileName || `Протокол: ${e.test} — ${L ? L.short : ''}.pdf`, date: day(e.date), size: e.fileSize || '—' });
      p.events.push({ date: day(e.date), type: e.ok ? 'lab' : 'warn', text: `Лаборатория: ${e.test} ${e.value} — ${e.ok ? 'соответствует' : 'не соответствует'} (${L ? L.short : ''})`, who: e.author || 'Лаборатория' });
      D.recompute(p);
    });
  }

  function applyDesign(e) {
    (e.rows || []).forEach((r) => {
      const p = D.pickets[r.pk];
      const L = p && p.layers.find((x) => x.id === r.layer);
      if (!L) return;
      L.design = +r.volume;
      L.done = Math.min(L.done, L.design);
      D.recompute(p);
    });
  }

  // Пересобираем данные: база + подтверждённые записи в порядке поступления
  function refresh() {
    D.pickets = D.generate();
    Store.list().slice().reverse().filter((e) => e.status === 'approved').forEach((e) => {
      if (e.type === 'report') applyReport(e);
      if (e.type === 'survey') applySurvey(e);
      if (e.type === 'lab') applyLab(e);
      if (e.type === 'design') applyDesign(e);
    });
  }

  window.WS = { Store, ENTRY_TYPES, refresh };
  refresh();
})();
