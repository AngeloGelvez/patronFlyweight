import { EstadoSilla, SillaRegistro, Tribuna } from '../core/data/estadio.generator';
import { ZonaId } from '../core/data/zonas.db';
import { DetalleSilla } from '../core/models/mapa-de-sillas';
import { bytesDeUbicacion } from '../core/utils/memoria';
import { Localidad } from './localidad';

/** Una referencia ocupa 8 bytes (puntero de 64 bits). */
const BYTES_POR_REFERENCIA = 8;

/**
 * ✅ CONTEXTO
 *
 * Guarda solo el estado extrínseco: los datos que son únicos de cada silla.
 * Todo lo que comparte con las demás sillas de su localidad lo obtiene a
 * través de una referencia al flyweight.
 */
export class Silla {
  readonly id: string;
  readonly tribuna: Tribuna;
  readonly zona: ZonaId;
  readonly seccion: string;
  readonly fila: number;
  readonly numero: number;
  readonly x: number;
  readonly y: number;
  readonly estado: EstadoSilla;

  constructor(
    registro: SillaRegistro,
    private readonly localidad: Localidad,
  ) {
    this.id = registro.id;
    this.tribuna = registro.tribuna;
    this.zona = registro.zona;
    this.seccion = registro.seccion;
    this.fila = registro.fila;
    this.numero = registro.numero;
    this.x = registro.x;
    this.y = registro.y;
    this.estado = registro.estado;
  }

  /** Delega el dibujo al flyweight y le pasa los datos propios de la silla. */
  dibujar(ctx: CanvasRenderingContext2D, tamano: number): void {
    this.localidad.dibujar(ctx, this.x, this.y, tamano, this.estado);
  }

  detalle(): DetalleSilla {
    return {
      id: this.id,
      tribuna: this.tribuna,
      zona: this.zona,
      seccion: this.seccion,
      fila: this.fila,
      numero: this.numero,
      x: this.x,
      y: this.y,
      estado: this.estado,
      localidad: this.localidad.datos,
    };
  }

  /** Solo cuenta los datos propios: la localidad es compartida. */
  memoriaEstimadaBytes(): number {
    return bytesDeUbicacion(this) + BYTES_POR_REFERENCIA;
  }
}
