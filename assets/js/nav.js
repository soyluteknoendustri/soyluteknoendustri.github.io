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

  // Scroll-reveal — bu oturumda bir kez görülen bölümler sayfa değişince
  // (ör. Blog/Ürünler'e gidip geri dönünce) tekrar gizlenmez.
  const revealEls = document.querySelectorAll(
    ".service-block, .about-grid, .sector-item, .contact-grid, .stat, .blog-card, .product-card"
  );
  if (sessionStorage.getItem("revealSeen")) {
    revealEls.forEach(el => el.classList.add("reveal", "visible"));
  } else {
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
    sessionStorage.setItem("revealSeen", "1");
  }

});
