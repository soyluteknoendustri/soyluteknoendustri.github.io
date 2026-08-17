const AUDIT_PAGE_SIZE = 50;
let auditOffset = 0;
let auditDone = false;

function fmtDateTime(ts) {
  return new Date(ts).toLocaleString("tr-TR");
}

async function loadAuditPage() {
  if (auditDone) return;
  const { data, error } = await sb
    .from("stock_audit_log")
    .select("*")
    .order("zaman", { ascending: false })
    .range(auditOffset, auditOffset + AUDIT_PAGE_SIZE - 1);
  if (error) { console.error(error); return; }

  const rows = data || [];
  const body = document.getElementById("auditBody");
  if (auditOffset === 0 && !rows.length) {
    body.innerHTML = `<tr><td colspan="5" class="stock-empty">Kayıt yok.</td></tr>`;
  } else {
    body.insertAdjacentHTML("beforeend", rows.map(r => {
      const badgeClass = r.islem === "CREATE" ? "green" : r.islem === "DELETE" ? "red" : "amber";
      const detay = r.detay ? JSON.stringify(r.detay) : "";
      return `
        <tr>
          <td>${fmtDateTime(r.zaman)}</td>
          <td>${escapeHtml(r.kullanici || "—")}</td>
          <td><span class="badge ${badgeClass}">${escapeHtml(r.islem)}</span></td>
          <td>${escapeHtml(r.nesne)}</td>
          <td style="max-width:420px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${escapeHtml(detay)}">${escapeHtml(detay)}</td>
        </tr>`;
    }).join(""));
  }

  auditOffset += rows.length;
  if (rows.length < AUDIT_PAGE_SIZE) {
    auditDone = true;
    document.getElementById("loadMoreBtn").style.display = "none";
  }
}

document.getElementById("loadMoreBtn").addEventListener("click", loadAuditPage);
document.addEventListener("DOMContentLoaded", loadAuditPage);
