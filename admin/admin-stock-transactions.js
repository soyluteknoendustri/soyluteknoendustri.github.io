let stockTransactions = [];
let txAccounts = [];
let txProducts = [];
let currentTxTip = "all";

const NO_PRODUCT_TYPES = ["tahsilat", "odeme", "virman"];
const AMOUNT_TYPES = ["tahsilat", "odeme"];

async function loadTxData() {
  const [{ data: tx }, { data: accounts }, { data: products }] = await Promise.all([
    sb.from("stock_transactions").select("*").order("tarih", { ascending: false }).order("created_at", { ascending: false }),
    sb.from("stock_accounts").select("id,kod,unvan,tip").order("unvan"),
    sb.from("stock_products").select("id,kod,ad").order("kod")
  ]);
  stockTransactions = tx || [];
  txAccounts = accounts || [];
  txProducts = products || [];
  populateTxSelects();
  renderTx();
}

function populateTxSelects() {
  const accOpts = txAccounts.map(a => `<option value="${a.id}">${escapeHtml(a.kod)} — ${escapeHtml(a.unvan)}</option>`).join("");
  document.getElementById("t_cari").innerHTML = accOpts;
  document.getElementById("t_hedef_cari").innerHTML = accOpts;
  document.getElementById("t_urun").innerHTML = txProducts.map(p => `<option value="${p.id}">${escapeHtml(p.kod)} — ${escapeHtml(p.ad)}</option>`).join("");
}

function accountLabel(id) {
  const a = txAccounts.find(x => x.id === id);
  return a ? a.unvan : "—";
}
function productLabel(id) {
  const p = txProducts.find(x => x.id === id);
  return p ? p.ad : "—";
}

function renderTx() {
  const filtered = stockTransactions.filter(t => currentTxTip === "all" || t.tip === currentTxTip);
  const body = document.getElementById("txBody");
  body.innerHTML = filtered.length ? filtered.map(t => `
    <tr data-id="${t.id}">
      <td>${fmtDate(t.tarih)}</td>
      <td><span class="badge navy">${TX_TYPE_LABELS[t.tip] || t.tip}</span></td>
      <td>${t.tip === "virman" ? escapeHtml(accountLabel(t.cari_id)) + " → " + escapeHtml(accountLabel(t.hedef_cari_id)) : escapeHtml(accountLabel(t.cari_id))}</td>
      <td>${t.urun_id ? escapeHtml(productLabel(t.urun_id)) : "—"}</td>
      <td class="num">${t.miktar ?? "—"}</td>
      <td class="num">${t.kdv_orani != null ? "%" + t.kdv_orani : "—"}</td>
      <td class="num">${fmtTL(t.toplam)}</td>
      <td class="row-actions"><button type="button" class="icon-btn" data-del="${t.id}" title="Sil">🗑</button></td>
    </tr>`).join("") : `<tr><td colspan="8" class="stock-empty">Kayıt bulunamadı.</td></tr>`;

  body.querySelectorAll("[data-del]").forEach(btn => btn.addEventListener("click", () => deleteTx(btn.dataset.del)));
}

document.getElementById("txTabs").addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-tip]");
  if (!btn) return;
  currentTxTip = btn.dataset.tip;
  document.querySelectorAll("#txTabs button").forEach(b => b.classList.toggle("active", b === btn));
  renderTx();
});

function updateTxFormVisibility() {
  const tip = document.getElementById("t_tip").value;
  document.getElementById("t_hedef_cari_group").style.display = tip === "virman" ? "block" : "none";
  document.getElementById("t_urun_group").style.display = NO_PRODUCT_TYPES.includes(tip) ? "none" : "block";
  document.getElementById("t_fatura_edilmeyen_group").style.display = NO_PRODUCT_TYPES.includes(tip) ? "none" : "flex";
  document.getElementById("t_miktar_group").style.display = AMOUNT_TYPES.includes(tip) || tip === "virman" ? "none" : "grid";
  document.getElementById("t_tutar_group").style.display = AMOUNT_TYPES.includes(tip) || tip === "virman" ? "block" : "none";
  document.getElementById("t_cari_label").textContent = tip === "virman" ? "Kaynak Cari" : "Cari";
}
document.getElementById("t_tip").addEventListener("change", updateTxFormVisibility);

document.getElementById("newTxBtn").addEventListener("click", () => {
  document.getElementById("t_tip").value = "satis";
  document.getElementById("t_miktar").value = 1;
  document.getElementById("t_birim_fiyat").value = 0;
  document.getElementById("t_kdv").value = 20;
  document.getElementById("t_tutar").value = 0;
  document.getElementById("t_fatura_edilmeyen").checked = false;
  document.getElementById("t_tarih").value = todayISO();
  document.getElementById("t_vade").value = "";
  document.getElementById("t_fatura_no").value = "";
  document.getElementById("t_aciklama").value = "";
  document.getElementById("txStatusMsg").textContent = "";
  updateTxFormVisibility();
  openDialog("txDialog");
});

document.getElementById("saveTxBtn").addEventListener("click", async () => {
  const tip = document.getElementById("t_tip").value;
  const cariId = document.getElementById("t_cari").value;
  const miktar = Number(document.getElementById("t_miktar").value) || 0;
  const birimFiyat = Number(document.getElementById("t_birim_fiyat").value) || 0;
  const kdv = Number(document.getElementById("t_kdv").value) || 0;

  let toplam;
  if (AMOUNT_TYPES.includes(tip) || tip === "virman") {
    toplam = Number(document.getElementById("t_tutar").value) || 0;
  } else {
    toplam = miktar * birimFiyat * (1 + kdv / 100);
  }

  const payload = {
    tip,
    tarih: document.getElementById("t_tarih").value || todayISO(),
    cari_id: cariId || null,
    hedef_cari_id: tip === "virman" ? (document.getElementById("t_hedef_cari").value || null) : null,
    urun_id: NO_PRODUCT_TYPES.includes(tip) ? null : (document.getElementById("t_urun").value || null),
    fatura_edilmeyen: NO_PRODUCT_TYPES.includes(tip) ? false : document.getElementById("t_fatura_edilmeyen").checked,
    miktar: NO_PRODUCT_TYPES.includes(tip) ? null : miktar,
    birim_fiyat: NO_PRODUCT_TYPES.includes(tip) ? null : birimFiyat,
    kdv_orani: NO_PRODUCT_TYPES.includes(tip) ? null : kdv,
    toplam,
    fatura_no: document.getElementById("t_fatura_no").value.trim() || null,
    vade_tarihi: document.getElementById("t_vade").value || null,
    aciklama: document.getElementById("t_aciklama").value.trim() || null
  };

  if (!payload.cari_id) { showStatus("txStatusMsg", "Cari seçin.", false); return; }
  if (tip === "virman" && !payload.hedef_cari_id) { showStatus("txStatusMsg", "Hedef cari seçin.", false); return; }
  if (!NO_PRODUCT_TYPES.includes(tip) && !payload.urun_id) { showStatus("txStatusMsg", "Ürün seçin.", false); return; }

  const { error } = await sb.from("stock_transactions").insert(payload);
  if (error) { showStatus("txStatusMsg", "Kaydedilemedi: " + error.message, false); return; }
  await loadTxData();
  closeDialog("txDialog");
});

async function deleteTx(id) {
  if (!confirm("Bu işlemi silmek istediğinize emin misiniz? Stok/bakiye otomatik güncellenecek.")) return;
  const { error } = await sb.from("stock_transactions").delete().eq("id", id);
  if (error) { alert("Silinemedi: " + error.message); return; }
  await loadTxData();
}

document.addEventListener("DOMContentLoaded", () => { loadTxData(); updateTxFormVisibility(); });
