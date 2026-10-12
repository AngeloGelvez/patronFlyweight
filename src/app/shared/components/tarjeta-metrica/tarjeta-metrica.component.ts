import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Tarjeta con una métrica de rendimiento. */
@Component({
  selector: 'app-tarjeta-metrica',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div
      class="h-full rounded-xl p-4 ring-1"
      [class]="destacada() ? 'bg-emerald-50 ring-emerald-200' : 'bg-white ring-slate-200'"
    >
      <p class="text-xs font-medium text-slate-600">{{ etiqueta() }}</p>
      <p class="mt-1 text-2xl font-bold tabular-nums text-slate-900">{{ valor() }}</p>
      @if (detalle()) {
        <p class="mt-1 text-xs text-slate-600">{{ detalle() }}</p>
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
