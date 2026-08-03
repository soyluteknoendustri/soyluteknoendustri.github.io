document.addEventListener("DOMContentLoaded", () => {

  // Contact form — Formspree (FORMSPREE_ENDPOINT assets/js/config.js'te tanımlı)
  document.getElementById("contactForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.target;
    const btn  = form.querySelector("button[type=submit]");
    const data = new FormData(form);

    // Konu alanını okunabilir hale getir
    const subjectSelect = form.querySelector("#fsubject");
    if (subjectSelect && subjectSelect.selectedOptions[0]) {
      data.set("_subject", "Soylu Tekno Endüstri — " + subjectSelect.selectedOptions[0].text);
    }
    // Formspree'nin yönlendirmesini kapat (AJAX modda çalış)
    data.set("_captcha", "false");

    btn.disabled = true;
    btn.textContent = currentLang === "tr" ? "Gönderiliyor..." : "Sending...";
    btn.style.opacity = ".7";

    try {
      const res = await fetch(FORMSPREE_ENDPOINT, {
        method:  "POST",
        body:    data,
        headers: { Accept: "application/json" }
      });

      if (res.ok) {
        btn.textContent = currentLang === "tr" ? "Gönderildi ✓" : "Sent ✓";
        btn.style.background = "linear-gradient(135deg,#2d9e5f,#38c170)";
        btn.style.opacity = "1";
        form.reset();
        setTimeout(() => {
          btn.textContent = currentLang === "tr" ? "Gönder" : "Send Message";
          btn.style.background = "";
          btn.disabled = false;
        }, 4000);
      } else {
        throw new Error("server");
      }
    } catch {
      btn.textContent = currentLang === "tr" ? "Hata — Tekrar Dene" : "Error — Try Again";
      btn.style.background = "linear-gradient(135deg,#c0392b,#e74c3c)";
      btn.style.opacity = "1";
      setTimeout(() => {
        btn.textContent = currentLang === "tr" ? "Gönder" : "Send Message";
        btn.style.background = "";
        btn.disabled = false;
      }, 3000);
    }
  });

});
