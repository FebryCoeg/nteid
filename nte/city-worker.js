/* Menjalankan solver di luar utas utama agar halaman tidak macet. */
let engine = null;
self.onmessage = (ev) => {
  const { ver, data, layout, inventory, options } = ev.data;
  try {
    if (!engine) {
      importScripts("/nte/city-engine.js" + ver, "/nte/city-solver.js" + ver);
      engine = self.NteCity.create(data);
    }
    self.postMessage({ result: self.NteCitySolver.solve(engine, layout, inventory, options) });
  } catch (e) {
    self.postMessage({ error: String((e && e.message) || e) });
  }
};
