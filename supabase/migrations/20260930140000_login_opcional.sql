-- Chave para ligar/desligar a exigência de login. Com login desligado, o sistema volta a
-- ser de acesso livre (todos com as permissões de administrador); perfis, auditoria e
-- regras ficam prontos para quando a chave for ligada:
--   update public.app_config set login_obrigatorio = true;
create table public.app_config (
  id int primary key default 1 check (id = 1),
  login_obrigatorio boolean not null default false
);
insert into public.app_config (id, login_obrigatorio) values (1, false);
alter table public.app_config enable row level security;
create policy leitura_livre on public.app_config for select to anon, authenticated using (true);
create policy alteracao_admin on public.app_config
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
grant select on public.app_config to anon, authenticated;

create or replace function public.login_obrigatorio()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select login_obrigatorio from public.app_config where id = 1), true);
$$;

create or replace function public.is_aprovado()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select not public.login_obrigatorio() or exists (
    select 1 from public.profiles p join auth.users u on u.id = p.id
    where p.id = auth.uid() and p.aprovado and u.email_confirmed_at is not null
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select not public.login_obrigatorio() or exists (
    select 1 from public.profiles p join auth.users u on u.id = p.id
    where p.id = auth.uid() and p.aprovado and p.perfil = 'admin' and u.email_confirmed_at is not null
  );
$$;

-- Regras passam a valer também para acesso sem login (anon); com a chave ligada,
-- is_aprovado()/is_admin() voltam a exigir login e anon não enxerga nada.
do $$
declare pol record;
begin
  for pol in
    select p.polname, c.relname
    from pg_policy p join pg_class c on c.oid = p.polrelid join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname <> 'app_config'
  loop
    execute format('alter policy %I on public.%I to anon, authenticated', pol.polname, pol.relname);
  end loop;
end $$;

grant select, insert, update, delete on all tables in schema public to anon;
grant usage, select on all sequences in schema public to anon;
grant execute on all functions in schema public to anon;
revoke execute on function public.fn_auditoria() from anon;
revoke execute on function public.fn_novo_usuario() from anon;
revoke execute on function public.vincula_plano_fluidos_betoneira() from anon;
