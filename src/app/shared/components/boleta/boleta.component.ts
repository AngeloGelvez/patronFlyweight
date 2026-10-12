import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { EVENTO } from '../../../core/data/evento.db';
import { ZONAS } from '../../../core/data/zonas.db';
import { Lienzo } from '../../../core/render/icono-silla';
import { CompraService } from '../../../core/services/compra.service';
import { CodigoAccesoComponent } from '../codigo-acceso/codigo-acceso.component';
import { nombreLocalidadYZona } from '../../etiquetas';
import { VistaPreviaComponent } from '../vista-previa/vista-previa.component';

/** Las puertas abren tres horas antes del evento (ver términos y condiciones). */
const HORAS_APERTURA_ANTES = 3;

/** Paso 4: boleta electrónica de la compra. */
@Component({
  selector: 'app-boleta',
  imports: [CurrencyPipe, DatePipe, CodigoAccesoComponent, VistaPreviaComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (compra.silla(); as s) {
      <section aria-labelledby="titulo-boleta" class="space-y-6">
        <div class="flex items-start gap-3 rounded-2xl bg-emerald-50 p-5 ring-1 ring-emerald-200">
          <span aria-hidden="true" class="grid size-8 shrink-0 place-items-center rounded-full bg-marca text-white">✓</span>
          <div>
            <h2 id="titulo-boleta" class="text-lg font-semibold text-emerald-950">¡Compra confirmada!</h2>
            <p class="text-sm text-emerald-900">
              Tu boleta está lista. Preséntala en la puerta junto con tu documento.
            </p>
          </div>
        </div>

        <article class="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <div class="grid gap-0 md:grid-cols-[1fr_15rem]">
            <div class="p-5 sm:p-6">
              <p class="text-xs font-semibold uppercase tracking-wide text-marca">{{ evento.estadio }} · {{ evento.ciudad }}</p>
              <h3 class="mt-1 text-xl font-bold text-slate-900">{{ evento.nombre }}</h3>
              <p class="mt-1 text-sm text-slate-700">
                {{ evento.fecha | date: "EEEE d 'de' MMMM 'de' y, h:mm a" }} · Puertas abren a las
                {{ apertura() | date: 'h:mm a' }}
              </p>

              <dl class="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div>
                  <dt class="text-xs text-slate-500">Ingreso</dt>
                  <dd class="font-semibold text-slate-900">{{ zona().puerta }}</dd>
                </div>
                <div>
                  <dt class="text-xs text-slate-500">Sección</dt>
                  <dd class="font-mono font-semibold text-slate-900">{{ s.seccion }}</dd>
                </div>
                <div>
                  <dt class="text-xs text-slate-500">Fila</dt>
                  <dd class="font-mono font-semibold text-slate-900">{{ s.fila }}</dd>
                </div>
                <div>
                  <dt class="text-xs text-slate-500">Silla</dt>
                  <dd class="font-mono font-semibold text-slate-900">{{ s.numero }}</dd>
                </div>
                <div class="col-span-2">
                  <dt class="text-xs text-slate-500">Localidad</dt>
                  <dd class="flex items-center gap-1.5 font-semibold text-slate-900">
                    <span aria-hidden="true" class="size-3 rounded" [style.background-color]="s.localidad.color"></span>
                    {{ ubicacion() }}
                  </dd>
                </div>
                <div class="col-span-2">
                  <dt class="text-xs text-slate-500">Titular</dt>
                  <dd class="font-semibold text-slate-900">
                    {{ compra.asistente()?.nombre }}
                    <span class="font-normal text-slate-600">· {{ compra.asistente()?.tipoDocumento }} {{ documentoOculto() }}</span>
                  </dd>
                </div>
              </dl>

              @if (vista(); as v) {
                <app-vista-previa class="mt-5 max-w-md" [vista]="v" [zona]="zona().nombre" />
              }
            </div>

            <div class="flex flex-col items-center justify-center gap-3 border-t border-dashed border-slate-300 bg-slate-50 p-6 md:border-t-0 md:border-l">
              <div class="size-40 rounded-lg bg-white p-2 ring-1 ring-slate-200">
                <app-codigo-acceso [codigo]="compra.codigo() ?? ''" />
              </div>
              <p class="font-mono text-sm font-semibold tracking-wider text-slate-900">{{ compra.codigo() }}</p>
              <p class="text-center text-xs text-slate-500">Código ilustrativo de la demostración</p>
              <p class="text-sm text-slate-700">
                Pagado: <strong>{{ compra.total() | currency: 'COP' : 'symbol-narrow' : '1.0-0' }}</strong>
              </p>
            </div>
          </div>
        </article>

        <div class="no-imprimir flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            class="rounded-xl px-5 py-3 text-sm font-medium text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca"
            (click)="imprimir()"
          >
            Imprimir boleta
          </button>
          <button
            type="button"
            class="rounded-xl bg-marca px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-marca-oscuro focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca"
            (click)="nuevaCompra.emit()"
          >
            Comprar otra boleta
          </button>
        </div>
      </section>
    }
  `,
})
export class BoletaComponent {
  readonly vista = input<Lienzo | null>(null);
  readonly nuevaCompra = output<void>();

  protected readonly compra = inject(CompraService);
  protected readonly evento = EVENTO;

  protected readonly zona = computed(() => ZONAS[this.compra.silla()?.zona ?? 'GENERAL_NORTE']);
  protected readonly ubicacion = computed(() =>
    nombreLocalidadYZona(this.compra.silla()?.localidad.nombre ?? '', this.zona().nombre),
  );

  protected readonly apertura = computed(() => {
    const fecha = new Date(this.evento.fecha);
    fecha.setHours(fecha.getHours() - HORAS_APERTURA_ANTES);
    return fecha;
  });

  /** Solo se muestran los últimos 4 dígitos del documento. */
  protected readonly documentoOculto = computed(() => {
    const documento = this.compra.asistente()?.documento ?? '';
    return `•••${documento.slice(-4)}`;
  });

  protected imprimir(): void {
    window.print();
  }
}
