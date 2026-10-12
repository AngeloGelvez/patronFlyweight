export type VersionMapa = 'antes' | 'despues';

export const NOMBRE_VERSION: Record<VersionMapa, string> = {
  antes: 'Sin Flyweight',
  despues: 'Con Flyweight',
};

/** Métricas de una ejecución completa del mapa. */
export interface ResultadoEjecucion {
  readonly version: VersionMapa;
  readonly cantidad: number;
  /** Generar los registros de la base de datos falsa (igual en ambas versiones). */
  readonly cargaDatosMs: number;
  /** Construir los objetos del mapa: aquí es donde actúa el patrón. */
  readonly creacionMs: number;
  /** Dibujar todas las sillas en el canvas. */
  readonly renderMs: number;
  readonly totalMs: number;
  readonly copiasDeLocalidad: number;
  readonly iconos: number;
  readonly memoriaEstimadaBytes: number;
  /**
   * Heap de JavaScript usado al terminar, según `performance.memory`.
   * Solo existe en Chrome y Edge, y es aproximado; `null` en otros navegadores.
   */
  readonly heapUsadoBytes: number | null;
  /** Fecha de la ejecución en formato ISO 8601. */
  readonly fecha: string;
}

/** Cuánto mejora la versión con Flyweight respecto a la versión sin él. */
export interface Comparacion {
  /** Si ambas ejecuciones usaron la misma cantidad de sillas (comparación justa). */
  readonly mismaCantidad: boolean;
  /** Cuántas veces más rápido (por ejemplo, 120 = 120 veces más rápido). */
  readonly aceleracionCreacion: number;
  readonly aceleracionRender: number;
  readonly aceleracionTotal: number;
  /** Fracción de memoria ahorrada, entre 0 y 1. */
  readonly reduccionMemoria: number;
  /** Copias de localidad que el patrón evitó crear. */
  readonly copiasEvitadas: number;
}
