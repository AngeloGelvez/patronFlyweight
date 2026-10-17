import { Dibujante, ResultadoDibujo } from '../dibujante';

/**
 * ABSTRACCIÓN del patrón Bridge: el «qué se dibuja».
 *
 * Esta es la otra jerarquía del patrón. Fíjate en el detalle clave: la vista
 * **NO hereda** del dibujante, lo **guarda en un atributo**. Esa referencia es
 * el «puente» que da nombre al patrón.
 *
 *   VistaDelEstadio ──tiene un──> Dibujante
 *        ▲                            ▲
 *        │ heredan                    │ implementan
 *   Mapa, Vista, Entrada        Canvas, SVG, Texto
 *
 * Gracias a eso las dos jerarquías crecen por separado: añadir una vista
 * nueva es una clase, y añadir un motor nuevo es otra. Con herencia sola
 * harían falta una clase por cada combinación (MapaCanvas, MapaSvg, …).
 */
export abstract class VistaDelEstadio {
  /** ← El puente. La abstracción solo conoce la interfaz, nunca un motor concreto. */
  constructor(protected readonly dibujante: Dibujante) {}

  abstract readonly titulo: string;
  abstract readonly descripcion: string;
  abstract readonly ancho: number;
  abstract readonly alto: number;

  /**
   * Operación de alto nivel: prepara el lienzo, deja que la vista concreta
   * describa su contenido con figuras básicas y devuelve lo que salga.
   */
  dibujar(): ResultadoDibujo {
    this.dibujante.iniciar(this.ancho, this.alto);
    this.dibujarContenido();
    return this.dibujante.terminar();
  }

  /** Cada vista se describe aquí usando solo las figuras del dibujante. */
  protected abstract dibujarContenido(): void;
}
