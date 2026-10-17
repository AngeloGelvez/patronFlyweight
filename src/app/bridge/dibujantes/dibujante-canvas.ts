import { Dibujante, Estilo, EstiloTexto, ResultadoDibujo } from '../dibujante';

/**
 * IMPLEMENTACIÓN CONCRETA · Canvas 2D.
 *
 * Pinta píxeles directamente sobre un elemento `<canvas>`. Es el motor más
 * rápido cuando hay muchas figuras, pero la imagen no se puede ampliar sin
 * perder nitidez.
 */
export class DibujanteCanvas implements Dibujante {
  readonly id = 'canvas' as const;
  readonly nombre = 'Canvas 2D';

  constructor(private readonly ctx: CanvasRenderingContext2D) {}

  iniciar(ancho: number, alto: number): void {
    this.ctx.canvas.width = ancho;
    this.ctx.canvas.height = alto;
    this.ctx.clearRect(0, 0, ancho, alto);
  }

  rectangulo(x: number, y: number, ancho: number, alto: number, estilo: Estilo = {}): void {
    this.ctx.globalAlpha = estilo.opacidad ?? 1;
    this.ctx.beginPath();
    this.ctx.roundRect(x, y, ancho, alto, estilo.radio ?? 0);
    this.pintar(estilo);
  }

  circulo(x: number, y: number, radio: number, estilo: Estilo = {}): void {
    this.ctx.globalAlpha = estilo.opacidad ?? 1;
    this.ctx.beginPath();
    this.ctx.arc(x, y, radio, 0, Math.PI * 2);
    this.pintar(estilo);
  }

  linea(x1: number, y1: number, x2: number, y2: number, estilo: Estilo = {}): void {
    this.ctx.globalAlpha = estilo.opacidad ?? 1;
    this.ctx.beginPath();
    this.ctx.moveTo(x1, y1);
    this.ctx.lineTo(x2, y2);
    this.ctx.strokeStyle = estilo.borde ?? '#000000';
    this.ctx.lineWidth = estilo.grosor ?? 1;
    this.ctx.stroke();
    this.ctx.globalAlpha = 1;
  }

  texto(x: number, y: number, contenido: string, estilo: EstiloTexto = {}): void {
    const tamano = estilo.tamano ?? 16;
    this.ctx.globalAlpha = 1;
    this.ctx.font = `${estilo.negrita ? '700' : '400'} ${tamano}px ui-sans-serif, system-ui, sans-serif`;
    this.ctx.fillStyle = estilo.color ?? '#0f172a';
    this.ctx.textAlign = ALINEACION[estilo.alineacion ?? 'izquierda'];
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(contenido, x, y);
  }

  /** El canvas ya quedó pintado, así que no hay nada que devolver. */
  terminar(): ResultadoDibujo {
    return { tipo: 'canvas' };
  }

  private pintar(estilo: Estilo): void {
    if (estilo.relleno) {
      this.ctx.fillStyle = estilo.relleno;
      this.ctx.fill();
    }
    if (estilo.borde) {
      this.ctx.strokeStyle = estilo.borde;
      this.ctx.lineWidth = estilo.grosor ?? 1;
      this.ctx.stroke();
    }
    this.ctx.globalAlpha = 1;
  }
}

const ALINEACION: Record<NonNullable<EstiloTexto['alineacion']>, CanvasTextAlign> = {
  izquierda: 'left',
  centro: 'center',
  derecha: 'right',
};
