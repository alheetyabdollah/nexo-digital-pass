begin;

-- Restore original single-owner access behavior.

create or replace function public.nexo_owns_card_id(
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
      and c.owner_id = auth.uid()
      and c.status = 'Activated'
  );
$$;

revoke all
on function public.nexo_owns_card_id(uuid)
from public, anon;

grant execute
on function public.nexo_owns_card_id(uuid)
to authenticated;


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
    and c.owner_id = auth.uid()
    and c.status = 'Activated'
  limit 1;
$$;

revoke all
on function public.nexo_get_owned_card(text)
from public, anon;

grant execute
on function public.nexo_get_owned_card(text)
to authenticated;


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
  where upper(card_code) = upper(trim(p_card_code))
    and owner_id = auth.uid()
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


drop trigger if exists
  nexo_reset_web_access_on_owner_change
on public.cards;

drop function if exists
  public.nexo_reset_web_access_on_owner_change();

drop function if exists
  public.nexo_authorize_web_device(text, text);

drop function if exists
  public.nexo_initialize_web_access_secret(text, text);

drop function if exists
  public.nexo_has_card_access_id(uuid);

drop table if exists public.card_web_access;

alter table public.cards
  drop column if exists web_access_secret_hash,
  drop column if exists web_access_secret_version;

commit;