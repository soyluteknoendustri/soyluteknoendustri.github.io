let stockAccounts = [];
let selectedAccountId = null;
let currentTip = "all";
let bulkEditMode = false;

async function loadAccounts() {
  const { data, error } = await sb.from("stock_accounts").select("*").order("kod");
  if (error) { console.error(error); return; }
  stockAccounts = data || [];
  renderAccounts();
}

function renderAccounts() {
  const q = (document.getElementById("searchInput").value || "").toLowerCase();
  const filtered = stockAccounts.filter(a =>
    (currentTip === "all" || a.tip === currentTip) &&
    (!q || a.unvan.toLowerCase().includes(q) || a.kod.toLowerCase().includes(q))
  );
  const body = document.getElementById("accountBody");
  body.innerHTML = filtered.length ? filtered.map(a => {
    const durum = a.bakiye > 0 ? `<span class="badge red">Borçlu</span>` : a.bakiye < 0 ? `<span class="badge green">Borçluyuz</span>` : `<span class="badge gray">Sıfır</span>`;
    return `
      <tr data-id="${a.id}">
        <td>${escapeHtml(a.kod)}</td>
        <td class="clickable" data-open="${a.id}">${escapeHtml(a.unvan)}</td>
        <td>${a.tip === "musteri" ? "Müşteri" : "Tedarikçi"}</td>
        <td class="tel-cell">${bulkEditMode ? `<input type="text" class="bulk-tel" data-id="${a.id}" value="${escapeHtml(a.telefon || "")}" />` : escapeHtml(a.telefon || "—")}</td>
        <td class="num ${a.bakiye > 0 ? "amount-pos" : a.bakiye < 0 ? "amount-neg" : ""}">${fmtTL(a.bakiye)}</td>
        <td>${durum}</td>
        <td><button type="button" class="btn-outline" data-statement="${a.id}">Ekstre</button></td>
      </tr>`;
  }).join("") : `<tr><td colspan="7" class="stock-empty">Cari bulunamadı.</td></tr>`;

  body.querySelectorAll("[data-open]").forEach(el => el.addEventListener("click", () => openAccountForm(el.dataset.open)));
  body.querySelectorAll("[data-statement]").forEach(el => el.addEventListener("click", (e) => { e.stopPropagation(); openStatement(el.dataset.statement); }));
}

document.getElementById("accountTabs").addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-tip]");
  if (!btn) return;
  currentTip = btn.dataset.tip;
  document.querySelectorAll("#accountTabs button").forEach(b => b.classList.toggle("active", b === btn));
  renderAccounts();
});
document.getElementById("searchInput").addEventListener("input", renderAccounts);

function openAccountForm(id) {
  selectedAccountId = id || null;
  const a = id ? stockAccounts.find(x => x.id === id) : null;
  document.getElementById("accountDialogTitle").textContent = a ? "Cariyi Düzenle" : "Yeni Cari";
  document.getElementById("a_kod").value = a?.kod || "";
  document.getElementById("a_tip").value = a?.tip || "musteri";
  document.getElementById("a_unvan").value = a?.unvan || "";
  document.getElementById("a_telefon").value = a?.telefon || "";
  document.getElementById("a_email").value = a?.email || "";
  document.getElementById("a_vkn").value = a?.vkn || "";
  document.getElementById("a_adres").value = a?.adres || "";
  document.getElementById("a_aktif").checked = a ? !!a.aktif : true;
  document.getElementById("deleteAccountBtn").style.display = a ? "inline-block" : "none";
  document.getElementById("accountStatusMsg").textContent = "";
  openDialog("accountDialog");
}

document.getElementById("newAccountBtn").addEventListener("click", () => openAccountForm(null));

document.getElementById("saveAccountBtn").addEventListener("click", async () => {
  const payload = {
    kod: document.getElementById("a_kod").value.trim(),
    tip: document.getElementById("a_tip").value,
    unvan: document.getElementById("a_unvan").value.trim(),
    telefon: document.getElementById("a_telefon").value.trim() || null,
    email: document.getElementById("a_email").value.trim() || null,
    vkn: document.getElementById("a_vkn").value.trim() || null,
    adres: document.getElementById("a_adres").value.trim() || null,
    aktif: document.getElementById("a_aktif").checked
  };
  if (!payload.kod || !payload.unvan) {
    showStatus("accountStatusMsg", "Kod ve ünvan zorunludur.", false);
    return;
  }
  const result = selectedAccountId
    ? await sb.from("stock_accounts").update(payload).eq("id", selectedAccountId).select().single()
    : await sb.from("stock_accounts").insert(payload).select().single();
  if (result.error) { showStatus("accountStatusMsg", "Kaydedilemedi: " + result.error.message, false); return; }
  await loadAccounts();
  closeDialog("accountDialog");
});

document.getElementById("deleteAccountBtn").addEventListener("click", async () => {
  if (!selectedAccountId) return;
  if (!confirm("Bu cariyi silmek istediğinize emin misiniz?")) return;
  const { error } = await sb.from("stock_accounts").delete().eq("id", selectedAccountId);
  if (error) { showStatus("accountStatusMsg", "Silinemedi: " + error.message, false); return; }
  await loadAccounts();
  closeDialog("accountDialog");
});

document.getElementById("bulkEditBtn").addEventListener("click", () => {
  bulkEditMode = !bulkEditMode;
  document.getElementById("bulkEditBar").style.display = bulkEditMode ? "block" : "none";
  renderAccounts();
});

document.getElementById("bulkSaveBtn").addEventListener("click", async () => {
  const inputs = [...document.querySelectorAll(".bulk-tel")];
  await Promise.all(inputs.map(inp => sb.from("stock_accounts").update({ telefon: inp.value.trim() || null }).eq("id", inp.dataset.id)));
  bulkEditMode = false;
  document.getElementById("bulkEditBar").style.display = "none";
  await loadAccounts();
});

document.getElementById("exportBtn").addEventListener("click", () => {
  const rows = stockAccounts.map(a => ({
    Kod: a.kod, Ünvan: a.unvan, Tip: a.tip === "musteri" ? "Müşteri" : "Tedarikçi",
    Telefon: a.telefon || "", Bakiye: a.bakiye
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Cariler");
  XLSX.writeFile(wb, "cariler.xlsx");
});

async function openStatement(accountId) {
  const account = stockAccounts.find(a => a.id === accountId);
  document.getElementById("statementTitle").textContent = "Ekstre — " + (account ? account.unvan : "");
  const { data, error } = await sb
    .from("stock_transactions")
    .select("*")
    .or(`cari_id.eq.${accountId},hedef_cari_id.eq.${accountId}`)
    .order("tarih").order("created_at");
  if (error) { console.error(error); return; }

  let running = 0;
  const rows = (data || []).map(t => {
    let delta = 0;
    if (t.tip === "satis" && t.cari_id === accountId) delta = t.toplam;
    else if (t.tip === "tahsilat" && t.cari_id === accountId) delta = -t.toplam;
    else if (t.tip === "alis" && t.cari_id === accountId) delta = -t.toplam;
    else if (t.tip === "odeme" && t.cari_id === accountId) delta = t.toplam;
    else if (t.tip === "satis_iade" && t.cari_id === accountId) delta = -t.toplam;
    else if (t.tip === "alis_iade" && t.cari_id === accountId) delta = t.toplam;
    else if (t.tip === "virman" && t.cari_id === accountId) delta = -t.toplam;
    else if (t.tip === "virman" && t.hedef_cari_id === accountId) delta = t.toplam;
    running += Number(delta);
    return { ...t, delta, running };
  });

  document.getElementById("statementBody").innerHTML = rows.length ? rows.map(t => `
    <tr>
      <td>${fmtDate(t.tarih)}</td>
      <td>${TX_TYPE_LABELS[t.tip] || t.tip}</td>
      <td>${escapeHtml(t.aciklama || "—")}</td>
      <td class="num ${t.delta >= 0 ? "amount-pos" : "amount-neg"}">${fmtTL(t.delta)}</td>
      <td class="num">${fmtTL(t.running)}</td>
    </tr>`).join("") : `<tr><td colspan="5" class="stock-empty">Hareket yok.</td></tr>`;

  openDialog("statementDialog");
}

document.addEventListener("DOMContentLoaded", loadAccounts);
