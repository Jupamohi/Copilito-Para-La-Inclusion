import { randomUUID } from 'node:crypto';
import {
  access,
  mkdir,
  readFile,
  readdir,
  rename,
  rm,
  writeFile,
} from 'node:fs/promises';
import { URL, fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const raiz = fileURLToPath(new URL('../', import.meta.url));
const carpeta = new URL('../public/mediapipe/', import.meta.url);
await mkdir(carpeta, { recursive: true });
await access(new URL('hand_landmarker.task', carpeta)).catch(() => {
  throw new Error(
    'Falta public/mediapipe/hand_landmarker.task. Consulte los comandos del README.',
  );
});
const origenWasm = new URL(
  '../node_modules/@mediapipe/tasks-vision/wasm/',
  import.meta.url,
);
const carpetaWasm = new URL('wasm/', carpeta);
await mkdir(carpetaWasm, { recursive: true });
for (const archivo of await readdir(origenWasm, { withFileTypes: true })) {
  if (archivo.isFile()) {
    const contenido = await readFile(new URL(archivo.name, origenWasm));
    await prepararArchivo(carpetaWasm, archivo.name, contenido);
  }
}

// MediaPipe 0.10.21 carga el WASM con importScripts en el worker clásico.
const { outputFiles } = await build({
  absWorkingDir: raiz,
  entryPoints: ['src/lib/mediapipe/hand-worker.ts'],
  outfile: 'public/mediapipe/hand-worker.js',
  bundle: true,
  format: 'iife',
  platform: 'browser',
  target: 'es2022',
  minify: true,
  write: false,
});
await prepararArchivo(carpeta, 'hand-worker.js', outputFiles[0].contents);

async function prepararArchivo(directorio, nombre, contenido) {
  const destino = new URL(nombre, directorio);
  const coincide = async () => {
    try {
      return (await readFile(destino)).equals(contenido);
    } catch (error) {
      if (error.code === 'ENOENT') return false;
      throw error;
    }
  };
  if (await coincide()) return;

  // dev y build pueden preparar los mismos archivos al mismo tiempo.
  const provisional = new URL(`.${nombre}.${randomUUID()}.tmp`, directorio);
  try {
    await writeFile(provisional, contenido, { flag: 'wx' });
    try {
      await rename(provisional, destino);
    } catch (error) {
      if (!(await coincide())) throw error;
    }
  } finally {
    await rm(provisional, { force: true });
  }
}
