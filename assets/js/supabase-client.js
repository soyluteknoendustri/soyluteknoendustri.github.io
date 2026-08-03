// Supabase istemcisi — tüm blog/ürün/admin sayfaları bu dosyayı kullanır.
// Bu dosyadan önce sayfada sırasıyla şunlar yüklenmiş olmalı:
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js"></script>
// <script src=".../assets/js/config.js"></script>

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
