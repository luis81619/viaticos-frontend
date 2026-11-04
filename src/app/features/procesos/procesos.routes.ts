import { Routes } from '@angular/router';

export const procesosRoutes: Routes = [
  {
    path: 'comisiones',

    loadComponent: () => import('./comisiones/comisiones-page/comisiones-page'),
  },

  {
    path: 'comisiones/nueva',

    loadComponent: () => import('./comisiones/nueva-comision-page/nueva-comision-page'),
  },

  {
    path: 'comisiones/:id/editar',

    loadComponent: () => import('./comisiones/nueva-comision-page/nueva-comision-page'),
  },

  {
    path: 'comisiones/:id',

    loadComponent: () => import('./comisiones/comision-detalle-page/comision-detalle-page'),
  },
];
