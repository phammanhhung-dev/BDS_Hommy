const SITE_URL = "https://hommy.vn";

export function setMetaTag(name, content, attribute = "name") {
  if (!content) return;
  let el = document.querySelector(`meta[${attribute}="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attribute, name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

export function setCanonical(url) {
  let el = document.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", url);
}

export function setPageSEO({
  title,
  description,
  keywords,
  canonical = `${SITE_URL}/`,
  ogTitle,
  ogDescription,
  ogUrl,
}) {
  if (title) document.title = title;
  if (description) setMetaTag("description", description);
  if (keywords) setMetaTag("keywords", keywords);
  setCanonical(canonical);

  setMetaTag("og:title", ogTitle || title, "property");
  setMetaTag("og:description", ogDescription || description, "property");
  setMetaTag("og:url", ogUrl || canonical, "property");
  setMetaTag("twitter:title", ogTitle || title, "property");
  setMetaTag("twitter:description", ogDescription || description, "property");
}

export function injectJsonLd(id, data) {
  let script = document.getElementById(id);
  if (!script) {
    script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = id;
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(data);
}

export function removeJsonLd(id) {
  document.getElementById(id)?.remove();
}

export { SITE_URL };
