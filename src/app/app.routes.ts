import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'antes' },
  {
    path: 'antes',
    title: 'Sin Flyweight · Mapa de sillas',
    loadComponent: () => import('./antes/antes.page').then((m) => m.AntesPage),
  },
  {
    path: 'despues',
    title: 'Con Flyweight · Mapa de sillas',
    loadComponent: () => import('./despues/despues.page').then((m) => m.DespuesPage),
  },
  { path: '**', redirectTo: 'antes' },
];
