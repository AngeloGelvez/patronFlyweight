import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EstadioGenerado } from '../core/data/estadio.generator';
import { MapaDeSillas } from '../core/models/mapa-de-sillas';
import { ComparacionResultadosComponent } from '../shared/components/comparacion-resultados/comparacion-resultados.component';
import { LaboratorioMapaComponent } from '../shared/components/laboratorio-mapa/laboratorio-mapa.component';
import { EstadioSinFlyweight } from './estadio-sin-flyweight';

const CODIGO = `class SillaPesada {
  // Datos propios de la silla
  id; seccion; fila; numero; x; y; estado;

  // ❌ Repetidos en cada silla
  localidad;  // precio, beneficios, ~2 KB de términos
  icono;      // lienzo de 24 × 24 px

  constructor(registro, localidad) {
    // ...
    this.localidad = localidad;          // copia propia (llega del API)
    this.icono = crearIconoSilla(color); // se dibuja otra vez
  }
}`;

@Component({
  selector: 'app-antes-page',
  imports: [RouterLink, LaboratorioMapaComponent, ComparacionResultadosComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-8">
      <header class="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div class="max-w-3xl">
          <p class="text-sm font-semibold text-antes">Versión 1 de 2 · Sin el patrón</p>
          <h1 class="mt-1 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Mapa de sillas sin Flyweight
          </h1>
          <p class="mt-3 text-slate-300">
            Así se haría de la forma directa: cada silla es un objeto que guarda
            <strong class="text-white">su propia copia</strong> de la localidad (precio, beneficios y
            términos) y <strong class="text-white">su propio icono</strong>. Solo hay 6 localidades,
            pero con 100.000 sillas se crean 100.000 copias de todo.
          </p>
        </div>
        <a
          routerLink="/despues"
          class="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-despues px-5 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          Ver versión con Flyweight <span aria-hidden="true">→</span>
        </a>
      </header>

      <app-laboratorio-mapa version="antes" [crearMapa]="crearMapa" />

      <section aria-labelledby="titulo-problema" class="grid grid-cols-1 gap-6 rounded-2xl bg-slate-900 p-5 ring-1 ring-white/10 sm:p-6 lg:grid-cols-2">
        <div>
          <h2 id="titulo-problema" class="text-lg font-semibold text-white">¿Cuál es el problema?</h2>
          <p class="mt-2 text-sm text-slate-300">
            Los datos de una silla se dividen en dos tipos, pero aquí se guardan juntos:
          </p>
          <ul class="mt-3 space-y-2 text-sm text-slate-300">
            <li>
              <strong class="text-white">Propios de cada silla</strong> (estado extrínseco): sección,
              fila, número, posición y estado. Cambian de una silla a otra.
            </li>
            <li>
              <strong class="text-white">Iguales para toda la localidad</strong> (estado intrínseco):
              precio, color, beneficios, términos y el icono. Se repiten miles de veces.
            </li>
          </ul>
          <div class="mt-4 rounded-xl bg-white/5 p-4 text-sm">
            <p class="font-mono text-slate-200">100.000 sillas × (≈ 4,4 KB de localidad + 2,3 KB de icono)</p>
            <p class="mt-1 font-mono text-white">≈ 680 MB solo en datos repetidos</p>
          </div>
          <p class="mt-4 text-sm text-slate-300">
            Además, dibujar 100.000 iconos distintos es lento, porque el navegador tiene que tratar
            cada uno como una imagen diferente.
          </p>
        </div>
        <div>
          <p class="text-xs font-medium uppercase tracking-wide text-slate-400">antes/silla-pesada.ts (resumido)</p>
          <pre class="mt-2 overflow-x-auto rounded-xl bg-slate-950 p-4 text-xs leading-relaxed text-slate-200 ring-1 ring-white/10"><code>{{ codigo }}</code></pre>
        </div>
      </section>

      <app-comparacion-resultados />
    </div>
  `,
})
export class AntesPage {
  protected readonly codigo = CODIGO;
  protected readonly crearMapa = (plano: EstadioGenerado): MapaDeSillas =>
    new EstadioSinFlyweight(plano);
}
