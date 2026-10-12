import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CompraService, TipoDocumento } from '../../../core/services/compra.service';

const TIPOS_DOCUMENTO: readonly { readonly id: TipoDocumento; readonly nombre: string }[] = [
  { id: 'CC', nombre: 'Cédula de ciudadanía' },
  { id: 'CE', nombre: 'Cédula de extranjería' },
  { id: 'TI', nombre: 'Tarjeta de identidad' },
  { id: 'PA', nombre: 'Pasaporte' },
];

type CampoDatos = 'nombre' | 'tipoDocumento' | 'documento' | 'correo' | 'celular' | 'acepto';

/** Campos validados, en el orden del formulario (su id coincide con el nombre). */
const CAMPOS_EN_ORDEN: readonly CampoDatos[] = ['nombre', 'documento', 'correo', 'celular', 'acepto'];

/** Paso 2: datos de la persona que va a usar la boleta. */
@Component({
  selector: 'app-paso-datos',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section aria-labelledby="titulo-datos" class="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
      <h2 id="titulo-datos" class="text-lg font-semibold text-slate-900">Datos del asistente</h2>
      <p class="mt-1 text-sm text-slate-600">
        La boleta es personal: la persona que ingresa debe presentar este documento en la puerta.
      </p>

      <form class="mt-5 grid gap-4 sm:grid-cols-2" [formGroup]="formulario" (ngSubmit)="enviar()" novalidate>
        <div class="sm:col-span-2">
          <label for="nombre" class="text-sm font-medium text-slate-800">Nombre completo</label>
          <input
            id="nombre"
            type="text"
            autocomplete="name"
            formControlName="nombre"
            [attr.aria-invalid]="invalido('nombre')"
            aria-describedby="error-nombre"
            [class]="claseCampo('nombre')"
          />
          @if (invalido('nombre')) {
            <p id="error-nombre" class="mt-1 text-sm text-red-700">Escribe tu nombre y apellido.</p>
          }
        </div>

        <div>
          <label for="tipo-documento" class="text-sm font-medium text-slate-800">Tipo de documento</label>
          <select id="tipo-documento" formControlName="tipoDocumento" [class]="claseCampo('tipoDocumento')">
            @for (tipo of tiposDocumento; track tipo.id) {
              <option [value]="tipo.id">{{ tipo.nombre }}</option>
            }
          </select>
        </div>

        <div>
          <label for="documento" class="text-sm font-medium text-slate-800">Número de documento</label>
          <input
            id="documento"
            type="text"
            inputmode="numeric"
            formControlName="documento"
            [attr.aria-invalid]="invalido('documento')"
            aria-describedby="error-documento"
            [class]="claseCampo('documento')"
          />
          @if (invalido('documento')) {
            <p id="error-documento" class="mt-1 text-sm text-red-700">
              Usa entre 5 y 12 caracteres, sin puntos ni espacios.
            </p>
          }
        </div>

        <div>
          <label for="correo" class="text-sm font-medium text-slate-800">Correo electrónico</label>
          <input
            id="correo"
            type="email"
            autocomplete="email"
            formControlName="correo"
            [attr.aria-invalid]="invalido('correo')"
            aria-describedby="ayuda-correo error-correo"
            [class]="claseCampo('correo')"
          />
          <p id="ayuda-correo" class="mt-1 text-xs text-slate-500">Allí enviaríamos la boleta.</p>
          @if (invalido('correo')) {
            <p id="error-correo" class="mt-1 text-sm text-red-700">Escribe un correo válido, por ejemplo nombre&#64;correo.com.</p>
          }
        </div>

        <div>
          <label for="celular" class="text-sm font-medium text-slate-800">Celular</label>
          <input
            id="celular"
            type="tel"
            autocomplete="tel-national"
            inputmode="numeric"
            formControlName="celular"
            [attr.aria-invalid]="invalido('celular')"
            aria-describedby="error-celular"
            [class]="claseCampo('celular')"
          />
          @if (invalido('celular')) {
            <p id="error-celular" class="mt-1 text-sm text-red-700">Escribe un celular de 10 dígitos que empiece por 3.</p>
          }
        </div>

        <div class="sm:col-span-2">
          <label class="flex items-start gap-2 text-sm text-slate-700">
            <input
              id="acepto"
              type="checkbox"
              formControlName="acepto"
              class="mt-0.5 size-4 rounded border-slate-300 accent-marca"
              [attr.aria-invalid]="invalido('acepto')"
              aria-describedby="error-acepto"
            />
            Acepto los términos y condiciones de la localidad y el tratamiento de mis datos para esta compra.
          </label>
          @if (invalido('acepto')) {
            <p id="error-acepto" class="mt-1 text-sm text-red-700">Debes aceptar los términos para continuar.</p>
          }
        </div>

        <div class="flex flex-col-reverse gap-3 sm:col-span-2 sm:flex-row sm:justify-between">
          <button
            type="button"
            class="rounded-xl px-5 py-3 text-sm font-medium text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca"
            (click)="volver.emit()"
          >
            ← Cambiar silla
          </button>
          <button
            type="submit"
            class="rounded-xl bg-marca px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-marca-oscuro focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca"
          >
            Continuar al pago
          </button>
        </div>
      </form>
    </section>
  `,
})
export class PasoDatosComponent {
  readonly volver = output<void>();

  private readonly compra = inject(CompraService);
  private readonly enviado = signal(false);

  protected readonly tiposDocumento = TIPOS_DOCUMENTO;

  protected readonly formulario = inject(FormBuilder).nonNullable.group({
    nombre: [this.compra.asistente()?.nombre ?? '', [Validators.required, Validators.pattern(/^\S+(\s+\S+)+$/)]],
    tipoDocumento: [this.compra.asistente()?.tipoDocumento ?? ('CC' as TipoDocumento)],
    documento: [this.compra.asistente()?.documento ?? '', [Validators.required, Validators.pattern(/^[A-Za-z0-9]{5,12}$/)]],
    correo: [this.compra.asistente()?.correo ?? '', [Validators.required, Validators.email]],
    celular: [this.compra.asistente()?.celular ?? '', [Validators.required, Validators.pattern(/^3\d{9}$/)]],
    acepto: [this.compra.asistente() !== null, Validators.requiredTrue],
  });

  protected invalido(campo: CampoDatos): boolean {
    const control = this.formulario.controls[campo];
    return control.invalid && (control.touched || this.enviado());
  }

  protected claseCampo(campo: CampoDatos): string {
    const base =
      'mt-1 block w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm focus:outline-2 focus:outline-offset-1 focus:outline-marca';
    return `${base} ${this.invalido(campo) ? 'border-red-500' : 'border-slate-300'}`;
  }

  protected enviar(): void {
    this.enviado.set(true);
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      const primero = CAMPOS_EN_ORDEN.find((campo) => this.formulario.controls[campo].invalid);
      if (primero) document.getElementById(primero)?.focus();
      return;
    }

    const { acepto: _acepto, ...datos } = this.formulario.getRawValue();
    this.compra.guardarDatos({ ...datos, nombre: datos.nombre.trim() });
  }
}
