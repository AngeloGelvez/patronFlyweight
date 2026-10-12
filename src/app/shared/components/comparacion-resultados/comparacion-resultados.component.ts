import { DecimalPipe, PercentPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import {
  MetricasVistas,
  NOMBRE_VERSION,
  ResultadoEjecucion,
} from '../../../core/models/resultado-ejecucion';
import { ResultadosService } from '../../../core/services/resultados.service';
import { DuracionPipe, MegabytesPipe, VecesPipe } from '../../pipes/formato.pipes';

interface FilaComparacion {
  readonly etiqueta: string;
  readonly antes: number;
  readonly despues: number;
  readonly textoAntes: string;
  readonly textoDespues: string;
  readonly mejora: string;
  /** Si se dibuja también como barras (las métricas de tiempo y memoria). */
  readonly enGrafico: boolean;
}

const duracion = new DuracionPipe();
const megabytes = new MegabytesPipe();
const veces = new VecesPipe();
const enteros = (valor: number) => valor.toLocaleString('es-CO');

/**
 * Compara la última ejecución de cada versión. Lee los resultados del
 * servicio global, así que funciona en las dos rutas.
 */
@Component({
  selector: 'app-comparacion-resultados',
  imports: [DecimalPipe, PercentPipe, VecesPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section aria-labelledby="titulo-comparacion" class="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="titulo-comparacion" class="text-lg font-semibold text-slate-900">
            Comparación: sin Flyweight vs con Flyweight
          </h2>
          <p class="text-sm text-slate-600">Última carga del mapa en cada versión.</p>
        </div>
        @if (antes() || despues()) {
          <button
            type="button"
            class="rounded-lg px-3 py-1.5 text-sm text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca"
            (click)="limpiar()"
          >
            Borrar resultados
          </button>
        }
      </div>

      @if (comparacion(); as c) {
        @if (!c.mismaCantidad) {
          <p role="status" class="mt-4 flex gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-900 ring-1 ring-amber-200">
            <span aria-hidden="true">⚠</span>
            <span>
              Las cargas usaron aforos distintos ({{ antes()!.cantidad | number }} y
              {{ despues()!.cantidad | number }} sillas). Para una comparación justa, usa el mismo
              aforo en las dos versiones.
            </span>
          </p>
        }

        <div class="mt-5 grid gap-3 sm:grid-cols-3">
          <div class="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
            <p class="text-3xl font-bold tabular-nums text-slate-900">{{ c.aceleracionCreacion | veces }}</p>
            <p class="mt-1 text-sm text-slate-700">más rápido creando los objetos</p>
          </div>
          <div class="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
            <p class="text-3xl font-bold tabular-nums text-slate-900">{{ c.reduccionMemoria | percent: '1.0-1' }}</p>
            <p class="mt-1 text-sm text-slate-700">menos memoria estimada del mapa</p>
          </div>
          <div class="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
            <p class="text-3xl font-bold tabular-nums text-slate-900">{{ c.copiasEvitadas | number }}</p>
            <p class="mt-1 text-sm text-slate-700">copias de localidad que no se crearon</p>
          </div>
        </div>

        <div class="mt-6">
          <ul aria-label="Series del gráfico" class="flex gap-4 text-sm text-slate-700">
            <li class="flex items-center gap-1.5">
              <span aria-hidden="true" class="size-3 rounded-sm bg-antes"></span>{{ nombre.antes }}
            </li>
            <li class="flex items-center gap-1.5">
              <span aria-hidden="true" class="size-3 rounded-sm bg-despues"></span>{{ nombre.despues }}
            </li>
          </ul>

          <div class="mt-3 grid gap-5 md:grid-cols-2">
            @for (fila of filasGrafico(); track fila.etiqueta) {
              <figure>
                <figcaption class="text-sm font-medium text-slate-800">{{ fila.etiqueta }}</figcaption>
                <div
                  role="img"
                  class="mt-2 space-y-1.5"
                  [attr.aria-label]="fila.etiqueta + ': ' + nombre.antes + ' ' + fila.textoAntes + ', ' + nombre.despues + ' ' + fila.textoDespues"
                >
                  <div class="flex items-center gap-2" [title]="nombre.antes + ': ' + fila.textoAntes">
                    <span class="w-10 shrink-0 text-xs text-slate-600">Sin</span>
                    <div class="h-3 flex-1">
                      <div class="h-full rounded-r-[4px] bg-antes" [style.width]="ancho(fila.antes, fila)"></div>
                    </div>
                    <span class="w-20 shrink-0 text-right text-xs tabular-nums text-slate-800">{{ fila.textoAntes }}</span>
                  </div>
                  <div class="flex items-center gap-2" [title]="nombre.despues + ': ' + fila.textoDespues">
                    <span class="w-10 shrink-0 text-xs text-slate-600">Con</span>
                    <div class="h-3 flex-1">
                      <div class="h-full rounded-r-[4px] bg-despues" [style.width]="ancho(fila.despues, fila)"></div>
                    </div>
                    <span class="w-20 shrink-0 text-right text-xs tabular-nums text-slate-800">{{ fila.textoDespues }}</span>
                  </div>
                </div>
              </figure>
            }
          </div>
        </div>

        <div class="mt-6 overflow-x-auto">
          <table class="w-full min-w-[34rem] text-left text-sm">
            <caption class="sr-only">Métricas de cada versión y mejora obtenida con Flyweight</caption>
            <thead class="text-xs uppercase tracking-wide text-slate-500">
              <tr class="border-b border-slate-200">
                <th scope="col" class="py-2 pr-4 font-medium">Métrica</th>
                <th scope="col" class="py-2 pr-4 text-right font-medium">{{ nombre.antes }}</th>
                <th scope="col" class="py-2 pr-4 text-right font-medium">{{ nombre.despues }}</th>
                <th scope="col" class="py-2 text-right font-medium">Mejora</th>
              </tr>
            </thead>
            <tbody>
              @for (fila of filas(); track fila.etiqueta) {
                <tr class="border-b border-slate-100 last:border-0">
                  <th scope="row" class="py-2 pr-4 font-normal text-slate-700">{{ fila.etiqueta }}</th>
                  <td class="py-2 pr-4 text-right tabular-nums text-slate-800">{{ fila.textoAntes }}</td>
                  <td class="py-2 pr-4 text-right tabular-nums text-slate-800">{{ fila.textoDespues }}</td>
                  <td class="py-2 text-right font-semibold tabular-nums text-slate-900">{{ fila.mejora }}</td>
                </tr>
              }
            </tbody>
          </table>
          <p class="mt-2 text-xs text-slate-500">
            Las vistas previas dependen de cuántas sillas seleccionaste en cada versión: sin Flyweight
            se dibuja una por silla; con Flyweight, una por zona (máximo 7).
          </p>
        </div>
      } @else {
        <div class="mt-4 rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-700">
          @if (antes(); as a) {
            Ya tienes la carga <strong>sin Flyweight</strong> con {{ a.cantidad | number }} sillas.
            Cambia a <strong>Con Flyweight</strong> en la barra superior para compararlas.
          } @else if (despues()) {
            Ya tienes la carga <strong>con Flyweight</strong> con {{ despues()!.cantidad | number }} sillas.
            Cambia a <strong>Sin Flyweight</strong> en la barra superior para compararlas.
          } @else {
            Todavía no hay resultados. Carga el mapa en las dos versiones con el mismo aforo para
            ver cuánto mejora el rendimiento con el patrón Flyweight.
          }
        </div>
      }
    </section>
  `,
})
export class ComparacionResultadosComponent {
  private readonly resultados = inject(ResultadosService);

  protected readonly nombre = NOMBRE_VERSION;
  protected readonly antes = this.resultados.antes;
  protected readonly despues = this.resultados.despues;
  protected readonly comparacion = this.resultados.comparacion;

  protected readonly filas = computed<FilaComparacion[]>(() => {
    const antes = this.antes();
    const despues = this.despues();
    return antes && despues
      ? construirFilas(antes, despues, this.resultados.vistasAntes(), this.resultados.vistasDespues())
      : [];
  });

  protected readonly filasGrafico = computed(() => this.filas().filter((f) => f.enGrafico));

  /** Ancho de la barra relativo al mayor de los dos valores (mínimo 2 px). */
  protected ancho(valor: number, fila: FilaComparacion): string {
    const maximo = Math.max(fila.antes, fila.despues);
    const porcentaje = maximo > 0 ? (valor / maximo) * 100 : 0;
    return `max(2px, ${porcentaje}%)`;
  }

  protected limpiar(): void {
    this.resultados.limpiar();
  }
}

function construirFilas(
  antes: ResultadoEjecucion,
  despues: ResultadoEjecucion,
  vistasAntes: MetricasVistas | null,
  vistasDespues: MetricasVistas | null,
): FilaComparacion[] {
  const tiempo = (etiqueta: string, a: number, d: number): FilaComparacion => ({
    etiqueta,
    antes: a,
    despues: d,
    textoAntes: duracion.transform(a),
    textoDespues: duracion.transform(d),
    mejora: `${veces.transform(Math.max(a, 0.1) / Math.max(d, 0.1))} más rápido`,
    enGrafico: true,
  });

  const conteo = (etiqueta: string, a: number, d: number): FilaComparacion => ({
    etiqueta,
    antes: a,
    despues: d,
    textoAntes: enteros(a),
    textoDespues: enteros(d),
    mejora: `${enteros(a - d)} menos`,
    enGrafico: false,
  });

  const vistas = (m: MetricasVistas | null) =>
    m ? `${enteros(m.renderizadas)} de ${enteros(m.solicitadas)}` : '—';

  return [
    tiempo('Crear objetos', antes.creacionMs, despues.creacionMs),
    tiempo('Dibujar mapa', antes.renderMs, despues.renderMs),
    tiempo('Tiempo total', antes.totalMs, despues.totalMs),
    {
      etiqueta: 'Memoria estimada del mapa',
      antes: antes.memoriaEstimadaBytes,
      despues: despues.memoriaEstimadaBytes,
      textoAntes: megabytes.transform(antes.memoriaEstimadaBytes),
      textoDespues: megabytes.transform(despues.memoriaEstimadaBytes),
      mejora: `${veces.transform(antes.memoriaEstimadaBytes / Math.max(despues.memoriaEstimadaBytes, 1))} menos`,
      enGrafico: true,
    },
    conteo('Copias de localidad', antes.copiasDeLocalidad, despues.copiasDeLocalidad),
    conteo('Iconos renderizados', antes.iconos, despues.iconos),
    {
      etiqueta: 'Vistas previas dibujadas (de solicitadas)',
      antes: vistasAntes?.renderizadas ?? 0,
      despues: vistasDespues?.renderizadas ?? 0,
      textoAntes: vistas(vistasAntes),
      textoDespues: vistas(vistasDespues),
      mejora: '—',
      enGrafico: false,
    },
  ];
}
