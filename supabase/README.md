# Supabase Kurulum Checklist

Bu proje herkese açık siteyi GitHub Pages'te statik tutuyor; blog, ürün kataloğu, dosya
depolama ve admin girişi tamamen Supabase (ücretsiz katman) üzerinden yönetiliyor.
Aşağıdaki adımlar **Supabase Dashboard üzerinden manuel olarak** yapılmalı — Claude Code
bu ortamdan bir Supabase projesi oluşturamaz veya CLI ile bağlanamaz.

## 1. Proje oluştur
- https://supabase.com üzerinde ücretsiz bir proje oluştur.
- Region olarak Türkiye'ye yakın bir bölge seç (örn. Frankfurt / eu-central-1).

## 2. Şemayı çalıştır
- Sol menüden **SQL Editor**'e gir.
- Bu klasördeki `schema.sql` dosyasının tüm içeriğini yapıştır ve çalıştır.
- Bu adım tabloları (`blog_posts`, `blog_attachments`, `products`), RLS policy'lerini,
  storage policy'lerini ve `updated_at` trigger'ını oluşturur.

## 3. Storage bucket'larını oluştur
Sol menüden **Storage**'a gir ve şu 3 bucket'ı oluştur — her biri **Public** olarak işaretlenmeli:
- `blog-media` (blog kapak görselleri)
- `blog-files` (PPT/PPTX/PDF blog ekleri)
- `product-media` (ürün görselleri + teknik dokümanlar)

> `schema.sql` içindeki storage policy'leri bucket'lar oluşturulduktan sonra devreye girer;
> policy'ler zaten adım 2'de eklendi, burada sadece bucket'ların kendisini oluşturman yeterli.

## 4. Admin kullanıcısını oluştur
- Sol menüden **Authentication → Users**'a gir.
- **Add user** ile işletme sahibinin e-posta adresi ve bir şifre gir (e-posta onayını
  "Auto Confirm User" seçeneğiyle atla).
- Bu, sitedeki tek admin girişi olacak — herkese açık bir kayıt formu yok.

## 5. (Önerilir) Public sign-up'ı kapat
- **Authentication → Settings**'te "Allow new users to sign up" seçeneğini kapat.
- Böylece admin login sayfası bulunsa bile kimse kendi hesabını oluşturamaz.

## 6. API bilgilerini al ve Claude Code'a ver
- **Project Settings → API**'ye gir.
- **Project URL** ve **anon public key** değerlerini kopyala.
- Bu iki değeri Claude Code'a ilet — `assets/js/supabase-client.js` dosyasına işlenecek.

> ⚠️ **service_role key'i asla** bu repoya veya herhangi bir dosyaya ekleme. Sadece
> `anon public key` client tarafında kullanılır; bu güvenlidir çünkü tüm erişim
> Row Level Security (RLS) policy'leri ile kontrol edilir.

## Şema değişiklikleri
İleride şema değişikliği gerekirse, tek dosyayı düzenlemek yerine
`supabase/migrations/000X_aciklama.sql` şeklinde yeni, tarihli bir dosya ekleyip
Supabase SQL Editor'de o dosyayı çalıştırmak, geçmişi git üzerinden izlenebilir tutar.

## Ek: site_settings (iletişim bilgileri)
`schema.sql` içine sonradan eklenen `site_settings` tablosu (telefon, e-posta, adres,
sosyal medya linkleri) için: SQL Editor'de sadece bu tabloya ait `create table
site_settings ...` bloğunu (yorum satırındaki "site_settings" başlığından "Storage
bucket policy'leri" başlığına kadar olan kısmı) çalıştırman yeterli.

> ⚠️ **Dosyanın tamamını tekrar çalıştırma.** `create table ... if not exists` idempotent
> olsa da, `create trigger` ve `create policy` ifadeleri `IF NOT EXISTS` desteklemez —
> daha önce oluşturulmuş bir trigger/policy'yi tekrar oluşturmaya çalışmak hataya sebep
> olur. Şema her güncellendiğinde sadece o güncellemeye ait yeni SQL bloğunu çalıştır.
