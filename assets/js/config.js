// Site genelinde kullanılan public/client-side yapılandırma değerleri.
// Bunlar "gizli" değildir — tarayıcı zaten bu değerleri Supabase'e/Formspree'ye
// istek atarken kullanmak zorunda, dolayısıyla herkese açık kaynak/network'te
// görünürler. Güvenlik Supabase tarafında Row Level Security (RLS) ile sağlanıyor,
// bu değerlerin gizli kalmasıyla değil. Bkz. supabase/README.md.
//
// GERÇEK GİZLİ BİLGİ (Supabase service_role/secret key) ASLA buraya veya
// başka hiçbir dosyaya girilmemeli.

const SUPABASE_URL = "https://niiqacgkfpijxrfygdcj.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_wsvWfal5M56C9BupeDtGiw_5sHvq_o5";
const FORMSPREE_ENDPOINT = "https://formspree.io/f/xzdkljpz";
