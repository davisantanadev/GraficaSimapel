create table if not exists public.access_profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    nome text,
    email text not null unique,
    status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
    is_admin boolean not null default false,
    is_primary boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

alter table if exists public.access_profiles add column if not exists is_primary boolean not null default false;

create table if not exists public.access_requests (
    id uuid primary key default gen_random_uuid(),
    user_id uuid,
    nome text,
    email text not null unique,
    status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
    requested_admin boolean not null default false,
    reviewed_by uuid,
    reviewed_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

alter table if exists public.access_requests add column if not exists user_id uuid;
alter table if exists public.access_requests add column if not exists requested_admin boolean not null default false;
alter table if exists public.access_requests add column if not exists reviewed_by uuid;
alter table if exists public.access_requests add column if not exists reviewed_at timestamptz;

create or replace function public.is_access_admin(user_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
    select exists (
        select 1
        from public.access_profiles
        where id = user_id
          and status = 'approved'
          and is_admin = true
    );
$$;

create or replace function public.create_access_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    insert into public.access_profiles (id, nome, email, status, is_admin)
    values (
        new.id,
        coalesce(new.raw_user_meta_data ->> 'nome', new.email),
        new.email,
        'pending',
        false
    )
    on conflict (id) do update
    set nome = coalesce(public.access_profiles.nome, excluded.nome),
        email = excluded.email,
        updated_at = now();

    return new;
end;
$$;

create or replace function public.sync_missing_access_profiles()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
    inserted_count integer := 0;
begin
    if not public.is_access_admin(auth.uid()) then
        raise exception 'Apenas administradores podem sincronizar solicitacoes de acesso.';
    end if;

    insert into public.access_profiles (id, nome, email, status, is_admin)
    select
        auth_users.id,
        coalesce(auth_users.raw_user_meta_data ->> 'nome', auth_users.email),
        auth_users.email,
        'pending',
        false
    from auth.users as auth_users
    where auth_users.email is not null
      and not exists (
          select 1
          from public.access_profiles as access_profiles
          where access_profiles.id = auth_users.id
      );

    get diagnostics inserted_count = row_count;
    return inserted_count;
end;
$$;

drop trigger if exists create_access_profile_after_signup on auth.users;
create trigger create_access_profile_after_signup
after insert on auth.users
for each row execute function public.create_access_profile_for_new_user();

drop trigger if exists sync_access_profile_after_auth_user_update on auth.users;
create trigger sync_access_profile_after_auth_user_update
after update of email, raw_user_meta_data on auth.users
for each row execute function public.create_access_profile_for_new_user();

insert into public.access_profiles (id, nome, email, status, is_admin)
select
    auth_users.id,
    coalesce(auth_users.raw_user_meta_data ->> 'nome', auth_users.email),
    auth_users.email,
    'pending',
    false
from auth.users as auth_users
where auth_users.email is not null
  and not exists (
      select 1
      from public.access_profiles as access_profiles
      where access_profiles.id = auth_users.id
);

create or replace function public.request_access_profile()
returns public.access_profiles
language plpgsql
security definer
set search_path = public
as $$
declare
    auth_user auth.users%rowtype;
    profile public.access_profiles%rowtype;
begin
    if auth.uid() is null then
        raise exception 'Usuario nao autenticado.';
    end if;

    select *
    into auth_user
    from auth.users
    where id = auth.uid();

    if auth_user.id is null then
        raise exception 'Usuario nao encontrado.';
    end if;

    insert into public.access_profiles (id, nome, email, status, is_admin)
    values (
        auth_user.id,
        coalesce(auth_user.raw_user_meta_data ->> 'nome', auth_user.email),
        auth_user.email,
        'pending',
        false
    )
    on conflict (id) do update
    set nome = coalesce(public.access_profiles.nome, excluded.nome),
        email = excluded.email,
        status = case
            when public.access_profiles.status = 'rejected' then 'pending'
            else public.access_profiles.status
        end,
        is_admin = case
            when public.access_profiles.status = 'rejected' then false
            else public.access_profiles.is_admin
        end,
        updated_at = now()
    returning *
    into profile;

    return profile;
end;
$$;

grant execute on function public.request_access_profile() to authenticated;
grant execute on function public.sync_missing_access_profiles() to authenticated;

insert into public.access_profiles (id, nome, email, status, is_admin)
select
    auth_users.id,
    coalesce(auth_users.raw_user_meta_data ->> 'nome', auth_users.email),
    auth_users.email,
    'pending',
    false
from auth.users as auth_users
where not exists (
    select 1
    from public.access_profiles as access_profiles
    where access_profiles.id = auth_users.id
);

create or replace function public.is_access_admin(user_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
    select exists (
        select 1
        from public.access_profiles
        where id = user_id
          and status = 'approved'
          and is_admin = true
    );
$$;

alter table public.access_profiles enable row level security;
alter table public.access_requests enable row level security;

grant insert on public.access_requests to anon;
grant insert on public.access_requests to authenticated;
grant select, update on public.access_requests to authenticated;
grant insert, select, update on public.access_profiles to authenticated;
grant insert on public.access_profiles to anon;

drop policy if exists "Usuarios veem o proprio perfil" on public.access_profiles;
create policy "Usuarios veem o proprio perfil"
on public.access_profiles
for select
to authenticated
using (id = auth.uid());

drop policy if exists "Admins veem todos os perfis" on public.access_profiles;
create policy "Admins veem todos os perfis"
on public.access_profiles
for select
to authenticated
using (public.is_access_admin(auth.uid()));

drop policy if exists "Usuarios criam solicitacao propria" on public.access_profiles;
create policy "Usuarios criam solicitacao propria"
on public.access_profiles
for insert
to authenticated
with check (
    id = auth.uid()
    and status = 'pending'
    and is_admin = false
);

drop policy if exists "Admins criam perfis" on public.access_profiles;
create policy "Admins criam perfis"
on public.access_profiles
for insert
to authenticated
with check (public.is_access_admin(auth.uid()));

drop policy if exists "Cadastro anonimo cria solicitacao pendente" on public.access_profiles;
create policy "Cadastro anonimo cria solicitacao pendente"
on public.access_profiles
for insert
to anon
with check (
    status = 'pending'
    and is_admin = false
    and coalesce(is_primary, false) = false
);

drop policy if exists "Admins atualizam perfis" on public.access_profiles;
create policy "Admins atualizam perfis"
on public.access_profiles
for update
to authenticated
using (public.is_access_admin(auth.uid()))
with check (
    public.is_access_admin(auth.uid())
    and not (
        is_primary = true
        and (
            is_admin = false
            or status <> 'approved'
        )
    )
);

drop policy if exists "Qualquer cadastro cria solicitacao" on public.access_requests;
create policy "Qualquer cadastro cria solicitacao"
on public.access_requests
for insert
to anon, authenticated
with check (
    status = 'pending'
    and requested_admin = false
);

drop policy if exists "Admins veem solicitacoes" on public.access_requests;
create policy "Admins veem solicitacoes"
on public.access_requests
for select
to authenticated
using (public.is_access_admin(auth.uid()));

drop policy if exists "Admins atualizam solicitacoes" on public.access_requests;
create policy "Admins atualizam solicitacoes"
on public.access_requests
for update
to authenticated
using (public.is_access_admin(auth.uid()))
with check (public.is_access_admin(auth.uid()));

-- Depois de criar a conta do administrador pelo fluxo "Solicitar acesso",
-- execute o UPDATE abaixo trocando o e-mail pelo admin inicial do projeto.
-- Isso aprova o primeiro admin para que ele consiga gerenciar as proximas solicitacoes.
--
-- update public.access_profiles
-- set status = 'approved',
--     is_admin = true,
--     is_primary = true,
--     updated_at = now()
-- where email = 'admin@simapel.com.br';
