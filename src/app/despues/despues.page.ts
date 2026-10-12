import { ChangeDetectionStrategy, Component } from '@angular/core';
import { EstadioGenerado } from '../core/data/estadio.generator';
import { MapaDeSillas } from '../core/models/mapa-de-sillas';
import { BoleteriaComponent } from '../shared/components/boleteria/boleteria.component';
import { EstadioConFlyweight } from './estadio-con-flyweight';

const CODIGO = `class VistaPreviaFactory {
  private cache = new Map<ZonaId, Lienzo>();

  obtenerVista(zona) {
    let vista = this.cache.get(zona);
    if (!vista) {                    // ✅ solo la primera vez
      vista = renderizarVistaCancha(zona);
      this.cache.set(zona, vista);
    }
    return vista;                    // la misma imagen
  }
}

// Igual con las localidades: 100.000 sillas, 6 instancias
new Silla(registro, localidades.obtenerLocalidad(registro.localidadId));`;

/** Partes del patrón, en el orden de Refactoring Guru. */
const PARTES = [
  {
    nombre: 'Flyweight',
    clase: 'Localidad · vista de zona',
    descripcion:
      'Lo que comparten muchas sillas: precio, beneficios, términos e icono (por localidad) y la imagen de la cancha (por zona). Inmutable.',
  },
  {
    nombre: 'Contexto',
    clase: 'Silla',
    descripcion:
      'Solo lo propio de cada silla: zona, sección, fila, número, posición y estado, más una referencia a su Localidad.',
  },
  {
    nombre: 'Fábricas',
    clase: 'LocalidadFactory · VistaPreviaFactory',
    descripcion:
      'Único punto donde se crean localidades y vistas. Si ya existe, devuelven la misma instancia desde su caché.',
  },
  {
    nombre: 'Cliente',
    clase: 'EstadioConFlyweight',
    descripcion:
      'Construye el mapa pidiendo todo a las fábricas y dibuja cada silla pasándole al flyweight su posición y estado.',
  },
] as const;

@Component({
  selector: 'app-despues-page',
  imports: [BoleteriaComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-boleteria version="despues" [crearMapa]="crearMapa">
      <section aria-labelledby="titulo-solucion" class="space-y-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
        <div>
          <h3 id="titulo-solucion" class="text-lg font-semibold text-slate-900">¿Cómo lo resuelve Flyweight?</h3>
          <p class="mt-2 max-w-3xl text-sm text-slate-700">
            El patrón divide el objeto pesado en dos: la parte que se repite (estado intrínseco) se
            guarda una sola vez y se comparte, y la parte única de cada silla (estado extrínseco) se
            queda en un objeto liviano.
          </p>
        </div>

        <ol class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          @for (parte of partes; track parte.nombre) {
            <li class="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
              <p class="text-xs font-semibold uppercase tracking-wide text-marca">{{ parte.nombre }}</p>
              <p class="mt-1 font-mono text-sm font-semibold text-slate-900">{{ parte.clase }}</p>
              <p class="mt-2 text-sm text-slate-700">{{ parte.descripcion }}</p>
            </li>
          }
        </ol>

        <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div class="space-y-3 text-sm">
            <div class="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
              <p class="font-mono text-slate-700">100.000 sillas × ≈ 100 bytes (datos propios + referencia)</p>
              <p class="font-mono text-slate-700">+ 6 localidades × ≈ 6,7 KB (datos + icono)</p>
              <p class="mt-1 font-mono font-semibold text-slate-900">≈ 9,5 MB en total</p>
              <p class="mt-2 font-mono text-slate-700">+ como máximo 7 vistas de 1,4 MB (una por zona)</p>
            </div>
            <p class="text-slate-700">
              Prueba a seleccionar varias sillas de la misma zona: la primera dibuja la vista y las
              demás la reutilizan al instante.
            </p>
            <p class="text-slate-700">
              <strong class="text-slate-900">Importante:</strong> lo compartido es inmutable
              (<code class="text-marca">Object.freeze</code>). Si una silla pudiera cambiar el precio,
              el cambio afectaría a todas las sillas que lo comparten.
            </p>
          </div>
          <div>
            <p class="text-xs font-medium uppercase tracking-wide text-slate-500">despues/vista-previa.factory.ts (resumido)</p>
            <pre class="mt-2 overflow-x-auto rounded-xl bg-slate-900 p-4 text-xs leading-relaxed text-slate-100"><code>{{ codigo }}</code></pre>
          </div>
        </div>
      </section>
    </app-boleteria>
  `,
})
export class DespuesPage {
  protected readonly codigo = CODIGO;
  protected readonly partes = PARTES;
  protected readonly crearMapa = (plano: EstadioGenerado): MapaDeSillas =>
    new EstadioConFlyweight(plano);
}
