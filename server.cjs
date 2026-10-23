const http = require("node:http"),
  fs = require("node:fs"),
  path = require("node:path");
const root = __dirname;
const files = {
  "/": "index.html",
  "/index.html": "index.html",
  "/style.css": "style.css",
  "/fonts.css": "fonts.css",
  "/app.js": "app.js",
  "/store.js": "store.js",
};
const types = {
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
};
http
  .createServer((req, res) => {
    const name = new URL(req.url, "http://localhost").pathname;
    const font =
      /^\/fonts\/(Woff2\/IRANYekanXFaNum-[A-Za-z]+\.woff2|Woff\/IRANYekanXFaNum-[A-Za-z]+\.woff)$/.test(
        name,
      );
    const file = files[name] || (font ? name.slice(1) : null);
    if (!file) {
      res.writeHead(404);
      return res.end("Not found");
    }
    fs.readFile(path.join(root, file), (error, data) => {
      if (error) {
        res.writeHead(404);
        return res.end("Not found");
      }
      res.setHeader(
        "Content-Type",
        types[path.extname(file)] || "application/octet-stream",
      );
      res.setHeader("Cache-Control", "no-store");
      res.end(data);
    });
  })
  .listen(4173, "127.0.0.1", () =>
    console.log("Maks Cafe: http://127.0.0.1:4173/?table=7"),
  );
