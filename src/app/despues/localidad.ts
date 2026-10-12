import { EstadoSilla } from '../core/data/estadio.generator';
import { LocalidadRegistro } from '../core/data/localidades.db';
import { crearIconoSilla, Lienzo, OPACIDAD_POR_ESTADO, TAMANO_ICONO_PX } from '../core/render/icono-silla';
import { bytesDeIcono, bytesDeLocalidad } from '../core/utils/memoria';

/**
 * ✅ FLYWEIGHT (objeto ligero compartido)
 *
 * Guarda el estado intrínseco: los datos que son iguales para todas las sillas
 * de una localidad (precio, color, beneficios, términos) y su icono. Existe
 * una sola instancia por localidad y la comparten miles de sillas.
 *
 * Es inmutable: si una silla pudiera modificarla, el cambio afectaría a todas
 * las demás sillas que la comparten.
 */
export class Localidad {
  readonly icono: Lienzo;

  constructor(readonly datos: LocalidadRegistro) {
    Object.freeze(datos.beneficios);
    Object.freeze(datos);
    this.icono = crearIconoSilla(datos.color);
    Object.freeze(this);
  }

  /**
   * Dibuja una silla de esta localidad. Los datos propios de la silla
   * (posición y estado) llegan como parámetros: son el estado extrínseco.
   */
  dibujar(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    tamano: number,
    estado: EstadoSilla,
  ): void {
    const mitad = tamano / 2;
    ctx.globalAlpha = OPACIDAD_POR_ESTADO[estado];
    ctx.drawImage(this.icono, x - mitad, y - mitad, tamano, tamano);
  }

  memoriaEstimadaBytes(): number {
    return bytesDeLocalidad(this.datos) + bytesDeIcono(TAMANO_ICONO_PX);
  }
}
