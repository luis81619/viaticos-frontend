import { Routes } from '@angular/router';

import { MainLayout } from './core/layout/pages/main-layout/main-layout';

import { authGuard } from './core/auth/guards/auth-guard';

export const routes: Routes = [

  /*
  |--------------------------------------------------------------------------
  | LOGIN
  |--------------------------------------------------------------------------
  */

  {
    path: 'login',

    loadComponent: () =>
      import('./core/auth/pages/auth-callback/auth-callback'),
  },

  /*
  |--------------------------------------------------------------------------
  | PRIVATE LAYOUT
  |--------------------------------------------------------------------------
  */

  {
    path: '',

    component: MainLayout,

    canActivate: [authGuard],

    children: [

      /*
      |--------------------------------------------------------------------------
      | DASHBOARD
      |--------------------------------------------------------------------------
      */

      {
        path: 'dashboard',

        loadComponent: () =>
          import('./features/dashboard/pages/dashboard/dashboard'),
      },

      /*
      |--------------------------------------------------------------------------
      | CATALOGOS
      |--------------------------------------------------------------------------
      */

      {
        path: 'catalogos',

        loadChildren: () =>
          import('./features/catalogos/catalogos.routes')
            .then(m => m.catalogosRoutes),
      },

      /*
      |--------------------------------------------------------------------------
      | REDIRECT
      |--------------------------------------------------------------------------
      */

      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },

    ],
  },

];
