import { EstadioGenerado, EstadoSilla, Tribuna } from '../data/estadio.generator';
import { LocalidadId } from '../data/localidades.db';

/**
 * Contrato común de las dos versiones del mapa (sin y con Flyweight).
 *
 * La interfaz gráfica solo conoce este contrato, así que dibuja, busca y mide
 * las dos versiones exactamente de la misma forma. Lo único que cambia entre
 * ellas es cómo guardan los datos en memoria.
 */
export interface MapaDeSillas {
  /** Plano con el que se construyó el mapa (tamaño, cancha y separación). */
  readonly plano: EstadioGenerado;

  /** Dibuja todas las sillas usando coordenadas del plano del estadio. */
  dibujar(ctx: CanvasRenderingContext2D): void;

  /** Devuelve la silla que está en (x, y), o `null` si no hay ninguna. */
  buscarSilla(x: number, y: number): DetalleSilla | null;

  estadisticas(): EstadisticasMapa;
}

/** Información que se muestra al hacer clic en una silla. */
export interface DetalleSilla {
  readonly id: string;
  readonly tribuna: Tribuna;
  readonly seccion: string;
  readonly fila: number;
  readonly numero: number;
  /** Posición en el plano, para resaltar la silla seleccionada. */
  readonly x: number;
  readonly y: number;
  readonly estado: EstadoSilla;
  readonly localidad: {
    readonly id: LocalidadId;
    readonly nombre: string;
    readonly descripcion: string;
    readonly precio: number;
    readonly color: string;
    readonly beneficios: readonly string[];
    readonly terminosYCondiciones: string;
  };
}

export interface EstadisticasMapa {
  readonly sillas: number;
  /** Cuántas copias de los datos de una localidad existen en memoria. */
  readonly copiasDeLocalidad: number;
  /** Cuántos iconos de silla se renderizaron. */
  readonly iconos: number;
  /** Estimación de la memoria que ocupan los datos (ver `memoria.ts`). */
  readonly memoriaEstimadaBytes: number;
}
