import { LocalidadId, obtenerLocalidad } from '../core/data/localidades.db';
import { Localidad } from './localidad';

/**
 * ✅ FÁBRICA FLYWEIGHT
 *
 * Es el único punto donde se crean localidades. Guarda las que ya creó en una
 * caché y, cuando se le pide una que ya existe, devuelve la misma instancia
 * en lugar de crear otra.
 */
export class LocalidadFactory {
  private readonly cache = new Map<LocalidadId, Localidad>();

  obtenerLocalidad(id: LocalidadId): Localidad {
    let localidad = this.cache.get(id);

    if (!localidad) {
      // Igual que en la versión sin Flyweight, los datos llegan del API como
      // JSON (una copia), pero aquí solo se piden una vez por localidad.
      localidad = new Localidad(structuredClone(obtenerLocalidad(id)));
      this.cache.set(id, localidad);
    }

    return localidad;
  }

  /** Cuántas localidades distintas se han creado. */
  get cantidad(): number {
    return this.cache.size;
  }

  localidades(): Localidad[] {
    return [...this.cache.values()];
  }
}
