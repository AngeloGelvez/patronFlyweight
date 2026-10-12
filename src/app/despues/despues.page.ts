import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EstadioGenerado } from '../core/data/estadio.generator';
import { MapaDeSillas } from '../core/models/mapa-de-sillas';
import { ComparacionResultadosComponent } from '../shared/components/comparacion-resultados/comparacion-resultados.component';
import { LaboratorioMapaComponent } from '../shared/components/laboratorio-mapa/laboratorio-mapa.component';
import { EstadioConFlyweight } from './estadio-con-flyweight';

const CODIGO = `class LocalidadFactory {
  private cache = new Map<LocalidadId, Localidad>();

  obtenerLocalidad(id) {
    let localidad = this.cache.get(id);
    if (!localidad) {               // ✅ solo la primera vez
      localidad = new Localidad(datosDelApi(id));
      this.cache.set(id, localidad);
    }
    return localidad;               // misma instancia
  }
}

// 100.000 sillas, 6 localidades compartidas
new Silla(registro, fabrica.obtenerLocalidad(registro.localidadId));`;

/** Partes del patrón, en el orden de Refactoring Guru. */
const PARTES = [
  {
    nombre: 'Flyweight',
    clase: 'Localidad',
    descripcion:
      'Guarda lo que comparten todas las sillas de una localidad: precio, color, beneficios, términos e icono. Es inmutable y existe una sola por localidad.',
  },
  {
    nombre: 'Contexto',
    clase: 'Silla',
    descripcion:
      'Guarda solo lo propio de cada silla: sección, fila, número, posición y estado, más una referencia a su Localidad.',
  },
  {
    nombre: 'Fábrica',
    clase: 'LocalidadFactory',
    descripcion:
      'Es el único punto donde se crean localidades. Si ya existe, devuelve la misma instancia desde su caché.',
  },
  {
    nombre: 'Cliente',
    clase: 'EstadioConFlyweight',
    descripcion:
      'Construye el mapa pidiendo las localidades a la fábrica y dibuja cada silla pasándole al flyweight su posición y estado.',
  },
] as const;

@Component({
  selector: 'app-despues-page',
  imports: [RouterLink, LaboratorioMapaComponent, ComparacionResultadosComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-8">
      <header class="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div class="max-w-3xl">
          <p class="text-sm font-semibold text-despues">Versión 2 de 2 · Con el patrón</p>
          <h1 class="mt-1 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Mapa de sillas con Flyweight
          </h1>
          <p class="mt-3 text-slate-300">
            Separamos los datos: cada silla guarda solo lo que es suyo y
            <strong class="text-white">comparte</strong> la localidad con las demás sillas. Sin
            importar si hay 10.000 o 100.000 sillas, solo existen
            <strong class="text-white">6 localidades y 6 iconos</strong> en memoria.
          </p>
        </div>
        <a
          routerLink="/antes"
          class="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-antes px-5 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <span aria-hidden="true">←</span> Ver versión sin Flyweight
        </a>
      </header>

      <app-laboratorio-mapa version="despues" [crearMapa]="crearMapa" />

      <section aria-labelledby="titulo-solucion" class="space-y-6 rounded-2xl bg-slate-900 p-5 ring-1 ring-white/10 sm:p-6">
        <div>
          <h2 id="titulo-solucion" class="text-lg font-semibold text-white">¿Cómo lo resuelve Flyweight?</h2>
          <p class="mt-2 max-w-3xl text-sm text-slate-300">
            El patrón divide el objeto pesado en dos: la parte que se repite (estado intrínseco) se
            guarda una sola vez y se comparte, y la parte única de cada silla (estado extrínseco) se
            queda en un objeto liviano.
          </p>
        </div>

        <ol class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          @for (parte of partes; track parte.clase) {
            <li class="rounded-xl bg-white/5 p-4">
              <p class="text-xs font-semibold uppercase tracking-wide text-despues">{{ parte.nombre }}</p>
              <p class="mt-1 font-mono text-sm font-semibold text-white">{{ parte.clase }}</p>
              <p class="mt-2 text-sm text-slate-300">{{ parte.descripcion }}</p>
            </li>
          }
        </ol>

        <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div class="space-y-3 text-sm">
            <div class="rounded-xl bg-white/5 p-4">
              <p class="font-mono text-slate-200">100.000 sillas × ≈ 100 bytes (datos propios + referencia)</p>
              <p class="font-mono text-slate-200">+ 6 localidades × ≈ 6,7 KB (datos + icono)</p>
              <p class="mt-1 font-mono text-white">≈ 9,5 MB en total</p>
            </div>
            <p class="text-slate-300">
              Además, dibujar es más rápido: el navegador reutiliza los mismos 6 iconos en vez de
              tratar con 100.000 imágenes distintas.
            </p>
            <p class="text-slate-300">
              <strong class="text-white">Importante:</strong> la localidad es inmutable
              (<code class="text-despues">Object.freeze</code>). Si una silla pudiera cambiarle el
              precio, el cambio afectaría a todas las sillas que la comparten.
            </p>
          </div>
          <div>
            <p class="text-xs font-medium uppercase tracking-wide text-slate-400">despues/localidad.factory.ts (resumido)</p>
            <pre class="mt-2 overflow-x-auto rounded-xl bg-slate-950 p-4 text-xs leading-relaxed text-slate-200 ring-1 ring-white/10"><code>{{ codigo }}</code></pre>
          </div>
        </div>
      </section>

      <app-comparacion-resultados />
    </div>
  `,
})
export class DespuesPage {
  protected readonly codigo = CODIGO;
  protected readonly partes = PARTES;
  protected readonly crearMapa = (plano: EstadioGenerado): MapaDeSillas =>
    new EstadioConFlyweight(plano);
}
