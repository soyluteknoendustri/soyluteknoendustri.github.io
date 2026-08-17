// Stok & Cari modülünün ortak sol sidebar'ı. Her stock-*.html sayfası
// <body data-stock-page="dashboard"> gibi bir işaretle bu dosyayı yükler;
// bu script #stockSidebar içine nav listesini basar (kopya HTML'i önler).

const STOCK_NAV_ITEMS = [
  { key: "dashboard", href: "stock-dashboard.html", label: "Dashboard" },
  { key: "products", href: "stock-products.html", label: "Ürünler" },
  { key: "unbilled", href: "stock-unbilled.html", label: "Fatura Edilmeyenler" },
  { key: "accounts", href: "stock-accounts.html", label: "Cariler" },
  { key: "transactions", href: "stock-transactions.html", label: "İşlemler" },
  { key: "reminders", href: "stock-reminders.html", label: "Hatırlatma" },
  { key: "import", href: "stock-excel-import.html", label: "Excel Aktarım" },
  { key: "reports", href: "stock-reports.html", label: "Raporlar" },
  { key: "audit", href: "stock-audit.html", label: "Denetim" },
  { key: "settings", href: "stock-settings.html", label: "Ayarlar" }
];

document.addEventListener("DOMContentLoaded", () => {
  const wrap = document.getElementById("stockSidebar");
  if (!wrap) return;
  const current = document.body.dataset.stockPage;
  const nav = document.createElement("nav");
  STOCK_NAV_ITEMS.forEach(item => {
    const a = document.createElement("a");
    a.href = item.href;
    a.textContent = item.label;
    if (item.key === current) a.classList.add("active");
    nav.appendChild(a);
  });
  wrap.appendChild(nav);
});
