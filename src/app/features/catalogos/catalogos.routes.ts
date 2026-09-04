import { Routes } from '@angular/router';
import { authGuard } from '../../core/auth/guards/auth-guard';
import { Role } from '../../core/auth/interfaces/role';

export const catalogosRoutes: Routes = [
  {
    path: 'planteles',
    canActivate: [authGuard],
    data: {
      roles: [Role.ACCESO, Role.ADMIN],
    },
    loadComponent: () => import('./planteles/planteles-page/planteles-page'),
  },
  {
    path: 'actividades',
    canActivate: [authGuard],
    data: {
      roles: [Role.ACCESO, Role.ADMIN],
    },
    loadComponent: () => import('./actividades/actividades-page/actividades-page'),
  },

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
