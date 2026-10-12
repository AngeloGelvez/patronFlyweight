import { SillaRegistro } from '../data/estadio.generator';
import { LocalidadRegistro } from '../data/localidades.db';

/**
 * Estimaciones aproximadas de memoria.
 *
 * JavaScript no permite medir cuánto ocupa un objeto, así que se calcula a
 * partir de los datos útiles que guarda. No incluye la sobrecarga interna del
 * motor, por lo que el consumo real es algo mayor. Sirve para comparar las
 * dos versiones con la misma regla.
 */

/** Los textos de JavaScript usan UTF-16: hasta 2 bytes por carácter. */
const BYTES_POR_CARACTER = 2;
const BYTES_POR_NUMERO = 8;
/** Píxeles RGBA: 4 bytes por píxel. */
const BYTES_POR_PIXEL = 4;

export function bytesDeTexto(texto: string): number {
  return texto.length * BYTES_POR_CARACTER;
}

/** Memoria de los datos propios de una silla (su estado extrínseco). */
export function bytesDeUbicacion(silla: Pick<SillaRegistro, 'id' | 'seccion'>): number {
  const textos = bytesDeTexto(silla.id) + bytesDeTexto(silla.seccion);
  // fila, numero, x, y + tribuna y estado (referencias a textos constantes).
  return textos + 6 * BYTES_POR_NUMERO;
}

/** Memoria de una copia de los datos de una localidad (estado intrínseco). */
export function bytesDeLocalidad(localidad: LocalidadRegistro): number {
  const textos =
    bytesDeTexto(localidad.id) +
    bytesDeTexto(localidad.nombre) +
    bytesDeTexto(localidad.descripcion) +
    bytesDeTexto(localidad.color) +
    bytesDeTexto(localidad.terminosYCondiciones) +
    localidad.beneficios.reduce((total, b) => total + bytesDeTexto(b), 0);

  return textos + BYTES_POR_NUMERO; // + precio
}

/** Memoria de los píxeles de un icono cuadrado. */
export function bytesDeIcono(tamanoPx: number): number {
  return tamanoPx * tamanoPx * BYTES_POR_PIXEL;
}

/** Memoria de los píxeles de una imagen rectangular. */
export function bytesDeImagen(ancho: number, alto: number): number {
  return ancho * alto * BYTES_POR_PIXEL;
}
