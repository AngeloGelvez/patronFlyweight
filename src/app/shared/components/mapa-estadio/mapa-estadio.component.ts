import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  output,
  viewChild,
} from '@angular/core';
import { GEOMETRIA_ESTADIO } from '../../../core/data/estadio.generator';
import { MapaDeSillas } from '../../../core/models/mapa-de-sillas';

export interface PuntoPlano {
  readonly x: number;
  readonly y: number;
}

const COLOR_FONDO = '#ffffff';
const COLOR_GRADERIA = '#e9eef5';
const COLOR_CANCHA = '#3f8f46';
const COLOR_LINEAS = 'rgba(255, 255, 255, 0.85)';

/**
 * Etiquetas de cada zona, dibujadas encima de las sillas. Son la segunda forma
 * de identificar la localidad además del color (accesibilidad).
 */
const ETIQUETAS_ZONAS: readonly { texto: string; x: number; y: number }[] = [
  { texto: 'LATERAL ESTE', x: 900, y: 96 },
  { texto: 'PREFERENCIA', x: 900, y: 216 },
  { texto: 'VIP', x: 900, y: 784 },
  { texto: 'PALCO', x: 900, y: 904 },
  { texto: 'LATERAL OESTE', x: 560, y: 845 },
  { texto: 'FONDO NORTE', x: 250, y: 500 },
  { texto: 'FONDO SUR', x: 1550, y: 500 },
];

/**
 * Canvas con el plano del estadio. No sabe si el mapa usa Flyweight o no:
 * solo le pide que se dibuje.
 */
@Component({
  selector: 'app-mapa-estadio',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative overflow-hidden rounded-xl bg-white ring-1 ring-slate-200">
      <canvas
        #lienzo
        [width]="ancho"
        [height]="alto"
        class="block h-auto w-full cursor-pointer"
        role="img"
        [attr.aria-label]="descripcion()"
        (click)="alHacerClic($event)"
      ></canvas>

      @if (resaltado(); as punto) {
        <span
          aria-hidden="true"
          class="pointer-events-none absolute size-5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-[3px] ring-slate-900 shadow-[0_0_0_3px_rgba(255,255,255,0.95)]"
          [style.left.%]="(punto.x / ancho) * 100"
          [style.top.%]="(punto.y / alto) * 100"
        ></span>
      }

      <ng-content />
    </div>
  `,
})
export class MapaEstadioComponent implements AfterViewInit {
  readonly descripcion = input('Plano del estadio');
  /** Silla seleccionada, que se marca con un anillo encima del canvas. */
  readonly resaltado = input<PuntoPlano | null>(null);
  readonly clicEnPlano = output<PuntoPlano>();

  protected readonly ancho = GEOMETRIA_ESTADIO.ancho;
  protected readonly alto = GEOMETRIA_ESTADIO.alto;

  private readonly lienzo = viewChild.required<ElementRef<HTMLCanvasElement>>('lienzo');

  ngAfterViewInit(): void {
    this.limpiar();
  }

  /** Dibuja el estadio vacío. */
  limpiar(): void {
    dibujarFondo(this.contexto());
  }

  /** Dibuja el estadio con todas las sillas del mapa. */
  renderizar(mapa: MapaDeSillas): void {
    const ctx = this.contexto();
    dibujarFondo(ctx);
    mapa.dibujar(ctx);
    dibujarEtiquetas(ctx);
  }

  protected alHacerClic(evento: MouseEvent): void {
    const area = this.lienzo().nativeElement.getBoundingClientRect();
    this.clicEnPlano.emit({
      x: ((evento.clientX - area.left) / area.width) * this.ancho,
      y: ((evento.clientY - area.top) / area.height) * this.alto,
    });
  }

  private contexto(): CanvasRenderingContext2D {
    const ctx = this.lienzo().nativeElement.getContext('2d');
    if (!ctx) {
      throw new Error('El navegador no permitió crear el contexto 2D del mapa.');
    }
    return ctx;
  }
}

function dibujarFondo(ctx: CanvasRenderingContext2D): void {
  const { ancho, alto, radioExterno, radioInterno, cancha } = GEOMETRIA_ESTADIO;

  ctx.globalAlpha = 1;
  ctx.fillStyle = COLOR_FONDO;
  ctx.fillRect(0, 0, ancho, alto);

  ctx.fillStyle = COLOR_GRADERIA;
  trazarContorno(ctx, radioExterno);
  ctx.fill();

  ctx.fillStyle = COLOR_FONDO;
  trazarContorno(ctx, radioInterno);
  ctx.fill();

  // Cancha de fútbol con sus líneas principales.
  ctx.fillStyle = COLOR_CANCHA;
  ctx.fillRect(cancha.x, cancha.y, cancha.ancho, cancha.alto);

  const centroX = cancha.x + cancha.ancho / 2;
  const centroY = cancha.y + cancha.alto / 2;
  const anchoArea = cancha.ancho * 0.16;
  const altoArea = cancha.alto * 0.44;

  ctx.strokeStyle = COLOR_LINEAS;
  ctx.lineWidth = 3;
  ctx.strokeRect(cancha.x + 10, cancha.y + 10, cancha.ancho - 20, cancha.alto - 20);
  ctx.beginPath();
  ctx.moveTo(centroX, cancha.y + 10);
  ctx.lineTo(centroX, cancha.y + cancha.alto - 10);
  ctx.moveTo(centroX + 50, centroY);
  ctx.arc(centroX, centroY, 50, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeRect(cancha.x + 10, centroY - altoArea / 2, anchoArea, altoArea);
  ctx.strokeRect(cancha.x + cancha.ancho - 10 - anchoArea, centroY - altoArea / 2, anchoArea, altoArea);
}

/** Traza la forma de estadio: rectángulo con extremos semicirculares. */
function trazarContorno(ctx: CanvasRenderingContext2D, radio: number): void {
  const { centroX, centroY, largoRecto } = GEOMETRIA_ESTADIO;
  const izquierda = centroX - largoRecto / 2;
  const derecha = centroX + largoRecto / 2;

  ctx.beginPath();
  ctx.moveTo(izquierda, centroY - radio);
  ctx.lineTo(derecha, centroY - radio);
  ctx.arc(derecha, centroY, radio, -Math.PI / 2, Math.PI / 2);
  ctx.lineTo(izquierda, centroY + radio);
  ctx.arc(izquierda, centroY, radio, Math.PI / 2, (Math.PI * 3) / 2);
  ctx.closePath();
}

function dibujarEtiquetas(ctx: CanvasRenderingContext2D): void {
  ctx.globalAlpha = 1;
  ctx.font = '600 28px ui-sans-serif, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (const { texto, x, y } of ETIQUETAS_ZONAS) {
    const ancho = ctx.measureText(texto).width + 20;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
    ctx.beginPath();
    ctx.roundRect(x - ancho / 2, y - 20, ancho, 40, 10);
    ctx.fill();
    ctx.fillStyle = '#0f172a';
    ctx.fillText(texto, x, y + 1);
  }
}
