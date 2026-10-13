import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { EstadioGenerado } from '../../../core/data/estadio.generator';
import { EVENTO } from '../../../core/data/evento.db';
import { LocalidadId, LOCALIDADES } from '../../../core/data/localidades.db';
import { MapaDeSillas, SillaSeleccionada } from '../../../core/models/mapa-de-sillas';
import { VersionMapa } from '../../../core/models/resultado-ejecucion';
import { Lienzo } from '../../../core/render/icono-silla';
import { BenchmarkService } from '../../../core/services/benchmark.service';
import { CompraService, PASOS_COMPRA } from '../../../core/services/compra.service';
import { DemoService } from '../../../core/services/demo.service';
import { BoletaComponent } from '../boleta/boleta.component';
import { EscudoEquipoComponent } from '../escudo-equipo/escudo-equipo.component';
import { LeyendaMapaComponent } from '../leyenda-mapa/leyenda-mapa.component';
import { MapaEstadioComponent, PuntoPlano } from '../mapa-estadio/mapa-estadio.component';
import { PanelSillaComponent } from '../panel-silla/panel-silla.component';
import { PasoDatosComponent } from '../paso-datos/paso-datos.component';
import { PasoPagoComponent } from '../paso-pago/paso-pago.component';
import { ResumenCompraComponent } from '../resumen-compra/resumen-compra.component';

/** Desde este aforo, la versión sin Flyweight pide confirmación antes de cargar. */
const AFORO_PESADO = 50_000;
const AFORO_SEGURO = 25_000;
/** Las puertas abren dos horas antes del partido (ver condiciones). */
const HORAS_APERTURA_ANTES = 2;

const AVISO_CARGA_PESADA: Record<number, string> = {
  50_000: 'Sin Flyweight, cargar 50.000 asientos puede congelar la pestaña unos 10 segundos.',
  100_000:
    'Sin Flyweight, cargar 100.000 asientos puede congelar la pestaña entre 40 segundos y 1 minuto, y usar cientos de MB de memoria. Es justo el problema que resuelve el patrón.',
};

/**
 * Sitio de venta de entradas: partido, mapa de asientos, vista previa y compra.
 *
 * Es igual para las dos versiones; cada página le pasa su propia función
 * `crearMapa`, que es lo único que cambia entre usar o no el patrón. Los
 * tiempos se registran en la consola del navegador.
 */
@Component({
  selector: 'app-boleteria',
  imports: [
    CurrencyPipe,
    DatePipe,
    DecimalPipe,
    BoletaComponent,
    EscudoEquipoComponent,
    LeyendaMapaComponent,
    MapaEstadioComponent,
    PanelSillaComponent,
    PasoDatosComponent,
    PasoPagoComponent,
    ResumenCompraComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Portada del partido, a todo el ancho -->
    <section aria-labelledby="titulo-evento" class="no-imprimir relative isolate overflow-hidden bg-slate-800">
      @if (!fotoFallida()) {
        <img
          [src]="evento.imagenEstadio"
          alt=""
          referrerpolicy="no-referrer"
          class="absolute inset-0 -z-10 size-full object-cover"
          (error)="fotoFallida.set(true)"
        />
      }
      <div aria-hidden="true" class="absolute inset-0 -z-10 bg-gradient-to-t from-slate-950/95 via-slate-950/55 to-slate-950/10"></div>

      <div class="mx-auto flex min-h-[26rem] max-w-7xl flex-col justify-end gap-6 px-4 pb-8 pt-28 sm:min-h-[34rem] sm:pb-12 lg:flex-row lg:items-end lg:justify-between">
        <div class="max-w-4xl">
          <p class="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white ring-1 ring-white/30 backdrop-blur sm:text-sm">
            {{ evento.competicion }} · {{ evento.jornada }}
          </p>

          <h1 id="titulo-evento" class="mt-4 flex flex-wrap items-center gap-x-4 gap-y-3 text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
            <span class="flex items-center gap-3">
              <app-escudo-equipo class="size-12 sm:size-16" [equipo]="evento.local" />
              {{ evento.local.nombre }}
            </span>
            <span class="text-xl font-semibold text-white/75 sm:text-3xl">vs</span>
            <span class="flex items-center gap-3">
              <app-escudo-equipo class="size-12 sm:size-16" [equipo]="evento.visitante" />
              {{ evento.visitante.nombre }}
            </span>
          </h1>

          <dl class="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/90 sm:text-base">
            <div class="flex gap-1.5">
              <dt class="sr-only">Fecha</dt>
              <dd class="first-letter:uppercase">{{ evento.fecha | date: "EEEE d 'de' MMMM 'de' y · HH:mm" : evento.zonaHoraria }}</dd>
            </div>
            <div class="flex gap-1.5">
              <dt class="sr-only">Estadio</dt>
              <dd>{{ evento.estadio }}, {{ evento.ciudad }}</dd>
            </div>
            <div class="flex gap-1.5">
              <dt>Apertura de puertas:</dt>
              <dd>{{ apertura | date: 'HH:mm' : evento.zonaHoraria }}</dd>
            </div>
          </dl>
        </div>

        <div class="flex shrink-0 items-center gap-4 rounded-2xl bg-white/95 p-4 shadow-xl">
          <div>
            <p class="text-xs text-slate-600">Entradas desde</p>
            <p class="text-2xl font-bold text-slate-900">{{ precioMinimo | currency: 'EUR' : 'symbol' : '1.0-0' }}</p>
          </div>
          <button
            type="button"
            class="rounded-xl bg-marca px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-marca-oscuro focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca"
            (click)="irACompra()"
          >
            Comprar entradas
          </button>
        </div>
      </div>
      <p class="absolute right-3 bottom-2 text-[10px] text-white/60">Foto: socios.com</p>
    </section>

    <div class="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:py-10">
      <!-- Encabezado y pasos de la compra -->
      <div id="compra" class="scroll-mt-28 space-y-6">
        <div>
          <h2 class="text-2xl font-bold tracking-tight text-slate-900">Compra tus entradas</h2>
          <p class="mt-1 text-slate-600">
            Elige una localidad o haz clic en un asiento del mapa. Antes de pagar verás cómo se ve el
            campo desde tu zona.
          </p>
        </div>

        <nav aria-label="Pasos de la compra" class="rounded-2xl bg-white px-4 py-4 shadow-sm ring-1 ring-slate-200 sm:px-6">
          <ol class="flex items-center gap-2 sm:gap-4">
            @for (paso of pasos; track paso.id; let i = $index, ultimo = $last) {
              <li class="flex flex-1 items-center gap-2 sm:gap-3" [attr.aria-current]="i === indicePaso() ? 'step' : null">
                <span
                  class="grid size-8 shrink-0 place-items-center rounded-full text-sm font-semibold"
                  [class]="i < indicePaso() ? 'bg-marca text-white' : i === indicePaso() ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500 ring-1 ring-slate-200'"
                >
                  @if (i < indicePaso()) {
                    <span aria-hidden="true">✓</span><span class="sr-only">Completado:</span>
                  } @else {
                    {{ i + 1 }}
                  }
                </span>
                <span
                  class="hidden text-sm sm:inline"
                  [class]="i === indicePaso() ? 'font-semibold text-slate-900' : 'text-slate-600'"
                >
                  {{ paso.nombre }}
                </span>
                @if (!ultimo) {
                  <span aria-hidden="true" class="h-0.5 flex-1 rounded" [class]="i < indicePaso() ? 'bg-marca' : 'bg-slate-200'"></span>
                }
              </li>
            }
          </ol>
          <p class="mt-2 text-sm font-semibold text-slate-900 sm:hidden">
            Paso {{ indicePaso() + 1 }} de {{ pasos.length }}: {{ pasos[indicePaso()].nombre }}
          </p>
        </nav>
      </div>

      <!-- Paso 1: elegir asiento. Se oculta (sin destruirse) para conservar el mapa dibujado. -->
      <div [hidden]="compra.paso() !== 'silla'" class="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <div class="space-y-6">
          <section aria-labelledby="titulo-localidades" class="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <h3 id="titulo-localidades" class="text-base font-semibold text-slate-900">Localidades</h3>
            <p class="text-sm text-slate-600">Elige una y te asignamos un asiento libre al azar.</p>
            <ul class="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
              @for (localidad of localidades; track localidad.id) {
                <li>
                  <button
                    type="button"
                    class="flex w-full items-center gap-3 rounded-xl p-3 text-left ring-1 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca disabled:cursor-not-allowed disabled:opacity-50"
                    [class]="seleccion()?.detalle?.localidad?.id === localidad.id ? 'bg-slate-50 ring-2 ring-slate-900' : 'ring-slate-200'"
                    [disabled]="!mapa() || cargando() || (libres().get(localidad.id) ?? 0) === 0"
                    (click)="buscarDisponible(localidad.id)"
                  >
                    <span aria-hidden="true" class="h-10 w-1.5 shrink-0 rounded-full" [style.background-color]="localidad.color"></span>
                    <span class="min-w-0 flex-1">
                      <span class="block font-semibold text-slate-900">{{ localidad.nombre }}</span>
                      <span class="block text-xs text-slate-600">
                        @if (mapa()) {
                          {{ libres().get(localidad.id) ?? 0 | number }} libres
                        } @else {
                          Cargando…
                        }
                      </span>
                    </span>
                    <span class="font-semibold tabular-nums text-slate-900">{{ localidad.precio | currency: 'EUR' : 'symbol' : '1.0-0' }}</span>
                  </button>
                </li>
              }
            </ul>
            @if (avisoBusqueda(); as aviso) {
              <p role="status" class="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900 ring-1 ring-amber-200">{{ aviso }}</p>
            }
          </section>

          <section aria-labelledby="titulo-mapa" class="space-y-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div class="flex flex-wrap items-baseline justify-between gap-2">
              <h3 id="titulo-mapa" class="text-base font-semibold text-slate-900">Mapa del estadio</h3>
              <p class="text-sm text-slate-600">{{ demo.aforo() | number }} asientos · haz clic en uno para verlo</p>
            </div>

            @if (confirmacionPendiente()) {
              <div role="alert" class="rounded-xl bg-amber-50 p-4 text-sm text-amber-950 ring-1 ring-amber-300">
                <p class="flex gap-2">
                  <span aria-hidden="true">⚠</span>
                  <span><strong>Aviso de la demostración:</strong> {{ avisoCargaPesada() }}</span>
                </p>
                <div class="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    class="rounded-lg bg-amber-900 px-4 py-2 font-medium text-white hover:bg-amber-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-900"
                    (click)="confirmarCarga()"
                  >
                    Cargar el mapa de todos modos
                  </button>
                  <button
                    type="button"
                    class="rounded-lg px-4 py-2 font-medium text-amber-950 ring-1 ring-amber-400 hover:bg-amber-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-900"
                    (click)="usarAforoSeguro()"
                  >
                    Usar {{ aforoSeguro | number }} asientos
                  </button>
                </div>
              </div>
            }

            <app-mapa-estadio
              [descripcion]="descripcionMapa()"
              [resaltado]="puntoSeleccionado()"
              (clicEnPlano)="seleccionarEn($event)"
            >
              @if (cargando()) {
                <div class="absolute inset-0 grid place-items-center bg-white/75">
                  <div class="flex items-center gap-3 rounded-xl bg-white px-5 py-4 text-sm text-slate-800 shadow-lg ring-1 ring-slate-200">
                    <span aria-hidden="true" class="size-5 animate-spin rounded-full border-2 border-slate-200 border-t-marca motion-reduce:animate-none"></span>
                    Cargando el mapa del estadio…
                  </div>
                </div>
              }
            </app-mapa-estadio>

            @if (error(); as mensaje) {
              <p role="alert" class="rounded-lg bg-red-50 p-3 text-sm text-red-800 ring-1 ring-red-200">
                No se pudo cargar el mapa: {{ mensaje }}
              </p>
            }

            <app-leyenda-mapa />
          </section>
        </div>

        <app-panel-silla [silla]="seleccion()?.detalle ?? null" [vista]="vista()" (continuar)="continuar()" />
      </div>

      @switch (compra.paso()) {
        @case ('datos') {
          <div class="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
            <app-paso-datos (volver)="irAPaso('silla')" />
            <app-resumen-compra [vista]="vista()" />
          </div>
        }
        @case ('pago') {
          <div class="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
            <app-paso-pago (volver)="irAPaso('datos')" />
            <app-resumen-compra [vista]="vista()" />
          </div>
        }
        @case ('boleta') {
          <app-boleta [vista]="vista()" (nuevaCompra)="nuevaCompra()" />
        }
      }

      <p class="sr-only" role="status" aria-live="polite">{{ mensajeEstado() }}</p>
    </div>
  `,
})
export class BoleteriaComponent {
  readonly version = input.required<VersionMapa>();
  /** Construye el mapa: la única diferencia entre las dos versiones. */
  readonly crearMapa = input.required<(plano: EstadioGenerado) => MapaDeSillas>();

  private readonly benchmark = inject(BenchmarkService);
  protected readonly demo = inject(DemoService);
  protected readonly compra = inject(CompraService);
  private readonly mapaEstadio = viewChild.required(MapaEstadioComponent);

  protected readonly evento = EVENTO;
  protected readonly pasos = PASOS_COMPRA;
  protected readonly localidades = LOCALIDADES;
  protected readonly precioMinimo = Math.min(...LOCALIDADES.map((l) => l.precio));
  protected readonly aforoSeguro = AFORO_SEGURO;
  protected readonly apertura = new Date(
    new Date(EVENTO.fecha).getTime() - HORAS_APERTURA_ANTES * 3_600_000,
  );

  protected readonly fotoFallida = signal(false);
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly confirmacionPendiente = signal(false);
  protected readonly mapa = signal<MapaDeSillas | null>(null);
  protected readonly seleccion = signal<SillaSeleccionada | null>(null);
  protected readonly vista = signal<Lienzo | null>(null);
  protected readonly avisoBusqueda = signal<string | null>(null);

  protected readonly indicePaso = computed(() =>
    this.pasos.findIndex((p) => p.id === this.compra.paso()),
  );
  protected readonly avisoCargaPesada = computed(() => AVISO_CARGA_PESADA[this.demo.aforo()] ?? '');

  /** Asientos disponibles por localidad en el mapa cargado. */
  protected readonly libres = computed(() => {
    const libres = new Map<LocalidadId, number>();
    for (const silla of this.mapa()?.plano.sillas ?? []) {
      if (silla.estado === 'DISPONIBLE') {
        libres.set(silla.localidadId, (libres.get(silla.localidadId) ?? 0) + 1);
      }
    }
    return libres;
  });

  protected readonly puntoSeleccionado = computed<PuntoPlano | null>(() => {
    const detalle = this.seleccion()?.detalle;
    return detalle ? { x: detalle.x, y: detalle.y } : null;
  });

  protected readonly descripcionMapa = computed(() =>
    this.mapa()
      ? `Mapa del estadio con ${this.demo.aforo().toLocaleString('es-ES')} asientos. Haz clic en un asiento para ver su detalle, o elige una localidad.`
      : 'Mapa del estadio sin asientos cargados.',
  );

  protected readonly mensajeEstado = computed(() => {
    if (this.cargando()) return 'Cargando el mapa del estadio…';
    const detalle = this.seleccion()?.detalle;
    return detalle
      ? `Asiento seleccionado: ${detalle.localidad.nombre}, sección ${detalle.seccion}, fila ${detalle.fila}, asiento ${detalle.numero}.`
      : '';
  });

  constructor() {
    // Carga el mapa al entrar y cada vez que cambia el aforo de la demostración.
    effect(() => {
      const aforo = this.demo.aforo();
      untracked(() => this.prepararCarga(aforo));
    });
  }

  protected confirmarCarga(): void {
    this.confirmacionPendiente.set(false);
    void this.cargarMapa();
  }

  protected usarAforoSeguro(): void {
    this.demo.cambiarAforo(AFORO_SEGURO);
  }

  protected seleccionarEn(punto: PuntoPlano): void {
    const mapa = this.mapa();
    if (!mapa || this.cargando()) return;

    const silla = mapa.seleccionarSilla(punto.x, punto.y);
    if (silla) this.aplicarSeleccion(mapa, silla);
  }

  /** Alternativa al clic (y accesible con teclado): un asiento libre al azar. */
  protected buscarDisponible(localidad: LocalidadId): void {
    const mapa = this.mapa();
    if (!mapa) return;

    const libres = mapa.plano.sillas.filter((s) => s.localidadId === localidad && s.estado === 'DISPONIBLE');
    if (libres.length === 0) {
      this.avisoBusqueda.set('No quedan asientos libres en esa localidad.');
      return;
    }

    this.avisoBusqueda.set(null);
    const registro = libres[Math.floor(Math.random() * libres.length)];
    const silla = mapa.seleccionarSilla(registro.x, registro.y);
    if (silla) this.aplicarSeleccion(mapa, silla);
  }

  protected continuar(): void {
    const silla = this.seleccion()?.detalle;
    if (!silla || silla.estado !== 'DISPONIBLE') return;

    this.compra.elegirSilla(silla, this.demo.aforo());
    this.irACompra();
  }

  protected irAPaso(paso: 'silla' | 'datos'): void {
    this.compra.irA(paso);
    this.irACompra();
  }

  protected nuevaCompra(): void {
    this.compra.reiniciar();
    this.seleccion.set(null);
    this.vista.set(null);
    this.irACompra();
  }

  protected irACompra(): void {
    document.getElementById('compra')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  private prepararCarga(aforo: number): void {
    this.compra.sincronizarAforo(aforo);

    if (this.version() === 'antes' && aforo >= AFORO_PESADO) {
      this.mapa.set(null);
      this.seleccion.set(null);
      this.vista.set(null);
      this.confirmacionPendiente.set(true);
      return;
    }

    this.confirmacionPendiente.set(false);
    void this.cargarMapa();
  }

  private async cargarMapa(): Promise<void> {
    if (this.cargando()) return;

    this.cargando.set(true);
    this.error.set(null);
    this.avisoBusqueda.set(null);
    this.seleccion.set(null);
    this.vista.set(null);
    // Suelta el mapa anterior para que el recolector de basura pueda liberarlo.
    this.mapa.set(null);

    // La carga bloquea el hilo principal: primero se deja pintar el aviso
    // de "Cargando…" y el estadio vacío.
    await esperarPintado();
    this.mapaEstadio().limpiar();
    await esperarPintado();

    try {
      const { mapa } = this.benchmark.ejecutar({
        version: this.version(),
        cantidad: this.demo.aforo(),
        crearMapa: this.crearMapa(),
        renderizar: (m) => this.mapaEstadio().renderizar(m),
      });
      this.mapa.set(mapa);
      this.restaurarSeleccion(mapa);
    } catch (e) {
      console.error(e);
      this.error.set(e instanceof Error ? e.message : String(e));
      this.mapaEstadio().limpiar();
    } finally {
      this.cargando.set(false);
    }
  }

  /** Si había un asiento elegido (por ejemplo, antes de cambiar de versión), se vuelve a mostrar. */
  private restaurarSeleccion(mapa: MapaDeSillas): void {
    const elegida = this.compra.silla();
    if (!elegida) return;

    const silla = mapa.seleccionarSilla(elegida.x, elegida.y);
    if (silla?.detalle.id === elegida.id) this.aplicarSeleccion(mapa, silla);
  }

  private aplicarSeleccion(mapa: MapaDeSillas, silla: SillaSeleccionada): void {
    this.seleccion.set(silla);
    this.vista.set(this.benchmark.medirVista(this.version(), mapa, silla));
  }
}

/**
 * Espera a que el navegador pinte el siguiente cuadro. Si la pestaña está en
 * segundo plano, `requestAnimationFrame` no se dispara, así que un temporizador
 * de respaldo evita que la carga quede esperando para siempre.
 */
function esperarPintado(): Promise<void> {
  return new Promise((resolver) => {
    let resuelto = false;
    const continuar = () => {
      if (resuelto) return;
      resuelto = true;
      setTimeout(resolver, 0);
    };
    requestAnimationFrame(continuar);
    setTimeout(continuar, 100);
  });
}
