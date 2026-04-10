document.addEventListener("DOMContentLoaded", () => {

  // Navbar scroll effect
  const navbar = document.getElementById("navbar");
  window.addEventListener("scroll", () => {
    navbar.classList.toggle("scrolled", window.scrollY > 40);
  });

  // Hamburger menu
  const hamburger = document.getElementById("hamburger");
  const mobileMenu = document.getElementById("mobileMenu");
  hamburger.addEventListener("click", () => {
    hamburger.classList.toggle("open");
    mobileMenu.classList.toggle("open");
  });
  mobileMenu.querySelectorAll("a").forEach(a => {
    a.addEventListener("click", () => {
      hamburger.classList.remove("open");
      mobileMenu.classList.remove("open");
    });
  });

  // Scroll-reveal
  const revealEls = document.querySelectorAll(
    ".service-block, .about-grid, .sector-item, .contact-grid, .stat"
  );
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add("visible");
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });
  revealEls.forEach(el => {
    el.classList.add("reveal");
    observer.observe(el);
  });

  // Contact form — Formspree
  // Formspree endpoint'ini buraya yapıştır:
  const FORMSPREE_ENDPOINT = "https://formspree.io/f/xzdkljpz";

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
