import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

const EJEMPLOS = [
  { nombre: 'Ejemplo 1 · Solo State', ruta: '/patronState/simple' },
  { nombre: 'Ejemplo 2 · State + Observer', ruta: '/patronState/observer' },
] as const;

/** Barra de la demostración, encima del sitio: elige el ejemplo. No forma parte del sitio real. */
@Component({
  selector: 'app-barra-demo',
  imports: [RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="border-b border-amber-200 bg-amber-50 text-sm">
      <div class="mx-auto flex max-w-7xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-2">
        <p class="font-semibold text-amber-950"><span aria-hidden="true">🧪</span> Demo · Patrón State</p>

        <nav aria-label="Ejemplo">
          <ul class="flex flex-wrap rounded-lg bg-white p-0.5 ring-1 ring-amber-200">
            @for (ejemplo of ejemplos; track ejemplo.ruta) {
              <li>
                <a
                  [routerLink]="ejemplo.ruta"
                  routerLinkActive
                  ariaCurrentWhenActive="page"
                  #rla="routerLinkActive"
                  class="block rounded-md px-3 py-1 font-medium focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-amber-900"
                  [class]="rla.isActive ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-amber-100'"
                >
                  {{ ejemplo.nombre }}
                </a>
              </li>
            }
          </ul>
        </nav>

        <p class="text-amber-900 sm:ml-auto">Patrón de comportamiento · sin backend</p>
      </div>
    </div>
  `,
})
export class BarraDemoComponent {
  protected readonly ejemplos = EJEMPLOS;
}
