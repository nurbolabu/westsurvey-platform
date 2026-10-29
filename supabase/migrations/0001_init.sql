-- WestSurvey · контроль строительства автодороги
-- Схема базы для Supabase (PostgreSQL 15 + PostGIS).
-- Применение: supabase db push  (или вставить в SQL Editor проекта).

create extension if not exists postgis;

-- ============ справочники ============
create type user_role as enum ('admin', 'customer', 'supervision', 'contractor', 'geodesy', 'lab');
create type entry_status as enum ('pending', 'approved', 'rejected');
create type layer_group as enum ('earth', 'pave');

create table projects (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  region        text,
  picket_step_m numeric not null default 100,
  srid_source   int,                       -- исходная система координат чертежа (например МСК)
  created_at    timestamptz not null default now()
);

create table contractors (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  name       text not null,
  short_name text,
  color      text,
  pk_from    int not null,
  pk_to      int not null,
  check (pk_to > pk_from)
);

create table contracts (
  id            uuid primary key default gen_random_uuid(),
  contractor_id uuid not null references contractors(id) on delete cascade,
  number        text not null,
  signed_on     date,
  valid_until   date,
  amount_kzt    numeric,
  subject       text,
  file_path     text                       -- путь в Storage: contracts/…
);

-- Пользователи: учётная запись Supabase Auth + профиль с ролью
create table profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  full_name     text not null,
  position      text,
  phone         text,
  role          user_role not null default 'customer',
  contractor_id uuid references contractors(id),   -- для подрядчика: только свой участок
  project_id    uuid references projects(id)
);

-- Слои конструкции (порядок снизу вверх)
create table layers (
  id         text primary key,             -- base, s1 … recycler
  project_id uuid not null references projects(id) on delete cascade,
  name       text not null,
  short_name text not null,
  unit       text not null,                -- м³, т, м²
  grp        layer_group not null,
  sort       int not null,
  plan_start date                          -- начало по календарному графику
);

-- ============ геометрия ============
-- Ось трассы (из KML/DWG, WGS84)
create table route (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references projects(id) on delete cascade,
  name        text,
  geom        geometry(LineStringZ, 4326) not null,
  source_file text,
  is_active   boolean not null default true,
  uploaded_by uuid references profiles(id),
  uploaded_at timestamptz not null default now()
);
create index on route using gist (geom);

-- Пикеты: точка на оси и отрезок до следующего пикета
create table pickets (
  project_id    uuid not null references projects(id) on delete cascade,
  pk            int not null,               -- номер пикета
  chainage_m    numeric not null,           -- расстояние от начала трассы
  point         geometry(Point, 4326) not null,
  segment       geometry(LineString, 4326),
  contractor_id uuid references contractors(id),
  start_plan    date,
  primary key (project_id, pk)
);
create index on pickets using gist (segment);

-- Прочие слои карты: граница полосы отвода, искусственные сооружения, карьеры
create table map_features (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  kind       text not null,                 -- right_of_way | culvert | bridge | quarry | asphalt_plant
  name       text,
  props      jsonb not null default '{}',
  geom       geometry(Geometry, 4326) not null
);
create index on map_features using gist (geom);

-- ============ проект и факт ============
-- Проектные объёмы по пикету и слою (из ведомости объёмов / CSV)
create table design_volumes (
  project_id uuid not null,
  pk         int not null,
  layer_id   text not null references layers(id),
  volume     numeric not null check (volume >= 0),
  primary key (project_id, pk, layer_id),
  foreign key (project_id, pk) references pickets(project_id, pk) on delete cascade
);

-- Ежедневные отчёты подрядчика: объём за смену на участок пикетов
create table work_reports (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references projects(id),
  pk_from     int not null,
  pk_to       int not null,                 -- не включительно: 100–105 = пикеты 100…104
  layer_id    text not null references layers(id),
  volume      numeric not null check (volume > 0),
  work_date   date not null,
  machinery   text[] not null default '{}',
  workers     int,
  note        text,
  status      entry_status not null default 'pending',
  author_id   uuid not null references profiles(id) default auth.uid(),
  reviewed_by uuid references profiles(id),
  reviewed_at timestamptz,
  created_at  timestamptz not null default now(),
  check (pk_to > pk_from)
);

-- Распределение подтверждённого отчёта по пикетам (заполняет триггер)
create table work_volumes (
  report_id uuid not null references work_reports(id) on delete cascade,
  project_id uuid not null,
  pk        int not null,
  layer_id  text not null references layers(id),
  volume    numeric not null,
  primary key (report_id, pk)
);

create table surveys (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references projects(id),
  pk_from     int not null,
  pk_to       int not null,
  kind        text not null,                -- Исполнительная съёмка, Акт разбивки …
  survey_date date not null,
  next_date   date,
  file_path   text,                         -- Storage: surveys/…
  status      entry_status not null default 'pending',
  author_id   uuid not null references profiles(id) default auth.uid(),
  reviewed_by uuid references profiles(id),
  created_at  timestamptz not null default now()
);

create table lab_tests (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references projects(id),
  pk_from     int not null,
  pk_to       int not null,
  layer_id    text references layers(id),
  test        text not null,                -- Коэффициент уплотнения …
  value       text not null,
  passed      boolean not null,
  test_date   date not null,
  file_path   text,
  status      entry_status not null default 'pending',
  author_id   uuid not null references profiles(id) default auth.uid(),
  reviewed_by uuid references profiles(id),
  created_at  timestamptz not null default now()
);

create table photos (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id),
  pk         int not null,
  report_id  uuid references work_reports(id) on delete set null,
  file_path  text not null,                 -- Storage: photos/…
  taken_at   timestamptz,
  location   geometry(Point, 4326),         -- координаты из EXIF или телефона
  caption    text,
  author_id  uuid references profiles(id) default auth.uid()
);

-- ============ распределение объёма при подтверждении ============
create or replace function distribute_report() returns trigger language plpgsql as $$
declare
  total_left numeric;
begin
  if new.status <> 'approved' or old.status = 'approved' then return new; end if;

  select sum(greatest(dv.volume - coalesce(f.done, 0), 0)) into total_left
  from design_volumes dv
  left join (select pk, layer_id, sum(volume) done from work_volumes where project_id = new.project_id group by 1, 2) f
    on f.pk = dv.pk and f.layer_id = dv.layer_id
  where dv.project_id = new.project_id and dv.layer_id = new.layer_id and dv.pk >= new.pk_from and dv.pk < new.pk_to;

  if coalesce(total_left, 0) = 0 then return new; end if;

  insert into work_volumes (report_id, project_id, pk, layer_id, volume)
  select new.id, new.project_id, dv.pk, dv.layer_id,
         least(new.volume, total_left) * greatest(dv.volume - coalesce(f.done, 0), 0) / total_left
  from design_volumes dv
  left join (select pk, layer_id, sum(volume) done from work_volumes where project_id = new.project_id group by 1, 2) f
    on f.pk = dv.pk and f.layer_id = dv.layer_id
  where dv.project_id = new.project_id and dv.layer_id = new.layer_id and dv.pk >= new.pk_from and dv.pk < new.pk_to;

  new.reviewed_at := now();
  return new;
end $$;

create trigger work_reports_approved
  before update of status on work_reports
  for each row execute function distribute_report();

-- ============ представления для фронтенда ============
-- Готовность слоя на пикете
create view v_layer_progress as
select dv.project_id, dv.pk, dv.layer_id, dv.volume as design,
       coalesce(sum(wv.volume), 0) as done,
       least(coalesce(sum(wv.volume), 0) / nullif(dv.volume, 0), 1) as frac
from design_volumes dv
left join work_volumes wv on wv.project_id = dv.project_id and wv.pk = dv.pk and wv.layer_id = dv.layer_id
group by dv.project_id, dv.pk, dv.layer_id, dv.volume;

-- Пикет целиком: готовность, последняя съёмка, геометрия для карты
create view v_picket_status as
select p.project_id, p.pk, p.chainage_m, p.contractor_id, p.segment,
       avg(lp.frac) as progress,
       (select max(survey_date) from surveys s where s.project_id = p.project_id and s.status = 'approved' and p.pk >= s.pk_from and p.pk < s.pk_to) as last_survey,
       (select max(next_date)   from surveys s where s.project_id = p.project_id and s.status = 'approved' and p.pk >= s.pk_from and p.pk < s.pk_to) as next_survey
from pickets p
left join v_layer_progress lp on lp.project_id = p.project_id and lp.pk = p.pk
group by p.project_id, p.pk, p.chainage_m, p.contractor_id, p.segment;

-- GeoJSON для карты одним запросом: select * from picket_geojson('<project id>');
create or replace function picket_geojson(pid uuid) returns jsonb language sql stable as $$
  select jsonb_build_object('type', 'FeatureCollection', 'features', coalesce(jsonb_agg(jsonb_build_object(
    'type', 'Feature', 'id', pk,
    'geometry', st_asgeojson(segment)::jsonb,
    'properties', jsonb_build_object('pk', pk, 'progress', progress, 'last_survey', last_survey, 'next_survey', next_survey, 'contractor_id', contractor_id)
  ) order by pk), '[]'::jsonb))
  from v_picket_status where project_id = pid;
$$;

-- Пикеты по оси: шаг picket_step_m вдоль активной оси трассы
create or replace function rebuild_pickets(pid uuid) returns int language plpgsql as $$
declare
  ax geometry; len numeric; step numeric; n int; i int;
begin
  select st_force2d(geom) into ax from route where project_id = pid and is_active order by uploaded_at desc limit 1;
  select picket_step_m into step from projects where id = pid;
  len := st_length(ax::geography);
  n := floor(len / step);
  delete from pickets where project_id = pid and pk > n;
  for i in 0..n loop
    insert into pickets (project_id, pk, chainage_m, point, segment, contractor_id)
    values (pid, i, i * step,
            st_lineinterpolatepoint(ax, least(i * step / len, 1)),
            case when i < n then st_linesubstring(ax, i * step / len, least((i + 1) * step / len, 1)) end,
            (select id from contractors c where c.project_id = pid and i >= c.pk_from and i < c.pk_to limit 1))
    on conflict (project_id, pk) do update set chainage_m = excluded.chainage_m, point = excluded.point, segment = excluded.segment, contractor_id = excluded.contractor_id;
  end loop;
  return n;
end $$;

-- ============ права доступа (RLS) ============
create or replace function my_role() returns user_role language sql stable security definer as $$
  select role from profiles where id = auth.uid()
$$;
create or replace function my_contractor() returns uuid language sql stable security definer as $$
  select contractor_id from profiles where id = auth.uid()
$$;
-- пикеты участка подрядчика
create or replace function in_my_section(pid uuid, a int, b int) returns boolean language sql stable as $$
  select my_role() <> 'contractor' or exists (
    select 1 from contractors c where c.id = my_contractor() and c.project_id = pid and a >= c.pk_from and b <= c.pk_to)
$$;

alter table work_reports enable row level security;
alter table surveys enable row level security;
alter table lab_tests enable row level security;
alter table photos enable row level security;
alter table design_volumes enable row level security;
alter table route enable row level security;

-- читать могут все вошедшие участники проекта
create policy read_all on work_reports for select to authenticated using (true);
create policy read_all on surveys      for select to authenticated using (true);
create policy read_all on lab_tests    for select to authenticated using (true);
create policy read_all on photos       for select to authenticated using (true);
create policy read_all on design_volumes for select to authenticated using (true);
create policy read_all on route        for select to authenticated using (true);

-- вносить: подрядчик только на своём участке, геодезия съёмки, лаборатория протоколы
create policy add_report on work_reports for insert to authenticated
  with check (my_role() in ('contractor', 'admin') and in_my_section(project_id, pk_from, pk_to) and status = 'pending');
create policy add_survey on surveys for insert to authenticated
  with check (my_role() in ('geodesy', 'admin') and status = 'pending');
create policy add_lab on lab_tests for insert to authenticated
  with check (my_role() in ('lab', 'contractor', 'admin') and status = 'pending');
create policy add_photo on photos for insert to authenticated with check (true);

-- подтверждать: технадзор, заказчик, администратор
create policy review_report on work_reports for update to authenticated using (my_role() in ('supervision', 'customer', 'admin'));
create policy review_survey on surveys      for update to authenticated using (my_role() in ('supervision', 'customer', 'admin'));
create policy review_lab    on lab_tests    for update to authenticated using (my_role() in ('supervision', 'customer', 'admin'));

-- трасса и проектные объёмы: только администратор
create policy admin_route  on route          for all to authenticated using (my_role() = 'admin') with check (my_role() = 'admin');
create policy admin_design on design_volumes for all to authenticated using (my_role() = 'admin') with check (my_role() = 'admin');
