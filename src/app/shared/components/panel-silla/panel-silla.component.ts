import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { ZONAS } from '../../../core/data/zonas.db';
import { DetalleSilla } from '../../../core/models/mapa-de-sillas';
import { Lienzo } from '../../../core/render/icono-silla';
import { ICONO_ESTADO, NOMBRE_ESTADO, NOMBRE_TRIBUNA } from '../../etiquetas';
import { VistaPreviaComponent } from '../vista-previa/vista-previa.component';

/** Panel con el asiento seleccionado, su vista previa y el botón para comprarlo. */
@Component({
  selector: 'app-panel-silla',
  imports: [CurrencyPipe, DecimalPipe, VistaPreviaComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section
      aria-labelledby="titulo-panel-silla"
      class="flex h-full flex-col rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"
    >
      <h2 id="titulo-panel-silla" class="text-base font-semibold text-slate-900">Tu asiento</h2>

      @if (silla(); as s) {
        <div aria-live="polite" class="mt-3 flex flex-1 flex-col">
          @if (vista(); as v) {
            <app-vista-previa [vista]="v" [zona]="zona()" />
          }

          <div class="mt-4 flex items-start justify-between gap-3">
            <div class="flex items-center gap-2">
              <span aria-hidden="true" class="size-3.5 shrink-0 rounded" [style.background-color]="s.localidad.color"></span>
              <p class="text-lg font-semibold text-slate-900">{{ s.localidad.nombre }}</p>
            </div>
            <p class="text-xl font-bold text-slate-900">
              {{ s.localidad.precio | currency: 'EUR' : 'symbol' : '1.0-0' }}
            </p>
          </div>

          <dl class="mt-3 grid grid-cols-3 gap-2 text-center">
            <div class="rounded-lg bg-slate-100 p-2">
              <dt class="text-xs text-slate-600">Sección</dt>
              <dd class="font-mono font-semibold text-slate-900">{{ s.seccion }}</dd>
            </div>
            <div class="rounded-lg bg-slate-100 p-2">
              <dt class="text-xs text-slate-600">Fila</dt>
              <dd class="font-mono font-semibold text-slate-900">{{ s.fila }}</dd>
            </div>
            <div class="rounded-lg bg-slate-100 p-2">
              <dt class="text-xs text-slate-600">Asiento</dt>
              <dd class="font-mono font-semibold text-slate-900">{{ s.numero }}</dd>
            </div>
          </dl>

          <p class="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-700">
            <span>{{ nombreTribuna[s.tribuna] }} · {{ puerta() }}</span>
            <span
              class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
              [class]="s.estado === 'DISPONIBLE' ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200' : 'bg-slate-100 text-slate-700 ring-1 ring-slate-200'"
            >
              <span aria-hidden="true">{{ iconoEstado[s.estado] }}</span>
              {{ nombreEstado[s.estado] }}
            </span>
          </p>

          <p class="mt-3 text-sm text-slate-700">{{ s.localidad.descripcion }}</p>

          <h3 class="mt-4 text-sm font-semibold text-slate-900">Incluye</h3>
          <ul class="mt-1 list-inside list-disc space-y-0.5 text-sm text-slate-700">
            @for (beneficio of s.localidad.beneficios; track beneficio) {
              <li>{{ beneficio }}</li>
            }
          </ul>

          <details class="mt-4 rounded-lg bg-slate-50 text-sm ring-1 ring-slate-200">
            <summary class="cursor-pointer rounded-lg px-3 py-2 font-medium text-slate-800 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-marca">
              Condiciones de la entrada
              <span class="font-normal text-slate-500">({{ s.localidad.terminosYCondiciones.length | number }} caracteres)</span>
            </summary>
            <p class="max-h-48 overflow-y-auto whitespace-pre-line px-3 pb-3 text-xs leading-relaxed text-slate-600">
              {{ s.localidad.terminosYCondiciones }}
            </p>
          </details>

          <div class="mt-auto pt-5">
            @if (s.estado === 'DISPONIBLE') {
              <button
                type="button"
                class="w-full rounded-xl bg-marca px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-marca-oscuro focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca"
                (click)="continuar.emit()"
              >
                Continuar con este asiento
              </button>
            } @else {
              <p class="rounded-lg bg-amber-50 p-3 text-sm text-amber-900 ring-1 ring-amber-200">
                Este asiento está {{ nombreEstado[s.estado].toLowerCase() }}. Elige otro en el mapa o una
                localidad para que te asignemos uno libre.
              </p>
            }
          </div>
        </div>
      } @else {
        <div class="mt-3 flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 p-6 text-center">
          <p class="text-sm font-medium text-slate-800">Aún no has elegido asiento</p>
          <p class="mt-1 text-sm text-slate-600">
            Haz clic en un asiento del mapa o elige una localidad. Verás cómo se ve el campo
            desde esa zona antes de comprar.
          </p>
        </div>
      }
    </section>
  `,
})
export class PanelSillaComponent {
  readonly silla = input<DetalleSilla | null>(null);
  readonly vista = input<Lienzo | null>(null);
  readonly continuar = output<void>();

  protected readonly zona = computed(() => {
    const silla = this.silla();
    return silla ? ZONAS[silla.zona].nombre : '';
  });
  protected readonly puerta = computed(() => {
    const silla = this.silla();
    return silla ? ZONAS[silla.zona].puerta : '';
  });

  protected readonly nombreEstado = NOMBRE_ESTADO;
  protected readonly iconoEstado = ICONO_ESTADO;
  protected readonly nombreTribuna = NOMBRE_TRIBUNA;
}
