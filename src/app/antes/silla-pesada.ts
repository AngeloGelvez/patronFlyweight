import { EstadoSilla, SillaRegistro, Tribuna } from '../core/data/estadio.generator';
import { LocalidadRegistro } from '../core/data/localidades.db';
import { ZonaId } from '../core/data/zonas.db';
import { DetalleSilla } from '../core/models/mapa-de-sillas';
import { crearIconoSilla, Lienzo, TAMANO_ICONO_PX } from '../core/render/icono-silla';
import { ALTO_VISTA, ANCHO_VISTA, renderizarVistaCancha } from '../core/render/vista-cancha';
import { bytesDeIcono, bytesDeImagen, bytesDeLocalidad, bytesDeUbicacion } from '../core/utils/memoria';

/**
 * ❌ SIN FLYWEIGHT
 *
 * Cada silla guarda TODO: sus datos propios (sección, fila, posición, estado)
 * y además su propia copia de la localidad, su propio icono renderizado y,
 * cuando el usuario la selecciona, su propia vista previa de la cancha.
 *
 * Con 100.000 sillas y solo 6 localidades, hay 100.000 copias de los términos
 * y condiciones y 100.000 iconos, cuando bastaría con 6 de cada uno. Y cada
 * silla seleccionada vuelve a dibujar una vista que ya existía para su zona.
 */
export class SillaPesada {
  // Datos propios de esta silla (estado extrínseco).
  readonly id: string;
  readonly tribuna: Tribuna;
  readonly zona: ZonaId;
  readonly seccion: string;
  readonly fila: number;
  readonly numero: number;
  readonly x: number;
  readonly y: number;
  readonly estado: EstadoSilla;

  // Datos que se repiten en todas las sillas de la misma localidad o zona
  // (estado intrínseco), duplicados en cada silla.
  readonly localidad: LocalidadRegistro;
  readonly icono: Lienzo;
  private vista: Lienzo | null = null;

  constructor(registro: SillaRegistro, localidad: LocalidadRegistro) {
    this.id = registro.id;
    this.tribuna = registro.tribuna;
    this.zona = registro.zona;
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

  /**
   * Cada silla dibuja y guarda su propia vista previa, aunque todas las
   * sillas de su zona vean la cancha igual.
   */
  obtenerVista(): Lienzo {
    this.vista ??= renderizarVistaCancha(this.zona);
    return this.vista;
  }

  get tieneVista(): boolean {
    return this.vista !== null;
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
      localidad: this.localidad,
    };
  }

  memoriaEstimadaBytes(): number {
    return (
      bytesDeUbicacion(this) +
      bytesDeLocalidad(this.localidad) +
      bytesDeIcono(TAMANO_ICONO_PX) +
      (this.vista ? bytesDeImagen(ANCHO_VISTA, ALTO_VISTA) : 0)
    );
  }
}
