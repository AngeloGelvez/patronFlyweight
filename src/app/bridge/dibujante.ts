/**
 * IMPLEMENTACIÓN del patrón Bridge: el «con qué se dibuja».
 *
 * Esta es una de las dos jerarquías del patrón. Solo sabe pintar figuras
 * básicas (rectángulos, círculos, líneas y texto); no tiene ni idea de qué
 * es un asiento, una zona o una entrada.
 *
 * Cada motor implementa estas mismas operaciones a su manera: uno pinta en
 * un canvas, otro genera marcado SVG y otro describe la escena con palabras.
 */

/** Motores de dibujo disponibles. */
export type MotorId = 'canvas' | 'svg' | 'texto';

export interface Estilo {
  readonly relleno?: string;
  readonly borde?: string;
  readonly grosor?: number;
  /** Radio de las esquinas redondeadas (solo rectángulos). */
  readonly radio?: number;
  readonly opacidad?: number;
  /**
   * Qué representa la figura. Cada motor lo aprovecha a su manera: el canvas
   * lo ignora, el SVG lo convierte en `<title>` (texto alternativo) y el motor
   * de texto lo usa para describir la escena.
   */
  readonly etiqueta?: string;
}

export interface EstiloTexto {
  readonly color?: string;
  readonly tamano?: number;
  readonly negrita?: boolean;
  readonly alineacion?: 'izquierda' | 'centro' | 'derecha';
}

/**
 * Lo que entrega un motor al terminar. Cada uno produce algo distinto, y por
 * eso la página sabe cómo mostrar cada caso.
 */
export type ResultadoDibujo =
  /** Ya está pintado directamente en el elemento `<canvas>`. */
  | { readonly tipo: 'canvas' }
  | { readonly tipo: 'svg'; readonly marcado: string }
  | { readonly tipo: 'texto'; readonly lineas: readonly string[] };

export interface Dibujante {
  readonly id: MotorId;
  readonly nombre: string;

  /** Prepara un lienzo nuevo y borra lo anterior. */
  iniciar(ancho: number, alto: number): void;

  rectangulo(x: number, y: number, ancho: number, alto: number, estilo?: Estilo): void;
  circulo(x: number, y: number, radio: number, estilo?: Estilo): void;
  linea(x1: number, y1: number, x2: number, y2: number, estilo?: Estilo): void;
  texto(x: number, y: number, contenido: string, estilo?: EstiloTexto): void;

  terminar(): ResultadoDibujo;
}
