import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { CompraService, MetodoPago } from '../../../core/services/compra.service';

const METODOS: readonly { readonly id: MetodoPago; readonly nombre: string; readonly detalle: string }[] = [
  { id: 'TARJETA', nombre: 'Tarjeta de crédito o débito', detalle: 'Visa, Mastercard, American Express' },
  { id: 'BIZUM', nombre: 'Bizum', detalle: 'Pago inmediato desde tu móvil' },
  { id: 'PAYPAL', nombre: 'PayPal', detalle: 'Paga con tu cuenta de PayPal' },
];

/** Tiempo que se muestra el mensaje "Procesando pago…". */
const DURACION_PAGO_SIMULADO_MS = 1_200;

/** Paso 3: pago simulado. No se piden ni se envían datos de pago. */
@Component({
  selector: 'app-paso-pago',
  imports: [CurrencyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section aria-labelledby="titulo-pago" class="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
      <h2 id="titulo-pago" class="text-lg font-semibold text-slate-900">Pago</h2>

      <p class="mt-3 flex gap-2 rounded-lg bg-sky-50 p-3 text-sm text-sky-900 ring-1 ring-sky-200">
        <span aria-hidden="true">ℹ</span>
        <span>
          Este es un sitio de demostración: el pago es simulado. No se piden datos bancarios ni se
          realiza ningún cobro.
        </span>
      </p>

      <fieldset class="mt-5" [disabled]="procesando()">
        <legend class="text-sm font-medium text-slate-800">Medio de pago</legend>
        <div class="mt-2 space-y-2">
          @for (metodo of metodos; track metodo.id) {
            <label
              class="flex cursor-pointer items-center gap-3 rounded-xl p-4 ring-1 transition has-checked:bg-emerald-50 has-checked:ring-2 has-checked:ring-marca"
              [class.ring-slate-200]="seleccionado() !== metodo.id"
            >
              <input
                type="radio"
                name="metodo-pago"
                class="size-4 accent-marca"
                [value]="metodo.id"
                [checked]="seleccionado() === metodo.id"
                (change)="seleccionado.set(metodo.id)"
              />
              <span>
                <span class="block text-sm font-semibold text-slate-900">{{ metodo.nombre }}</span>
                <span class="block text-sm text-slate-600">{{ metodo.detalle }}</span>
              </span>
            </label>
          }
        </div>
      </fieldset>

      <div class="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <button
          type="button"
          class="rounded-xl px-5 py-3 text-sm font-medium text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca disabled:opacity-50"
          [disabled]="procesando()"
          (click)="volver.emit()"
        >
          ← Volver a tus datos
        </button>
        <button
          type="button"
          class="rounded-xl bg-marca px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-marca-oscuro focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca disabled:cursor-wait disabled:opacity-70"
          [disabled]="procesando()"
          (click)="pagar()"
        >
          @if (procesando()) {
            Procesando pago…
          } @else {
            Pagar {{ compra.total() | currency: 'EUR' : 'symbol' : '1.2-2' }}
          }
        </button>
      </div>
      <p class="sr-only" role="status">{{ procesando() ? 'Procesando pago' : '' }}</p>
    </section>
  `,
})
export class PasoPagoComponent {
  readonly volver = output<void>();

  protected readonly compra = inject(CompraService);
  protected readonly metodos = METODOS;
  protected readonly seleccionado = signal<MetodoPago>(this.compra.metodoPago() ?? 'TARJETA');
  protected readonly procesando = signal(false);

  protected pagar(): void {
    this.procesando.set(true);
    setTimeout(() => this.compra.pagar(this.seleccionado()), DURACION_PAGO_SIMULADO_MS);
  }
}
