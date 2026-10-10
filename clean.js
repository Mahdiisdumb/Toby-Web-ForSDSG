#!/usr/bin/env node
/*
 * Usage:  node strip_games.js index.html
 * Writes: index.new.html  (your original is not modified)
 *
 * Removes: Deltarune + Undertale main pages/buttons, the legacy classic page,
 *          Undertale 10th Anniversary, and base Undertale Yellow.
 * Keeps:   Undertale Yellow: Shades of Justice.
 */
const fs = require("fs");

const src = process.argv[2] || "index.html";
const out = src.replace(/\.[^.]+$/, "") + ".new.html";
let html = fs.readFileSync(src, "utf8");

function sub(label, pattern, repl = "") {
  const next = html.replace(pattern, repl);
  console.log((next !== html ? "OK  " : "MISS") + " " + label);
  html = next;
}

// Remove <div id="..."> ... matching </div>, handling nested divs.
function removeDivById(label, id) {
  const start = html.search(new RegExp(`<div id="${id}"[^>]*>`));
  if (start === -1) return console.log("MISS " + label);
  const tag = /<(\/?)div\b[^>]*>/g;
  tag.lastIndex = start;
  let depth = 0, m;
  while ((m = tag.exec(html))) {
    depth += m[1] ? -1 : 1;
    if (depth === 0) {
      html = html.slice(0, start) + html.slice(tag.lastIndex).replace(/^\n+/, "");
      return console.log("OK   " + label);
    }
  }
  console.log("MISS " + label);
}

// Remove `function name(...) {...}` (optionally async) via brace matching.
function removeFunction(name) {
  const m = new RegExp(`[ \\t]*(?:async\\s+)?function\\s+${name}\\s*\\(`).exec(html);
  if (!m) return console.log("MISS function " + name);
  const open = html.indexOf("{", m.index + m[0].length);
  let depth = 0;
  for (let i = open; i < html.length; i++) {
    if (html[i] === "{") depth++;
    else if (html[i] === "}" && --depth === 0) {
      html = html.slice(0, m.index) + html.slice(i + 1).replace(/^\n+/, "");
      return console.log("OK   function " + name);
    }
  }
  console.log("MISS function " + name);
}

// ---------- HTML ----------
sub("home buttons (.home-choices)", /<div class="home-choices">.*?<\/div>\s*/s);
for (const page of ["deltarune-page", "undertale-page", "classic-page"]) {
  sub(`section #${page}`, new RegExp(`<section id="${page}".*?</section>\\s*`, "s"));
}
sub("extras card: Undertale 10th", /<button class="game-card ut10th[^>]*>.*?<\/button>\s*/s);
sub(
  "credits rows: UT Yellow + UT 10th",
  /<a class="game-credit-row[^>]*href="[^"]*(?:UndertaleYellow\/136925|ut10-battle\.undertale\.com)"[^>]*>.*?<\/a>\s*/s
);
sub(
  "extras cards: Asgore Runs Over Dess + Scampton The Great",
  /<button class="game-card (?:asgoredess|scampton)[^>]*>.*?<\/button>\s*/gs
);
sub(
  "credits rows: Asgore Runs Over Dess + Scampton The Great",
  /<a class="game-credit-row[^>]*>(?:(?!<\/a>)[\s\S])*?(?:asgore-runs-over-dess|scampton-the-great)(?:(?!<\/a>)[\s\S])*<\/a>\s*/g
);
removeDivById("modal featured-save-info", "featured-save-info-modal");
removeDivById("modal ut-saves", "ut-saves-modal");

// ---------- JS ----------
sub(
  "constants",
  /^[ \t]*(?:const UNDERTALE_YELLOW_BASE|const FEATURED_SAVE_URL|let utSavesData|const CHAPTER5_BASE|const SCAMPTON_BASE|const ASGORE_DESS_BASE)\b.*\n/gm
);
for (const fn of [
  "loadChapter", "loadDeltaruneWebport", "loadUndertale", "loadUndertaleYellow",
  "loadUndertale10thAnniversary", "openFeaturedSaveInfo", "closeFeaturedSaveInfo",
  "fetchFeaturedSaveText", "downloadFeaturedSave", "importFeaturedSave",
  "fetchUtSaves", "openUtSaves", "closeUtSaves", "loadUtSave",
  "loadAsgoreRunsOverDess", "loadScamptonTheGreat",
]) removeFunction(fn);

// valid-page list at the bottom
const before = html;
html = html.replace('["home", "deltarune", "undertale", "mods"', '["home", "mods"');
html = html.replace(', "extras", "credits", "classic"]', ', "extras", "credits"]');
console.log((html !== before ? "OK  " : "MISS") + " initial page list");

fs.writeFileSync(out, html, "utf8");
console.log(`\nWrote ${out}`);