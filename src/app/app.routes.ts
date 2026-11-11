import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'patronState/simple' },

  // Ejemplo 1: solo el patrón State.
  {
    path: 'patronState/simple',
    title: 'Patrón State · La entrada · Estadio Metropolitano',
    loadComponent: () => import('./state-simple/simple.page').then((m) => m.SimplePage),
  },

  // Ejemplo 2: State combinado con Observer.
  {
    path: 'patronState/observer',
    title: 'State + Observer · El pedido · Estadio Metropolitano',
    loadComponent: () => import('./state-observer/observer.page').then((m) => m.ObserverPage),
  },

  { path: '**', redirectTo: 'patronState/simple' },
];
