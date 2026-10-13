/**
 * Partido ficticio para el que se venden las entradas.
 *
 * Las imágenes se cargan desde sus URL públicas (no se guardan en el
 * proyecto); si no cargan, la página muestra un respaldo.
 */
export interface EquipoRegistro {
  readonly nombre: string;
  readonly abreviatura: string;
  /** Escudo en PNG, servido por Wikimedia. */
  readonly escudo: string;
}

export interface EventoRegistro {
  readonly local: EquipoRegistro;
  readonly visitante: EquipoRegistro;
  readonly competicion: string;
  readonly jornada: string;
  readonly estadio: string;
  readonly ciudad: string;
  /** Fecha y hora en formato ISO 8601, con la zona horaria de Madrid. */
  readonly fecha: string;
  /** Zona horaria en la que se muestran las horas (la del estadio). */
  readonly zonaHoraria: string;
  readonly imagenEstadio: string;
}

export const EVENTO: EventoRegistro = {
  local: {
    nombre: 'Real Madrid',
    abreviatura: 'RMA',
    escudo: 'https://thumb.wikimedia.org/wikipedia/en/thumb/5/56/Real_Madrid_CF.svg/330px-Real_Madrid_CF.svg.png',
  },
  visitante: {
    nombre: 'Atlético de Madrid',
    abreviatura: 'ATM',
    escudo:
      'https://thumb.wikimedia.org/wikipedia/en/thumb/f/f9/Atletico_Madrid_Logo_2024.svg/330px-Atletico_Madrid_Logo_2024.svg.png',
  },
  competicion: 'LaLiga EA Sports',
  jornada: 'Jornada 16 · Derbi madrileño',
  estadio: 'Estadio Metropolitano',
  ciudad: 'Madrid',
  fecha: '2026-12-13T21:00:00+01:00',
  zonaHoraria: '+0100',
  imagenEstadio: 'https://www.socios.com/wp-content/uploads/2026/05/civitas-metropolitano.jpg',
};
