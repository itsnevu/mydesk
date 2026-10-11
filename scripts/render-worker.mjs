// The dev server's renderer, in a worker thread: a worker has a module registry of its own, so scripts/serve.js can start a new
// one whenever a source of the portfolio changes (site.js, the dictionaries, labs, data.js, the page's CSS and script) and every
// module is read fresh, with no restart. One message in (an id), one message out (the pages, or the error).
import { parentPort } from 'node:worker_threads';
import { renderSite } from './site.js';

parentPort.on('message', async (id) => {
  try { parentPort.postMessage({ id, pages: await renderSite() }); }
  catch (e) { parentPort.postMessage({ id, error: String(e?.stack || e) }); }
});
