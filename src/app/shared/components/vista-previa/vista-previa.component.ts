import { ChangeDetectionStrategy, Component, effect, ElementRef, input, viewChild } from '@angular/core';
import { Lienzo } from '../../../core/render/icono-silla';

/** Muestra la vista del campo desde la zona del asiento seleccionado. */
@Component({
  selector: 'app-vista-previa',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <figure class="overflow-hidden rounded-xl bg-slate-100 ring-1 ring-slate-200">
      <canvas
        #lienzo
        width="800"
        height="450"
        class="block aspect-video h-auto w-full"
        role="img"
        [attr.aria-label]="'Vista aproximada del campo desde ' + zona()"
      ></canvas>
      @if (conPie()) {
        <figcaption class="flex items-center justify-between gap-2 px-3 py-2 text-xs text-slate-600">
          <span>Vista desde <strong class="text-slate-900">{{ zona() }}</strong></span>
          <span>Imagen aproximada, igual para toda la zona</span>
        </figcaption>
      }
    </figure>
  `,
})
export class VistaPreviaComponent {
  readonly vista = input.required<Lienzo>();
  readonly zona = input.required<string>();
  readonly conPie = input(true);

  // El tamaño del canvas va fijo en la plantilla (800 × 450, igual que
  // ANCHO_VISTA y ALTO_VISTA): si se enlazara con [width], Angular lo
  // aplicaría después del primer dibujo y borraría la imagen.
  private readonly lienzo = viewChild.required<ElementRef<HTMLCanvasElement>>('lienzo');

  constructor() {
    effect(() => {
      const ctx = this.lienzo().nativeElement.getContext('2d');
      ctx?.drawImage(this.vista(), 0, 0);
    });
  }
}
