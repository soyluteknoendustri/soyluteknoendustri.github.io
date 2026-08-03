let siteSettings = null;

const SOCIAL_ICONS = {
  social_linkedin: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.24 8.25h4.5V23h-4.5V8.25zm7.19 0h4.31v2.02h.06c.6-1.13 2.06-2.32 4.24-2.32 4.54 0 5.38 2.99 5.38 6.87V23h-4.5v-6.5c0-1.55-.03-3.54-2.16-3.54-2.16 0-2.49 1.69-2.49 3.43V23h-4.5V8.25z"/></svg>',
  social_instagram: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.16c3.2 0 3.58.01 4.85.07 3.25.15 4.77 1.69 4.92 4.92.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.15 3.23-1.66 4.77-4.92 4.92-1.27.06-1.64.07-4.85.07s-3.58-.01-4.85-.07c-3.26-.15-4.77-1.7-4.92-4.92-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85C2.38 3.9 3.9 2.38 7.15 2.23 8.42 2.17 8.8 2.16 12 2.16zm0 5.35a4.49 4.49 0 100 8.98 4.49 4.49 0 000-8.98zm0 7.4a2.91 2.91 0 110-5.82 2.91 2.91 0 010 5.82zm4.66-7.58a1.05 1.05 0 110-2.1 1.05 1.05 0 010 2.1z"/></svg>',
  social_facebook: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M22 12a10 10 0 10-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0022 12z"/></svg>',
  social_x: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.24 2h3.3l-7.2 8.23L23 22h-6.63l-5.2-6.8L5.2 22H1.9l7.7-8.8L1 2h6.8l4.7 6.2L18.24 2zm-1.16 18h1.83L7.05 3.9H5.1L17.08 20z"/></svg>'
};

async function loadContactSettings() {
  const { data, error } = await sb.from("site_settings").select("*").eq("id", 1).single();
  if (error) {
    console.error("İletişim bilgileri yüklenemedi:", error);
    return;
  }
  siteSettings = data;
  renderContactSettings();
}

function renderContactSettings() {
  if (!siteSettings) return;

  const phoneEl = document.getElementById("cinfoPhone");
  const emailEl = document.getElementById("cinfoEmail");
  const addressEl = document.getElementById("cinfoAddress");

  if (phoneEl && siteSettings.phone) phoneEl.textContent = siteSettings.phone;
  if (emailEl && siteSettings.email) emailEl.textContent = siteSettings.email;
  if (addressEl) {
    const address = currentLang === "tr" ? siteSettings.address_tr : siteSettings.address_en;
    if (address) addressEl.textContent = address;
  }

  const socialWrap = document.getElementById("socialLinks");
  if (!socialWrap) return;
  socialWrap.innerHTML = "";
  Object.keys(SOCIAL_ICONS).forEach(key => {
    const url = siteSettings[key];
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener";
    a.className = "social-icon";
    a.innerHTML = SOCIAL_ICONS[key];
    socialWrap.appendChild(a);
  });
}

document.addEventListener("DOMContentLoaded", loadContactSettings);
window.addEventListener("langchange", renderContactSettings);
