import { EstadoSilla } from '../data/estadio.generator';

/**
 * Resolución con la que se pre-renderiza el icono de una silla. Se dibuja una
 * vez en un lienzo aparte y luego se copia con `drawImage`, que es mucho más
 * rápido que trazar la figura completa en cada silla.
 */
export const TAMANO_ICONO_PX = 24;

/** Fracción del espacio entre sillas que ocupa el icono dibujado. */
export const ESCALA_ICONO = 0.85;

/**
 * El estado de la silla no cambia el icono: se representa con la opacidad al
 * momento de dibujar. Así el mismo icono sirve para cualquier estado.
 */
export const OPACIDAD_POR_ESTADO: Record<EstadoSilla, number> = {
  DISPONIBLE: 1,
  RESERVADA: 0.55,
  VENDIDA: 0.2,
};

export type Lienzo = OffscreenCanvas | HTMLCanvasElement;

/**
 * Pre-renderiza el icono de una silla (espaldar, asiento y patas) con el color
 * de su localidad. Es la operación costosa que el patrón Flyweight evita
 * repetir.
 */
export function crearIconoSilla(color: string, tamano: number = TAMANO_ICONO_PX): Lienzo {
  const lienzo = crearLienzo(tamano);
  const ctx = lienzo.getContext('2d') as
    | CanvasRenderingContext2D
    | OffscreenCanvasRenderingContext2D
    | null;

  if (!ctx) {
    throw new Error('El navegador no permitió crear un contexto 2D para el icono de la silla.');
  }

  // La figura se diseña en una cuadrícula de 12 x 12 unidades.
  const u = tamano / 12;

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(2 * u, 1 * u, 8 * u, 6 * u, 1.5 * u); // Espaldar
  ctx.fill();

  ctx.beginPath();
  ctx.roundRect(1 * u, 7 * u, 10 * u, 3 * u, 1 * u); // Asiento
  ctx.fill();

  ctx.fillRect(2 * u, 10 * u, 1.5 * u, 2 * u); // Pata izquierda
  ctx.fillRect(8.5 * u, 10 * u, 1.5 * u, 2 * u); // Pata derecha

  // Sombra entre el espaldar y el asiento para dar volumen.
  ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.fillRect(2 * u, 6.5 * u, 8 * u, 0.75 * u);

  return lienzo;
}

export function crearLienzo(ancho: number, alto: number = ancho): Lienzo {
  if (typeof OffscreenCanvas !== 'undefined') {
    return new OffscreenCanvas(ancho, alto);
  }

  const lienzo = document.createElement('canvas');
  lienzo.width = ancho;
  lienzo.height = alto;
  return lienzo;
}
