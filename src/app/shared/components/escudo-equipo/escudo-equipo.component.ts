import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { EquipoRegistro } from '../../../core/data/evento.db';

/**
 * Escudo de un equipo, cargado desde su URL pública. Si la imagen no carga
 * (sin conexión o URL caída), muestra la abreviatura del equipo.
 */
@Component({
  selector: 'app-escudo-equipo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'inline-flex shrink-0' },
  template: `
    @if (!fallo()) {
      <img
        [src]="equipo().escudo"
        [alt]="'Escudo de ' + equipo().nombre"
        referrerpolicy="no-referrer"
        class="size-full object-contain drop-shadow-[0_2px_6px_rgba(0,0,0,0.45)]"
        (error)="fallo.set(true)"
      />
    } @else {
      <span
        class="grid size-full place-items-center rounded-full bg-white/90 text-sm font-bold text-slate-900"
        [attr.aria-label]="equipo().nombre"
      >
        {{ equipo().abreviatura }}
      </span>
    }
  `,
})
export class EscudoEquipoComponent {
  readonly equipo = input.required<EquipoRegistro>();
  protected readonly fallo = signal(false);
}
