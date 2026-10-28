import { copyFile, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

// Hostinger's Node runtime uses LiteSpeed/Passenger.  Its reverse port binding
// recognises the positional `server.listen(port, host)` form, whereas Nitro's
// generated srvx server uses an options object.  Normalise the generated output
// after each Vite build so the same artifact also works in local Node.
const srvxPath = resolve('.output/server/_libs/srvx.mjs');
const source = await readFile(srvxPath, 'utf8');
const target = 'server.listen(this.serveOptions);';
const replacement = `if (process.env.LSNODE_CONSOLE_LOG) {
  server.listen();
} else {
  server.listen(this.serveOptions.port, this.serveOptions.host);
}`;

if (!source.includes(target)) {
  throw new Error('Hostinger compatibility patch could not find the Nitro listener.');
}

await writeFile(srvxPath, source.replace(target, replacement));
await copyFile(
  resolve('scripts/hostinger-passenger.cjs'),
  resolve('.output/app.cjs'),
);
// Vite deliberately omits dotfiles from public/.  Hostinger's LiteSpeed
// needs this routing file in public_html, so place it in the built output
// explicitly after the normal build has finished.
await copyFile(
  resolve('scripts/hostinger-production.htaccess'),
  resolve('.output/public/.htaccess'),
);
console.log('Applied Hostinger LiteSpeed listener compatibility patch.');
