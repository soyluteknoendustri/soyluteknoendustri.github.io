// Tüm korumalı admin sayfalarında (dashboard/posts/products) supabase-client.js'ten
// sonra yüklenir. Oturum yoksa login'e yönlendirir.

async function requireSession() {
  const { data } = await sb.auth.getSession();
  if (!data.session) {
    window.location.href = "index.html";
    return null;
  }
  return data.session;
}

sb.auth.onAuthStateChange((event) => {
  if (event === "SIGNED_OUT") {
    window.location.href = "index.html";
  }
});

document.addEventListener("DOMContentLoaded", () => {
  requireSession();
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await sb.auth.signOut();
    });
  }
});
