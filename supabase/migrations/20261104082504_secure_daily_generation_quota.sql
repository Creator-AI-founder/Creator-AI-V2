create or replace function public.consume_daily_generation(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_plan text;
  v_limit integer;
  v_count integer;
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception using errcode = '42501', message = 'Not authorized to consume another user quota';
  end if;

  select p.plan, l.daily_generations
    into v_plan, v_limit
  from public.profiles p
  join public.plan_limits l on l.plan = p.plan
  where p.id = p_user_id;

  if v_plan is null then
    raise exception using errcode = 'P0001', message = 'Profile not found';
  end if;

  insert into public.daily_usage (user_id, usage_date, generations, updated_at)
  values (p_user_id, current_date, 1, now())
  on conflict (user_id, usage_date)
  do update
    set generations = public.daily_usage.generations + 1,
        updated_at = now()
    where public.daily_usage.generations < v_limit
  returning generations into v_count;

  if v_count is null then
    select generations into v_count
    from public.daily_usage
    where user_id = p_user_id and usage_date = current_date;
    return jsonb_build_object('allowed', false, 'plan', v_plan, 'daily_limit', v_limit,
      'used', coalesce(v_count, 0), 'remaining', greatest(v_limit - coalesce(v_count, 0), 0));
  end if;

  return jsonb_build_object('allowed', true, 'plan', v_plan, 'daily_limit', v_limit,
    'used', v_count, 'remaining', greatest(v_limit - v_count, 0));
end;
$function$;

revoke all on function public.consume_daily_generation(uuid) from public, anon;
grant execute on function public.consume_daily_generation(uuid) to authenticated;
