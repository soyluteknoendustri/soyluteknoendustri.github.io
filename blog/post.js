function getSlug() {
  return new URLSearchParams(window.location.search).get("slug");
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString(currentLang === "tr" ? "tr-TR" : "en-US", {
    year: "numeric", month: "long", day: "numeric"
  });
}

function extBadge(fileName) {
  const ext = (fileName || "").split(".").pop();
  return ext ? ext.toUpperCase().slice(0, 4) : "DOC";
}

let currentPost = null;
let currentAttachments = [];

async function loadPost() {
  const slug = getSlug();
  const root = document.getElementById("postRoot");
  if (!slug) {
    root.innerHTML = "<p>Post not found.</p>";
    return;
  }

  const { data: post, error } = await sb
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .single();

  if (error || !post) {
    console.error("Yazı bulunamadı:", error);
    root.innerHTML = "<p>Post not found.</p>";
    return;
  }

  const { data: attachments } = await sb
    .from("blog_attachments")
    .select("*")
    .eq("post_id", post.id)
    .order("created_at", { ascending: true });

  currentPost = post;
  currentAttachments = attachments || [];
  renderPost();
}

function renderPost() {
  if (!currentPost) return;
  const root = document.getElementById("postRoot");
  const post = currentPost;

  document.title = `${pick(post, "title")} — Soylu Tekno & Endüstri`;

  root.innerHTML = "";

  const h1 = document.createElement("h1");
  h1.textContent = pick(post, "title");
  root.appendChild(h1);

  const date = document.createElement("span");
  date.className = "post-date";
  date.textContent = formatDate(post.created_at);
  root.appendChild(date);

  if (post.cover_image_url) {
    const cover = document.createElement("img");
    cover.className = "post-cover";
    cover.src = post.cover_image_url;
    cover.alt = pick(post, "title");
    root.appendChild(cover);
  }

  const body = document.createElement("div");
  body.className = "post-body";
  body.innerHTML = pick(post, "body");
  root.appendChild(body);

  if (currentAttachments.length) {
    const wrap = document.createElement("div");
    wrap.className = "attachments";

    const h4 = document.createElement("h4");
    h4.textContent = translations[currentLang]["blog.attachments"];
    wrap.appendChild(h4);

    currentAttachments.forEach(att => {
      const item = document.createElement("a");
      item.className = "attachment-item";
      item.href = att.file_url;
      item.target = "_blank";
      item.rel = "noopener";

      const icon = document.createElement("div");
      icon.className = "attachment-icon";
      icon.textContent = extBadge(att.file_name);
      icon.style.fontSize = ".55rem";
      icon.style.fontWeight = "700";
      item.appendChild(icon);

      const name = document.createElement("span");
      name.className = "attachment-name";
      name.textContent = att.file_name || att.file_url;
      item.appendChild(name);

      const dl = document.createElement("span");
      dl.className = "attachment-download";
      dl.textContent = "↓";
      item.appendChild(dl);

      wrap.appendChild(item);
    });

    root.appendChild(wrap);
  }
}

document.addEventListener("DOMContentLoaded", loadPost);
window.addEventListener("langchange", renderPost);
