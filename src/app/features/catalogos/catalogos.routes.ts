import { Routes } from '@angular/router';

export const catalogosRoutes: Routes = [
  {
    path: 'bancos',

    loadComponent: () => import('./bancos/bancos-page/bancos-page'),
  },

  {
    path: 'vehiculos',

    loadComponent: () => import('./vehiculos/vehiculos-page/vehiculos-page'),
  },

  {
    path: 'municipios',

    loadComponent: () => import('./municipios/municipios-page/municipios-page'),
  },

  {
    path: 'zonas',

    loadComponent: () => import('./zonificacion/zonificacion-page/zonificacion-page'),
  },

  {
    path: 'tabulador',

    loadComponent: () => import('./tabulador/tabulador-page/tabulador-page'),
  },
];
