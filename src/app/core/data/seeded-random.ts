/**
 * Generador pseudoaleatorio con semilla (algoritmo mulberry32).
 *
 * Con la misma semilla siempre produce la misma secuencia de números, así las
 * versiones "Antes" y "Después" trabajan exactamente con las mismas sillas y
 * la comparación de rendimiento es justa.
 */
export function crearAleatorio(semilla: number): () => number {
  let estado = semilla >>> 0;

  return () => {
    estado = (estado + 0x6d2b79f5) >>> 0;
    let t = estado;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
