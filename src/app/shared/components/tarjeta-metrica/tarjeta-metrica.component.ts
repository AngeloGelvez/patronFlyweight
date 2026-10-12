import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Tarjeta con una métrica de rendimiento. */
@Component({
  selector: 'app-tarjeta-metrica',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div
      class="h-full rounded-xl p-4 ring-1"
      [class]="destacada() ? 'bg-white/10 ring-white/25' : 'bg-slate-900 ring-white/10'"
    >
      <p class="text-xs font-medium text-slate-400">{{ etiqueta() }}</p>
      <p class="mt-1 text-2xl font-bold tabular-nums text-white">{{ valor() }}</p>
      @if (detalle()) {
        <p class="mt-1 text-xs text-slate-400">{{ detalle() }}</p>
      }
    </div>
  `,
})
export class TarjetaMetricaComponent {
  readonly etiqueta = input.required<string>();
  readonly valor = input.required<string>();
  readonly detalle = input<string>();
  /** Resalta la métrica donde actúa el patrón. */
  readonly destacada = input(false);
}
