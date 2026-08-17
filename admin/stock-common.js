// Stok & Cari modülü genelinde kullanılan yardımcı fonksiyonlar.
// admin-auth.js'ten sonra, sayfaya özel admin-stock-*.js'ten önce yüklenir.

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str == null ? "" : String(str);
  return div.innerHTML;
}

function fmtTL(num) {
  const n = Number(num || 0);
  return n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " ₺";
}

function fmtDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("tr-TR");
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function daysAgo(dateStr) {
  if (!dateStr) return 0;
  const d = new Date(dateStr + "T00:00:00");
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.floor((now - d) / 86400000);
}

const TX_TYPE_LABELS = {
  alis: "Alış",
  satis: "Satış",
  tahsilat: "Tahsilat",
  odeme: "Ödeme",
  alis_iade: "Alış İade",
  satis_iade: "Satış İade",
  virman: "Virman"
};

function openDialog(id) {
  const dlg = document.getElementById(id);
  if (dlg && typeof dlg.showModal === "function") dlg.showModal();
}

function closeDialog(id) {
  const dlg = document.getElementById(id);
  if (dlg && typeof dlg.close === "function") dlg.close();
}

function showStatus(elId, msg, ok) {
  const el = document.getElementById(elId);
  if (!el) return;
  el.textContent = msg;
  el.className = "status-msg " + (ok ? "ok" : "err");
}

function buildWhatsAppLink(phone, message) {
  const digits = (phone || "").replace(/[^\d]/g, "");
  const withCountry = digits.startsWith("90") ? digits : "90" + digits.replace(/^0/, "");
  return `https://wa.me/${withCountry}?text=${encodeURIComponent(message)}`;
}
