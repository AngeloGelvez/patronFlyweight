import { DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Dibujante, MotorId } from './dibujante';
import { DibujanteCanvas } from './dibujantes/dibujante-canvas';
import { DibujanteSvg } from './dibujantes/dibujante-svg';
import { DibujanteTexto } from './dibujantes/dibujante-texto';
import { ASIENTOS_DEMO, crearEscena } from './escena';
import { EntradaImprimible } from './vistas/entrada-imprimible';
import { MapaDeAsientos } from './vistas/mapa-de-asientos';
import { VistaDelEstadio } from './vistas/vista-del-estadio';
import { VistaDesdeElAsiento } from './vistas/vista-desde-el-asiento';

type VistaId = 'mapa' | 'vista' | 'entrada';

/** Las tres abstracciones; `clase` sirve para armar la matriz de combinaciones. */
const VISTAS: readonly { readonly id: VistaId; readonly nombre: string; readonly clase: string }[] = [
  { id: 'mapa', nombre: 'Mapa de asientos', clase: 'Mapa' },
  { id: 'vista', nombre: 'Vista desde el asiento', clase: 'Vista' },
  { id: 'entrada', nombre: 'Entrada imprimible', clase: 'Entrada' },
];

/** Las tres implementaciones. */
const MOTORES: readonly {
  readonly id: MotorId;
  readonly nombre: string;
  readonly clase: string;
  readonly nota: string;
}[] = [
  { id: 'canvas', clase: 'Canvas', nombre: 'Canvas 2D', nota: 'Rápido con muchas figuras, pero se pixela al ampliar.' },
  { id: 'svg', clase: 'Svg', nombre: 'SVG', nota: 'Vectorial: se amplía e imprime sin perder nitidez.' },
  { id: 'texto', clase: 'Texto', nombre: 'Texto accesible', nota: 'Describe la escena con palabras, sin dibujar nada.' },
];

const CODIGO = `// ABSTRACCIÓN: guarda el dibujante, NO hereda de él
abstract class VistaDelEstadio {
  constructor(protected dibujante: Dibujante) {}   // ← el puente

  dibujar() {
    this.dibujante.iniciar(this.ancho, this.alto);
    this.dibujarContenido();   // la vista se describe con figuras básicas
    return this.dibujante.terminar();
  }
}

// Se combinan al construir: cualquier vista con cualquier motor
new MapaDeAsientos(new DibujanteCanvas(ctx), plano).dibujar();
new MapaDeAsientos(new DibujanteSvg(), plano).dibujar();
new EntradaImprimible(new DibujanteTexto(), datos).dibujar();`;

@Component({
  selector: 'app-bridge-page',
  imports: [DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mx-auto max-w-7xl space-y-8 px-4 py-8">
      <header class="max-w-3xl">
        <p class="text-sm font-semibold uppercase tracking-wide text-marca">Patrón estructural</p>
        <h1 class="mt-1 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Patrón Bridge</h1>
        <p class="mt-3 text-slate-700">
          Separa <strong class="text-slate-900">qué se dibuja</strong> de
          <strong class="text-slate-900">con qué se dibuja</strong>, en dos jerarquías que crecen por
          separado. La vista no hereda del motor: lo guarda en un atributo, y esa referencia es el
          «puente» que da nombre al patrón.
        </p>
      </header>

      <!-- Las dos jerarquías -->
      <section aria-labelledby="titulo-jerarquias" class="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
        <h2 id="titulo-jerarquias" class="text-lg font-semibold text-slate-900">Las dos jerarquías</h2>
        <div class="mt-4 flex flex-col items-stretch gap-4 lg:flex-row lg:items-center">
          <div class="flex-1 rounded-xl bg-slate-50 p-5 ring-1 ring-slate-200">
            <p class="font-mono text-xs uppercase tracking-wide text-slate-500">Abstracción · el qué</p>
            <p class="mt-1 font-mono text-base font-semibold text-slate-900">VistaDelEstadio</p>
            <ul class="mt-3 space-y-1 text-sm text-slate-700">
              @for (vista of vistas; track vista.id) {
                <li class="font-mono">{{ vista.clase }}…</li>
              }
            </ul>
          </div>

          <div class="flex shrink-0 flex-col items-center gap-1 px-2">
            <p class="font-mono text-xs text-marca">tiene un</p>
            <p aria-hidden="true" class="text-2xl text-marca">→</p>
            <p class="text-xs text-slate-500">(composición)</p>
          </div>

          <div class="flex-1 rounded-xl bg-emerald-50 p-5 ring-1 ring-emerald-200">
            <p class="font-mono text-xs uppercase tracking-wide text-emerald-800">Implementación · el con qué</p>
            <p class="mt-1 font-mono text-base font-semibold text-slate-900">Dibujante</p>
            <ul class="mt-3 space-y-1 text-sm text-slate-700">
              @for (motor of motores; track motor.id) {
                <li class="font-mono">Dibujante{{ motor.clase }}</li>
              }
            </ul>
          </div>
        </div>
      </section>

      <!-- Matriz de combinaciones -->
      <section aria-labelledby="titulo-matriz" class="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
        <h2 id="titulo-matriz" class="text-lg font-semibold text-slate-900">Elige una combinación</h2>
        <p class="mt-1 text-sm text-slate-600">
          Cada celda es la clase que haría falta escribir <em>sin</em> Bridge. Pulsa una para verla.
        </p>

        <div class="mt-4 overflow-x-auto">
          <div class="grid min-w-[36rem] grid-cols-[10rem_repeat(3,minmax(0,1fr))] gap-2">
            <div></div>
            @for (motor of motores; track motor.id) {
              <p class="px-2 pb-1 text-center text-sm font-semibold text-slate-900">{{ motor.nombre }}</p>
            }

            @for (vista of vistas; track vista.id) {
              <p class="flex items-center pr-2 text-sm font-semibold text-slate-900">{{ vista.nombre }}</p>
              @for (motor of motores; track motor.id) {
                <button
                  type="button"
                  class="rounded-lg px-2 py-3 text-center font-mono text-xs ring-1 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca sm:text-sm"
                  [class]="
                    vistaId() === vista.id && motorId() === motor.id
                      ? 'bg-marca text-white ring-marca hover:bg-marca'
                      : 'text-slate-600 ring-slate-200'
                  "
                  [attr.aria-pressed]="vistaId() === vista.id && motorId() === motor.id"
                  (click)="elegir(vista.id, motor.id)"
                >
                  {{ vista.clase }}{{ motor.clase }}
                </button>
              }
            }
          </div>
        </div>

        <p class="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-950 ring-1 ring-emerald-200">
          <strong>9 combinaciones</strong> con solo <strong>6 clases</strong>: 3 vistas + 3 motores.
          Sin Bridge serían 9 clases, y un cuarto motor pasaría de 1 clase nueva a 3.
        </p>
      </section>

      <!-- Resultado -->
      <section aria-labelledby="titulo-resultado" class="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
        <div class="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="titulo-resultado" class="text-lg font-semibold text-slate-900">{{ tituloVista() }}</h2>
            <p class="text-sm text-slate-600">{{ descripcionVista() }}</p>
          </div>
          <p class="rounded-full bg-slate-100 px-3 py-1 font-mono text-xs text-slate-700">
            {{ nombreMotor() }} · {{ detalleSalida() }}
          </p>
        </div>

        <div class="mt-4 overflow-hidden rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
          <!-- El canvas se queda siempre en el DOM para poder pedirle su contexto 2D. -->
          <canvas
            #lienzo
            [hidden]="motorId() !== 'canvas'"
            class="block h-auto w-full rounded-lg bg-white"
            role="img"
            [attr.aria-label]="descripcionVista()"
          ></canvas>

          @if (motorId() === 'svg') {
            <div class="rounded-lg bg-white" [innerHTML]="svgSeguro()"></div>
          }

          @if (motorId() === 'texto') {
            <pre class="max-h-[28rem] overflow-auto rounded-lg bg-white p-4 text-xs leading-relaxed text-slate-800">{{ textoPlano() }}</pre>
          }
        </div>

        <p class="mt-3 text-sm text-slate-600">{{ notaMotor() }}</p>

        @if (motorId() === 'svg') {
          <details class="mt-3 rounded-lg bg-slate-50 text-sm ring-1 ring-slate-200">
            <summary class="cursor-pointer rounded-lg px-3 py-2 font-medium text-slate-800 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-marca">
              Ver el marcado que generó el motor
            </summary>
            <pre class="max-h-64 overflow-auto px-3 pb-3 text-xs leading-relaxed text-slate-600">{{ adelantoMarcado() }}</pre>
          </details>
        }
      </section>

      <!-- Código -->
      <section aria-labelledby="titulo-codigo" class="grid grid-cols-1 gap-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6 lg:grid-cols-2">
        <div>
          <h2 id="titulo-codigo" class="text-lg font-semibold text-slate-900">El puente, en código</h2>
          <p class="mt-2 text-sm text-slate-700">
            La abstracción solo conoce la interfaz <code class="font-mono text-marca">Dibujante</code>,
            nunca un motor concreto. Por eso puedes añadir un motor nuevo (WebGL, PDF, impresora
            térmica) sin tocar ni una línea de las vistas.
          </p>
          <ul class="mt-4 space-y-2 text-sm text-slate-700">
            <li><strong class="text-slate-900">No es herencia:</strong> la vista <em>tiene</em> un dibujante, no <em>es</em> uno.</li>
            <li><strong class="text-slate-900">Se combinan al construir:</strong> la pareja se decide al crear el objeto.</li>
            <li><strong class="text-slate-900">Este plano tiene {{ asientos | number }} asientos:</strong> suficiente para verlo y rápido en los tres motores.</li>
          </ul>
        </div>
        <div>
          <p class="text-xs font-medium uppercase tracking-wide text-slate-500">bridge/vistas/vista-del-estadio.ts (resumido)</p>
          <pre class="mt-2 overflow-x-auto rounded-xl bg-slate-900 p-4 text-xs leading-relaxed text-slate-100"><code>{{ codigo }}</code></pre>
        </div>
      </section>
    </div>
  `,
})
export class BridgePage {
  private readonly sanitizer = inject(DomSanitizer);
  private readonly lienzo = viewChild.required<ElementRef<HTMLCanvasElement>>('lienzo');

  protected readonly vistas = VISTAS;
  protected readonly motores = MOTORES;
  protected readonly codigo = CODIGO;
  protected readonly asientos = ASIENTOS_DEMO;

  private readonly escena = crearEscena();

  protected readonly vistaId = signal<VistaId>('mapa');
  protected readonly motorId = signal<MotorId>('canvas');

  protected readonly tituloVista = signal('');
  protected readonly descripcionVista = signal('');
  protected readonly detalleSalida = signal('');
  protected readonly svgSeguro = signal<SafeHtml | null>(null);
  protected readonly textoPlano = signal('');
  protected readonly adelantoMarcado = signal('');

  constructor() {
    // Vuelve a dibujar cada vez que cambia la vista o el motor.
    effect(() => this.redibujar(this.vistaId(), this.motorId()));
  }

  protected elegir(vista: VistaId, motor: MotorId): void {
    this.vistaId.set(vista);
    this.motorId.set(motor);
  }

  protected nombreMotor(): string {
    return MOTORES.find((m) => m.id === this.motorId())?.nombre ?? '';
  }

  protected notaMotor(): string {
    return MOTORES.find((m) => m.id === this.motorId())?.nota ?? '';
  }

  /** Aquí se construye la pareja abstracción + implementación. */
  private redibujar(vistaId: VistaId, motorId: MotorId): void {
    const vista = this.crearVista(vistaId, this.crearDibujante(motorId));
    const resultado = vista.dibujar();

    this.tituloVista.set(vista.titulo);
    this.descripcionVista.set(vista.descripcion);

    switch (resultado.tipo) {
      case 'canvas':
        this.detalleSalida.set('píxeles en el canvas');
        break;
      case 'svg':
        this.svgSeguro.set(this.sanitizer.bypassSecurityTrustHtml(resultado.marcado));
        this.adelantoMarcado.set(resultado.marcado.slice(0, 1200) + '\n…');
        this.detalleSalida.set(`${resultado.marcado.length.toLocaleString('es-ES')} caracteres de SVG`);
        break;
      case 'texto':
        this.textoPlano.set(resultado.lineas.join('\n'));
        this.detalleSalida.set(`${resultado.lineas.length} líneas`);
        break;
    }
  }

  private crearDibujante(motorId: MotorId): Dibujante {
    switch (motorId) {
      case 'canvas': {
        const ctx = this.lienzo().nativeElement.getContext('2d');
        if (!ctx) throw new Error('El navegador no permitió crear el contexto 2D.');
        return new DibujanteCanvas(ctx);
      }
      case 'svg':
        return new DibujanteSvg();
      case 'texto':
        return new DibujanteTexto();
    }
  }

  private crearVista(vistaId: VistaId, dibujante: Dibujante): VistaDelEstadio {
    switch (vistaId) {
      case 'mapa':
        return new MapaDeAsientos(dibujante, this.escena.plano);
      case 'vista':
        return new VistaDesdeElAsiento(dibujante, this.escena.zona.nombre, this.escena.localidad.color);
      case 'entrada':
        return new EntradaImprimible(dibujante, this.escena.entrada);
    }
  }
}
