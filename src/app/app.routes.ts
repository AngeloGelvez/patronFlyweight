import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'antes' },
  {
    path: 'antes',
    title: 'Boletería · Estadio Metropolitano (sin Flyweight)',
    loadComponent: () => import('./antes/antes.page').then((m) => m.AntesPage),
  },
  {
    path: 'despues',
    title: 'Boletería · Estadio Metropolitano (con Flyweight)',
    loadComponent: () => import('./despues/despues.page').then((m) => m.DespuesPage),
  },
  { path: '**', redirectTo: 'antes' },
];
