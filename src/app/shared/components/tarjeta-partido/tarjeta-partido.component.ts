import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { EVENTO } from '../../../core/data/evento.db';
import { EscudoEquipoComponent } from '../escudo-equipo/escudo-equipo.component';

/** Franja con el partido para el que se compran las entradas. */
@Component({
  selector: 'app-tarjeta-partido',
  imports: [DatePipe, EscudoEquipoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-wrap items-center gap-4 rounded-2xl bg-slate-900 px-5 py-4 text-white">
      <div class="flex items-center gap-3">
        <app-escudo-equipo [equipo]="evento.local" class="size-12" />
        <span class="text-sm font-semibold text-slate-300">vs</span>
        <app-escudo-equipo [equipo]="evento.visitante" class="size-12" />
      </div>
      <div>
        <p class="text-lg font-bold leading-tight">{{ evento.local.nombre }} – {{ evento.visitante.nombre }}</p>
        <p class="text-sm text-slate-300">
          {{ evento.jornada }} · {{ evento.fecha | date: "d 'de' MMMM, HH:mm" : evento.zonaHoraria : 'es' }} ·
          {{ evento.estadio }}
        </p>
      </div>
    </div>
  `,
})
export class TarjetaPartidoComponent {
  protected readonly evento = EVENTO;
}
