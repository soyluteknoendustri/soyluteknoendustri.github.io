-- Soylu Tekno & Endüstri — Supabase şeması
-- Supabase Dashboard > SQL Editor içinde tek seferde çalıştırılır.
-- Tek admin kullanıcısı varsayımıyla: rol/profil tablosu yok,
-- tüm yazma izinleri auth.role() = 'authenticated' koşuluna bağlanmıştır.

-- ---------------------------------------------------------------------------
-- Ortak: updated_at otomatik güncelleme trigger fonksiyonu
-- ---------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ---------------------------------------------------------------------------
-- blog_posts
-- ---------------------------------------------------------------------------
create table if not exists blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title_tr text not null,
  title_en text,
  excerpt_tr text,
  excerpt_en text,
  body_tr text,
  body_en text,
  cover_image_url text,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger blog_posts_set_updated_at
  before update on blog_posts
  for each row execute function set_updated_at();

alter table blog_posts enable row level security;

create policy "blog_posts_public_read_published"
  on blog_posts for select
  to anon
  using (published = true);

create policy "blog_posts_authenticated_read_all"
  on blog_posts for select
  to authenticated
  using (true);

create policy "blog_posts_authenticated_write"
  on blog_posts for all
  to authenticated
  using (true)
  with check (true);

-- ---------------------------------------------------------------------------
-- blog_attachments (PPT/PPTX/PDF vb. ekler)
-- ---------------------------------------------------------------------------
create table if not exists blog_attachments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references blog_posts(id) on delete cascade,
  file_url text not null,
  file_name text,
  file_type text,
  created_at timestamptz not null default now()
);

alter table blog_attachments enable row level security;

create policy "blog_attachments_public_read_published"
  on blog_attachments for select
  to anon
  using (
    exists (
      select 1 from blog_posts p
      where p.id = blog_attachments.post_id and p.published = true
    )
  );

create policy "blog_attachments_authenticated_read_all"
  on blog_attachments for select
  to authenticated
  using (true);

create policy "blog_attachments_authenticated_write"
  on blog_attachments for all
  to authenticated
  using (true)
  with check (true);

-- ---------------------------------------------------------------------------
-- products
-- ---------------------------------------------------------------------------
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name_tr text not null,
  name_en text,
  category text not null check (category in ('oil', 'metal', 'software')),
  short_desc_tr text,
  short_desc_en text,
  description_tr text,
  description_en text,
  images text[] not null default '{}',
  datasheet_url text,
  published boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger products_set_updated_at
  before update on products
  for each row execute function set_updated_at();

alter table products enable row level security;

create policy "products_public_read_published"
  on products for select
  to anon
  using (published = true);

create policy "products_authenticated_read_all"
  on products for select
  to authenticated
  using (true);

create policy "products_authenticated_write"
  on products for all
  to authenticated
  using (true)
  with check (true);

-- ---------------------------------------------------------------------------
-- site_settings (İletişim bilgileri — tek satırlık site geneli ayarlar)
-- ---------------------------------------------------------------------------
create table if not exists site_settings (
  id smallint primary key default 1,
  phone text,
  email text,
  address_tr text,
  address_en text,
  social_linkedin text,
  social_instagram text,
  social_facebook text,
  social_x text,
  updated_at timestamptz not null default now(),
  constraint site_settings_singleton check (id = 1)
);

insert into site_settings (id) values (1) on conflict (id) do nothing;

create trigger site_settings_set_updated_at
  before update on site_settings
  for each row execute function set_updated_at();

alter table site_settings enable row level security;

create policy "site_settings_public_read"
  on site_settings for select
  to anon
  using (true);

create policy "site_settings_authenticated_read"
  on site_settings for select
  to authenticated
  using (true);

create policy "site_settings_authenticated_write"
  on site_settings for update
  to authenticated
  using (true)
  with check (true);

-- ---------------------------------------------------------------------------
-- Storage bucket policy'leri
-- NOT: bucket'ların kendisi (blog-media, blog-files, product-media) Dashboard
-- üzerinden "Public" olarak oluşturulmalıdır (bkz. README.md adım 3-4).
-- ---------------------------------------------------------------------------
create policy "storage_public_read"
  on storage.objects for select
  to anon
  using (bucket_id in ('blog-media', 'blog-files', 'product-media'));

create policy "storage_authenticated_read"
  on storage.objects for select
  to authenticated
  using (bucket_id in ('blog-media', 'blog-files', 'product-media'));

create policy "storage_authenticated_write"
  on storage.objects for insert
  to authenticated
  with check (bucket_id in ('blog-media', 'blog-files', 'product-media'));

create policy "storage_authenticated_update"
  on storage.objects for update
  to authenticated
  using (bucket_id in ('blog-media', 'blog-files', 'product-media'));

create policy "storage_authenticated_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id in ('blog-media', 'blog-files', 'product-media'));
