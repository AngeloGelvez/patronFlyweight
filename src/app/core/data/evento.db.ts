/**
 * Evento ficticio para el que se venden las boletas.
 */
export interface EventoRegistro {
  readonly nombre: string;
  readonly estadio: string;
  readonly ciudad: string;
  /** Fecha y hora en formato ISO 8601. */
  readonly fecha: string;
}

export const EVENTO: EventoRegistro = {
  nombre: 'Gran Final del Torneo Nacional 2026',
  estadio: 'Estadio Metropolitano',
  ciudad: 'Bogotá',
  fecha: '2026-12-13T19:30:00-05:00',
};
