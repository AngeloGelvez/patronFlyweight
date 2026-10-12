import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { crearAleatorio } from '../../../core/data/seeded-random';

const MODULOS = 25;
const TAMANO_GUIA = 7;

interface Modulo {
  readonly x: number;
  readonly y: number;
}

/**
 * Dibujo con aspecto de código QR, generado a partir del código de la boleta.
 * Es solo ilustrativo: no se puede escanear.
 */
@Component({
  selector: 'app-codigo-acceso',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg
      [attr.viewBox]="'-2 -2 ' + (modulos + 4) + ' ' + (modulos + 4)"
      class="block size-full"
      role="img"
      [attr.aria-label]="'Código de ingreso ' + codigo() + ' (ilustrativo)'"
      shape-rendering="crispEdges"
    >
      <rect x="-2" y="-2" [attr.width]="modulos + 4" [attr.height]="modulos + 4" fill="#ffffff" />
      @for (m of celdas(); track $index) {
        <rect [attr.x]="m.x" [attr.y]="m.y" width="1" height="1" fill="#0f172a" />
      }
      @for (g of guias; track $index) {
        <rect [attr.x]="g.x" [attr.y]="g.y" width="7" height="7" fill="#0f172a" />
        <rect [attr.x]="g.x + 1" [attr.y]="g.y + 1" width="5" height="5" fill="#ffffff" />
        <rect [attr.x]="g.x + 2" [attr.y]="g.y + 2" width="3" height="3" fill="#0f172a" />
      }
    </svg>
  `,
})
export class CodigoAccesoComponent {
  readonly codigo = input.required<string>();

  protected readonly modulos = MODULOS;
  protected readonly guias: readonly Modulo[] = [
    { x: 0, y: 0 },
    { x: MODULOS - TAMANO_GUIA, y: 0 },
    { x: 0, y: MODULOS - TAMANO_GUIA },
  ];

  protected readonly celdas = computed<Modulo[]>(() => {
    let semilla = 0;
    for (const caracter of this.codigo()) semilla = (semilla * 31 + caracter.charCodeAt(0)) >>> 0;
    const aleatorio = crearAleatorio(semilla);

    const celdas: Modulo[] = [];
    for (let y = 0; y < MODULOS; y++) {
      for (let x = 0; x < MODULOS; x++) {
        if (!this.enGuia(x, y) && aleatorio() < 0.48) celdas.push({ x, y });
      }
    }
    return celdas;
  });

  /** Las esquinas con los cuadros guía (más un margen) quedan libres. */
  private enGuia(x: number, y: number): boolean {
    const limite = TAMANO_GUIA + 1;
    const cerca = (v: number) => v < limite;
    const lejos = (v: number) => v >= MODULOS - limite;
    return (cerca(x) && cerca(y)) || (lejos(x) && cerca(y)) || (cerca(x) && lejos(y));
  }
}
