let importRows = [];
let importHeaders = [];
let columnMap = {};

const TARGET_FIELDS = {
  products: [
    { key: "kod", label: "Kod", required: true },
    { key: "ad", label: "Ad", required: true },
    { key: "ambalaj", label: "Ambalaj" },
    { key: "kritik_stok", label: "Kritik Stok" },
    { key: "birim_fiyat", label: "Birim Fiyat" },
    { key: "kdv_orani", label: "KDV %" }
  ],
  accounts: [
    { key: "kod", label: "Kod", required: true },
    { key: "unvan", label: "Ünvan", required: true },
    { key: "tip", label: "Tip (musteri/tedarikci)", required: true },
    { key: "telefon", label: "Telefon" },
    { key: "email", label: "E-posta" },
    { key: "vkn", label: "VKN" },
    { key: "adres", label: "Adres" }
  ],
  transactions: [
    { key: "tarih", label: "Tarih", required: true },
    { key: "tip", label: "Tip (alis/satis/tahsilat/odeme/...)", required: true },
    { key: "cari_kod", label: "Cari Kodu", required: true },
    { key: "urun_kod", label: "Ürün Kodu" },
    { key: "miktar", label: "Miktar" },
    { key: "birim_fiyat", label: "Birim Fiyat" },
    { key: "kdv_orani", label: "KDV %" },
    { key: "aciklama", label: "Açıklama" }
  ]
};

function setStep(n) {
  [1, 2, 3].forEach(i => {
    document.getElementById(`step${i}`).style.display = i === n ? "block" : "none";
    const ind = document.getElementById(`step${i}indicator`);
    ind.classList.toggle("active", i === n);
    ind.classList.toggle("done", i < n);
  });
}

document.getElementById("pickFileBtn").addEventListener("click", () => document.getElementById("fileInput").click());

document.getElementById("fileInput").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const json = XLSX.utils.sheet_to_json(sheet, { defval: "" });
  if (!json.length) { alert("Dosyada veri bulunamadı."); return; }
  importRows = json;
  importHeaders = Object.keys(json[0]);
  renderMapping();
  setStep(2);
});

document.getElementById("targetSelect").addEventListener("change", renderMapping);

function renderMapping() {
  const target = document.getElementById("targetSelect").value;
  const fields = TARGET_FIELDS[target];
  const area = document.getElementById("mappingArea");
  area.innerHTML = fields.map(f => `
    <div class="form-group">
      <label>${f.label}${f.required ? " *" : ""}</label>
      <select data-field="${f.key}">
        <option value="">— eşleme yok —</option>
        ${importHeaders.map(h => `<option value="${escapeHtml(h)}" ${guessMatch(h, f.key) ? "selected" : ""}>${escapeHtml(h)}</option>`).join("")}
      </select>
    </div>`).join("");
  area.querySelectorAll("select[data-field]").forEach(sel => {
    columnMap[sel.dataset.field] = sel.value;
    sel.addEventListener("change", () => { columnMap[sel.dataset.field] = sel.value; renderPreview(); });
  });
  renderPreview();
}

function guessMatch(header, fieldKey) {
  return header.toLowerCase().replace(/[^a-z0-9]/g, "") === fieldKey.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function renderPreview() {
  const target = document.getElementById("targetSelect").value;
  const fields = TARGET_FIELDS[target];
  document.getElementById("previewHead").innerHTML = `<tr>${fields.map(f => `<th>${f.label}</th>`).join("")}</tr>`;
  document.getElementById("previewBody").innerHTML = importRows.slice(0, 5).map(row => `
    <tr>${fields.map(f => `<td>${escapeHtml(columnMap[f.key] ? row[columnMap[f.key]] : "")}</td>`).join("")}</tr>
  `).join("");
}

document.getElementById("toStep3Btn").addEventListener("click", () => {
  const target = document.getElementById("targetSelect").value;
  const fields = TARGET_FIELDS[target];
  const missing = fields.filter(f => f.required && !columnMap[f.key]);
  if (missing.length) {
    alert("Zorunlu alan(lar) eşlenmedi: " + missing.map(f => f.label).join(", "));
    return;
  }
  document.getElementById("importSummary").textContent =
    `${importRows.length} satır "${document.getElementById("targetSelect").selectedOptions[0].textContent}" hedefine aktarılacak.`;
  setStep(3);
});

document.getElementById("runImportBtn").addEventListener("click", async () => {
  const target = document.getElementById("targetSelect").value;
  const btn = document.getElementById("runImportBtn");
  btn.disabled = true;
  try {
    if (target === "products") await importProducts();
    else if (target === "accounts") await importAccounts();
    else await importTransactions();
  } catch (err) {
    showStatus("importStatusMsg", "Aktarım sırasında hata: " + err.message, false);
  } finally {
    btn.disabled = false;
  }
});

function mapRow(row, fields) {
  const out = {};
  fields.forEach(f => {
    if (columnMap[f.key]) out[f.key] = row[columnMap[f.key]];
  });
  return out;
}

async function importProducts() {
  const fields = TARGET_FIELDS.products;
  const rows = importRows.map(r => {
    const m = mapRow(r, fields);
    return {
      kod: String(m.kod || "").trim(),
      ad: String(m.ad || "").trim(),
      ambalaj: m.ambalaj ? String(m.ambalaj).trim() : null,
      kritik_stok: Number(m.kritik_stok) || 0,
      birim_fiyat: Number(m.birim_fiyat) || 0,
      kdv_orani: Number(m.kdv_orani) || 20
    };
  }).filter(r => r.kod && r.ad);
  const { error } = await sb.from("stock_products").upsert(rows, { onConflict: "kod" });
  if (error) throw error;
  showStatus("importStatusMsg", `${rows.length} ürün içe aktarıldı.`, true);
}

async function importAccounts() {
  const fields = TARGET_FIELDS.accounts;
  const rows = importRows.map(r => {
    const m = mapRow(r, fields);
    return {
      kod: String(m.kod || "").trim(),
      unvan: String(m.unvan || "").trim(),
      tip: String(m.tip || "musteri").trim().toLowerCase(),
      telefon: m.telefon ? String(m.telefon).trim() : null,
      email: m.email ? String(m.email).trim() : null,
      vkn: m.vkn ? String(m.vkn).trim() : null,
      adres: m.adres ? String(m.adres).trim() : null
    };
  }).filter(r => r.kod && r.unvan && ["musteri", "tedarikci"].includes(r.tip));
  const { error } = await sb.from("stock_accounts").upsert(rows, { onConflict: "kod" });
  if (error) throw error;
  showStatus("importStatusMsg", `${rows.length} cari içe aktarıldı.`, true);
}

async function importTransactions() {
  const fields = TARGET_FIELDS.transactions;
  const [{ data: accounts }, { data: products }] = await Promise.all([
    sb.from("stock_accounts").select("id,kod"),
    sb.from("stock_products").select("id,kod")
  ]);
  const accByKod = Object.fromEntries((accounts || []).map(a => [a.kod, a.id]));
  const prodByKod = Object.fromEntries((products || []).map(p => [p.kod, p.id]));

  const rows = [];
  const skipped = [];
  importRows.forEach(r => {
    const m = mapRow(r, fields);
    const cariId = accByKod[String(m.cari_kod || "").trim()];
    if (!cariId) { skipped.push(r); return; }
    const miktar = Number(m.miktar) || 0;
    const birimFiyat = Number(m.birim_fiyat) || 0;
    const kdv = Number(m.kdv_orani) || 0;
    rows.push({
      tarih: m.tarih ? String(m.tarih) : todayISO(),
      tip: String(m.tip || "").trim().toLowerCase(),
      cari_id: cariId,
      urun_id: m.urun_kod ? (prodByKod[String(m.urun_kod).trim()] || null) : null,
      miktar: miktar || null,
      birim_fiyat: birimFiyat || null,
      kdv_orani: kdv || null,
      toplam: miktar * birimFiyat * (1 + kdv / 100),
      aciklama: m.aciklama ? String(m.aciklama).trim() : null
    });
  });

  if (rows.length) {
    const { error } = await sb.from("stock_transactions").insert(rows);
    if (error) throw error;
  }
  showStatus("importStatusMsg", `${rows.length} hareket içe aktarıldı${skipped.length ? `, ${skipped.length} satır cari kodu bulunamadığı için atlandı.` : "."}`, true);
}

document.addEventListener("DOMContentLoaded", () => setStep(1));
