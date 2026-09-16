begin;

-- ============================================================
-- NEXO Web Multi-Device Access v1
--
-- Purpose:
-- Allow one activated card to authorize multiple browser/device
-- Supabase sessions without transferring owner_id.
--
-- Existing owner_id remains the primary owner.
-- Existing encryption and account data are not modified.
-- ============================================================

alter table public.cards
  add column if not exists web_access_secret_hash text,
  add column if not exists web_access_secret_version integer;

create table if not exists public.card_web_access (
  card_id uuid not null
    references public.cards(id)
    on delete cascade,

  user_id uuid not null
    references auth.users(id)
    on delete cascade,

  created_at timestamptz not null
    default now(),

  last_used_at timestamptz not null
    default now(),

  primary key (card_id, user_id)
);

alter table public.card_web_access
  enable row level security;

revoke all
on table public.card_web_access
from public, anon, authenticated;


-- ------------------------------------------------------------
-- Central access check:
-- primary owner OR authorized browser/device session.
-- ------------------------------------------------------------

create or replace function public.nexo_has_card_access_id(
  p_card_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.cards c
    where c.id = p_card_id
      and c.status = 'Activated'
      and auth.uid() is not null
      and (
        c.owner_id = auth.uid()
        or exists (
          select 1
          from public.card_web_access a
          where a.card_id = c.id
            and a.user_id = auth.uid()
        )
      )
  );
$$;

revoke all
on function public.nexo_has_card_access_id(uuid)
from public, anon;

grant execute
on function public.nexo_has_card_access_id(uuid)
to authenticated;


-- ------------------------------------------------------------
-- Keep the existing accounts RLS policies unchanged.
-- They already call nexo_owns_card_id(card_id).
-- We only extend this central check to trusted devices.
-- ------------------------------------------------------------

create or replace function public.nexo_owns_card_id(
  p_card_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.nexo_has_card_access_id(p_card_id);
$$;

revoke all
on function public.nexo_owns_card_id(uuid)
from public, anon;

grant execute
on function public.nexo_owns_card_id(uuid)
to authenticated;


-- ------------------------------------------------------------
-- Initialize the card-level web access verifier.
--
-- Only the primary owner may initialize it.
-- The client sends a 64-char secret derived locally from the
-- decrypted Vault Key. Only SHA-256(secret) is stored.
--
-- Initialization is one-time, but retrying with the same secret
-- is safe and idempotent.
-- ------------------------------------------------------------

create or replace function public.nexo_initialize_web_access_secret(
  p_card_code text,
  p_access_secret text
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_user_id uuid := auth.uid();
  v_card public.cards%rowtype;
  v_secret_hash text;
  v_initialized boolean := false;
begin
  if v_user_id is null then
    return jsonb_build_object('ok', false);
  end if;

  if p_access_secret is null
     or trim(p_access_secret) !~ '^[0-9A-Fa-f]{64}$' then
    return jsonb_build_object('ok', false);
  end if;

  v_secret_hash :=
    encode(
      extensions.digest(
        lower(trim(p_access_secret)),
        'sha256'
      ),
      'hex'
    );

  select *
  into v_card
  from public.cards
  where upper(card_code) =
        upper(trim(p_card_code))
    and status = 'Activated'
    and owner_id = v_user_id
  limit 1;

  if not found then
    return jsonb_build_object('ok', false);
  end if;

  if v_card.web_access_secret_hash is null then
    update public.cards
    set
      web_access_secret_hash = v_secret_hash,
      web_access_secret_version = 1,
      updated_at = now()
    where id = v_card.id;

    v_initialized := true;

  elsif v_card.web_access_secret_hash <> v_secret_hash
        or v_card.web_access_secret_version <> 1 then

    return jsonb_build_object(
      'ok', false,
      'reason', 'verifier_mismatch'
    );
  end if;

  insert into public.card_web_access (
    card_id,
    user_id,
    created_at,
    last_used_at
  )
  values (
    v_card.id,
    v_user_id,
    now(),
    now()
  )
  on conflict (card_id, user_id)
  do update
  set last_used_at = excluded.last_used_at;

  return jsonb_build_object(
    'ok', true,
    'initialized', v_initialized,
    'card_code', v_card.card_code
  );
end;
$$;

revoke all
on function public.nexo_initialize_web_access_secret(text, text)
from public, anon;

grant execute
on function public.nexo_initialize_web_access_secret(text, text)
to authenticated;


-- ------------------------------------------------------------
-- Authorize another browser/device.
--
-- This does NOT change owner_id.
-- Successful local Vault Key decryption is required before the
-- client can derive the correct access secret.
-- ------------------------------------------------------------

create or replace function public.nexo_authorize_web_device(
  p_card_code text,
  p_access_secret text
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_user_id uuid := auth.uid();
  v_card_id uuid;
  v_card_code text;
  v_secret_hash text;
begin
  if v_user_id is null then
    return jsonb_build_object('ok', false);
  end if;

  if p_access_secret is null
     or trim(p_access_secret) !~ '^[0-9A-Fa-f]{64}$' then
    return jsonb_build_object('ok', false);
  end if;

  v_secret_hash :=
    encode(
      extensions.digest(
        lower(trim(p_access_secret)),
        'sha256'
      ),
      'hex'
    );

  select
    c.id,
    c.card_code
  into
    v_card_id,
    v_card_code
  from public.cards c
  where upper(c.card_code) =
        upper(trim(p_card_code))
    and c.status = 'Activated'
    and c.web_access_secret_hash = v_secret_hash
    and c.web_access_secret_version = 1
  limit 1;

  if not found then
    return jsonb_build_object('ok', false);
  end if;

  insert into public.card_web_access (
    card_id,
    user_id,
    created_at,
    last_used_at
  )
  values (
    v_card_id,
    v_user_id,
    now(),
    now()
  )
  on conflict (card_id, user_id)
  do update
  set last_used_at = excluded.last_used_at;

  return jsonb_build_object(
    'ok', true,
    'card_code', v_card_code
  );
end;
$$;

revoke all
on function public.nexo_authorize_web_device(text, text)
from public, anon;

grant execute
on function public.nexo_authorize_web_device(text, text)
to authenticated;


-- ------------------------------------------------------------
-- Existing web account flows use this RPC before account CRUD.
-- Extend it to all authorized devices.
-- ------------------------------------------------------------

create or replace function public.nexo_get_owned_card(
  p_card_code text
)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'id', c.id,
    'card_code', c.card_code,
    'customer_name', c.customer_name,
    'status', c.status
  )
  from public.cards c
  where upper(c.card_code) =
          upper(trim(p_card_code))
    and c.status = 'Activated'
    and public.nexo_has_card_access_id(c.id)
  limit 1;
$$;

revoke all
on function public.nexo_get_owned_card(text)
from public, anon;

grant execute
on function public.nexo_get_owned_card(text)
to authenticated;


-- ------------------------------------------------------------
-- "My Card" may also be viewed from any authorized device.
-- ------------------------------------------------------------

create or replace function public.nexo_get_my_card_summary(
  p_card_code text
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_card public.cards%rowtype;
begin
  if auth.uid() is null then
    return null;
  end if;

  select *
  into v_card
  from public.cards
  where upper(card_code) =
        upper(trim(p_card_code))
    and status = 'Activated'
    and public.nexo_has_card_access_id(id)
  limit 1;

  if not found then
    return null;
  end if;

  return jsonb_build_object(
    'id', v_card.id,
    'card_code', v_card.card_code,
    'status', v_card.status,
    'created_at', v_card.created_at,
    'updated_at', v_card.updated_at
  );
end;
$$;

revoke all
on function public.nexo_get_my_card_summary(text)
from public, anon;

grant execute
on function public.nexo_get_my_card_summary(text)
to authenticated;

commit;