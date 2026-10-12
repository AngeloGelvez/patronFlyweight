import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { LOCALIDADES } from '../../../core/data/localidades.db';
import { OPACIDAD_POR_ESTADO } from '../../../core/render/icono-silla';

/** Leyenda de colores (localidades) y opacidades (estados) del mapa. */
@Component({
  selector: 'app-leyenda-mapa',
  imports: [CurrencyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-3 text-sm sm:flex-row sm:items-start sm:justify-between">
      <ul aria-label="Localidades" class="flex flex-wrap gap-x-4 gap-y-1.5">
        @for (localidad of localidades; track localidad.id) {
          <li class="flex items-center gap-1.5 text-slate-700">
            <span aria-hidden="true" class="size-3 rounded-sm" [style.background-color]="localidad.color"></span>
            <span class="font-medium text-slate-900">{{ localidad.nombre }}</span>
            <span class="text-slate-600">{{ localidad.precio | currency: 'COP' : 'symbol-narrow' : '1.0-0' }}</span>
          </li>
        }
      </ul>

      <ul aria-label="Estados de la silla" class="flex shrink-0 gap-4 text-slate-700">
        @for (estado of estados; track estado.nombre) {
          <li class="flex items-center gap-1.5">
            <span aria-hidden="true" class="size-3 rounded-sm bg-slate-700" [style.opacity]="estado.opacidad"></span>
            {{ estado.nombre }}
          </li>
        }
      </ul>
    </div>
  `,
})
export class LeyendaMapaComponent {
  protected readonly localidades = LOCALIDADES;
  protected readonly estados = [
    { nombre: 'Disponible', opacidad: OPACIDAD_POR_ESTADO.DISPONIBLE },
    { nombre: 'Reservada', opacidad: OPACIDAD_POR_ESTADO.RESERVADA },
    { nombre: 'Vendida', opacidad: OPACIDAD_POR_ESTADO.VENDIDA },
  ];
}
