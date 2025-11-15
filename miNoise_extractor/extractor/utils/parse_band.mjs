import * as cheerio from "cheerio";

export function parseBandHTML(html) {
  const $ = cheerio.load(html);

  // --- Datos básicos ---
  const description = $(".bio-text, .tralbum-about").text().trim() || null;
  const label = $("a.label-link").text().trim() || null;
  const location = $(".location").first().text().trim() || null;
  const image = $("meta[property='og:image']").attr("content") || null;

  // --- Tags del artista ---
  const tags = [];
  $(".tag").each((_, el) => tags.push($(el).text().trim()));

  // --- Álbumes (Bandcamp los lista como <li class='music-grid-item'>) ---
  const albums_data = [];
  $(".music-grid-item a").each((i, el) => {
    if (i >= 8) return false; // máximo 8 álbumes
    const url = $(el).attr("href");
    const title = $(el).find(".title").text().trim() || null;

    if (url && title) {
      const fullUrl = url.startsWith("http")
        ? url
        : `${$("meta[property='og:url']").attr("content")}${url}`;
      albums_data.push({ title, url: fullUrl });
    }
  });

  return { description, label, location, image, tags, albums_data };
}
