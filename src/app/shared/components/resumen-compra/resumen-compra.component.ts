import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { EVENTO } from '../../../core/data/evento.db';
import { ZONAS } from '../../../core/data/zonas.db';
import { Lienzo } from '../../../core/render/icono-silla';
import { CompraService } from '../../../core/services/compra.service';
import { nombreLocalidadYZona } from '../../etiquetas';
import { VistaPreviaComponent } from '../vista-previa/vista-previa.component';

/** Resumen lateral de la compra en los pasos de datos y pago. */
@Component({
  selector: 'app-resumen-compra',
  imports: [CurrencyPipe, DatePipe, VistaPreviaComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <aside aria-labelledby="titulo-resumen" class="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <h2 id="titulo-resumen" class="text-base font-semibold text-slate-900">Resumen de tu compra</h2>
      <p class="mt-1 text-sm text-slate-600">
        {{ evento.nombre }} · {{ evento.fecha | date: "EEE d 'de' MMM, h:mm a" }}
      </p>

      @if (compra.silla(); as s) {
        @if (vista(); as v) {
          <app-vista-previa class="mt-4" [vista]="v" [zona]="zona()" [conPie]="false" />
        }

        <div class="mt-4 flex items-center gap-2">
          <span aria-hidden="true" class="size-3 rounded" [style.background-color]="s.localidad.color"></span>
          <p class="font-semibold text-slate-900">{{ ubicacion() }}</p>
        </div>
        <p class="mt-1 font-mono text-sm text-slate-700">
          Sección {{ s.seccion }} · Fila {{ s.fila }} · Silla {{ s.numero }}
        </p>

        <dl class="mt-4 space-y-1.5 border-t border-slate-200 pt-4 text-sm">
          <div class="flex justify-between">
            <dt class="text-slate-600">Boleta</dt>
            <dd class="tabular-nums text-slate-900">{{ compra.precio() | currency: 'COP' : 'symbol-narrow' : '1.0-0' }}</dd>
          </div>
          <div class="flex justify-between">
            <dt class="text-slate-600">Cargo por servicio (10 %)</dt>
            <dd class="tabular-nums text-slate-900">{{ compra.cargoServicio() | currency: 'COP' : 'symbol-narrow' : '1.0-0' }}</dd>
          </div>
          <div class="flex justify-between border-t border-slate-200 pt-2 text-base font-semibold">
            <dt>Total</dt>
            <dd class="tabular-nums">{{ compra.total() | currency: 'COP' : 'symbol-narrow' : '1.0-0' }}</dd>
          </div>
        </dl>
      }
    </aside>
  `,
})
export class ResumenCompraComponent {
  readonly vista = input<Lienzo | null>(null);

  protected readonly compra = inject(CompraService);
  protected readonly evento = EVENTO;
  protected readonly zona = computed(() => {
    const silla = this.compra.silla();
    return silla ? ZONAS[silla.zona].nombre : '';
  });
  protected readonly ubicacion = computed(() =>
    nombreLocalidadYZona(this.compra.silla()?.localidad.nombre ?? '', this.zona()),
  );
}
