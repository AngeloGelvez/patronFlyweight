import { DatePipe, DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { CANTIDADES_DISPONIBLES, EstadioGenerado } from '../../../core/data/estadio.generator';
import { EVENTO } from '../../../core/data/evento.db';
import { DetalleSilla, MapaDeSillas } from '../../../core/models/mapa-de-sillas';
import { NOMBRE_VERSION, VersionMapa } from '../../../core/models/resultado-ejecucion';
import { BenchmarkService } from '../../../core/services/benchmark.service';
import { ResultadosService } from '../../../core/services/resultados.service';
import { DuracionPipe, MegabytesPipe } from '../../pipes/formato.pipes';
import { DetalleSillaComponent } from '../detalle-silla/detalle-silla.component';
import { LeyendaMapaComponent } from '../leyenda-mapa/leyenda-mapa.component';
import { MapaEstadioComponent, PuntoPlano } from '../mapa-estadio/mapa-estadio.component';
import { TarjetaMetricaComponent } from '../tarjeta-metrica/tarjeta-metrica.component';

/** Duración aproximada de la versión sin Flyweight, medida en Chrome. */
const ADVERTENCIAS_SIN_FLYWEIGHT: Record<number, string> = {
  50_000: 'Con 50.000 sillas, la versión sin Flyweight puede congelar la pestaña unos 10 a 15 segundos.',
  100_000:
    'Con 100.000 sillas, la versión sin Flyweight puede congelar la pestaña entre 40 segundos y 1 minuto, y usar cientos de MB de memoria. Es justo el problema que resuelve el patrón.',
};

/**
 * Página de pruebas del mapa: elige la cantidad, ejecuta la versión medida,
 * dibuja el estadio y muestra las métricas. Es igual para las dos versiones;
 * cada página le pasa su propia función `crearMapa`.
 */
@Component({
  selector: 'app-laboratorio-mapa',
  imports: [
    DatePipe,
    DecimalPipe,
    DetalleSillaComponent,
    LeyendaMapaComponent,
    MapaEstadioComponent,
    TarjetaMetricaComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6">
      <!-- Controles -->
      <section
        aria-label="Configuración de la ejecución"
        class="rounded-2xl bg-slate-900 p-5 ring-1 ring-white/10 sm:p-6"
      >
        <div class="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <fieldset [disabled]="ejecutando()">
            <legend class="text-sm font-medium text-slate-200">Cantidad de sillas</legend>
            <div class="mt-2 flex flex-wrap gap-2">
              @for (opcion of cantidades; track opcion) {
                <label
                  class="cursor-pointer rounded-lg px-4 py-2 text-sm font-medium tabular-nums ring-1 transition has-checked:bg-white has-checked:text-slate-950 has-checked:ring-white has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-despues has-disabled:cursor-not-allowed has-disabled:opacity-60"
                  [class]="cantidad() === opcion ? '' : 'text-slate-200 ring-white/15 hover:bg-white/5'"
                >
                  <input
                    type="radio"
                    name="cantidad-{{ version() }}"
                    class="sr-only"
                    [value]="opcion"
                    [checked]="cantidad() === opcion"
                    (change)="cantidad.set(opcion)"
                  />
                  {{ opcion | number }}
                </label>
              }
            </div>
          </fieldset>

          <div class="flex flex-wrap items-center gap-3">
            <button
              type="button"
              class="rounded-lg px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-wait disabled:opacity-70"
              [class]="version() === 'antes' ? 'bg-antes' : 'bg-despues'"
              [disabled]="ejecutando()"
              (click)="ejecutar()"
            >
              @if (ejecutando()) {
                Ejecutando…
              } @else {
                Ejecutar {{ nombreVersion().toLowerCase() }}
              }
            </button>
            <button
              type="button"
              class="rounded-lg px-4 py-2.5 text-sm text-slate-300 ring-1 ring-white/15 hover:bg-white/5 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-despues disabled:opacity-50"
              [disabled]="!mapa() || ejecutando()"
              (click)="seleccionarAlAzar()"
            >
              Ver una silla al azar
            </button>
          </div>
        </div>

        @if (advertencia(); as texto) {
          <p class="mt-4 flex gap-2 rounded-lg bg-amber-500/10 p-3 text-sm text-amber-200 ring-1 ring-amber-500/30">
            <span aria-hidden="true">⚠</span>
            <span><strong>Aviso:</strong> {{ texto }}</span>
          </p>
        }

        <p class="mt-4 text-xs text-slate-400">
          Para una medición limpia,
          <button type="button" class="text-slate-200 underline underline-offset-2 hover:text-white" (click)="recargar()">
            recarga la pestaña</button>
          antes de cada ejecución: así la memoria de pruebas anteriores no afecta los tiempos. Los
          resultados se conservan. Los tiempos detallados también aparecen en la consola (F12).
        </p>

        <p class="sr-only" role="status" aria-live="polite">{{ mensajeEstado() }}</p>

        @if (error(); as mensaje) {
          <p role="alert" class="mt-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-200 ring-1 ring-red-500/30">
            No se pudo completar la ejecución: {{ mensaje }}
          </p>
        }
      </section>

      <!-- Mapa y detalle -->
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section aria-labelledby="titulo-mapa" class="space-y-3">
          <div class="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="titulo-mapa" class="text-lg font-semibold text-white">{{ evento.estadio }}</h2>
            <p class="text-sm text-slate-400">
              {{ evento.nombre }} · {{ evento.fecha | date: "d 'de' MMMM, h:mm a" }}
            </p>
          </div>

          <app-mapa-estadio
            [descripcion]="descripcionMapa()"
            [resaltado]="puntoSeleccionado()"
            (clicEnPlano)="seleccionarEn($event)"
          >
            @if (ejecutando()) {
              <div class="absolute inset-0 grid place-items-center bg-slate-950/70">
                <div class="flex items-center gap-3 rounded-xl bg-slate-900 px-5 py-4 text-sm text-slate-200 ring-1 ring-white/15">
                  <span aria-hidden="true" class="size-5 animate-spin rounded-full motion-reduce:animate-none border-2 border-white/20 border-t-white"></span>
                  Creando y dibujando {{ cantidad() | number }} sillas…
                  <span class="text-slate-400">la página puede dejar de responder</span>
                </div>
              </div>
            } @else if (!mapa()) {
              <div class="pointer-events-none absolute inset-0 grid place-items-center">
                <p class="rounded-lg bg-slate-950/80 px-4 py-2 text-sm text-slate-300">
                  Elige la cantidad y pulsa «Ejecutar» para dibujar las sillas
                </p>
              </div>
            }
          </app-mapa-estadio>

          <app-leyenda-mapa />
        </section>

        <app-detalle-silla [silla]="seleccionada()" [version]="version()" />
      </div>

      <!-- Métricas -->
      <section aria-labelledby="titulo-metricas" class="space-y-3">
        <div class="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="titulo-metricas" class="text-lg font-semibold text-white">Métricas · {{ nombreVersion() }}</h2>
          @if (resultado(); as r) {
            <p class="text-sm text-slate-400">
              {{ r.cantidad | number }} sillas ·
              @if (mapa()) {
                ejecución actual
              } @else {
                última ejecución guardada ({{ r.fecha | date: 'shortTime' }})
              }
            </p>
          }
        </div>

        @if (metricas(); as m) {
          <div class="grid grid-cols-2 gap-3 md:grid-cols-4">
            <app-tarjeta-metrica etiqueta="Crear objetos" [valor]="m.creacion" detalle="Aquí actúa el patrón" [destacada]="true" />
            <app-tarjeta-metrica etiqueta="Dibujar mapa" [valor]="m.render" />
            <app-tarjeta-metrica etiqueta="Tiempo total" [valor]="m.total" [detalle]="'Incluye cargar datos: ' + m.carga" />
            <app-tarjeta-metrica etiqueta="Memoria estimada" [valor]="m.memoria" detalle="Datos + píxeles de iconos" [destacada]="true" />
            <app-tarjeta-metrica etiqueta="Copias de localidad" [valor]="m.copias" detalle="Objetos con precio, beneficios y términos" [destacada]="true" />
            <app-tarjeta-metrica etiqueta="Iconos renderizados" [valor]="m.iconos" detalle="Lienzos de 24 × 24 px" />
            <app-tarjeta-metrica etiqueta="Sillas" [valor]="m.sillas" />
            <app-tarjeta-metrica etiqueta="Heap JS (Chrome)" [valor]="m.heap" detalle="Total de la pestaña; ver nota" />
          </div>
          <p class="text-xs text-slate-400">
            <strong class="text-slate-300">Nota sobre la memoria:</strong> JavaScript no permite medir
            cuánto ocupa un objeto, así que la memoria estimada se calcula a partir de los datos que
            guarda cada versión con la misma regla. El heap de Chrome (<code>performance.memory</code>)
            es el total usado por la pestaña, incluida la propia app: no cuenta los píxeles de los
            iconos, se actualiza con retraso y redondea mucho. Sirve como referencia, no para
            comparar al detalle.
          </p>
        } @else {
          <p class="rounded-xl border border-dashed border-white/15 p-5 text-sm text-slate-400">
            Aún no has ejecutado esta versión. Los tiempos aparecerán aquí y en la consola del navegador.
          </p>
        }
      </section>
    </div>
  `,
})
export class LaboratorioMapaComponent {
  readonly version = input.required<VersionMapa>();
  /** Construye el mapa: la única diferencia entre las dos versiones. */
  readonly crearMapa = input.required<(plano: EstadioGenerado) => MapaDeSillas>();

  private readonly benchmark = inject(BenchmarkService);
  private readonly resultados = inject(ResultadosService);
  private readonly mapaEstadio = viewChild.required(MapaEstadioComponent);

  protected readonly evento = EVENTO;
  protected readonly cantidades = CANTIDADES_DISPONIBLES;

  protected readonly cantidad = signal<number>(CANTIDADES_DISPONIBLES[0]);
  protected readonly ejecutando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly mapa = signal<MapaDeSillas | null>(null);
  protected readonly seleccionada = signal<DetalleSilla | null>(null);

  protected readonly nombreVersion = computed(() => NOMBRE_VERSION[this.version()]);

  protected readonly resultado = computed(() =>
    this.version() === 'antes' ? this.resultados.antes() : this.resultados.despues(),
  );

  protected readonly advertencia = computed(() =>
    this.version() === 'antes' ? (ADVERTENCIAS_SIN_FLYWEIGHT[this.cantidad()] ?? null) : null,
  );

  protected readonly puntoSeleccionado = computed<PuntoPlano | null>(() => {
    const silla = this.seleccionada();
    return silla ? { x: silla.x, y: silla.y } : null;
  });

  protected readonly metricas = computed(() => {
    const r = this.resultado();
    if (!r) return null;

    const duracion = new DuracionPipe();
    const megabytes = new MegabytesPipe();
    const entero = (n: number) => n.toLocaleString('es-CO');

    return {
      carga: duracion.transform(r.cargaDatosMs),
      creacion: duracion.transform(r.creacionMs),
      render: duracion.transform(r.renderMs),
      total: duracion.transform(r.totalMs),
      memoria: megabytes.transform(r.memoriaEstimadaBytes),
      copias: entero(r.copiasDeLocalidad),
      iconos: entero(r.iconos),
      sillas: entero(r.cantidad),
      heap: r.heapUsadoBytes === null ? 'No disponible' : megabytes.transform(r.heapUsadoBytes),
    };
  });

  protected readonly descripcionMapa = computed(() => {
    const mapa = this.mapa();
    return mapa
      ? `Plano del estadio con ${mapa.plano.sillas.length.toLocaleString('es-CO')} sillas. Haz clic en una silla para ver su detalle o usa el botón «Ver una silla al azar».`
      : 'Plano del estadio vacío.';
  });

  protected readonly mensajeEstado = computed(() => {
    if (this.ejecutando()) return `Ejecutando ${this.nombreVersion().toLowerCase()}…`;
    const r = this.resultado();
    return this.mapa() && r
      ? `Listo: ${r.cantidad.toLocaleString('es-CO')} sillas en ${new DuracionPipe().transform(r.totalMs)}.`
      : '';
  });

  protected async ejecutar(): Promise<void> {
    if (this.ejecutando()) return;

    this.ejecutando.set(true);
    this.error.set(null);
    this.seleccionada.set(null);
    // Suelta el mapa anterior para que el recolector de basura pueda liberarlo.
    this.mapa.set(null);
    this.mapaEstadio().limpiar();

    // La ejecución bloquea el hilo principal; se espera a que el navegador
    // pinte el aviso de "Ejecutando…" antes de empezar.
    await esperarPintado();

    try {
      const { mapa } = this.benchmark.ejecutar({
        version: this.version(),
        cantidad: this.cantidad(),
        crearMapa: this.crearMapa(),
        renderizar: (m) => this.mapaEstadio().renderizar(m),
      });
      this.mapa.set(mapa);
    } catch (e) {
      console.error(e);
      this.error.set(e instanceof Error ? e.message : String(e));
      this.mapaEstadio().limpiar();
    } finally {
      this.ejecutando.set(false);
    }
  }

  protected seleccionarEn(punto: PuntoPlano): void {
    const mapa = this.mapa();
    if (!mapa || this.ejecutando()) return;
    this.seleccionada.set(mapa.buscarSilla(punto.x, punto.y));
  }

  protected seleccionarAlAzar(): void {
    const mapa = this.mapa();
    if (!mapa) return;
    const sillas = mapa.plano.sillas;
    const silla = sillas[Math.floor(Math.random() * sillas.length)];
    this.seleccionada.set(mapa.buscarSilla(silla.x, silla.y));
  }

  protected recargar(): void {
    location.reload();
  }
}

/**
 * Espera a que el navegador pinte el siguiente cuadro. Si la pestaña está en
 * segundo plano, `requestAnimationFrame` no se dispara, así que un temporizador
 * de respaldo evita que la ejecución quede esperando para siempre.
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
