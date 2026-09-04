/**
 * Build into a separate directory from the dev server's.
 *
 * `next build` and `next dev` share `.next` by default, so building while the
 * dev server is running replaces the chunks it is serving and the page loses
 * its stylesheet with a 404. Pointing the build at its own directory means the
 * two can run side by side.
 */
import { spawn } from 'node:child_process';

const child = spawn('npx', ['next', 'build'], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, NEXT_DIST_DIR: process.env.NEXT_DIST_DIR ?? '.next-build' },
});

child.on('exit', (code) => process.exit(code ?? 1));
