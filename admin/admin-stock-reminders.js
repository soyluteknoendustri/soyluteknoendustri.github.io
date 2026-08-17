let reminderRows = [];
let reminderMode = "today";

function remindedTodayKey() {
  return "stock_reminded_" + todayISO();
}
function getRemindedToday() {
  try { return JSON.parse(localStorage.getItem(remindedTodayKey()) || "[]"); } catch { return []; }
}
function markReminded(accountId) {
  const list = getRemindedToday();
  if (!list.includes(accountId)) {
    list.push(accountId);
    localStorage.setItem(remindedTodayKey(), JSON.stringify(list));
  }
}

async function loadReminders() {
  const [{ data: accounts }, { data: settings }] = await Promise.all([
    sb.from("stock_accounts").select("*").eq("tip", "musteri").gt("bakiye", 0),
    sb.from("stock_settings").select("*").eq("id", 1).single()
  ]);
  window.__stockSettings = settings || null;

  const debtorIds = (accounts || []).map(a => a.id);
  if (!debtorIds.length) { reminderRows = []; renderReminders(); return; }

  const { data: overdueTx } = await sb
    .from("stock_transactions")
    .select("cari_id,toplam,vade_tarihi,fatura_no")
    .eq("tip", "satis")
    .lt("vade_tarihi", todayISO())
    .not("vade_tarihi", "is", null)
    .in("cari_id", debtorIds);

  const grouped = {};
  (overdueTx || []).forEach(t => {
    if (!grouped[t.cari_id]) grouped[t.cari_id] = { toplam: 0, faturaSayisi: 0, enEski: t.vade_tarihi };
    grouped[t.cari_id].toplam += Number(t.toplam);
    grouped[t.cari_id].faturaSayisi += 1;
    if (t.vade_tarihi < grouped[t.cari_id].enEski) grouped[t.cari_id].enEski = t.vade_tarihi;
  });

  reminderRows = (accounts || [])
    .filter(a => grouped[a.id])
    .map(a => ({ account: a, ...grouped[a.id], gecikme: daysAgo(grouped[a.id].enEski) }))
    .sort((a, b) => b.gecikme - a.gecikme);

  renderReminders();
}

function renderReminders() {
  const remindedToday = getRemindedToday();
  const rows = reminderMode === "today" ? reminderRows.filter(r => !remindedToday.includes(r.account.id)) : reminderRows;

  document.getElementById("statToday").textContent = reminderMode === "today" ? rows.length : reminderRows.length;
  document.getElementById("statTotal").textContent = fmtTL(rows.reduce((s, r) => s + r.toplam, 0));

  const body = document.getElementById("reminderBody");
  body.innerHTML = rows.length ? rows.map(r => `
    <tr>
      <td>${escapeHtml(r.account.unvan)}<br><span style="color:var(--text-muted);font-size:.75rem;">${escapeHtml(r.account.kod)}</span></td>
      <td>${escapeHtml(r.account.telefon || "—")}</td>
      <td class="num">${r.faturaSayisi}</td>
      <td class="num amount-pos">${r.gecikme} gün</td>
      <td class="num">${fmtTL(r.toplam)}</td>
      <td>${r.account.telefon ? `<button type="button" class="btn-whatsapp" data-wa="${r.account.id}">WhatsApp</button>` : "—"}</td>
    </tr>`).join("") : `<tr><td colspan="6" class="stock-empty">Vadesi geçen cari yok.</td></tr>`;

  body.querySelectorAll("[data-wa]").forEach(btn => btn.addEventListener("click", () => sendReminder(btn.dataset.wa)));
}

function sendReminder(accountId) {
  const row = reminderRows.find(r => r.account.id === accountId);
  if (!row) return;
  const settings = window.__stockSettings || {};
  const lines = [
    `Sayın ${row.account.unvan},`,
    `${fmtTL(row.toplam)} tutarındaki ${row.faturaSayisi} adet vadesi geçmiş faturanız bulunmaktadır.`,
    settings.iban ? `IBAN: ${settings.iban}${settings.banka_adi ? " (" + settings.banka_adi + ")" : ""}` : "",
    settings.imza_metni || ""
  ].filter(Boolean);
  window.open(buildWhatsAppLink(row.account.telefon, lines.join("\n")), "_blank");
  markReminded(accountId);
  renderReminders();
}

document.getElementById("reminderTabs").addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-mode]");
  if (!btn) return;
  reminderMode = btn.dataset.mode;
  document.querySelectorAll("#reminderTabs button").forEach(b => b.classList.toggle("active", b === btn));
  renderReminders();
});

document.getElementById("refreshBtn").addEventListener("click", loadReminders);

document.addEventListener("DOMContentLoaded", loadReminders);
