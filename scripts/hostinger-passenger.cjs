// LiteSpeed's Passenger loader is CommonJS-first.  Keep this tiny bridge as the
// startup file and load the ESM Nitro bundle from it.
import('./server/index.mjs').catch((error) => {
  console.error('Could not start FLOWA server:', error);
  process.exitCode = 1;
});
