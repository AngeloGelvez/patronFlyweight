import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { EstadoSilla, Tribuna } from '../../../core/data/estadio.generator';
import { DetalleSilla } from '../../../core/models/mapa-de-sillas';
import { VersionMapa } from '../../../core/models/resultado-ejecucion';

const NOMBRE_ESTADO: Record<EstadoSilla, string> = {
  DISPONIBLE: 'Disponible',
  RESERVADA: 'Reservada',
  VENDIDA: 'Vendida',
};

const ICONO_ESTADO: Record<EstadoSilla, string> = {
  DISPONIBLE: '●',
  RESERVADA: '◐',
  VENDIDA: '○',
};

const NOMBRE_TRIBUNA: Record<Tribuna, string> = {
  ORIENTAL: 'Oriental',
  SUR: 'Sur',
  OCCIDENTAL: 'Occidental',
  NORTE: 'Norte',
};

/** Panel lateral con la información de la silla seleccionada. */
@Component({
  selector: 'app-detalle-silla',
  imports: [CurrencyPipe, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section
      aria-labelledby="titulo-detalle"
      aria-live="polite"
      class="flex h-full flex-col rounded-xl bg-slate-900 p-5 ring-1 ring-white/10"
    >
      <h2 id="titulo-detalle" class="text-sm font-semibold uppercase tracking-wide text-slate-400">
        Silla seleccionada
      </h2>

      @if (silla(); as s) {
        <div class="mt-4 flex items-start gap-3">
          <span
            aria-hidden="true"
            class="mt-1 size-4 shrink-0 rounded"
            [style.background-color]="s.localidad.color"
          ></span>
          <div>
            <p class="text-xl font-semibold text-white">{{ s.localidad.nombre }}</p>
            <p class="text-2xl font-bold text-white">
              {{ s.localidad.precio | currency: 'COP' : 'symbol-narrow' : '1.0-0' }}
            </p>
          </div>
        </div>

        <dl class="mt-4 grid grid-cols-3 gap-2 text-center">
          <div class="rounded-lg bg-white/5 p-2">
            <dt class="text-xs text-slate-400">Sección</dt>
            <dd class="font-mono font-semibold text-white">{{ s.seccion }}</dd>
          </div>
          <div class="rounded-lg bg-white/5 p-2">
            <dt class="text-xs text-slate-400">Fila</dt>
            <dd class="font-mono font-semibold text-white">{{ s.fila }}</dd>
          </div>
          <div class="rounded-lg bg-white/5 p-2">
            <dt class="text-xs text-slate-400">Silla</dt>
            <dd class="font-mono font-semibold text-white">{{ s.numero }}</dd>
          </div>
        </dl>

        <p class="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-300">
          <span>Tribuna {{ nombreTribuna[s.tribuna] }}</span>
          <span class="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-xs font-medium text-white">
            <span aria-hidden="true">{{ iconoEstado[s.estado] }}</span>
            {{ nombreEstado[s.estado] }}
          </span>
        </p>

        <p class="mt-3 text-sm text-slate-300">{{ s.localidad.descripcion }}</p>

        <h3 class="mt-4 text-sm font-semibold text-slate-200">Beneficios</h3>
        <ul class="mt-1 list-inside list-disc space-y-0.5 text-sm text-slate-300">
          @for (beneficio of s.localidad.beneficios; track beneficio) {
            <li>{{ beneficio }}</li>
          }
        </ul>

        <details class="group mt-4 rounded-lg bg-white/5 text-sm">
          <summary
            class="cursor-pointer rounded-lg px-3 py-2 font-medium text-slate-200 hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-despues"
          >
            Términos y condiciones
            <span class="text-slate-400">({{ s.localidad.terminosYCondiciones.length | number }} caracteres)</span>
          </summary>
          <p class="max-h-48 overflow-y-auto whitespace-pre-line px-3 pb-3 text-xs leading-relaxed text-slate-400">
            {{ s.localidad.terminosYCondiciones }}
          </p>
        </details>

        <p class="mt-auto border-t border-white/10 pt-4 text-xs text-slate-400">
          @if (version() === 'antes') {
            <strong class="text-slate-200">Copia propia:</strong> esta silla guarda su propia copia de
            la localidad y su propio icono, aunque son idénticos a los de las demás sillas
            {{ s.localidad.nombre }}.
          } @else {
            <strong class="text-slate-200">Dato compartido:</strong> la localidad y el icono vienen
            de la única instancia <code class="text-despues">Localidad("{{ s.localidad.id }}")</code>,
            compartida por todas las sillas {{ s.localidad.nombre }}. La silla solo guarda su
            sección, fila, número, posición y estado.
          }
        </p>
      } @else {
        <p class="mt-4 text-sm text-slate-400">
          Ejecuta el mapa y haz clic en cualquier silla para ver su localidad, precio y beneficios.
        </p>
      }
    </section>
  `,
})
export class DetalleSillaComponent {
  readonly silla = input<DetalleSilla | null>(null);
  readonly version = input.required<VersionMapa>();

  protected readonly nombreEstado = NOMBRE_ESTADO;
  protected readonly iconoEstado = ICONO_ESTADO;
  protected readonly nombreTribuna = NOMBRE_TRIBUNA;
}
