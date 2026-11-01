/* Демо-данные прототипа. В рабочей версии приходят из API (PostGIS + KML/GeoJSON трассы). */
(function () {
  let seed = 20261029;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  const TODAY = new Date('2026-11-02');
  const addDays = (d, n) => new Date(d.getTime() + n * 86400000);

  // Число пикетов берётся из оси трассы (config.js); демо-объёмы и участки масштабируются под него
  const N = (window.WS_CONFIG && window.WS_CONFIG.picketCount) || 200;
  const SC = N / 200;
  const at = (pk) => Math.round(pk * SC);

  // Конструкция: снизу вверх (как на эскизе)
  const LAYERS = [
    { id: 'base', planStart: '2026-08-17', name: 'Выемка / засыпка основания', short: 'Основание', unit: 'м³', design: 650.4, h: 64, color: '#8a6a4a', pattern: 'hatch', group: 'earth' },
    { id: 's1', planStart: '2026-09-21', name: 'Насыпь, слой I (грунт)', short: 'Слой I', unit: 'м³', design: 940, h: 70, color: '#a5784a', pattern: 'hatch2', group: 'earth' },
    { id: 's2', planStart: '2027-04-12', name: 'Насыпь, слой II (грунт)', short: 'Слой II', unit: 'м³', design: 446.5, h: 56, color: '#b98a52', pattern: 'wave', group: 'earth' },
    { id: 's3', planStart: '2027-05-03', name: 'Насыпь, слой III (грунт)', short: 'Слой III', unit: 'м³', design: 650, h: 54, color: '#c99c5f', pattern: 'wave', group: 'earth' },
    { id: 's4', planStart: '2027-05-24', name: 'Насыпь, слой IV (грунт)', short: 'Слой IV', unit: 'м³', design: 410, h: 44, color: '#d4ad72', pattern: 'wave', group: 'earth' },
    { id: 's5', planStart: '2027-06-14', name: 'Насыпь, слой V (глинистый)', short: 'Слой V', unit: 'м³', design: 380, h: 42, color: '#c4a27e', pattern: 'wave2', group: 'earth' },
    { id: 'gravel', planStart: '2027-07-05', name: 'Щебень Р600 (КЗ, МЗ)', short: 'Щебень', unit: 'м³', design: 120, h: 50, color: '#7d8796', pattern: 'dots', group: 'pave' },
    { id: 'bitumen', planStart: '2027-08-09', name: 'Розлив битума', short: 'Битум', unit: 'т', design: 9, h: 40, color: '#2b2f36', pattern: 'solid', group: 'pave' },
    { id: 'recycler', planStart: '2027-08-30', name: 'Recycler (ресайклинг)', short: 'Recycler', unit: 'м²', design: 140, h: 42, color: '#445066', pattern: 'diag', group: 'pave' },
  ];

  const STAGES = [
    'Геодезическая разбивка',
    'Срезка / отсыпка (насыпь)',
    'Подготовка дорожной одежды',
    'Щебень (КЗ, МЗ)',
    'Глинистый слой',
    'Розлив битума',
    'Recycler',
    'Укрепление обочин / откосов',
    'Контрольно-исполнительная съёмка',
  ];
  // Доля готовности, при которой этап считается завершённым
  const STAGE_AT = [0.02, 0.56, 0.62, 0.778, 0.667, 0.889, 1, 1, 1];

  const MACHINES = ['Самосвал', 'Каток', 'Экскаватор', 'Погрузчик', 'Автогрейдер', 'Бульдозер', 'Автогудронатор', 'Рециклер'];

  // Фактические данные объекта на 02.11.2026 (участки подрядчиков и выполненные работы)
  const mk = (id, name, short, from, to, color) => ({ id, name, short, from, to, color, start: '2026-11-02',
    contract: { no: 'не внесён', date: null, sum: '—', until: null, subject: '' }, team: [] });
  const CONTRACTORS = [
    mk('zak', 'ТОО «ЗАК ТРАНС»', 'ЗАК ТРАНС', 0, 110, '#0B41C7'),
    mk('eko', 'ТОО «ЭКО ПЛАСТ»', 'ЭКО ПЛАСТ', 110, 210, '#3BA9F5'),
    mk('tbd', 'Подрядчик не определён', 'Не определён', 210, 310, '#9AA3B2'),
    mk('arm', 'ТОО «Армандастар»', 'Армандастар', 310, N, '#FF8562'),
  ];
  CONTRACTORS.forEach((c) => { c.section = c.from < 310 ? 1 : 2; });
  // Геодезическая разбивка и работы: [ПК от, ПК до), ПК до не включительно
  const STAKEOUT = [[50, 78], [190, 210], [218, 248], [352, N]];
  const WORKS = [{ layer: 's1', from: 390, to: 550, text: 'Отсыпка первого слоя' }];

  const SUPERVISION = [];

  // Профиль готовности вдоль трассы: [ПК, готовность]
  // Начало строительства: в среднем ~10%, идут только основание и слой I насыпи
  const PROFILE = [[0, 0.21], [30, 0.19], [64, 0.13], [65, 0.17], [100, 0.12], [119, 0.07], [120, 0.08], [140, 0.05], [155, 0.02], [165, -0.03], [200, -0.08]];
  const profileAt = (i) => {
    for (let k = 0; k < PROFILE.length - 1; k++) {
      const [a, va] = PROFILE[k], [b, vb] = PROFILE[k + 1];
      const x = i / SC;
      if (x >= a && x <= b) return va + ((vb - va) * (x - a)) / (b - a);
    }
    return 0;
  };

  const fmtFile = (pk, s) => s.replace('{pk}', pk);

  function generate() {
  const pickets = [];
  for (let i = 0; i < N; i++) {
    const c = CONTRACTORS.find((x) => i >= x.from && i < x.to) || CONTRACTORS[CONTRACTORS.length - 1];
    // проектные объёмы пока типовые, до загрузки ведомости объёмов
    const layers = LAYERS.map((L) => ({ ...L, design: L.design, done: 0, frac: 0, active: false }));
    const staked = STAKEOUT.some(([a, b]) => i >= a && i < b);
    const works = WORKS.filter((w) => i >= w.from && i < w.to);
    works.forEach((w) => { const L = layers.find((x) => x.id === w.layer); if (L) L.active = true; });
    const started = staked || works.length > 0;
    const stages = STAGES.map((name, k) => ({ name, done: k === 0 && staked }));
    const current = works.length ? 1 : staked ? 1 : 0;
    const events = [];
    if (staked) events.push({ date: TODAY, type: 'geo', text: 'Геодезическая разбивка выполнена', who: 'WestSurvey' });
    works.forEach((w) => events.push({ date: TODAY, type: 'progress', text: `${w.text}: в работе на ПК ${w.from} – ПК ${w.to}`, who: c.short }));
    const status = started ? 'work' : 'none';
    pickets.push({
      i, pk: String(i), label: `ПК ${i} – ${i + 1}`, km: (i + 1) / 10, contractor: c, progress: 0, plan: 0, status, delayed: false,
      layers, stages, current, startDate: TODAY, started, lastSurvey: staked ? TODAY : null, nextSurvey: null,
      machinery: [], workers: 0, events,
      docsGeo: staked ? [{ name: `Акт разбивки ПК ${i}`, date: TODAY, size: '—' }] : [],
      docsLab: [], photos: [],
      doneVolume: 0, designVolume: layers.filter((L) => L.unit === 'м³').reduce((s, L) => s + L.design, 0),
      note: works.length ? works.map((w) => `${w.text} на ПК ${w.from} – ПК ${w.to}, объём не внесён`).join('. ') : '',
    });
  }
  return pickets;
  }

  // Пересчёт производных полей пикета после внесения данных
  function recompute(p) {
    p.layers.forEach((L) => { L.frac = L.design ? clamp(L.done / L.design, 0, 1) : 0; });
    const prog = p.layers.reduce((s, L) => s + L.frac, 0) / LAYERS.length;
    p.progress = prog >= 0.999 ? 1 : prog;
    p.plan = Math.max(p.plan, p.progress);
    if (p.progress > 0) p.started = true;
    p.stages.forEach((s, k) => {
      if (k < 6) s.done = k === 0 ? p.started : p.progress >= STAGE_AT[k];
      if (k === 6) s.done = p.progress >= 1;
    });
    p.current = p.stages.findIndex((s) => !s.done);
    p.status = p.progress >= 1 ? 'done' : p.delayed ? 'late' : p.progress > 0 ? 'work' : 'none';
    p.doneVolume = p.layers.filter((L) => L.unit === 'м³').reduce((s, L) => s + L.done, 0);
    p.designVolume = p.layers.filter((L) => L.unit === 'м³').reduce((s, L) => s + L.design, 0);
    p.events.sort((a, b) => b.date - a.date);
  }

  function fmtNum(v) {
    return Number(v).toLocaleString('ru-RU', { maximumFractionDigits: 1 });
  }

  window.DATA = {
    TODAY, N, LAYERS, STAGES, CONTRACTORS, SUPERVISION, MACHINES,
    pickets: generate(),
    generate, recompute,
    project: {
      name: 'Автодорога Асан – Азгир – Балкудык',
      region: 'Атырауская область',
      length: Math.round(N / 10),
      customer: 'Заказчик (демо)',
    },
  };
})();
