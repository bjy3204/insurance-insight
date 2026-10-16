-- Optional checkout identity. Approval requires an authenticated member,
-- an unexpired browser claim and a verified paid order.
begin;
alter table public.payapp_orders alter column instagram_id drop not null;

create or replace function public.apply_payapp_event(p_order_id uuid,p_rebill_no text,p_mul_no text,p_price integer,p_state text,p_message text)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare o public.payapp_orders%rowtype; s public.subscribers%rowtype; n integer;
begin
 select * into o from public.payapp_orders where id=p_order_id for update;
 if not found or p_price is distinct from o.amount or p_rebill_no is null or p_rebill_no !~ '^\d+$'
   or p_mul_no is null or p_mul_no !~ '^\d+$' or (o.rebill_no is not null and o.rebill_no<>p_rebill_no) then
   raise exception 'invalid_payment';
 end if;
 insert into public.payapp_events(order_id,mul_no,state,message) values(o.id,p_mul_no,p_state,coalesce(p_message,'')) on conflict do nothing;
 if not found then return; end if;
 update public.payapp_orders set rebill_no=p_rebill_no where id=o.id;
 if p_state='4' and o.instagram_id is null then
   if o.state <> 'canceled' then
     update public.payapp_orders set state='paid' where id=o.id;
   end if;
   return;
 end if;
 if p_state='4' then
   if o.state='canceled' then return; end if;
   perform pg_advisory_xact_lock(hashtextextended(o.instagram_id,0));
   if o.subscriber_id is not null then
     select * into s from public.subscribers where id::text=o.subscriber_id for update;
   else
     select count(*) into n from public.subscribers where lower(ltrim(trim(subscriber_id),'@'))=o.instagram_id;
     if n>1 then raise exception 'duplicate_subscriber_requires_review'; end if;
     select * into s from public.subscribers where lower(ltrim(trim(subscriber_id),'@'))=o.instagram_id for update;
     if found and coalesce(s.pay_app_code,'') not in ('',p_rebill_no) then raise exception 'existing_agreement_requires_review'; end if;
     if not found then
       insert into public.subscribers(subscriber_id,name,data_room,video_room,pay_app,pay_app_code,memo,status,is_checked)
       values(o.instagram_id,'','','',true,p_rebill_no,'','active',true) returning * into s;
     end if;
   end if;
   if s.id is null then raise exception 'subscriber_missing'; end if;
   update public.subscribers set pay_app=true,pay_app_code=p_rebill_no,status='active' where id=s.id;
   update public.payapp_orders set state='paid',subscriber_id=s.id::text where id=o.id;
   if o.claimed_by is not null then
     update public.profiles set status='approved' where id=o.claimed_by and linked_subscriber_id=s.id and status='payment_error';
   end if;
 end if;
 -- Non-success events remain in the audit table. Failure/cancel access policy is
 -- deliberately not inferred from a payment cancellation (which may be a refund).
end $$;


create or replace function public.claim_payapp_order(p_claim_hash text,p_user_id uuid)
returns text language plpgsql security definer set search_path = public, pg_temp as $$
declare o public.payapp_orders%rowtype; p public.profiles%rowtype; s public.subscribers%rowtype; member_instagram text; n integer;
begin
 select * into o from public.payapp_orders where claim_hash=p_claim_hash and claim_expires_at>now() for update;
 if not found then return 'missing'; end if;
 if o.claimed_by is not null then
   if o.claimed_by=p_user_id then return 'linked'; else return 'conflict'; end if;
 end if;
 if o.state<>'paid' then return 'pending'; end if;
 select * into p from public.profiles where id=p_user_id for update;
 if not found or coalesce(trim(p.nickname),'')='' then return 'signup'; end if;
 member_instagram := lower(ltrim(trim(p.instagram_id),'@'));
 if member_instagram is null or member_instagram !~ '^[a-z0-9._]{1,30}$' then return 'signup'; end if;
 if o.instagram_id is not null and member_instagram is distinct from o.instagram_id then return 'identity_mismatch'; end if;
 if p.status in ('blocked','rejected') then return 'review'; end if;
 if o.subscriber_id is null and o.instagram_id is null then
   perform pg_advisory_xact_lock(hashtextextended(member_instagram,0));
   select count(*) into n from public.subscribers where lower(ltrim(trim(subscriber_id),'@'))=member_instagram;
   if n>1 then return 'review'; end if;
   select * into s from public.subscribers where lower(ltrim(trim(subscriber_id),'@'))=member_instagram for update;
   if found and coalesce(s.pay_app_code,'') not in ('',o.rebill_no) then return 'conflict'; end if;
   if not found then
     insert into public.subscribers(subscriber_id,name,data_room,video_room,pay_app,pay_app_code,memo,status,is_checked)
     values(member_instagram,p.nickname,'','',true,o.rebill_no,'','active',true) returning * into s;
   end if;
 else
   select * into s from public.subscribers where id::text=o.subscriber_id for update;
 end if;
 if s.id is null then return 'review'; end if;
 if p.linked_subscriber_id is not null and p.linked_subscriber_id<>s.id then return 'conflict'; end if;
 if exists(select 1 from public.profiles where linked_subscriber_id=s.id and id<>p_user_id) then return 'conflict'; end if;
 update public.subscribers set pay_app=true,pay_app_code=o.rebill_no,status='active' where id=s.id;
 update public.profiles set linked_subscriber_id=s.id,status='approved' where id=p_user_id;
 update public.payapp_orders set claimed_by=p_user_id,subscriber_id=s.id::text where id=o.id;
 return 'linked';
end $$;

revoke all on function public.apply_payapp_event(uuid,text,text,integer,text,text) from public,anon,authenticated;
revoke all on function public.claim_payapp_order(text,uuid) from public,anon,authenticated;
grant execute on function public.apply_payapp_event(uuid,text,text,integer,text,text) to service_role;
grant execute on function public.claim_payapp_order(text,uuid) to service_role;
commit;
