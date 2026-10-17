import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'patronFlyweight/antes' },

  // Demostración del patrón Flyweight: el mismo sitio con y sin el patrón.
  {
    path: 'patronFlyweight/antes',
    title: 'Boletería · Estadio Metropolitano (sin Flyweight)',
    loadComponent: () => import('./antes/antes.page').then((m) => m.AntesPage),
  },
  {
    path: 'patronFlyweight/despues',
    title: 'Boletería · Estadio Metropolitano (con Flyweight)',
    loadComponent: () => import('./despues/despues.page').then((m) => m.DespuesPage),
  },

  // Demostración del patrón Bridge, independiente de la anterior.
  {
    path: 'patronBridge',
    title: 'Patrón Bridge · Estadio Metropolitano',
    loadComponent: () => import('./bridge/bridge.page').then((m) => m.BridgePage),
  },

  { path: '**', redirectTo: 'patronFlyweight/antes' },
];
