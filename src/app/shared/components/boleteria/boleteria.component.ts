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
import { NOMBRE_VERSION, VersionMapa } from '../../../core/models/resultado-ejecucion';
import { Lienzo } from '../../../core/render/icono-silla';
import { BenchmarkService } from '../../../core/services/benchmark.service';
import { CompraService, PASOS_COMPRA } from '../../../core/services/compra.service';
import { DemoService } from '../../../core/services/demo.service';
import { ResultadosService } from '../../../core/services/resultados.service';
import { DuracionPipe, MegabytesPipe } from '../../pipes/formato.pipes';
import { BoletaComponent } from '../boleta/boleta.component';
import { ComparacionResultadosComponent } from '../comparacion-resultados/comparacion-resultados.component';
import { LeyendaMapaComponent } from '../leyenda-mapa/leyenda-mapa.component';
import { MapaEstadioComponent, PuntoPlano } from '../mapa-estadio/mapa-estadio.component';
import { PanelSillaComponent } from '../panel-silla/panel-silla.component';
import { PasoDatosComponent } from '../paso-datos/paso-datos.component';
import { PasoPagoComponent } from '../paso-pago/paso-pago.component';
import { ResumenCompraComponent } from '../resumen-compra/resumen-compra.component';
import { TarjetaMetricaComponent } from '../tarjeta-metrica/tarjeta-metrica.component';

/** Desde este aforo, la versión sin Flyweight pide confirmación antes de cargar. */
const AFORO_PESADO = 50_000;
const AFORO_SEGURO = 25_000;

const AVISO_CARGA_PESADA: Record<number, string> = {
  50_000: 'Sin Flyweight, cargar 50.000 sillas puede congelar la pestaña unos 10 segundos.',
  100_000:
    'Sin Flyweight, cargar 100.000 sillas puede congelar la pestaña entre 40 segundos y 1 minuto, y usar cientos de MB de memoria. Es justo el problema que resuelve el patrón.',
};

/**
 * Sitio de la boletería: evento, mapa de sillas, vista previa y compra.
 *
 * Es igual para las dos versiones; cada página le pasa su propia función
 * `crearMapa`, que es lo único que cambia entre usar o no el patrón.
 */
@Component({
  selector: 'app-boleteria',
  imports: [
    CurrencyPipe,
    DatePipe,
    DecimalPipe,
    BoletaComponent,
    ComparacionResultadosComponent,
    LeyendaMapaComponent,
    MapaEstadioComponent,
    PanelSillaComponent,
    PasoDatosComponent,
    PasoPagoComponent,
    ResumenCompraComponent,
    TarjetaMetricaComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-8">
      <!-- Evento -->
      <section aria-labelledby="titulo-evento" class="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
        <div class="h-1.5 bg-marca"></div>
        <div class="flex flex-col gap-5 p-6 sm:p-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p class="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200">
              Fútbol · Final
            </p>
            <h1 id="titulo-evento" class="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              {{ evento.nombre }}
            </h1>
            <p class="mt-2 text-slate-700">
              {{ evento.fecha | date: "EEEE d 'de' MMMM, h:mm a" }} · {{ evento.estadio }}, {{ evento.ciudad }}
            </p>
            <p class="mt-1 text-sm text-slate-600">Las puertas abren tres horas antes del partido.</p>
          </div>
          <div class="shrink-0 rounded-2xl bg-slate-50 px-5 py-4 ring-1 ring-slate-200">
            <p class="text-xs text-slate-600">Boletas desde</p>
            <p class="text-2xl font-bold text-slate-900">{{ precioMinimo | currency: 'COP' : 'symbol-narrow' : '1.0-0' }}</p>
          </div>
        </div>
      </section>

      <!-- Pasos de la compra -->
      <nav id="compra" aria-label="Pasos de la compra" class="scroll-mt-28">
        <ol class="grid grid-cols-4 gap-2">
          @for (paso of pasos; track paso.id; let i = $index) {
            <li
              class="flex flex-col gap-2 border-t-4 pt-2 text-xs sm:text-sm"
              [class]="i <= indicePaso() ? 'border-marca' : 'border-slate-200'"
              [attr.aria-current]="i === indicePaso() ? 'step' : null"
            >
              <span [class]="i === indicePaso() ? 'font-semibold text-slate-900' : i < indicePaso() ? 'text-slate-700' : 'text-slate-500'">
                <span class="tabular-nums">{{ i + 1 }}.</span> {{ paso.nombre }}
                @if (i < indicePaso()) {
                  <span aria-label="(completado)">✓</span>
                }
              </span>
            </li>
          }
        </ol>
      </nav>

      <!-- Paso 1: elegir silla. Se oculta (sin destruirse) para conservar el mapa dibujado. -->
      <div [hidden]="compra.paso() !== 'silla'" class="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <section aria-labelledby="titulo-mapa" class="space-y-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div class="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="titulo-mapa" class="text-lg font-semibold text-slate-900">Elige tu silla</h2>
              <p class="text-sm text-slate-600">
                {{ demo.aforo() | number }} sillas · haz clic en una silla del mapa para ver la cancha desde allí.
              </p>
            </div>
            <form class="flex flex-wrap items-end gap-2" (submit)="$event.preventDefault(); buscarDisponible()">
              <div>
                <label for="localidad-buscada" class="block text-xs font-medium text-slate-700">Buscar silla disponible en</label>
                <select
                  id="localidad-buscada"
                  class="mt-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-2 focus:outline-offset-1 focus:outline-marca"
                  (change)="localidadBuscada.set($any($event.target).value)"
                >
                  @for (localidad of localidades; track localidad.id) {
                    <option [value]="localidad.id" [selected]="localidad.id === localidadBuscada()">{{ localidad.nombre }} · {{ localidad.precio | currency: 'COP' : 'symbol-narrow' : '1.0-0' }}</option>
                  }
                </select>
              </div>
              <button
                type="submit"
                class="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca disabled:opacity-50"
                [disabled]="!mapa() || cargando()"
              >
                Buscar
              </button>
            </form>
          </div>

          @if (avisoBusqueda(); as aviso) {
            <p role="status" class="rounded-lg bg-amber-50 p-3 text-sm text-amber-900 ring-1 ring-amber-200">{{ aviso }}</p>
          }

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
                  Usar {{ aforoSeguro | number }} sillas
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

      <!-- Panel de rendimiento (parte de la demostración, no del sitio real) -->
      <section id="rendimiento" aria-labelledby="titulo-rendimiento" class="no-imprimir scroll-mt-28 space-y-5 rounded-3xl border-2 border-dashed border-amber-300 bg-amber-50/40 p-5 sm:p-6">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p class="text-xs font-semibold uppercase tracking-wide text-amber-800">Demostración del patrón</p>
            <h2 id="titulo-rendimiento" class="text-xl font-bold text-slate-900">
              Panel de rendimiento · {{ nombreVersion() }}
            </h2>
            <p class="mt-1 max-w-3xl text-sm text-slate-700">
              Lo que pasa por dentro del sitio mientras compras. Los tiempos se miden con
              <code class="text-slate-900">console.time</code> / <code class="text-slate-900">console.timeEnd</code>
              (consola, F12) y con <code class="text-slate-900">performance.now()</code> para mostrarlos aquí.
            </p>
          </div>
          <button
            type="button"
            class="rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-800 ring-1 ring-slate-300 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca disabled:opacity-50"
            [disabled]="cargando() || confirmacionPendiente()"
            (click)="cargarMapa()"
          >
            Volver a cargar el mapa
          </button>
        </div>

        @if (metricas(); as m) {
          <div class="grid grid-cols-2 gap-3 md:grid-cols-4">
            <app-tarjeta-metrica etiqueta="Crear objetos del mapa" [valor]="m.creacion" detalle="Aquí actúa el patrón" [destacada]="true" />
            <app-tarjeta-metrica etiqueta="Dibujar el mapa" [valor]="m.render" />
            <app-tarjeta-metrica etiqueta="Carga total" [valor]="m.total" [detalle]="'Incluye leer los datos: ' + m.carga" />
            <app-tarjeta-metrica etiqueta="Memoria estimada" [valor]="m.memoria" [detalle]="'Mapa ' + m.memoriaMapa + ' + vistas ' + m.memoriaVistas" [destacada]="true" />
            <app-tarjeta-metrica etiqueta="Copias de localidad" [valor]="m.copias" detalle="Precio, beneficios y términos" [destacada]="true" />
            <app-tarjeta-metrica etiqueta="Iconos de silla" [valor]="m.iconos" detalle="Lienzos de 24 × 24 px" />
            <app-tarjeta-metrica etiqueta="Vistas previas dibujadas" [valor]="m.vistas" [detalle]="m.vistasDetalle" [destacada]="true" />
            <app-tarjeta-metrica etiqueta="Última vista previa" [valor]="m.ultimaVista" [detalle]="m.promedioVista" />
          </div>
          <p class="text-xs text-slate-600">
            <strong class="text-slate-800">Sobre la memoria:</strong> JavaScript no permite medir cuánto
            ocupa un objeto, así que se estima a partir de los datos que guarda cada versión con la
            misma regla (textos, números y píxeles de iconos y vistas). Cambiar de versión recarga la
            página para medir siempre con la memoria limpia.
          </p>
        } @else {
          <p class="rounded-xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-600">
            El mapa todavía no se ha cargado en esta versión.
          </p>
        }

        <ng-content />

        <app-comparacion-resultados />
      </section>
    </div>
  `,
})
export class BoleteriaComponent {
  readonly version = input.required<VersionMapa>();
  /** Construye el mapa: la única diferencia entre las dos versiones. */
  readonly crearMapa = input.required<(plano: EstadioGenerado) => MapaDeSillas>();

  private readonly benchmark = inject(BenchmarkService);
  private readonly resultados = inject(ResultadosService);
  protected readonly demo = inject(DemoService);
  protected readonly compra = inject(CompraService);
  private readonly mapaEstadio = viewChild.required(MapaEstadioComponent);

  protected readonly evento = EVENTO;
  protected readonly pasos = PASOS_COMPRA;
  protected readonly localidades = LOCALIDADES;
  protected readonly precioMinimo = Math.min(...LOCALIDADES.map((l) => l.precio));
  protected readonly aforoSeguro = AFORO_SEGURO;

  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly confirmacionPendiente = signal(false);
  protected readonly mapa = signal<MapaDeSillas | null>(null);
  protected readonly seleccion = signal<SillaSeleccionada | null>(null);
  protected readonly vista = signal<Lienzo | null>(null);
  protected readonly localidadBuscada = signal<LocalidadId>('GENERAL');
  protected readonly avisoBusqueda = signal<string | null>(null);

  protected readonly nombreVersion = computed(() => NOMBRE_VERSION[this.version()]);
  protected readonly indicePaso = computed(() =>
    this.pasos.findIndex((p) => p.id === this.compra.paso()),
  );
  protected readonly avisoCargaPesada = computed(() => AVISO_CARGA_PESADA[this.demo.aforo()] ?? '');

  protected readonly puntoSeleccionado = computed<PuntoPlano | null>(() => {
    const detalle = this.seleccion()?.detalle;
    return detalle ? { x: detalle.x, y: detalle.y } : null;
  });

  protected readonly descripcionMapa = computed(() =>
    this.mapa()
      ? `Mapa del estadio con ${this.demo.aforo().toLocaleString('es-CO')} sillas. Haz clic en una silla para ver su detalle, o usa «Buscar silla disponible».`
      : 'Mapa del estadio sin sillas cargadas.',
  );

  protected readonly metricas = computed(() => {
    const version = this.version();
    const r = version === 'antes' ? this.resultados.antes() : this.resultados.despues();
    if (!r) return null;
    const v = version === 'antes' ? this.resultados.vistasAntes() : this.resultados.vistasDespues();

    const duracion = new DuracionPipe();
    const megabytes = new MegabytesPipe();
    const entero = (n: number) => n.toLocaleString('es-CO');
    const memoriaVistas = v?.memoriaEstimadaBytes ?? 0;

    return {
      carga: duracion.transform(r.cargaDatosMs),
      creacion: duracion.transform(r.creacionMs),
      render: duracion.transform(r.renderMs),
      total: duracion.transform(r.totalMs),
      memoria: megabytes.transform(r.memoriaEstimadaBytes + memoriaVistas),
      memoriaMapa: megabytes.transform(r.memoriaEstimadaBytes),
      memoriaVistas: megabytes.transform(memoriaVistas),
      copias: entero(r.copiasDeLocalidad),
      iconos: entero(r.iconos),
      vistas: entero(v?.renderizadas ?? 0),
      vistasDetalle: v
        ? `de ${entero(v.solicitadas)} silla${v.solicitadas === 1 ? '' : 's'} seleccionada${v.solicitadas === 1 ? '' : 's'}`
        : 'Selecciona sillas en el mapa',
      ultimaVista: v ? duracion.transform(v.ultimaMs) : '—',
      promedioVista: v ? `Promedio: ${duracion.transform(v.totalMs / v.solicitadas)}` : 'Aún sin vistas',
    };
  });

  protected readonly mensajeEstado = computed(() => {
    if (this.cargando()) return 'Cargando el mapa del estadio…';
    const detalle = this.seleccion()?.detalle;
    return detalle
      ? `Silla seleccionada: ${detalle.localidad.nombre}, sección ${detalle.seccion}, fila ${detalle.fila}, silla ${detalle.numero}.`
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

  protected async cargarMapa(): Promise<void> {
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

  protected seleccionarEn(punto: PuntoPlano): void {
    const mapa = this.mapa();
    if (!mapa || this.cargando()) return;

    const silla = mapa.seleccionarSilla(punto.x, punto.y);
    if (silla) this.aplicarSeleccion(mapa, silla);
  }

  /** Alternativa al clic (y accesible con teclado): una silla libre al azar. */
  protected buscarDisponible(): void {
    const mapa = this.mapa();
    if (!mapa) return;

    const localidad = this.localidadBuscada();
    const libres = mapa.plano.sillas.filter((s) => s.localidadId === localidad && s.estado === 'DISPONIBLE');
    if (libres.length === 0) {
      this.avisoBusqueda.set('No quedan sillas disponibles en esa localidad.');
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
    this.irArriba();
  }

  protected irAPaso(paso: 'silla' | 'datos'): void {
    this.compra.irA(paso);
    this.irArriba();
  }

  protected nuevaCompra(): void {
    this.compra.reiniciar();
    this.seleccion.set(null);
    this.vista.set(null);
    this.irArriba();
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

  /** Si había una silla elegida (por ejemplo, antes de cambiar de versión), se vuelve a mostrar. */
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

  private irArriba(): void {
    document.getElementById('compra')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
