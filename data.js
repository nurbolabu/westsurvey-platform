/* Демо-данные прототипа. В рабочей версии приходят из API (PostGIS + KML/GeoJSON трассы). */
(function () {
  let seed = 20261029;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  const TODAY = new Date('2026-10-29');
  const addDays = (d, n) => new Date(d.getTime() + n * 86400000);

  const N = 200; // пикетов по 100 м → 20 км

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

  const CONTRACTORS = [
    {
      id: 'akzh', name: 'ТОО «Актобе Жол Курылыс»', short: 'Актобе Жол', from: 0, to: 65, color: '#0B41C7',
      start: '2026-08-17',
      contract: { no: '№ 07/26-СМР', date: '2026-03-02', sum: '3 940 000 000 ₸', until: '2027-08-31', subject: 'Строительство земляного полотна и дорожной одежды, ПК 0 – ПК 65' },
      team: [
        { name: 'Ержан Сарсенов', role: 'Руководитель проекта', phone: '+7 701 000 11 22' },
        { name: 'Айдос Кенжебаев', role: 'Прораб участка', phone: '+7 702 000 33 44' },
        { name: 'Мадина Жумагулова', role: 'Инженер ПТО', phone: '+7 705 000 55 66' },
      ],
    },
    {
      id: 'zak', name: 'ТОО «ЗАК ТРАНС»', short: 'ЗАК ТРАНС', from: 65, to: 120, color: '#3BA9F5',
      start: '2026-09-07',
      contract: { no: '№ 12/26-СМР', date: '2026-04-15', sum: '3 310 000 000 ₸', until: '2027-09-30', subject: 'Строительство земляного полотна и дорожной одежды, ПК 65 – ПК 120' },
      team: [
        { name: 'Нурлан Абдрахманов', role: 'Руководитель проекта', phone: '+7 701 000 77 88' },
        { name: 'Серик Тулегенов', role: 'Прораб участка', phone: '+7 707 000 99 10' },
        { name: 'Алия Бекмуханова', role: 'Инженер ПТО', phone: '+7 708 000 12 13' },
      ],
    },
    {
      id: 'btk', name: 'ТОО «Батыс Транс Құрылыс»', short: 'Батыс Транс', from: 120, to: 200, color: '#FF8562',
      start: '2026-10-05',
      contract: { no: '№ 19/26-СМР', date: '2026-06-10', sum: '4 760 000 000 ₸', until: '2027-11-30', subject: 'Строительство земляного полотна и дорожной одежды, ПК 120 – ПК 200' },
      team: [
        { name: 'Бауыржан Утепов', role: 'Руководитель проекта', phone: '+7 701 000 14 15' },
        { name: 'Руслан Есенгалиев', role: 'Прораб участка', phone: '+7 775 000 16 17' },
        { name: 'Динара Касымова', role: 'Инженер ПТО', phone: '+7 776 000 18 19' },
      ],
    },
  ];

  const SUPERVISION = [
    { name: 'Арман Жаксылыков', role: 'Старший геодезист · WestSurvey', phone: '+7 700 000 20 21' },
    { name: 'Асель Нурпеисова', role: 'Технический надзор', phone: '+7 700 000 22 23' },
  ];

  // Профиль готовности вдоль трассы: [ПК, готовность]
  // Начало строительства: в среднем ~10%, идут только основание и слой I насыпи
  const PROFILE = [[0, 0.21], [30, 0.19], [64, 0.13], [65, 0.17], [100, 0.12], [119, 0.07], [120, 0.08], [140, 0.05], [155, 0.02], [165, -0.03], [200, -0.08]];
  const profileAt = (i) => {
    for (let k = 0; k < PROFILE.length - 1; k++) {
      const [a, va] = PROFILE[k], [b, vb] = PROFILE[k + 1];
      if (i >= a && i <= b) return va + ((vb - va) * (i - a)) / (b - a);
    }
    return 0;
  };

  const fmtFile = (pk, s) => s.replace('{pk}', pk);

  const pickets = [];
  let noise = 0;
  for (let i = 0; i < N; i++) {
    noise = noise * 0.7 + (rnd() - 0.5) * 0.05;
    const c = CONTRACTORS.find((x) => i >= x.from && i < x.to);
    let p = clamp(profileAt(i) + noise, 0, 1);
    if (p > 0.97) p = 1;
    if (p < 0.012) p = 0;

    const x = p * LAYERS.length;
    const layers = LAYERS.map((L, k) => {
      const design = +(L.design * (0.88 + rnd() * 0.24)).toFixed(1);
      const frac = clamp(x - k, 0, 1);
      return { ...L, design, done: +(design * frac).toFixed(1), frac };
    });

    // этапы
    const postDone = p === 1 ? (i < 40 ? 2 : i < 60 ? 1 : 0) : 0;
    const stages = STAGES.map((name, s) => {
      let done = p >= STAGE_AT[s] && STAGE_AT[s] < 1;
      if (s === 6) done = p === 1;
      if (s === 7) done = postDone >= 1;
      if (s === 8) done = postDone >= 2;
      return { name, done };
    });
    const current = stages.findIndex((s) => !s.done);

    const startDate = addDays(new Date(c.start), Math.round((i - c.from) * 0.9 + rnd() * 4));
    const started = p > 0;
    const lastSurvey = started ? addDays(TODAY, -Math.ceil(rnd() * 13)) : null;
    const nextSurvey = started ? addDays(lastSurvey, 14) : addDays(new Date(c.start), Math.round((i - c.from) * 0.9) + 7);

    const inWork = p > 0 && p < 1;
    const delayed = inWork && noise < -0.016;
    const status = p === 1 ? 'done' : delayed ? 'late' : inWork ? 'work' : 'none';

    // техника и люди сегодня стоят только на активных фронтах работ
    const active = inWork && (i === 100 || rnd() < 0.12);
    const nMach = active ? 2 + Math.floor(rnd() * 5) : 0;
    const machinery = [];
    const pool = [...MACHINES];
    for (let m = 0; m < nMach; m++) machinery.push(pool.splice(Math.floor(rnd() * pool.length), 1)[0]);
    const workers = active ? 6 + Math.floor(rnd() * 18) : 0;

    // журнал работ
    const events = [];
    if (started) {
      const span = Math.max(5, (TODAY - startDate) / 86400000 - 2);
      events.push({ date: startDate, type: 'geo', text: 'Геодезическая разбивка оси и границ земляного полотна', who: 'WestSurvey' });
      layers.forEach((L, k) => {
        if (L.frac <= 0) return;
        const d = addDays(startDate, Math.round(span * ((k + L.frac) / Math.max(x, 1))));
        if (L.frac >= 1) {
          events.push({ date: d, type: 'work', text: `${L.name}: выполнено ${fmtNum(L.done)} ${L.unit}`, who: c.short });
          if (L.group === 'earth' && rnd() > 0.35) {
            const kU = (0.95 + rnd() * 0.04).toFixed(2);
            events.push({ date: addDays(d, 1), type: 'lab', text: `Лаборатория: коэффициент уплотнения ${kU.replace('.', ',')} (норма ≥ 0,95)`, who: 'Лаборатория' });
          }
        } else {
          events.push({ date: d, type: 'progress', text: `${L.name}: в работе, ${Math.round(L.frac * 100)}%`, who: c.short });
        }
      });
      events.push({ date: lastSurvey, type: 'geo', text: 'Исполнительная геодезическая съёмка', who: 'WestSurvey' });
      if (delayed) events.push({ date: addDays(TODAY, -2), type: 'warn', text: 'Отставание от графика: нехватка самосвалов на вывозке грунта', who: 'Технадзор' });
    }
    events.sort((a, b) => b.date - a.date);

    const pk = String(i);
    const docsGeo = started
      ? [
          { name: fmtFile(pk, 'Акт разбивки ПК {pk}.pdf'), date: startDate, size: '1,2 МБ' },
          { name: fmtFile(pk, 'Исполнительная съёмка ПК {pk}.dwg'), date: lastSurvey, size: '3,8 МБ' },
          ...(p > 0.5 ? [{ name: fmtFile(pk, 'Продольный профиль ПК {pk}.pdf'), date: addDays(lastSurvey, -14), size: '0,9 МБ' }] : []),
        ]
      : [];
    const docsLab = layers
      .filter((L) => L.frac >= 1 && L.group === 'earth')
      .slice(-3)
      .map((L) => ({ name: `Протокол уплотнения — ${L.short}.pdf`, date: addDays(startDate, Math.round(rnd() * 40)), size: '0,4 МБ' }));
    if (layers[6].frac > 0) docsLab.push({ name: 'Гранулометрический состав щебня.pdf', date: addDays(lastSurvey, -3), size: '0,6 МБ' });

    const photoCount = started ? 2 + Math.floor(rnd() * 4) : 0;
    const photos = Array.from({ length: photoCount }, (_, k) => ({
      date: addDays(lastSurvey || TODAY, -k * 9),
      caption: pick(['Отсыпка насыпи', 'Уплотнение катком', 'Планировка автогрейдером', 'Разбивка оси', 'Устройство щебня', 'Общий вид участка']),
      tone: k % 4,
    }));

    const doneVolume = layers.filter((L) => L.unit === 'м³').reduce((s, L) => s + L.done, 0);
    const designVolume = layers.filter((L) => L.unit === 'м³').reduce((s, L) => s + L.design, 0);

    pickets.push({
      i, pk, label: `ПК ${i} – ${i + 1}`, km: (i + 1) / 10, contractor: c, progress: p, status, delayed,
      plan: Math.min(1, p + (delayed ? 0.045 : started ? 0.008 : 0)),
      layers, stages, current, startDate, started, lastSurvey, nextSurvey, machinery, workers,
      events, docsGeo, docsLab, photos, doneVolume, designVolume,
      note: delayed ? 'Отставание от графика на 6 дней. Подрядчику направлено предписание.' : p === 1 ? 'Работы на пикете завершены, замечаний нет.' : '',
    });
  }

  function fmtNum(v) {
    return Number(v).toLocaleString('ru-RU', { maximumFractionDigits: 1 });
  }

  window.DATA = {
    TODAY, N, LAYERS, STAGES, CONTRACTORS, SUPERVISION, pickets,
    project: {
      name: 'Строительство автомобильной дороги',
      region: 'Актюбинская область',
      length: 20,
      customer: 'Заказчик (демо)',
    },
  };
})();
