let unbilledProducts = [];

async function loadUnbilled() {
  const { data, error } = await sb.from("stock_products").select("*").order("kod");
  if (error) { console.error(error); return; }
  unbilledProducts = data || [];
  renderUnbilled();
  populateUnbilledSelect();
}

function renderUnbilled() {
  const withUnbilled = unbilledProducts.filter(p => Number(p.stok_miktari_fatura_edilmeyen) !== 0);
  document.getElementById("statUnbilledProducts").textContent = withUnbilled.length;
  document.getElementById("statUnbilledTotal").textContent = withUnbilled.reduce((s, p) => s + Number(p.stok_miktari_fatura_edilmeyen), 0);

  const body = document.getElementById("unbilledBody");
  body.innerHTML = withUnbilled.length ? withUnbilled.map(p => `
    <tr>
      <td>${escapeHtml(p.kod)}</td>
      <td>${escapeHtml(p.ad)}</td>
      <td>${escapeHtml(p.ambalaj || "—")}</td>
      <td class="num">${p.stok_miktari_fatura_edilmeyen}</td>
      <td class="num">${p.stok_miktari}</td>
    </tr>`).join("") : `<tr><td colspan="5" class="stock-empty">Fatura edilmeyen stok hareketi yok.</td></tr>`;
}

function populateUnbilledSelect() {
  const sel = document.getElementById("m_urun");
  sel.innerHTML = unbilledProducts.map(p => `<option value="${p.id}">${escapeHtml(p.kod)} — ${escapeHtml(p.ad)}</option>`).join("");
}

document.getElementById("newMovementBtn").addEventListener("click", () => {
  document.getElementById("m_yon").value = "giris";
  document.getElementById("m_miktar").value = 1;
  document.getElementById("m_tarih").value = todayISO();
  document.getElementById("m_aciklama").value = "";
  document.getElementById("movementStatusMsg").textContent = "";
  openDialog("movementDialog");
});

document.getElementById("saveMovementBtn").addEventListener("click", async () => {
  const payload = {
    urun_id: document.getElementById("m_urun").value,
    yon: document.getElementById("m_yon").value,
    miktar: Number(document.getElementById("m_miktar").value) || 0,
    tarih: document.getElementById("m_tarih").value || todayISO(),
    aciklama: document.getElementById("m_aciklama").value.trim() || null
  };
  if (!payload.urun_id || payload.miktar <= 0) {
    showStatus("movementStatusMsg", "Ürün seçin ve miktarı pozitif girin.", false);
    return;
  }
  const { error } = await sb.from("stock_unbilled_movements").insert(payload);
  if (error) { showStatus("movementStatusMsg", "Kaydedilemedi: " + error.message, false); return; }
  await loadUnbilled();
  closeDialog("movementDialog");
});

document.addEventListener("DOMContentLoaded", loadUnbilled);
