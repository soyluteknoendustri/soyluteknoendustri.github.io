let allProducts = [];
let activeCategory = "all";

async function loadProducts() {
  const { data, error } = await sb
    .from("products")
    .select("*")
    .eq("published", true)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Ürünler yüklenemedi:", error);
    return;
  }
  allProducts = data || [];
  renderProducts();
}

function renderProducts() {
  const grid = document.getElementById("productGrid");
  const empty = document.getElementById("productEmpty");
  grid.innerHTML = "";

  const filtered = activeCategory === "all"
    ? allProducts
    : allProducts.filter(p => p.category === activeCategory);

  if (!filtered.length) {
    empty.style.display = "block";
    return;
  }
  empty.style.display = "none";

  filtered.forEach(product => {
    const card = document.createElement("a");
    card.href = `detail.html?slug=${encodeURIComponent(product.slug)}`;
    card.className = "product-card";

    const img = document.createElement("img");
    img.className = "product-card-img";
    img.src = (product.images && product.images[0]) || "../logo.png";
    img.alt = pick(product, "name");
    card.appendChild(img);

    const body = document.createElement("div");
    body.className = "product-card-body";

    const badge = document.createElement("span");
    badge.className = `product-badge ${product.category}`;
    badge.textContent = translations[currentLang][`products.filter.${product.category}`] || product.category;
    body.appendChild(badge);

    const title = document.createElement("h3");
    title.textContent = pick(product, "name");
    body.appendChild(title);

    const desc = document.createElement("p");
    desc.textContent = pick(product, "short_desc");
    body.appendChild(desc);

    card.appendChild(body);
    grid.appendChild(card);
  });
}

function setupFilter() {
  const filter = document.getElementById("categoryFilter");
  filter.addEventListener("click", (e) => {
    const btn = e.target.closest(".category-pill");
    if (!btn) return;
    filter.querySelectorAll(".category-pill").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    activeCategory = btn.dataset.category;
    renderProducts();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  setupFilter();
  loadProducts();
});
window.addEventListener("langchange", renderProducts);
