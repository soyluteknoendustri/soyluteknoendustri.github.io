let currentLogoUrl = "";

async function loadStockSettings() {
  const { data, error } = await sb.from("stock_settings").select("*").eq("id", 1).single();
  if (error) { console.error(error); return; }
  document.getElementById("s_unvan").value = data.sirket_unvani || "";
  document.getElementById("s_vkn").value = data.vkn || "";
  document.getElementById("s_vd_tel").value = data.vergi_dairesi_tel || "";
  document.getElementById("s_adres").value = data.adres || "";
  document.getElementById("s_eposta").value = data.eposta || "";
  document.getElementById("s_whatsapp").value = data.whatsapp_numarasi || "";
  document.getElementById("s_imza").value = data.imza_metni || "";
  document.getElementById("s_banka").value = data.banka_adi || "";
  document.getElementById("s_iban").value = data.iban || "";
  currentLogoUrl = data.logo_url || "";
  renderLogoPreview();
}

function renderLogoPreview() {
  const img = document.getElementById("logoPreview");
  if (currentLogoUrl) { img.src = currentLogoUrl; img.style.display = "block"; }
  else { img.style.display = "none"; }
}

document.getElementById("logoInput").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const path = `${Date.now()}-${file.name}`;
  const { error } = await sb.storage.from("stock-media").upload(path, file);
  if (error) { showStatus("settingsStatusMsg", "Logo yüklenemedi: " + error.message, false); return; }
  const { data } = sb.storage.from("stock-media").getPublicUrl(path);
  currentLogoUrl = data.publicUrl;
  renderLogoPreview();
  e.target.value = "";
});

document.getElementById("removeLogoBtn").addEventListener("click", () => {
  currentLogoUrl = "";
  renderLogoPreview();
});

document.getElementById("saveSettingsBtn").addEventListener("click", async () => {
  const payload = {
    sirket_unvani: document.getElementById("s_unvan").value.trim() || null,
    vkn: document.getElementById("s_vkn").value.trim() || null,
    vergi_dairesi_tel: document.getElementById("s_vd_tel").value.trim() || null,
    adres: document.getElementById("s_adres").value.trim() || null,
    eposta: document.getElementById("s_eposta").value.trim() || null,
    whatsapp_numarasi: document.getElementById("s_whatsapp").value.trim() || null,
    imza_metni: document.getElementById("s_imza").value.trim() || null,
    banka_adi: document.getElementById("s_banka").value.trim() || null,
    iban: document.getElementById("s_iban").value.trim() || null,
    logo_url: currentLogoUrl || null
  };
  const { error } = await sb.from("stock_settings").update(payload).eq("id", 1);
  if (error) { showStatus("settingsStatusMsg", "Kaydedilemedi: " + error.message, false); return; }
  showStatus("settingsStatusMsg", "Kaydedildi.", true);
});

document.addEventListener("DOMContentLoaded", loadStockSettings);
