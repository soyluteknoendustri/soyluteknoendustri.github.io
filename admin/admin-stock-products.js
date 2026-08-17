let stockProducts = [];
let selectedProductId = null;

async function loadProducts() {
  const { data, error } = await sb.from("stock_products").select("*").order("kod");
  if (error) { console.error(error); return; }
  stockProducts = data || [];
  renderProducts();
}

function renderProducts() {
  const q = (document.getElementById("searchInput").value || "").toLowerCase();
  const body = document.getElementById("productBody");
  const filtered = stockProducts.filter(p =>
    !q || p.kod.toLowerCase().includes(q) || p.ad.toLowerCase().includes(q)
  );
  body.innerHTML = filtered.length ? filtered.map(p => {
    const critical = Number(p.stok_miktari) <= Number(p.kritik_stok);
    return `
      <tr class="clickable" data-id="${p.id}">
        <td>${escapeHtml(p.kod)}</td>
        <td>${escapeHtml(p.ad)}</td>
        <td>${escapeHtml(p.ambalaj || "—")}</td>
        <td class="num">${critical ? `<span class="amount-pos">⚠ ${p.stok_miktari}</span>` : p.stok_miktari}</td>
        <td class="num">${p.kritik_stok}</td>
        <td class="num">${fmtTL(p.birim_fiyat)}</td>
        <td class="num">%${p.kdv_orani}</td>
      </tr>`;
  }).join("") : `<tr><td colspan="7" class="stock-empty">Ürün bulunamadı.</td></tr>`;

  body.querySelectorAll("tr[data-id]").forEach(row => {
    row.addEventListener("click", () => openProductForm(row.dataset.id));
  });
}

function openProductForm(id) {
  selectedProductId = id || null;
  const p = id ? stockProducts.find(x => x.id === id) : null;
  document.getElementById("productDialogTitle").textContent = p ? "Ürünü Düzenle" : "Yeni Ürün";
  document.getElementById("f_kod").value = p?.kod || "";
  document.getElementById("f_ambalaj").value = p?.ambalaj || "";
  document.getElementById("f_ad").value = p?.ad || "";
  document.getElementById("f_kritik").value = p?.kritik_stok ?? 0;
  document.getElementById("f_fiyat").value = p?.birim_fiyat ?? 0;
  document.getElementById("f_kdv").value = p?.kdv_orani ?? 20;
  document.getElementById("f_aktif").checked = p ? !!p.aktif : true;
  document.getElementById("deleteProductBtn").style.display = p ? "inline-block" : "none";
  document.getElementById("productStatusMsg").textContent = "";
  openDialog("productDialog");
}

document.getElementById("newProductBtn").addEventListener("click", () => openProductForm(null));
document.getElementById("searchInput").addEventListener("input", renderProducts);

document.getElementById("saveProductBtn").addEventListener("click", async () => {
  const payload = {
    kod: document.getElementById("f_kod").value.trim(),
    ambalaj: document.getElementById("f_ambalaj").value.trim() || null,
    ad: document.getElementById("f_ad").value.trim(),
    kritik_stok: Number(document.getElementById("f_kritik").value) || 0,
    birim_fiyat: Number(document.getElementById("f_fiyat").value) || 0,
    kdv_orani: Number(document.getElementById("f_kdv").value) || 0,
    aktif: document.getElementById("f_aktif").checked
  };
  if (!payload.kod || !payload.ad) {
    showStatus("productStatusMsg", "Kod ve ad zorunludur.", false);
    return;
  }
  const result = selectedProductId
    ? await sb.from("stock_products").update(payload).eq("id", selectedProductId).select().single()
    : await sb.from("stock_products").insert(payload).select().single();

  if (result.error) { showStatus("productStatusMsg", "Kaydedilemedi: " + result.error.message, false); return; }
  await loadProducts();
  closeDialog("productDialog");
});

document.getElementById("deleteProductBtn").addEventListener("click", async () => {
  if (!selectedProductId) return;
  if (!confirm("Bu ürünü silmek istediğinize emin misiniz?")) return;
  const { error } = await sb.from("stock_products").delete().eq("id", selectedProductId);
  if (error) { showStatus("productStatusMsg", "Silinemedi: " + error.message, false); return; }
  await loadProducts();
  closeDialog("productDialog");
});

document.getElementById("exportBtn").addEventListener("click", () => {
  const rows = stockProducts.map(p => ({
    Kod: p.kod, Ad: p.ad, Ambalaj: p.ambalaj || "", "Mevcut Stok": p.stok_miktari,
    "Kritik Stok": p.kritik_stok, "Birim Fiyat": p.birim_fiyat, "KDV %": p.kdv_orani
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Ürünler");
  XLSX.writeFile(wb, "urunler.xlsx");
});

document.addEventListener("DOMContentLoaded", loadProducts);
