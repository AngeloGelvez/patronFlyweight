import { EstadoSilla, SillaRegistro, Tribuna } from '../core/data/estadio.generator';
import { LocalidadRegistro } from '../core/data/localidades.db';
import { DetalleSilla } from '../core/models/mapa-de-sillas';
import { crearIconoSilla, Lienzo, TAMANO_ICONO_PX } from '../core/render/icono-silla';
import { bytesDeIcono, bytesDeLocalidad, bytesDeUbicacion } from '../core/utils/memoria';

/**
 * ❌ SIN FLYWEIGHT
 *
 * Cada silla guarda TODO: sus datos propios (sección, fila, posición, estado)
 * y además su propia copia de la localidad y su propio icono renderizado.
 *
 * Con 100.000 sillas y solo 6 localidades, hay 100.000 copias de los términos
 * y condiciones y 100.000 iconos, cuando bastaría con 6 de cada uno.
 */
export class SillaPesada {
  // Datos propios de esta silla (estado extrínseco).
  readonly id: string;
  readonly tribuna: Tribuna;
  readonly seccion: string;
  readonly fila: number;
  readonly numero: number;
  readonly x: number;
  readonly y: number;
  readonly estado: EstadoSilla;

  // Datos que se repiten en todas las sillas de la misma localidad
  // (estado intrínseco), duplicados en cada silla.
  readonly localidad: LocalidadRegistro;
  readonly icono: Lienzo;

  constructor(registro: SillaRegistro, localidad: LocalidadRegistro) {
    this.id = registro.id;
    this.tribuna = registro.tribuna;
    this.seccion = registro.seccion;
    this.fila = registro.fila;
    this.numero = registro.numero;
    this.x = registro.x;
    this.y = registro.y;
    this.estado = registro.estado;

    this.localidad = localidad;
    // Cada silla renderiza su propio icono, aunque sea idéntico al de las
    // demás sillas de su localidad.
    this.icono = crearIconoSilla(localidad.color);
  }

  detalle(): DetalleSilla {
    return {
      id: this.id,
      tribuna: this.tribuna,
      seccion: this.seccion,
      fila: this.fila,
      numero: this.numero,
      x: this.x,
      y: this.y,
      estado: this.estado,
      localidad: this.localidad,
    };
  }

  memoriaEstimadaBytes(): number {
    return (
      bytesDeUbicacion(this) + bytesDeLocalidad(this.localidad) + bytesDeIcono(TAMANO_ICONO_PX)
    );
  }
}
