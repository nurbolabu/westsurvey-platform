/*
  Карта трассы на MapLibre GL (совместима со стилями и тайлами Mapbox).
  Источники:
    - с токеном Mapbox: спутник Mapbox Satellite Streets и рельеф Mapbox Terrain DEM;
    - без токена: снимки Esri World Imagery и рельеф AWS Terrain Tiles.
  Геометрия трассы: загруженный KML/GeoJSON (Ввод данных → Трасса) или демо-линия
  из config.js. Пикеты строятся по оси трассы через каждые picketStep метров.
*/
(function () {
  const R = 6371008.8;
  const rad = (d) => (d * Math.PI) / 180;
  const dist = (a, b) => {
    const dLat = rad(b[1] - a[1]), dLon = rad(b[0] - a[0]);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[1])) * Math.cos(rad(b[1])) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  };

  // Сглаживание демо-линии (Catmull-Rom), чтобы трасса не была ломаной
  function smooth(pts, n = 10) {
    if (pts.length < 3) return pts;
    const out = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      for (let t = 0; t < n; t++) {
        const s = t / n, s2 = s * s, s3 = s2 * s;
        out.push([0, 1].map((k) => 0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * s + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * s2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * s3)));
      }
    }
    out.push(pts[pts.length - 1]);
    return out;
  }

  function measure(coords) {
    const cum = [0];
    for (let i = 1; i < coords.length; i++) cum.push(cum[i - 1] + dist(coords[i - 1], coords[i]));
    return cum;
  }
  function pointAt(coords, cum, d) {
    if (d <= 0) return coords[0];
    for (let i = 1; i < coords.length; i++) {
      if (cum[i] >= d) {
        const t = (d - cum[i - 1]) / (cum[i] - cum[i - 1] || 1);
        return [coords[i - 1][0] + (coords[i][0] - coords[i - 1][0]) * t, coords[i - 1][1] + (coords[i][1] - coords[i - 1][1]) * t];
      }
    }
    return coords[coords.length - 1];
  }

  // Геометрия пикетов: позиции и отрезки по оси трассы
  function geometry() {
    const D = window.DATA, cfg = window.WS_CONFIG;
    const imported = window.WS.Store.route();
    let coords = imported ? imported.coords : smooth(cfg.demoRoute);
    let cum = measure(coords);
    if (!imported) {
      // демо-линию обрезаем ровно по последнему пикету
      const want0 = D.N * cfg.picketStep;
      const cut = cum.findIndex((d) => d >= want0);
      if (cut > 0) { coords = coords.slice(0, cut).concat([pointAt(coords, cum, want0)]); cum = measure(coords); }
    }
    const length = cum[cum.length - 1];
    const want = D.N * cfg.picketStep;
    // если длина загруженной оси сильно отличается от числа пикетов, растягиваем шаг
    const step = !imported && length >= want ? cfg.picketStep : Math.abs(length - want) / want < 0.05 ? cfg.picketStep : length / D.N;
    const pos = [], segs = [];
    for (let i = 0; i <= D.N; i++) pos.push(pointAt(coords, cum, i * step));
    for (let i = 0; i < D.N; i++) {
      const s = [];
      for (let k = 0; k <= 4; k++) s.push(pointAt(coords, cum, (i + k / 4) * step));
      segs.push(s);
    }
    return { coords, length, step, pos, segs, imported: !!imported, name: imported ? imported.name : 'Демо-трасса' };
  }

  function styleFor(token) {
    const sat = token
      ? { type: 'raster', tiles: [`https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/tiles/512/{z}/{x}/{y}@2x?access_token=${token}`], tileSize: 512, maxzoom: 20, attribution: '© Mapbox © OpenStreetMap © Maxar' }
      : { type: 'raster', tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'], tileSize: 256, maxzoom: 19, attribution: 'Снимки © Esri, Maxar, Earthstar Geographics' };
    const dem = () => (token
      ? { type: 'raster-dem', tiles: [`https://api.mapbox.com/v4/mapbox.mapbox-terrain-dem-v1/{z}/{x}/{y}.pngraw?access_token=${token}`], tileSize: 512, maxzoom: 14, encoding: 'mapbox' }
      : { type: 'raster-dem', tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'], tileSize: 256, maxzoom: 15, encoding: 'terrarium', attribution: 'Рельеф © Mapzen, AWS Terrain Tiles' });
    const sources = { sat, dem: dem(), demShade: dem() };
    const layers = [
      { id: 'sat', type: 'raster', source: 'sat' },
      { id: 'shade', type: 'hillshade', source: 'demShade', paint: { 'hillshade-exaggeration': 0.35, 'hillshade-shadow-color': '#2a2418', 'hillshade-highlight-color': '#fffaf0' } },
    ];
    if (!token) {
      sources.labels = { type: 'raster', tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}'], tileSize: 256, maxzoom: 19 };
      layers.push({ id: 'labels', type: 'raster', source: 'labels', paint: { 'raster-opacity': 0.9 } });
    }
    return { version: 8, sources, layers };
  }

  function mount(el, opts) {
    const lib = window.maplibregl;
    if (!lib) return null;
    const token = window.WS.Store.token();
    let geo = geometry();
    const bounds = () => geo.coords.reduce((b, c) => b.extend(c), new lib.LngLatBounds(geo.coords[0], geo.coords[0]));

    const map = new lib.Map({
      container: el,
      style: styleFor(token),
      bounds: bounds(),
      fitBoundsOptions: { padding: opts.padding || 80 },
      pitchWithRotate: true,
      maxPitch: 75,
      attributionControl: { compact: true },
      cooperativeGestures: false,
    });
    map.addControl(new lib.NavigationControl({ visualizePitch: true }), 'bottom-right');
    map.addControl(new lib.ScaleControl({ unit: 'metric' }), 'bottom-left');

    const markers = [];
    let hover = -1;

    const segData = () => ({
      type: 'FeatureCollection',
      features: geo.segs.map((s, i) => {
        const p = window.DATA.pickets[i];
        return { type: 'Feature', id: i, properties: { i, color: opts.color(p), on: opts.matches(p) ? 1 : 0 }, geometry: { type: 'LineString', coordinates: s } };
      }),
    });
    const pointData = () => ({
      type: 'FeatureCollection',
      features: geo.pos.filter((_, i) => i % 10 === 0).map((c, k) => ({ type: 'Feature', properties: { pk: k * 10, major: (k * 10) % 50 === 0 ? 1 : 0 }, geometry: { type: 'Point', coordinates: c } })),
    });

    function placeMarkers() {
      markers.forEach((m) => m.remove());
      markers.length = 0;
      geo.pos.forEach((c, i) => {
        if (i % 10) return;
        const elm = document.createElement('div');
        elm.className = 'pk-tag' + (i % 50 === 0 ? ' major' : '');
        elm.textContent = `ПК ${i}`;
        markers.push(new lib.Marker({ element: elm, anchor: 'bottom', offset: [0, -8] }).setLngLat(c).addTo(map));
      });
      window.DATA.CONTRACTORS.forEach((c) => {
        const elm = document.createElement('div');
        elm.className = 'contr-tag';
        elm.innerHTML = `<i style="background:${c.color}"></i>${c.short}`;
        markers.push(new lib.Marker({ element: elm, anchor: 'top', offset: [0, 14] }).setLngLat(geo.pos[Math.round((c.from + c.to) / 2)]).addTo(map));
      });
      zoomClass();
    }
    function zoomClass() { el.classList.toggle('zoom-far', map.getZoom() < 11.2); }

    map.on('load', () => {
      map.addSource('segs', { type: 'geojson', data: segData() });
      map.addSource('pts', { type: 'geojson', data: pointData() });
      map.addLayer({ id: 'route-casing', type: 'line', source: 'segs', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#ffffff', 'line-width': ['interpolate', ['linear'], ['zoom'], 9, 6, 14, 16] } });
      map.addLayer({ id: 'route', type: 'line', source: 'segs', layout: { 'line-cap': 'butt', 'line-join': 'round' }, paint: {
        'line-color': ['get', 'color'],
        'line-width': ['interpolate', ['linear'], ['zoom'], 9, 3.5, 14, 11],
        'line-opacity': ['case', ['==', ['get', 'on'], 1], 1, 0.25],
      } });
      map.addLayer({ id: 'route-hover', type: 'line', source: 'segs', filter: ['==', ['get', 'i'], -1], paint: { 'line-color': '#0B41C7', 'line-width': ['interpolate', ['linear'], ['zoom'], 9, 8, 14, 20], 'line-opacity': 0.55 } });
      map.addLayer({ id: 'route-hit', type: 'line', source: 'segs', paint: { 'line-color': '#000', 'line-width': 26, 'line-opacity': 0 } });
      map.addLayer({ id: 'pk-dots', type: 'circle', source: 'pts', paint: {
        'circle-radius': ['case', ['==', ['get', 'major'], 1], 6, 4],
        'circle-color': '#fff', 'circle-stroke-color': '#1B2230', 'circle-stroke-width': 2,
      } });
      placeMarkers();
      el.querySelector('.maplibregl-ctrl-attrib')?.classList.remove('maplibregl-compact-show');
      opts.onReady && opts.onReady();
    });
    map.on('zoom', zoomClass);
    map.on('mousemove', 'route-hit', (e) => {
      const i = e.features[0].properties.i;
      map.getCanvas().style.cursor = 'pointer';
      if (i !== hover) { hover = i; map.setFilter('route-hover', ['==', ['get', 'i'], i]); }
      opts.onHover && opts.onHover(e.originalEvent, i);
    });
    map.on('mouseleave', 'route-hit', () => {
      hover = -1;
      map.getCanvas().style.cursor = '';
      map.setFilter('route-hover', ['==', ['get', 'i'], -1]);
      opts.onLeave && opts.onLeave();
    });
    map.on('click', 'route-hit', (e) => opts.onPick && opts.onPick(e.features[0].properties.i));

    return {
      map,
      geo: () => geo,
      update() { if (map.getSource('segs')) map.getSource('segs').setData(segData()); },
      reload() {
        geo = geometry();
        if (!map.getSource('segs')) return;
        map.getSource('segs').setData(segData());
        map.getSource('pts').setData(pointData());
        placeMarkers();
        this.fit();
      },
      fit() { map.fitBounds(bounds(), { padding: opts.padding || 80, pitch: map.getPitch(), duration: 800 }); },
      terrain(on) {
        if (on) { map.setTerrain({ source: 'dem', exaggeration: 1.8 }); map.easeTo({ pitch: 62, bearing: -20, duration: 900 }); }
        else { map.setTerrain(null); map.easeTo({ pitch: 0, bearing: 0, duration: 700 }); }
      },
      flyTo(i) { map.flyTo({ center: geo.pos[i], zoom: 15, duration: 900 }); },
      resize() { map.resize(); },
      destroy() { map.remove(); },
    };
  }

  // ---------- разбор KML / GeoJSON ----------
  function parseRouteFile(text, name) {
    let lines = [], points = [];
    if (/^\s*[{[]/.test(text)) {
      const gj = JSON.parse(text);
      const feats = gj.type === 'FeatureCollection' ? gj.features : gj.type === 'Feature' ? [gj] : [{ geometry: gj, properties: {} }];
      feats.forEach((f) => {
        const g = f.geometry; if (!g) return;
        if (g.type === 'LineString') lines.push(g.coordinates);
        if (g.type === 'MultiLineString') g.coordinates.forEach((c) => lines.push(c));
        if (g.type === 'Point') points.push({ name: (f.properties && (f.properties.name || f.properties.Name)) || '', coord: g.coordinates });
      });
    } else {
      const xml = new DOMParser().parseFromString(text, 'application/xml');
      if (xml.querySelector('parsererror')) throw new Error('Файл не похож на KML: проверьте, что он сохранён как .kml, а не .kmz');
      const parseCoords = (s) => s.trim().split(/\s+/).map((t) => t.split(',').map(Number)).filter((c) => c.length >= 2 && !isNaN(c[0]) && !isNaN(c[1])).map((c) => [c[0], c[1]]);
      xml.querySelectorAll('LineString coordinates').forEach((n) => lines.push(parseCoords(n.textContent)));
      xml.querySelectorAll('Placemark').forEach((pm) => {
        const c = pm.querySelector('Point coordinates');
        if (c) points.push({ name: (pm.querySelector('name') || {}).textContent || '', coord: parseCoords(c.textContent)[0] });
      });
    }
    lines = lines.filter((l) => l.length >= 2);
    if (!lines.length) throw new Error('В файле нет линии оси трассы (LineString). Экспортируйте ось как полилинию.');
    // берём самую длинную линию как ось
    const coords = lines.map((l) => ({ l, len: measure(l).pop() })).sort((a, b) => b.len - a.len)[0].l;
    const bad = coords.some(([x, y]) => Math.abs(x) > 180 || Math.abs(y) > 90);
    if (bad) throw new Error('Координаты не в WGS84 (долгота/широта). Перепроецируйте чертёж в EPSG:4326 перед экспортом.');
    const pickets = points.filter((p) => /пк|pk/i.test(p.name));
    return { name, coords, length: measure(coords).pop(), lines: lines.length, pickets: pickets.length, importedAt: new Date().toISOString() };
  }

  window.WSMap = { mount, geometry, parseRouteFile, available: () => !!window.maplibregl };
})();
