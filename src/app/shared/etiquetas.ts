import { EstadoSilla, Tribuna } from '../core/data/estadio.generator';

/** Textos para mostrar valores del modelo en la interfaz. */

export const NOMBRE_ESTADO: Record<EstadoSilla, string> = {
  DISPONIBLE: 'Disponible',
  RESERVADA: 'Reservada',
  VENDIDA: 'Vendida',
};

export const ICONO_ESTADO: Record<EstadoSilla, string> = {
  DISPONIBLE: '●',
  RESERVADA: '◐',
  VENDIDA: '○',
};

export const NOMBRE_TRIBUNA: Record<Tribuna, string> = {
  ORIENTAL: 'Oriental',
  SUR: 'Sur',
  OCCIDENTAL: 'Occidental',
  NORTE: 'Norte',
};

/** "General · General Sur", o solo "Palco" cuando la zona se llama igual que la localidad. */
export function nombreLocalidadYZona(localidad: string, zona: string): string {
  return localidad === zona ? localidad : `${localidad} · ${zona}`;
}
