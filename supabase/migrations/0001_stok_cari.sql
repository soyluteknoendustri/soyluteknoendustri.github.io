-- Stok & Cari Yönetimi modülü
-- Supabase Dashboard > SQL Editor içinde tek seferde çalıştırılır.
-- Bu modül herkese açık değildir: anon policy yok, sadece authenticated erişebilir.

-- ---------------------------------------------------------------------------
-- stock_products
-- ---------------------------------------------------------------------------
create table if not exists stock_products (
  id uuid primary key default gen_random_uuid(),
  kod text unique not null,
  ad text not null,
  ambalaj text,
  stok_miktari numeric not null default 0,
  stok_miktari_fatura_edilmeyen numeric not null default 0,
  kritik_stok numeric not null default 0,
  birim_fiyat numeric not null default 0,
  kdv_orani numeric not null default 20,
  aktif boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger stock_products_set_updated_at
  before update on stock_products
  for each row execute function set_updated_at();

alter table stock_products enable row level security;

create policy "stock_products_authenticated_all"
  on stock_products for all
  to authenticated
  using (true)
  with check (true);

-- ---------------------------------------------------------------------------
-- stock_accounts (Cariler)
-- ---------------------------------------------------------------------------
create table if not exists stock_accounts (
  id uuid primary key default gen_random_uuid(),
  kod text unique not null,
  unvan text not null,
  tip text not null check (tip in ('musteri', 'tedarikci')),
  telefon text,
  email text,
  adres text,
  vkn text,
  bakiye numeric not null default 0,
  aktif boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger stock_accounts_set_updated_at
  before update on stock_accounts
  for each row execute function set_updated_at();

alter table stock_accounts enable row level security;

create policy "stock_accounts_authenticated_all"
  on stock_accounts for all
  to authenticated
  using (true)
  with check (true);

-- ---------------------------------------------------------------------------
-- stock_transactions (İşlemler)
-- ---------------------------------------------------------------------------
create table if not exists stock_transactions (
  id uuid primary key default gen_random_uuid(),
  tarih date not null default current_date,
  tip text not null check (tip in ('alis', 'satis', 'tahsilat', 'odeme', 'alis_iade', 'satis_iade', 'virman')),
  cari_id uuid references stock_accounts(id) on delete restrict,
  hedef_cari_id uuid references stock_accounts(id) on delete restrict,
  urun_id uuid references stock_products(id) on delete restrict,
  fatura_edilmeyen boolean not null default false,
  miktar numeric,
  birim_fiyat numeric,
  kdv_orani numeric,
  toplam numeric not null default 0,
  fatura_no text,
  vade_tarihi date,
  aciklama text,
  created_at timestamptz not null default now()
);

create index if not exists idx_stock_transactions_urun on stock_transactions(urun_id);
create index if not exists idx_stock_transactions_cari on stock_transactions(cari_id);
create index if not exists idx_stock_transactions_hedef_cari on stock_transactions(hedef_cari_id);

alter table stock_transactions enable row level security;

create policy "stock_transactions_authenticated_all"
  on stock_transactions for all
  to authenticated
  using (true)
  with check (true);

-- ---- Yeniden hesaplama fonksiyonları ----

create or replace function stock_recompute_product(p_id uuid)
returns void as $$
begin
  if p_id is null then return; end if;
  update stock_products set stok_miktari = coalesce((
    select sum(case
      when tip = 'alis' then miktar
      when tip = 'satis' then -miktar
      when tip = 'alis_iade' then -miktar
      when tip = 'satis_iade' then miktar
      else 0
    end)
    from stock_transactions
    where urun_id = p_id and fatura_edilmeyen = false
  ), 0)
  where id = p_id;
end;
$$ language plpgsql security definer;

create or replace function stock_recompute_account(a_id uuid)
returns void as $$
begin
  if a_id is null then return; end if;
  update stock_accounts set bakiye = coalesce((
    select sum(case
      when tip = 'satis' and cari_id = a_id then toplam
      when tip = 'tahsilat' and cari_id = a_id then -toplam
      when tip = 'alis' and cari_id = a_id then -toplam
      when tip = 'odeme' and cari_id = a_id then toplam
      when tip = 'satis_iade' and cari_id = a_id then -toplam
      when tip = 'alis_iade' and cari_id = a_id then toplam
      when tip = 'virman' and cari_id = a_id then -toplam
      when tip = 'virman' and hedef_cari_id = a_id then toplam
      else 0
    end)
    from stock_transactions
    where cari_id = a_id or hedef_cari_id = a_id
  ), 0)
  where id = a_id;
end;
$$ language plpgsql security definer;

create or replace function stock_transactions_recompute_trigger()
returns trigger as $$
begin
  if TG_OP = 'DELETE' then
    perform stock_recompute_product(old.urun_id);
    perform stock_recompute_account(old.cari_id);
    perform stock_recompute_account(old.hedef_cari_id);
    return old;
  end if;

  perform stock_recompute_product(new.urun_id);
  perform stock_recompute_account(new.cari_id);
  perform stock_recompute_account(new.hedef_cari_id);

  if TG_OP = 'UPDATE' then
    if old.urun_id is distinct from new.urun_id then
      perform stock_recompute_product(old.urun_id);
    end if;
    if old.cari_id is distinct from new.cari_id then
      perform stock_recompute_account(old.cari_id);
    end if;
    if old.hedef_cari_id is distinct from new.hedef_cari_id then
      perform stock_recompute_account(old.hedef_cari_id);
    end if;
  end if;

  return new;
end;
$$ language plpgsql security definer;

create trigger stock_transactions_recompute
  after insert or update or delete on stock_transactions
  for each row execute function stock_transactions_recompute_trigger();

-- ---------------------------------------------------------------------------
-- stock_unbilled_movements (Fatura Edilmeyenler hareketleri)
-- ---------------------------------------------------------------------------
create table if not exists stock_unbilled_movements (
  id uuid primary key default gen_random_uuid(),
  urun_id uuid not null references stock_products(id) on delete cascade,
  tarih date not null default current_date,
  yon text not null check (yon in ('giris', 'cikis')),
  miktar numeric not null,
  aciklama text,
  created_at timestamptz not null default now()
);

create index if not exists idx_stock_unbilled_movements_urun on stock_unbilled_movements(urun_id);

alter table stock_unbilled_movements enable row level security;

create policy "stock_unbilled_movements_authenticated_all"
  on stock_unbilled_movements for all
  to authenticated
  using (true)
  with check (true);

create or replace function stock_recompute_unbilled(p_id uuid)
returns void as $$
begin
  if p_id is null then return; end if;
  update stock_products set stok_miktari_fatura_edilmeyen = coalesce((
    select sum(case when yon = 'giris' then miktar else -miktar end)
    from stock_unbilled_movements
    where urun_id = p_id
  ), 0)
  where id = p_id;
end;
$$ language plpgsql security definer;

create or replace function stock_unbilled_movements_recompute_trigger()
returns trigger as $$
begin
  if TG_OP = 'DELETE' then
    perform stock_recompute_unbilled(old.urun_id);
    return old;
  end if;
  perform stock_recompute_unbilled(new.urun_id);
  if TG_OP = 'UPDATE' and old.urun_id is distinct from new.urun_id then
    perform stock_recompute_unbilled(old.urun_id);
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger stock_unbilled_movements_recompute
  after insert or update or delete on stock_unbilled_movements
  for each row execute function stock_unbilled_movements_recompute_trigger();

-- ---------------------------------------------------------------------------
-- stock_settings (tekil satır)
-- ---------------------------------------------------------------------------
create table if not exists stock_settings (
  id smallint primary key default 1,
  sirket_unvani text,
  vkn text,
  vergi_dairesi_tel text,
  adres text,
  eposta text,
  logo_url text,
  whatsapp_numarasi text,
  imza_metni text,
  banka_adi text,
  iban text,
  updated_at timestamptz not null default now(),
  constraint stock_settings_singleton check (id = 1)
);

insert into stock_settings (id) values (1) on conflict (id) do nothing;

create trigger stock_settings_set_updated_at
  before update on stock_settings
  for each row execute function set_updated_at();

alter table stock_settings enable row level security;

create policy "stock_settings_authenticated_all"
  on stock_settings for all
  to authenticated
  using (true)
  with check (true);

-- ---------------------------------------------------------------------------
-- stock_audit_log (otomatik, trigger ile doldurulur)
-- ---------------------------------------------------------------------------
create table if not exists stock_audit_log (
  id uuid primary key default gen_random_uuid(),
  zaman timestamptz not null default now(),
  kullanici text,
  islem text not null,
  nesne text not null,
  detay jsonb
);

create index if not exists idx_stock_audit_log_zaman on stock_audit_log(zaman desc);

alter table stock_audit_log enable row level security;

create policy "stock_audit_log_authenticated_read"
  on stock_audit_log for select
  to authenticated
  using (true);

create or replace function stock_write_audit_log()
returns trigger as $$
begin
  insert into stock_audit_log (kullanici, islem, nesne, detay)
  values (
    coalesce(auth.jwt() ->> 'email', 'system'),
    case TG_OP when 'INSERT' then 'CREATE' when 'UPDATE' then 'UPDATE' else 'DELETE' end,
    TG_TABLE_NAME,
    to_jsonb(coalesce(new, old))
  );
  if TG_OP = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger stock_products_audit
  after insert or update or delete on stock_products
  for each row execute function stock_write_audit_log();

create trigger stock_accounts_audit
  after insert or update or delete on stock_accounts
  for each row execute function stock_write_audit_log();

create trigger stock_transactions_audit
  after insert or update or delete on stock_transactions
  for each row execute function stock_write_audit_log();

create trigger stock_settings_audit
  after insert or update or delete on stock_settings
  for each row execute function stock_write_audit_log();

-- ---------------------------------------------------------------------------
-- Storage bucket policy'leri (stock-media bucket'ı Dashboard'da Public olarak
-- manuel oluşturulmalı — bkz. supabase/README.md)
-- ---------------------------------------------------------------------------
create policy "stock_storage_authenticated_read"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'stock-media');

create policy "stock_storage_authenticated_write"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'stock-media');

create policy "stock_storage_authenticated_update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'stock-media');

create policy "stock_storage_authenticated_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'stock-media');
