import { Routes } from '@angular/router';

export const procesosRoutes: Routes = [
  {
    path: 'comisiones',

    loadComponent: () =>
      import('./comisiones/comisiones-page/comisiones-page'),
  },

  {
    path: 'comisiones/nueva',

    loadComponent: () =>
      import('./comisiones/nueva-comision-page/nueva-comision-page'),
  },

  // Va después de "nueva" para que esa ruta no se tome como un id.
  {
    path: 'comisiones/:id',

    loadComponent: () =>
      import('./comisiones/comision-detalle-page/comision-detalle-page'),
  },
];
