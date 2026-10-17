import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { VersionMapa } from '../../../core/models/resultado-ejecucion';
import { DemoService } from '../../../core/services/demo.service';

type PatronId = 'flyweight' | 'bridge';

const PATRONES: readonly { readonly id: PatronId; readonly nombre: string; readonly ruta: string }[] = [
  { id: 'flyweight', nombre: 'Flyweight', ruta: '/patronFlyweight/antes' },
  { id: 'bridge', nombre: 'Bridge', ruta: '/patronBridge' },
];

const VERSIONES: readonly { readonly id: VersionMapa; readonly nombre: string; readonly ruta: string }[] = [
  { id: 'antes', nombre: 'Sin Flyweight', ruta: '/patronFlyweight/antes' },
  { id: 'despues', nombre: 'Con Flyweight', ruta: '/patronFlyweight/despues' },
];

/**
 * Barra de la demostración, encima del sitio: elige el patrón y, en el de
 * Flyweight, la implementación y el aforo. No forma parte del sitio real.
 */
@Component({
  selector: 'app-barra-demo',
  imports: [DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="border-b border-amber-200 bg-amber-50 text-sm">
      <div class="mx-auto flex max-w-7xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-2">
        <p class="font-semibold text-amber-950">
          <span aria-hidden="true">🧪</span> Demo · Patrones de diseño
        </p>

        <nav aria-label="Patrón" class="flex items-center gap-2">
          <ul class="flex rounded-lg bg-white p-0.5 ring-1 ring-amber-200">
            @for (opcion of patrones; track opcion.id) {
              <li>
                <a
                  [href]="opcion.ruta"
                  [attr.aria-current]="patron() === opcion.id ? 'page' : null"
                  class="block rounded-md px-3 py-1 font-medium focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-amber-900"
                  [class]="patron() === opcion.id ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-amber-100'"
                >
                  {{ opcion.nombre }}
                </a>
              </li>
            }
          </ul>
        </nav>

        @if (patron() === 'flyweight') {
          <nav aria-label="Implementación del mapa" class="flex items-center gap-2">
            <ul class="flex rounded-lg bg-white p-0.5 ring-1 ring-amber-200">
              @for (opcion of versiones; track opcion.id) {
                <li>
                  <!-- Enlace normal (no del router): recarga la página para medir con la memoria limpia. -->
                  <a
                    [href]="opcion.ruta"
                    [attr.aria-current]="version() === opcion.id ? 'page' : null"
                    class="block rounded-md px-3 py-1 font-medium focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-amber-900"
                    [class]="version() === opcion.id ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-amber-100'"
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
                <option [value]="aforo" [selected]="aforo === demo.aforo()">{{ aforo | number }} asientos</option>
              }
            </select>
          </label>

          <p class="text-amber-900 sm:ml-auto">Tiempos medidos en la consola (F12)</p>
        } @else {
          <p class="text-amber-900 sm:ml-auto">500 asientos · Bridge no es un patrón de optimización</p>
        }
      </div>
    </div>
  `,
})
export class BarraDemoComponent {
  protected readonly demo = inject(DemoService);
  protected readonly patrones = PATRONES;
  protected readonly versiones = VERSIONES;

  private readonly url = signal('');

  protected readonly patron = computed<PatronId>(() =>
    this.url().startsWith('/patronBridge') ? 'bridge' : 'flyweight',
  );

  protected readonly version = computed<VersionMapa | null>(() => {
    const url = this.url();
    if (url.startsWith('/patronFlyweight/antes')) return 'antes';
    if (url.startsWith('/patronFlyweight/despues')) return 'despues';
    return null;
  });

  constructor() {
    const suscripcion = inject(Router).events.subscribe((evento) => {
      if (evento instanceof NavigationEnd) this.url.set(evento.urlAfterRedirects);
    });
    inject(DestroyRef).onDestroy(() => suscripcion.unsubscribe());
  }
}
