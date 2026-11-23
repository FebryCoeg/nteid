/* Logika halaman Esper Cycle (tanpa DOM): mengambil teks "… Enhancement" milik satu siklus dari deskripsi passive. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.NteCycles = factory();
})(typeof self !== "undefined" ? self : this, function () {
  const escRe = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  // Satu passive bisa memuat beberapa penguatan ("<b>Charge Enhancement</b>: … <b>Remora Enhancement</b>: …").
  // Mengembalikan teks milik `name` saja, atau null bila tidak ada.
  function enhancement(desc, name) {
    if (typeof desc !== "string" || !desc) return null;
    const m = new RegExp("<b>" + escRe(name) + " Enhancement</b>\\s*[:：]\\s*([\\s\\S]*?)(?=<b>[^<]*Enhancement</b>|$)").exec(desc);
    return m ? m[1].trim() : null;
  }

  // Angka bertanda <NumGreen>…</> pada teks game, berurutan (dipakai agar angka di teks terjemahan sama dengan data game).
  const nums = (s) => Array.from(String(s || "").matchAll(/<NumGreen>([^<]*)<\/>/g), (m) => m[1]);

  // Ganti {0}, {1}, … dengan angka tebal.
  const fill = (tpl, values) => String(tpl).replace(/\{(\d+)\}/g, (_, i) => (values[+i] == null ? "" : "<b>" + values[+i] + "</b>"));

  return { enhancement, nums, fill };
});
