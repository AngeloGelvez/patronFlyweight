import { ChangeDetectionStrategy, Component } from '@angular/core';
import { OPACIDAD_POR_ESTADO } from '../../../core/render/icono-silla';

/**
 * Leyenda del estado de los asientos (opacidad). Los colores de las
 * localidades se explican en las tarjetas de localidad, sobre el mapa.
 */
@Component({
  selector: 'app-leyenda-mapa',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ul aria-label="Estados del asiento" class="flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-700">
      @for (estado of estados; track estado.nombre) {
        <li class="flex items-center gap-1.5">
          <span aria-hidden="true" class="size-3 rounded-sm bg-slate-700" [style.opacity]="estado.opacidad"></span>
          {{ estado.nombre }}
        </li>
      }
    </ul>
  `,
})
export class LeyendaMapaComponent {
  protected readonly estados = [
    { nombre: 'Disponible', opacidad: OPACIDAD_POR_ESTADO.DISPONIBLE },
    { nombre: 'Reservado', opacidad: OPACIDAD_POR_ESTADO.RESERVADA },
    { nombre: 'Vendido', opacidad: OPACIDAD_POR_ESTADO.VENDIDA },
  ];
}
