import { ChangeDetectionStrategy, Component } from '@angular/core';
import { EstadioGenerado } from '../core/data/estadio.generator';
import { MapaDeSillas } from '../core/models/mapa-de-sillas';
import { BoleteriaComponent } from '../shared/components/boleteria/boleteria.component';
import { EstadioSinFlyweight } from './estadio-sin-flyweight';

const CODIGO = `class SillaPesada {
  // Datos propios de la silla
  id; zona; seccion; fila; numero; x; y; estado;

  // ❌ Repetidos en cada silla
  localidad;  // precio, beneficios, ~2 KB de términos
  icono;      // lienzo de 24 × 24 px
  vista;      // imagen de 800 × 450 px de la cancha

  obtenerVista() {
    // Cada silla dibuja su propia vista,
    // aunque toda su zona vea la cancha igual.
    this.vista ??= renderizarVistaCancha(this.zona);
    return this.vista;
  }
}`;

@Component({
  selector: 'app-antes-page',
  imports: [BoleteriaComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-boleteria version="antes" [crearMapa]="crearMapa">
      <section aria-labelledby="titulo-problema" class="grid grid-cols-1 gap-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6 lg:grid-cols-2">
        <div>
          <h3 id="titulo-problema" class="text-lg font-semibold text-slate-900">¿Cuál es el problema sin Flyweight?</h3>
          <p class="mt-2 text-sm text-slate-700">
            Los datos de una silla son de dos tipos, pero aquí se guardan juntos en cada objeto:
          </p>
          <ul class="mt-3 space-y-2 text-sm text-slate-700">
            <li>
              <strong class="text-slate-900">Propios de cada silla</strong> (estado extrínseco): sección,
              fila, número, posición y estado. Cambian de una silla a otra.
            </li>
            <li>
              <strong class="text-slate-900">Iguales para muchas sillas</strong> (estado intrínseco):
              precio, beneficios, términos e icono (iguales en toda la localidad) y la vista de la
              cancha (igual en toda la zona). Se repiten miles de veces.
            </li>
          </ul>
          <div class="mt-4 rounded-xl bg-slate-50 p-4 text-sm ring-1 ring-slate-200">
            <p class="font-mono text-slate-700">100.000 sillas × (≈ 4,4 KB de localidad + 2,3 KB de icono)</p>
            <p class="mt-1 font-mono font-semibold text-slate-900">≈ 680 MB solo en datos repetidos</p>
            <p class="mt-2 font-mono text-slate-700">+ 1,4 MB por cada silla que el usuario selecciona</p>
          </div>
          <p class="mt-4 text-sm text-slate-700">
            Prueba a seleccionar varias sillas de la misma zona: cada una vuelve a dibujar la misma
            vista de la cancha. Mira «Vistas previas dibujadas» en el panel.
          </p>
        </div>
        <div>
          <p class="text-xs font-medium uppercase tracking-wide text-slate-500">antes/silla-pesada.ts (resumido)</p>
          <pre class="mt-2 overflow-x-auto rounded-xl bg-slate-900 p-4 text-xs leading-relaxed text-slate-100"><code>{{ codigo }}</code></pre>
        </div>
      </section>
    </app-boleteria>
  `,
})
export class AntesPage {
  protected readonly codigo = CODIGO;
  protected readonly crearMapa = (plano: EstadioGenerado): MapaDeSillas =>
    new EstadioSinFlyweight(plano);
}
