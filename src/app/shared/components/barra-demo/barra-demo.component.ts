import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { VersionMapa } from '../../../core/models/resultado-ejecucion';
import { DemoService } from '../../../core/services/demo.service';

const VERSIONES: readonly { readonly id: VersionMapa; readonly nombre: string; readonly ruta: string }[] = [
  { id: 'antes', nombre: 'Sin Flyweight', ruta: '/antes' },
  { id: 'despues', nombre: 'Con Flyweight', ruta: '/despues' },
];

/**
 * Barra de la demostración, encima del sitio: elige la implementación y el
 * aforo. No forma parte del sitio real del estadio.
 */
@Component({
  selector: 'app-barra-demo',
  imports: [DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="border-b border-amber-200 bg-amber-50 text-sm">
      <div class="mx-auto flex max-w-7xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-2">
        <p class="font-semibold text-amber-950">
          <span aria-hidden="true">🧪</span> Demo · Patrón Flyweight
        </p>

        <nav aria-label="Implementación del mapa" class="flex items-center gap-2">
          <ul class="flex rounded-lg bg-white p-0.5 ring-1 ring-amber-200">
            @for (opcion of versiones; track opcion.id) {
              <li>
                <!-- Enlace normal (no del router): recarga la página para medir con la memoria limpia. -->
                <a
                  [href]="opcion.ruta"
                  [attr.aria-current]="actual() === opcion.id ? 'page' : null"
                  class="block rounded-md px-3 py-1 font-medium focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-amber-900"
                  [class]="actual() === opcion.id ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-amber-100'"
                >
                  {{ opcion.nombre }}
                </a>
              </li>
            }
          </ul>
        </nav>

        <label class="flex items-center gap-2 text-amber-950">
          Aforo
          <select
            class="rounded-md border border-amber-300 bg-white px-2 py-1 text-slate-900 focus:outline-2 focus:outline-offset-1 focus:outline-amber-900"
            (change)="demo.cambiarAforo(+$any($event.target).value)"
          >
            @for (aforo of demo.aforos; track aforo) {
              <option [value]="aforo" [selected]="aforo === demo.aforo()">{{ aforo | number }} sillas</option>
            }
          </select>
        </label>

        <button
          type="button"
          class="ml-auto rounded-md px-2 py-1 font-medium text-amber-950 underline underline-offset-2 hover:bg-amber-100 focus-visible:outline-2 focus-visible:outline-amber-900"
          (click)="verRendimiento()"
        >
          Ver rendimiento ↓
        </button>
      </div>
    </div>
  `,
})
export class BarraDemoComponent {
  protected readonly demo = inject(DemoService);
  protected readonly versiones = VERSIONES;

  private readonly url = signal('');

  protected readonly actual = computed<VersionMapa | null>(() => {
    const url = this.url();
    if (url.startsWith('/antes')) return 'antes';
    if (url.startsWith('/despues')) return 'despues';
    return null;
  });

  constructor() {
    const suscripcion = inject(Router).events.subscribe((evento) => {
      if (evento instanceof NavigationEnd) this.url.set(evento.urlAfterRedirects);
    });
    inject(DestroyRef).onDestroy(() => suscripcion.unsubscribe());
  }

  protected verRendimiento(): void {
    document.getElementById('rendimiento')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
