function getSlug() {
  return new URLSearchParams(window.location.search).get("slug");
}

let currentProduct = null;
let activeImageIndex = 0;

async function loadProduct() {
  const slug = getSlug();
  const root = document.getElementById("productRoot");
  if (!slug) {
    root.innerHTML = "<p>Product not found.</p>";
    return;
  }

  const { data: product, error } = await sb
    .from("products")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .single();

  if (error || !product) {
    console.error("Ürün bulunamadı:", error);
    root.innerHTML = "<p>Product not found.</p>";
    return;
  }

  currentProduct = product;
  renderProduct();
}

function renderProduct() {
  if (!currentProduct) return;
  const root = document.getElementById("productRoot");
  const product = currentProduct;
  const images = (product.images && product.images.length) ? product.images : ["../logo.png"];

  document.title = `${pick(product, "name")} — Soylu Tekno & Endüstri`;

  root.innerHTML = "";

  const gallery = document.createElement("div");
  gallery.className = "product-gallery";

  const mainImg = document.createElement("img");
  mainImg.className = "product-gallery-main";
  mainImg.src = images[activeImageIndex] || images[0];
  mainImg.alt = pick(product, "name");
  gallery.appendChild(mainImg);

  if (images.length > 1) {
    const thumbs = document.createElement("div");
    thumbs.className = "product-gallery-thumbs";
    images.forEach((url, i) => {
      const thumb = document.createElement("img");
      thumb.src = url;
      thumb.className = i === activeImageIndex ? "active" : "";
      thumb.addEventListener("click", () => {
        activeImageIndex = i;
        renderProduct();
      });
      thumbs.appendChild(thumb);
    });
    gallery.appendChild(thumbs);
  }
  root.appendChild(gallery);

  const info = document.createElement("div");
  info.className = "product-info";

  const badge = document.createElement("span");
  badge.className = `product-badge ${product.category}`;
  badge.textContent = translations[currentLang][`products.filter.${product.category}`] || product.category;
  info.appendChild(badge);

  const h1 = document.createElement("h1");
  h1.textContent = pick(product, "name");
  info.appendChild(h1);

  const desc = document.createElement("div");
  desc.className = "product-desc";
  desc.innerHTML = pick(product, "description") || pick(product, "short_desc");
  info.appendChild(desc);

  if (product.datasheet_url) {
    const dl = document.createElement("a");
    dl.className = "btn-primary";
    dl.href = product.datasheet_url;
    dl.target = "_blank";
    dl.rel = "noopener";
    dl.textContent = translations[currentLang]["products.datasheet"];
    info.appendChild(dl);
  }

  root.appendChild(info);
}

document.addEventListener("DOMContentLoaded", loadProduct);
window.addEventListener("langchange", renderProduct);
