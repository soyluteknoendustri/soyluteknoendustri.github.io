async function loadDashboard() {
  const [{ data: accounts }, { data: products }, { data: dueTx }] = await Promise.all([
    sb.from("stock_accounts").select("tip,bakiye"),
    sb.from("stock_products").select("kod,ad,stok_miktari,kritik_stok,aktif"),
    sb.from("stock_transactions").select("id,vade_tarihi,cari_id").lt("vade_tarihi", todayISO()).not("vade_tarihi", "is", null)
  ]);

  const acc = accounts || [];
  const musteriBorcu = acc.filter(a => a.tip === "musteri" && a.bakiye > 0).reduce((s, a) => s + Number(a.bakiye), 0);
  const tedarikciBorcu = acc.filter(a => a.tip === "tedarikci" && a.bakiye < 0).reduce((s, a) => s + Math.abs(Number(a.bakiye)), 0);
  document.getElementById("statMusteriBorcu").textContent = fmtTL(musteriBorcu);
  document.getElementById("statTedarikciBorcu").textContent = fmtTL(tedarikciBorcu);
  document.getElementById("sumAccounts").textContent = acc.length;

  const prod = (products || []).filter(p => p.aktif !== false);
  const critical = prod.filter(p => Number(p.stok_miktari) <= Number(p.kritik_stok));
  document.getElementById("statKritikStok").textContent = critical.length;
  document.getElementById("sumProducts").textContent = prod.length;
  document.getElementById("sumNegativeStock").textContent = prod.filter(p => Number(p.stok_miktari) < 0).length;

  const criticalBody = document.getElementById("criticalStockBody");
  criticalBody.innerHTML = critical.length
    ? critical.map(p => `
        <tr>
          <td>${escapeHtml(p.kod)}</td>
          <td>${escapeHtml(p.ad)}</td>
          <td class="num amount-pos">${p.stok_miktari}</td>
          <td class="num">${p.kritik_stok}</td>
        </tr>`).join("")
    : `<tr><td colspan="4" class="stock-empty">Kritik stok yok.</td></tr>`;

  const distinctDueCari = new Set((dueTx || []).map(t => t.cari_id));
  document.getElementById("statVadesiGecen").textContent = distinctDueCari.size;

  await renderCashFlowChart();
}

async function renderCashFlowChart() {
  const days = [];
  const start = new Date();
  start.setDate(start.getDate() - 29);
  for (let i = 0; i < 30; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(d.toISOString().slice(0, 10));
  }

  const { data } = await sb
    .from("stock_transactions")
    .select("tarih,tip,toplam")
    .in("tip", ["tahsilat", "odeme"])
    .gte("tarih", days[0]);

  const tahsilatByDay = Object.fromEntries(days.map(d => [d, 0]));
  const odemeByDay = Object.fromEntries(days.map(d => [d, 0]));
  (data || []).forEach(t => {
    if (t.tip === "tahsilat" && tahsilatByDay[t.tarih] !== undefined) tahsilatByDay[t.tarih] += Number(t.toplam);
    if (t.tip === "odeme" && odemeByDay[t.tarih] !== undefined) odemeByDay[t.tarih] += Number(t.toplam);
  });

  const ctx = document.getElementById("cashFlowChart");
  new Chart(ctx, {
    type: "line",
    data: {
      labels: days.map(d => d.slice(5)),
      datasets: [
        { label: "Tahsilat", data: days.map(d => tahsilatByDay[d]), borderColor: "#1e8c4f", backgroundColor: "rgba(30,140,79,.1)", tension: .3, fill: true },
        { label: "Ödeme", data: days.map(d => odemeByDay[d]), borderColor: "#c0392b", backgroundColor: "rgba(192,57,43,.1)", tension: .3, fill: true }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      scales: { y: { beginAtZero: true } }
    }
  });
}

document.addEventListener("DOMContentLoaded", loadDashboard);
