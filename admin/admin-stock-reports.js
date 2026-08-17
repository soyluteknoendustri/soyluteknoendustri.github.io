async function loadAgingReport() {
  const { data, error } = await sb
    .from("stock_transactions")
    .select("tarih,tip,toplam,vade_tarihi,fatura_no,aciklama,cari_id,stock_accounts(unvan)")
    .eq("tip", "satis")
    .not("vade_tarihi", "is", null)
    .order("vade_tarihi");
  if (error) { console.error(error); return; }

  const buckets = { b030: 0, b3160: 0, b6190: 0, b90: 0, future: 0 };
  const overdueRows = [];
  const today = todayISO();

  (data || []).forEach(t => {
    if (t.vade_tarihi >= today) {
      buckets.future += Number(t.toplam);
      return;
    }
    const gecikme = daysAgo(t.vade_tarihi);
    if (gecikme <= 30) buckets.b030 += Number(t.toplam);
    else if (gecikme <= 60) buckets.b3160 += Number(t.toplam);
    else if (gecikme <= 90) buckets.b6190 += Number(t.toplam);
    else buckets.b90 += Number(t.toplam);
    overdueRows.push({ ...t, gecikme });
  });

  document.getElementById("bucket030").textContent = fmtTL(buckets.b030);
  document.getElementById("bucket3160").textContent = fmtTL(buckets.b3160);
  document.getElementById("bucket6190").textContent = fmtTL(buckets.b6190);
  document.getElementById("bucket90").textContent = fmtTL(buckets.b90);
  document.getElementById("bucketFuture").textContent = fmtTL(buckets.future);

  overdueRows.sort((a, b) => b.gecikme - a.gecikme);
  document.getElementById("agingBody").innerHTML = overdueRows.length ? overdueRows.map(t => `
    <tr>
      <td>${fmtDate(t.vade_tarihi)}</td>
      <td class="num amount-pos">${t.gecikme} gün</td>
      <td>${escapeHtml(t.stock_accounts?.unvan || "—")}${t.fatura_no ? " — " + escapeHtml(t.fatura_no) : ""}</td>
      <td>${escapeHtml(t.aciklama || "—")}</td>
      <td class="num">${fmtTL(t.toplam)}</td>
    </tr>`).join("") : `<tr><td colspan="5" class="stock-empty">Vadesi geçen kayıt yok.</td></tr>`;
}

async function loadCriticalReport() {
  const { data, error } = await sb.from("stock_products").select("*").eq("aktif", true).order("kod");
  if (error) { console.error(error); return; }
  const critical = (data || []).filter(p => Number(p.stok_miktari) <= Number(p.kritik_stok));
  document.getElementById("criticalBody").innerHTML = critical.length ? critical.map(p => `
    <tr>
      <td>${escapeHtml(p.kod)}</td>
      <td>${escapeHtml(p.ad)}</td>
      <td class="num amount-pos">${p.stok_miktari}</td>
      <td class="num">${p.kritik_stok}</td>
    </tr>`).join("") : `<tr><td colspan="4" class="stock-empty">Kritik stok yok.</td></tr>`;
}

document.getElementById("reportTabs").addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-tab]");
  if (!btn) return;
  document.querySelectorAll("#reportTabs button").forEach(b => b.classList.toggle("active", b === btn));
  document.getElementById("agingTab").style.display = btn.dataset.tab === "aging" ? "block" : "none";
  document.getElementById("criticalTab").style.display = btn.dataset.tab === "critical" ? "block" : "none";
});

document.addEventListener("DOMContentLoaded", () => {
  loadAgingReport();
  loadCriticalReport();
});
