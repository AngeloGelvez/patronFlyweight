import { ZonaId } from '../core/data/zonas.db';
import { Lienzo } from '../core/render/icono-silla';
import { ALTO_VISTA, ANCHO_VISTA, renderizarVistaCancha } from '../core/render/vista-cancha';
import { bytesDeImagen } from '../core/utils/memoria';

/**
 * ✅ FÁBRICA FLYWEIGHT DE VISTAS PREVIAS
 *
 * Todas las sillas de una zona ven la cancha igual, así que la vista previa
 * es estado intrínseco de la zona. La fábrica la dibuja la primera vez que
 * alguien la pide y después devuelve siempre la misma imagen: como máximo
 * existe una vista por zona (7 en total), sin importar cuántas sillas se
 * seleccionen.
 */
export class VistaPreviaFactory {
  private readonly cache = new Map<ZonaId, Lienzo>();

  obtenerVista(zona: ZonaId): Lienzo {
    let vista = this.cache.get(zona);

    if (!vista) {
      vista = renderizarVistaCancha(zona);
      this.cache.set(zona, vista);
    }

    return vista;
  }

  /** Cuántas vistas distintas se han dibujado. */
  get cantidad(): number {
    return this.cache.size;
  }

  memoriaEstimadaBytes(): number {
    return this.cache.size * bytesDeImagen(ANCHO_VISTA, ALTO_VISTA);
  }
}
