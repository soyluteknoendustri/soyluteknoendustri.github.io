async function loadSettings() {
  const { data, error } = await sb.from("site_settings").select("*").eq("id", 1).single();
  if (error) { console.error(error); return; }
  document.getElementById("phone").value = data.phone || "";
  document.getElementById("email").value = data.email || "";
  document.getElementById("addressTr").value = data.address_tr || "";
  document.getElementById("addressEn").value = data.address_en || "";
  document.getElementById("socialLinkedin").value = data.social_linkedin || "";
  document.getElementById("socialInstagram").value = data.social_instagram || "";
  document.getElementById("socialFacebook").value = data.social_facebook || "";
  document.getElementById("socialX").value = data.social_x || "";
}

function showStatus(msg, ok) {
  const el = document.getElementById("statusMsg");
  el.textContent = msg;
  el.className = "status-msg " + (ok ? "ok" : "err");
}

document.getElementById("saveBtn").addEventListener("click", async () => {
  const payload = {
    phone: document.getElementById("phone").value,
    email: document.getElementById("email").value,
    address_tr: document.getElementById("addressTr").value,
    address_en: document.getElementById("addressEn").value,
    social_linkedin: document.getElementById("socialLinkedin").value || null,
    social_instagram: document.getElementById("socialInstagram").value || null,
    social_facebook: document.getElementById("socialFacebook").value || null,
    social_x: document.getElementById("socialX").value || null
  };

  const { error } = await sb.from("site_settings").update(payload).eq("id", 1);
  if (error) { showStatus("Kaydedilemedi: " + error.message, false); return; }
  showStatus("Kaydedildi.", true);
});

document.addEventListener("DOMContentLoaded", loadSettings);
