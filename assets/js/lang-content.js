// Supabase'ten gelen çift dilli (title_tr/title_en gibi) alanları
// mevcut i18n.js'in currentLang değişkenine göre okumak için yardımcı.
// Not: Bu, i18n.js'in data-i18n anahtar sistemine dahil DEĞİLDİR —
// kullanıcı içeriği (blog/ürün) doğrudan bu fonksiyonla okunur.
function pick(row, field) {
  if (!row) return "";
  return row[`${field}_${currentLang}`] || row[`${field}_tr`] || "";
}
