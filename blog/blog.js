let allPosts = [];

async function loadPosts() {
  const { data, error } = await sb
    .from("blog_posts")
    .select("*")
    .eq("published", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Blog yazıları yüklenemedi:", error);
    return;
  }
  allPosts = data || [];
  renderPosts();
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString(currentLang === "tr" ? "tr-TR" : "en-US", {
    year: "numeric", month: "long", day: "numeric"
  });
}

function renderPosts() {
  const grid = document.getElementById("blogGrid");
  const empty = document.getElementById("blogEmpty");
  grid.innerHTML = "";

  if (!allPosts.length) {
    empty.style.display = "block";
    return;
  }
  empty.style.display = "none";

  allPosts.forEach(post => {
    const card = document.createElement("a");
    card.href = `post.html?slug=${encodeURIComponent(post.slug)}`;
    card.className = "blog-card";

    const cover = document.createElement("img");
    cover.className = "blog-card-cover";
    cover.src = post.cover_image_url || "../logo.png";
    cover.alt = pick(post, "title");
    card.appendChild(cover);

    const body = document.createElement("div");
    body.className = "blog-card-body";

    const date = document.createElement("span");
    date.className = "blog-card-date";
    date.textContent = formatDate(post.created_at);
    body.appendChild(date);

    const title = document.createElement("h3");
    title.textContent = pick(post, "title");
    body.appendChild(title);

    const excerpt = document.createElement("p");
    excerpt.textContent = pick(post, "excerpt");
    body.appendChild(excerpt);

    const link = document.createElement("span");
    link.className = "blog-card-link";
    link.setAttribute("data-i18n", "blog.readmore");
    link.textContent = translations[currentLang]["blog.readmore"];
    body.appendChild(link);

    card.appendChild(body);
    grid.appendChild(card);
  });
}

document.addEventListener("DOMContentLoaded", loadPosts);
window.addEventListener("langchange", renderPosts);
