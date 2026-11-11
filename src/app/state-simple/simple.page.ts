import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import {
  DiagramaEstadosComponent,
  NodoEstado,
  Transicion,
} from '../shared/components/diagrama-estados/diagrama-estados.component';
import { TarjetaPartidoComponent } from '../shared/components/tarjeta-partido/tarjeta-partido.component';
import { Entrada } from './entrada';
import { Disponible } from './estados/disponible';
import { EstadoEntrada } from './estados/estado-entrada';
import { Pagada } from './estados/pagada';
import { Reservada } from './estados/reservada';
import { Usada } from './estados/usada';
import { Accion, ACCIONES, Resultado } from './resultado';

const DATOS = { zona: 'Lateral Oeste', fila: 12, asiento: 8, precio: 85 } as const;

const NODOS: readonly NodoEstado[] = [
  { id: 'disponible', nombre: 'Disponible', x: 90, y: 75 },
  { id: 'reservada', nombre: 'Reservada', x: 320, y: 75 },
  { id: 'pagada', nombre: 'Pagada', x: 550, y: 75 },
  { id: 'usada', nombre: 'Usada', x: 780, y: 75, final: true },
];

const TRANSICIONES: readonly Transicion[] = [
  { de: 'disponible', a: 'reservada', etiqueta: 'reservar', curva: -14 },
  { de: 'reservada', a: 'disponible', etiqueta: 'cancelar', curva: -14 },
  { de: 'reservada', a: 'pagada', etiqueta: 'pagar' },
  { de: 'pagada', a: 'usada', etiqueta: 'entrar' },
];

/** Un ejemplar de cada estado, para armar la tabla "estado × acción" a partir del código real. */
const ESTADOS: readonly (() => EstadoEntrada)[] = [
  () => new Disponible(),
  () => new Reservada(),
  () => new Pagada(),
  () => new Usada(),
];

const SIN_STATE = `// ❌ Sin State: cada método repite "if según el estado"
class Entrada {
  estado: 'disponible' | 'reservada' | 'pagada' | 'usada' = 'disponible';

  pagar() {
    if (this.estado === 'disponible') return 'Primero reserva';
    if (this.estado === 'reservada')  { this.estado = 'pagada'; return 'OK'; }
    if (this.estado === 'pagada')     return 'Ya está pagada';
    if (this.estado === 'usada')      return 'Ya se usó';
  }
  // ...y lo mismo en reservar(), cancelar() y entrar().
  // Un estado nuevo = tocar TODOS los métodos.
}`;

const CON_STATE = `// ✅ Con State: cada estado es una clase con su propio comportamiento
class Reservada extends EstadoEntrada {
  pagar(entrada: Entrada) {
    entrada.cambiarEstado(new Pagada());        // la transición vive aquí
    return { ok: true, mensaje: 'Pago recibido' };
  }
  cancelar(entrada: Entrada) {
    entrada.cambiarEstado(new Disponible());
    return { ok: true, mensaje: 'Reserva cancelada' };
  }
  // reservar() y entrar() no se sobrescriben → se rechazan solos
}

// El contexto no tiene ningún "if": solo delega
class Entrada {
  private estado: EstadoEntrada = new Disponible();
  pagar() { return this.estado.pagar(this); }
  cambiarEstado(nuevo: EstadoEntrada) { this.estado = nuevo; }
}`;

interface Celda {
  readonly accion: Accion;
  readonly ok: boolean;
  readonly destino: string;
}

@Component({
  selector: 'app-simple-page',
  imports: [CurrencyPipe, DiagramaEstadosComponent, TarjetaPartidoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mx-auto max-w-7xl space-y-8 px-4 py-8">
      <header class="max-w-3xl">
        <p class="text-sm font-semibold uppercase tracking-wide text-marca">Patrón de comportamiento · Ejemplo 1</p>
        <h1 class="mt-1 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Patrón State · La entrada</h1>
        <p class="mt-3 text-slate-700">
          Una entrada se comporta distinto según su <strong class="text-slate-900">estado</strong>: no puedes
          pagarla si nadie la reservó ni entrar con una que ya se usó. En vez de llenar el código de
          <code class="rounded bg-slate-200 px-1">if</code>, <strong class="text-slate-900">cada estado es una clase</strong>
          y la entrada le delega el trabajo a la del momento.
        </p>
      </header>

      <app-tarjeta-partido />

      <div class="grid gap-6 lg:grid-cols-[2fr_3fr]">
        <!-- La entrada y sus acciones -->
        <section aria-labelledby="titulo-entrada" class="space-y-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
          <h2 id="titulo-entrada" class="text-lg font-semibold text-slate-900">Tu entrada</h2>

          <div class="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
            <p class="font-semibold text-slate-900">
              {{ datos.zona }} · Fila {{ datos.fila }} · Asiento {{ datos.asiento }}
            </p>
            <p class="text-sm text-slate-600">{{ datos.precio | currency: 'EUR' : 'symbol' : '1.2-2' : 'es' }}</p>
            <p class="mt-3 text-sm text-slate-600">Estado actual</p>
            <p class="text-2xl font-bold text-marca" data-testid="estado-actual">{{ estado().nombre }}</p>
            <p class="text-sm text-slate-600">{{ estado().descripcion }}</p>
          </div>

          <div>
            <p class="mb-2 text-sm font-medium text-slate-900">¿Qué quieres hacer?</p>
            <div class="grid grid-cols-2 gap-2">
              @for (accion of acciones; track accion) {
                <button
                  type="button"
                  class="rounded-lg bg-slate-900 px-3 py-2.5 text-sm font-semibold capitalize text-white hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca"
                  (click)="ejecutar(accion)"
                >
                  {{ accion }}
                </button>
              }
            </div>
            <p class="mt-2 text-xs text-slate-600">
              Los cuatro botones siempre funcionan: es la propia entrada quien decide si acepta o rechaza.
            </p>
          </div>

          <p
            role="status"
            aria-live="polite"
            class="min-h-12 rounded-lg p-3 text-sm ring-1"
            [class]="
              ultimo() === null
                ? 'bg-slate-50 text-slate-600 ring-slate-200'
                : ultimo()!.ok
                  ? 'bg-emerald-50 text-emerald-950 ring-emerald-200'
                  : 'bg-rose-50 text-rose-950 ring-rose-200'
            "
          >
            {{ ultimo()?.mensaje ?? 'Pulsa una acción para empezar.' }}
          </p>

          <button
            type="button"
            class="text-sm font-medium text-slate-700 underline underline-offset-2 hover:text-marca"
            (click)="reiniciar()"
          >
            Reiniciar entrada
          </button>
        </section>

        <!-- Diagrama y tabla -->
        <div class="space-y-6">
          <section aria-labelledby="titulo-diagrama" class="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
            <h2 id="titulo-diagrama" class="text-lg font-semibold text-slate-900">Diagrama de estados</h2>
            <p class="mt-1 text-sm text-slate-600">
              El estado actual está en verde; las flechas verdes son las acciones que lo cambian desde ahí.
            </p>
            <div class="mt-3">
              <app-diagrama-estados [nodos]="nodos" [transiciones]="transiciones" [actual]="estado().id" [alto]="150" />
            </div>
          </section>

          <section aria-labelledby="titulo-tabla" class="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
            <h2 id="titulo-tabla" class="text-lg font-semibold text-slate-900">Qué hace cada estado con cada acción</h2>
            <div class="mt-3 overflow-x-auto">
              <table class="w-full min-w-[30rem] text-left text-sm">
                <caption class="sr-only">Resultado de cada acción según el estado de la entrada</caption>
                <thead>
                  <tr class="border-b border-slate-200 text-slate-600">
                    <th scope="col" class="py-2 pr-3 font-medium">Estado</th>
                    @for (accion of acciones; track accion) {
                      <th scope="col" class="px-2 py-2 font-medium capitalize">{{ accion }}</th>
                    }
                  </tr>
                </thead>
                <tbody>
                  @for (fila of tabla; track fila.estado) {
                    <tr class="border-b border-slate-100" [class]="fila.id === estado().id ? 'bg-emerald-50' : ''">
                      <th scope="row" class="py-2 pr-3 font-semibold text-slate-900">{{ fila.estado }}</th>
                      @for (celda of fila.celdas; track celda.accion) {
                        <td class="px-2 py-2" [class]="celda.ok ? 'font-medium text-emerald-800' : 'text-slate-500'">
                          @if (celda.ok) {
                            <span aria-hidden="true">→ </span>{{ celda.destino }}
                          } @else {
                            <span aria-hidden="true">✖</span><span class="sr-only">No permitido</span>
                          }
                        </td>
                      }
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>

      <!-- Código -->
      <section aria-labelledby="titulo-codigo" class="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
        <h2 id="titulo-codigo" class="text-lg font-semibold text-slate-900">El código, antes y después</h2>
        <div class="mt-4 grid gap-4 lg:grid-cols-2">
          <pre class="overflow-x-auto rounded-xl bg-slate-900 p-4 text-xs leading-relaxed text-slate-100"><code>{{ sinState }}</code></pre>
          <pre class="overflow-x-auto rounded-xl bg-slate-900 p-4 text-xs leading-relaxed text-slate-100"><code>{{ conState }}</code></pre>
        </div>
      </section>

      <!-- Historial -->
      <section aria-labelledby="titulo-historial" class="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
        <h2 id="titulo-historial" class="text-lg font-semibold text-slate-900">Historial de esta entrada</h2>
        @if (historial().length === 0) {
          <p class="mt-2 text-sm text-slate-600">Todavía no has hecho nada.</p>
        } @else {
          <ol class="mt-3 space-y-1 text-sm text-slate-800">
            @for (linea of historial(); track $index) {
              <li class="font-mono text-xs sm:text-sm">{{ linea }}</li>
            }
          </ol>
        }
      </section>
    </div>
  `,
})
export class SimplePage {
  protected readonly datos = DATOS;
  protected readonly nodos = NODOS;
  protected readonly transiciones = TRANSICIONES;
  protected readonly acciones = ACCIONES;
  protected readonly sinState = SIN_STATE;
  protected readonly conState = CON_STATE;
  protected readonly tabla = armarTabla();

  private readonly entrada = signal(new Entrada(DATOS));
  /** Cuenta los cambios: la entrada no es un signal, así que la vista se refresca con esto. */
  private readonly version = signal(0);

  protected readonly ultimo = signal<Resultado | null>(null);

  protected readonly estado = computed(() => {
    this.version();
    return this.entrada().estadoActual;
  });

  protected readonly historial = computed(() => {
    this.version();
    return [...this.entrada().historial].reverse();
  });

  protected ejecutar(accion: Accion): void {
    this.ultimo.set(this.entrada()[accion]());
    this.version.update((v) => v + 1);
  }

  protected reiniciar(): void {
    this.entrada.set(new Entrada(DATOS));
    this.ultimo.set(null);
    this.version.update((v) => v + 1);
  }
}

/**
 * Prueba cada acción en un estado recién creado y anota a dónde lleva. Así la
 * tabla sale del código real y nunca puede quedar desactualizada.
 */
function armarTabla(): { id: string; estado: string; celdas: Celda[] }[] {
  return ESTADOS.map((crear) => {
    const estado = crear();
    const celdas = ACCIONES.map((accion): Celda => {
      const prueba = new Entrada(DATOS);
      prueba.cambiarEstado(crear());
      const { ok } = prueba[accion]();
      return { accion, ok, destino: prueba.estadoActual.nombre };
    });
    return { id: estado.id, estado: estado.nombre, celdas };
  });
}
