import type { Tribuna } from './estadio.generator';
import type { LocalidadId } from './localidades.db';

/**
 * "Tabla" de zonas del estadio.
 *
 * Una zona agrupa los asientos que ven el campo prácticamente igual. Cada zona
 * tiene una sola vista previa, que se reutiliza para todos sus asientos.
 */
export type ZonaId =
  | 'GENERAL_NORTE'
  | 'GENERAL_SUR'
  | 'ORIENTAL'
  | 'OCCIDENTAL'
  | 'PREFERENCIAL'
  | 'VIP'
  | 'PALCO';

export interface ZonaRegistro {
  readonly id: ZonaId;
  readonly nombre: string;
  /** Puerta por la que se ingresa a la zona. */
  readonly puerta: string;
  /** Punto del plano desde donde se calcula la vista de la cancha. */
  readonly camara: { readonly x: number; readonly y: number };
}

export const ZONAS: Record<ZonaId, ZonaRegistro> = {
  GENERAL_NORTE: { id: 'GENERAL_NORTE', nombre: 'Fondo Norte', puerta: 'Puerta 9', camara: { x: 250, y: 500 } },
  GENERAL_SUR: { id: 'GENERAL_SUR', nombre: 'Fondo Sur', puerta: 'Puerta 11', camara: { x: 1550, y: 500 } },
  ORIENTAL: { id: 'ORIENTAL', nombre: 'Lateral Este', puerta: 'Puerta 6', camara: { x: 760, y: 110 } },
  OCCIDENTAL: { id: 'OCCIDENTAL', nombre: 'Lateral Oeste', puerta: 'Puerta 3', camara: { x: 640, y: 840 } },
  PREFERENCIAL: { id: 'PREFERENCIAL', nombre: 'Preferencia', puerta: 'Puerta 5', camara: { x: 900, y: 240 } },
  VIP: { id: 'VIP', nombre: 'VIP', puerta: 'Puerta 1', camara: { x: 900, y: 760 } },
  PALCO: { id: 'PALCO', nombre: 'Palco', puerta: 'Puerta 2', camara: { x: 900, y: 905 } },
};

/** Zona a la que pertenece una silla según su tribuna y su localidad. */
export function zonaDeSilla(tribuna: Tribuna, localidad: LocalidadId): ZonaId {
  switch (localidad) {
    case 'GENERAL':
      return tribuna === 'NORTE' ? 'GENERAL_NORTE' : 'GENERAL_SUR';
    default:
      return localidad;
  }
}
