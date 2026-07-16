import { Routes } from '@angular/router';

export const catalogosRoutes: Routes = [

  {
    path: 'bancos',

    loadComponent: () =>
      import('./bancos/bancos-page/bancos-page')
  },

];
