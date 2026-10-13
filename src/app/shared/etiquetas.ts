import { EstadoSilla, Tribuna } from '../core/data/estadio.generator';

/** Textos para mostrar valores del modelo en la interfaz. */

export const NOMBRE_ESTADO: Record<EstadoSilla, string> = {
  DISPONIBLE: 'Disponible',
  RESERVADA: 'Reservado',
  VENDIDA: 'Vendido',
};

export const ICONO_ESTADO: Record<EstadoSilla, string> = {
  DISPONIBLE: '●',
  RESERVADA: '◐',
  VENDIDA: '○',
};

export const NOMBRE_TRIBUNA: Record<Tribuna, string> = {
  ORIENTAL: 'Lateral Este',
  SUR: 'Fondo Sur',
  OCCIDENTAL: 'Lateral Oeste',
  NORTE: 'Fondo Norte',
};

/** "Fondo · Fondo Sur", o solo "Palco" cuando la zona se llama igual que la localidad. */
export function nombreLocalidadYZona(localidad: string, zona: string): string {
  return localidad === zona ? localidad : `${localidad} · ${zona}`;
}
