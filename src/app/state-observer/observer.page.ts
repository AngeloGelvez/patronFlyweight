import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, signal, WritableSignal } from '@angular/core';
import {
  DiagramaEstadosComponent,
  NodoEstado,
  Transicion,
} from '../shared/components/diagrama-estados/diagrama-estados.component';
import { TarjetaPartidoComponent } from '../shared/components/tarjeta-partido/tarjeta-partido.component';
import {
  CATALOGO,
  DIAS_MINIMOS_REEMBOLSO,
  ItemEntrada,
  MAX_ENTRADAS_POR_PEDIDO,
} from './catalogo';
import { EstadoPedidoId } from './estados/estado-pedido';
import { Observador } from './observador';
import { AlertaAntifraude } from './observadores/alerta-antifraude';
import { NotificadorCorreo } from './observadores/notificador-correo';
import { PanelTaquilla } from './observadores/panel-taquilla';
import { RegistroAuditoria } from './observadores/registro-auditoria';
import { Pedido } from './pedido';
import { Resultado } from './resultado';

const NODOS: readonly NodoEstado[] = [
  { id: 'carrito', nombre: 'En carrito', x: 90, y: 90 },
  { id: 'pendiente', nombre: 'Pendiente de pago', x: 320, y: 90 },
  { id: 'pagado', nombre: 'Pagado', x: 550, y: 90 },
  { id: 'reembolsado', nombre: 'Reembolsado', x: 780, y: 90, final: true },
  { id: 'cancelado', nombre: 'Cancelado', x: 320, y: 215, final: true },
];

const TRANSICIONES: readonly Transicion[] = [
  { de: 'carrito', a: 'pendiente', etiqueta: 'confirmar' },
  { de: 'pendiente', a: 'pendiente', etiqueta: 'pago rechazado (1.º y 2.º)' },
  { de: 'pendiente', a: 'pagado', etiqueta: 'pagar' },
  { de: 'pagado', a: 'reembolsado', etiqueta: 'reembolsar' },
  { de: 'carrito', a: 'cancelado', etiqueta: 'cancelar', curva: 8 },
  { de: 'pendiente', a: 'cancelado', etiqueta: 'cancelar · expirar · 3.er rechazo' },
];

interface Suscripcion {
  readonly observador: Observador;
  readonly activo: WritableSignal<boolean>;
}

@Component({
  selector: 'app-observer-page',
  imports: [CurrencyPipe, DecimalPipe, DiagramaEstadosComponent, TarjetaPartidoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mx-auto max-w-7xl space-y-8 px-4 py-8">
      <header class="max-w-3xl">
        <p class="text-sm font-semibold uppercase tracking-wide text-marca">Patrón de comportamiento · Ejemplo 2</p>
        <h1 class="mt-1 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">State + Observer · El pedido</h1>
        <p class="mt-3 text-slate-700">
          Un pedido de entradas pasa por varios <strong class="text-slate-900">estados</strong> y cada uno tiene sus
          reglas (<strong class="text-slate-900">State</strong>). Cada cambio, además, tiene que
          <strong class="text-slate-900">avisar</strong> al correo, a la taquilla, a la auditoría y al antifraude, sin
          que el pedido conozca a ninguno de ellos (<strong class="text-slate-900">Observer</strong>).
        </p>
      </header>

      <app-tarjeta-partido />

      <!-- Pedidos -->
      <section aria-labelledby="titulo-pedidos" class="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
        <div class="flex flex-wrap items-center gap-3">
          <h2 id="titulo-pedidos" class="text-lg font-semibold text-slate-900">Pedidos</h2>
          <ul class="flex flex-wrap gap-2">
            @for (p of pedidos(); track p.id) {
              <li>
                <button
                  type="button"
                  class="rounded-lg px-3 py-1.5 text-sm font-medium ring-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca"
                  [class]="p === pedido() ? 'bg-slate-900 text-white ring-slate-900' : 'text-slate-700 ring-slate-300 hover:bg-slate-50'"
                  [attr.aria-pressed]="p === pedido()"
                  (click)="elegirPedido(p)"
                >
                  Pedido #{{ p.id }}
                </button>
              </li>
            }
          </ul>
          <button
            type="button"
            class="rounded-lg bg-marca px-3 py-1.5 text-sm font-semibold text-white hover:bg-marca-oscuro focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca"
            (click)="nuevoPedido()"
          >
            + Nuevo pedido
          </button>
        </div>
        <p class="mt-2 text-sm text-slate-600">
          Todos los pedidos comparten los mismos observadores: mira cómo el panel de taquilla suma los de todos.
        </p>
      </section>

      <div class="grid gap-6 lg:grid-cols-2">
        <!-- Pedido en curso -->
        <section aria-labelledby="titulo-pedido" class="space-y-5 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
          <div class="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="titulo-pedido" class="text-lg font-semibold text-slate-900">Pedido #{{ pedido().id }}</h2>
            <p class="text-sm text-slate-600">
              Estado:
              <strong class="text-base text-marca" data-testid="estado-actual">{{ vista().estado.nombre }}</strong>
            </p>
          </div>
          <p class="-mt-3 text-sm text-slate-600">{{ vista().estado.descripcion }}</p>

          <div>
            <p class="mb-2 text-sm font-medium text-slate-900">
              Entradas (máx. {{ maxEntradas }}) · {{ vista().entradas.length }} en el pedido
            </p>
            <div class="grid grid-cols-2 gap-2">
              @for (item of catalogo; track item.nombre) {
                <button
                  type="button"
                  class="rounded-lg px-3 py-2 text-left text-sm ring-1 ring-slate-300 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca"
                  (click)="anadir(item)"
                >
                  <span class="font-semibold text-slate-900">+ {{ item.nombre }}</span>
                  <span class="block text-slate-600">{{ item.precio | currency: 'EUR' : 'symbol' : '1.0-0' : 'es' }}</span>
                </button>
              }
            </div>

            @if (vista().entradas.length > 0) {
              <ul class="mt-3 divide-y divide-slate-100 rounded-lg ring-1 ring-slate-200">
                @for (e of vista().entradas; track $index) {
                  <li class="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                    <span>{{ e.nombre }} · {{ e.precio | currency: 'EUR' : 'symbol' : '1.0-0' : 'es' }}</span>
                    <button
                      type="button"
                      class="text-slate-600 underline underline-offset-2 hover:text-rose-700"
                      (click)="quitar($index)"
                    >
                      Quitar<span class="sr-only"> {{ e.nombre }}</span>
                    </button>
                  </li>
                }
              </ul>
              <p class="mt-2 text-right text-sm font-semibold text-slate-900">
                Total: {{ vista().total | currency: 'EUR' : 'symbol' : '1.0-0' : 'es' }}
              </p>
            }
          </div>

          <div>
            <p class="mb-2 text-sm font-medium text-slate-900">Acciones del pedido</p>
            <div class="grid grid-cols-2 gap-2 sm:grid-cols-3">
              @for (a of acciones; track a.texto) {
                <button
                  type="button"
                  class="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca"
                  (click)="ejecutar(a.ejecutar)"
                >
                  {{ a.texto }}
                </button>
              }
            </div>
            <label class="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-800">
              Días que faltan para el partido
              <input
                type="number"
                min="0"
                max="60"
                class="w-20 rounded-md border border-slate-300 px-2 py-1"
                [value]="vista().dias"
                (input)="cambiarDias(+$any($event.target).value)"
              />
              <span class="text-xs text-slate-600">(el reembolso exige {{ diasMinimos }} o más)</span>
            </label>
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
            {{ ultimo()?.mensaje ?? 'Añade una entrada, confirma el pedido y paga.' }}
          </p>
        </section>

        <!-- Diagrama -->
        <section aria-labelledby="titulo-diagrama" class="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
          <h2 id="titulo-diagrama" class="text-lg font-semibold text-slate-900">Diagrama de estados</h2>
          <p class="mt-1 text-sm text-slate-600">
            Fíjate en el bucle de «pago rechazado»: el estado también puede llevar cuenta (los intentos) y decidir
            solo cuándo cambiar.
          </p>
          <div class="mt-3">
            <app-diagrama-estados
              [nodos]="nodos"
              [transiciones]="transiciones"
              [actual]="vista().estado.id"
              [alto]="270"
            />
          </div>
          @if (vista().pagosRechazados > 0) {
            <p class="mt-2 text-sm text-slate-700">Pagos rechazados en este pedido: {{ vista().pagosRechazados }}</p>
          }
        </section>
      </div>

      <!-- Observadores -->
      <section aria-labelledby="titulo-observadores" class="space-y-4">
        <div class="max-w-3xl">
          <h2 id="titulo-observadores" class="text-lg font-semibold text-slate-900">Los observadores</h2>
          <p class="mt-1 text-sm text-slate-600">
            Cada tarjeta es un observador suscrito a los pedidos. Apágalo para darlo de baja: el pedido sigue
            funcionando igual, y al reactivarlo <strong>no recibe lo que se perdió</strong>.
          </p>
        </div>

        <div class="grid gap-4 md:grid-cols-2">
          <!-- Correo -->
          <article class="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div class="flex items-center justify-between gap-3">
              <h3 class="font-semibold text-slate-900">✉ {{ correo.nombre }}</h3>
              <label class="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" [checked]="activo(correo)" (change)="alternar(correo)" />
                Suscrito<span class="sr-only">: {{ correo.nombre }}</span>
              </label>
            </div>
            <ul class="mt-3 max-h-56 space-y-2 overflow-y-auto text-sm">
              @for (c of correo.correos(); track $index) {
                <li class="rounded-lg bg-slate-50 p-2 ring-1 ring-slate-200">
                  <p class="font-semibold text-slate-900">{{ c.asunto }}</p>
                  <p class="text-slate-700">{{ c.cuerpo }}</p>
                </li>
              } @empty {
                <li class="text-slate-500">Sin correos enviados.</li>
              }
            </ul>
          </article>

          <!-- Taquilla -->
          <article class="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div class="flex items-center justify-between gap-3">
              <h3 class="font-semibold text-slate-900">🎟 {{ taquilla.nombre }}</h3>
              <label class="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" [checked]="activo(taquilla)" (change)="alternar(taquilla)" />
                Suscrito<span class="sr-only">: {{ taquilla.nombre }}</span>
              </label>
            </div>
            <dl class="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div class="rounded-lg bg-emerald-50 p-3 ring-1 ring-emerald-200">
                <dt class="text-emerald-900">Ingresos</dt>
                <dd class="text-xl font-bold text-slate-900">{{ taquilla.ingresos() | currency: 'EUR' : 'symbol' : '1.0-0' : 'es' }}</dd>
              </div>
              <div class="rounded-lg bg-emerald-50 p-3 ring-1 ring-emerald-200">
                <dt class="text-emerald-900">Entradas vendidas</dt>
                <dd class="text-xl font-bold text-slate-900">{{ taquilla.entradasVendidas() | number }}</dd>
              </div>
            </dl>
            <ul class="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-slate-700">
              @for (e of estadosPanel; track e.id) {
                <li class="flex justify-between">
                  <span>{{ e.nombre }}</span>
                  <strong class="text-slate-900">{{ taquilla.pedidosPorEstado()[e.id] }}</strong>
                </li>
              }
            </ul>
          </article>

          <!-- Antifraude -->
          <article class="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div class="flex items-center justify-between gap-3">
              <h3 class="font-semibold text-slate-900">🛡 {{ antifraude.nombre }}</h3>
              <label class="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" [checked]="activo(antifraude)" (change)="alternar(antifraude)" />
                Suscrito<span class="sr-only">: {{ antifraude.nombre }}</span>
              </label>
            </div>
            <ul class="mt-3 max-h-40 space-y-2 overflow-y-auto text-sm">
              @for (a of antifraude.alertas(); track $index) {
                <li class="rounded-lg bg-amber-50 p-2 text-amber-950 ring-1 ring-amber-200">{{ a }}</li>
              } @empty {
                <li class="text-slate-500">Sin alertas. Prueba «Rechazar pago» dos veces.</li>
              }
            </ul>
          </article>

          <!-- Auditoría -->
          <article class="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div class="flex items-center justify-between gap-3">
              <h3 class="font-semibold text-slate-900">📋 {{ auditoria.nombre }}</h3>
              <label class="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" [checked]="activo(auditoria)" (change)="alternar(auditoria)" />
                Suscrito<span class="sr-only">: {{ auditoria.nombre }}</span>
              </label>
            </div>
            <ol class="mt-3 max-h-40 space-y-1 overflow-y-auto font-mono text-xs text-slate-800">
              @for (l of auditoria.lineas(); track $index) {
                <li><span class="text-slate-500">{{ l.hora }}</span> {{ l.texto }}</li>
              } @empty {
                <li class="font-sans text-sm text-slate-500">Sin eventos.</li>
              }
            </ol>
          </article>
        </div>
      </section>

      <!-- Código -->
      <section aria-labelledby="titulo-codigo" class="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
        <h2 id="titulo-codigo" class="text-lg font-semibold text-slate-900">Cómo se juntan los dos patrones</h2>
        <pre class="mt-4 overflow-x-auto rounded-xl bg-slate-900 p-4 text-xs leading-relaxed text-slate-100"><code>{{ codigo }}</code></pre>
      </section>
    </div>
  `,
})
export class ObserverPage {
  protected readonly nodos = NODOS;
  protected readonly transiciones = TRANSICIONES;
  protected readonly catalogo = CATALOGO;
  protected readonly maxEntradas = MAX_ENTRADAS_POR_PEDIDO;
  protected readonly diasMinimos = DIAS_MINIMOS_REEMBOLSO;
  protected readonly codigo = CODIGO;

  protected readonly estadosPanel = NODOS.map((n) => ({ id: n.id as EstadoPedidoId, nombre: n.nombre }));

  // Los observadores viven fuera de los pedidos: los pedidos no los conocen.
  protected readonly correo = new NotificadorCorreo();
  protected readonly taquilla = new PanelTaquilla();
  protected readonly antifraude = new AlertaAntifraude();
  protected readonly auditoria = new RegistroAuditoria();

  private readonly suscripciones: readonly Suscripcion[] = [this.correo, this.taquilla, this.antifraude, this.auditoria].map(
    (observador) => ({ observador, activo: signal(true) }),
  );
  /** Funciones para darse de baja: observador → (pedido → baja). */
  private readonly bajas = new Map<Observador, Map<Pedido, () => void>>();

  protected readonly pedidos = signal<readonly Pedido[]>([]);
  protected readonly pedido = signal<Pedido>(this.crearPedido());

  /** El pedido no es un signal: esta cuenta refresca la vista tras cada acción. */
  private readonly version = signal(0);
  protected readonly ultimo = signal<Resultado | null>(null);

  protected readonly vista = computed(() => {
    this.version();
    const p = this.pedido();
    return {
      estado: p.estadoActual,
      entradas: p.entradas,
      total: p.total,
      dias: p.diasParaElPartido,
      pagosRechazados: p.pagosRechazados,
    };
  });

  protected readonly acciones: readonly { texto: string; ejecutar: (p: Pedido) => Resultado }[] = [
    { texto: 'Confirmar pedido', ejecutar: (p) => p.confirmar() },
    { texto: 'Pagar', ejecutar: (p) => p.pagar() },
    { texto: 'Rechazar pago', ejecutar: (p) => p.rechazarPago() },
    { texto: 'Expirar reserva', ejecutar: (p) => p.expirar() },
    { texto: 'Cancelar', ejecutar: (p) => p.cancelar() },
    { texto: 'Reembolsar', ejecutar: (p) => p.reembolsar() },
  ];

  protected nuevoPedido(): void {
    this.pedido.set(this.crearPedido());
    this.ultimo.set(null);
  }

  protected elegirPedido(p: Pedido): void {
    this.pedido.set(p);
    this.ultimo.set(null);
    this.refrescar();
  }

  protected anadir(item: ItemEntrada): void {
    this.resolver(this.pedido().anadirEntrada(item));
  }

  protected quitar(posicion: number): void {
    this.resolver(this.pedido().quitarEntrada(posicion));
  }

  protected ejecutar(accion: (p: Pedido) => Resultado): void {
    this.resolver(accion(this.pedido()));
  }

  protected cambiarDias(dias: number): void {
    this.pedido().diasParaElPartido = Number.isFinite(dias) ? Math.max(0, dias) : 0;
    this.refrescar();
  }

  protected activo(observador: Observador): boolean {
    return this.suscripciones.find((s) => s.observador === observador)!.activo();
  }

  /** Suscribe o da de baja un observador en TODOS los pedidos. */
  protected alternar(observador: Observador): void {
    const s = this.suscripciones.find((x) => x.observador === observador)!;
    const nuevo = !s.activo();
    s.activo.set(nuevo);
    for (const pedido of this.pedidos()) {
      if (nuevo) this.suscribir(observador, pedido);
      else this.bajas.get(observador)?.get(pedido)?.();
    }
  }

  private resolver(resultado: Resultado): void {
    this.ultimo.set(resultado);
    this.refrescar();
  }

  private refrescar(): void {
    this.version.update((v) => v + 1);
  }

  private crearPedido(): Pedido {
    const pedido = new Pedido();
    for (const s of this.suscripciones) if (s.activo()) this.suscribir(s.observador, pedido);
    pedido.anunciarCreacion();
    this.pedidos.update((lista) => [...lista, pedido]);
    return pedido;
  }

  private suscribir(observador: Observador, pedido: Pedido): void {
    const porPedido = this.bajas.get(observador) ?? new Map<Pedido, () => void>();
    porPedido.set(pedido, pedido.suscribir(observador));
    this.bajas.set(observador, porPedido);
  }
}

const CODIGO = `// STATE decide qué pasa; OBSERVER cuenta lo que pasó.
class Pedido extends Sujeto {                      // ← Sujeto = lista de observadores
  private estado: EstadoPedido = new EnCarrito();  // ← estado actual (State)

  pagar() { return this.estado.pagar(this); }      // State: delega en el estado

  cambiarEstado(nuevo: EstadoPedido, detalle: string) {
    const anterior = this.estado;
    this.estado = nuevo;
    this.notificar({ tipo: 'estado-cambiado', de: anterior.id, a: nuevo.id, detalle, ... });
  }                                                // Observer: avisa DESPUÉS del cambio
}

class PendienteDePago extends EstadoPedido {
  pagar(pedido: Pedido) {
    pedido.cambiarEstado(new Pagado(), 'Pago aceptado');  // el estado solo cambia al pedido…
    return { ok: true, mensaje: 'Entradas emitidas' };    // …y no sabe nada del correo ni de la taquilla
  }
}

// Los observadores se suscriben desde fuera:
const baja = pedido.suscribir(new NotificadorCorreo());
pedido.suscribir(new PanelTaquilla());
baja();   // darse de baja no afecta al pedido`;
