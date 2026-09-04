import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { MenuItem } from '../../../../shared/interfaces/menu.item';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { LayoutDashboardIcon, BookOpenIcon, FileTextIcon, ChevronDownIcon } from 'lucide-angular';
import { Role } from '../../../auth/interfaces/role';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, LucideAngularModule],
  templateUrl: './sidebar.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Sidebar {
  isCollapsed = input.required<boolean>();

  ChevronDownIcon = ChevronDownIcon;

  openMenu = signal<string | null>(null);

  toggleMenu(label: string) {
    this.openMenu.update((current) => (current === label ? null : label));
  }

  menuItems: MenuItem[] = [
    {
      label: 'Dashboard',
      icon: LayoutDashboardIcon,
      route: '/dashboard',
      roles: ['ADMIN', 'CAPTURISTA', 'SUPERVISOR'],
    },
    {
      label: 'Catálogos',
      icon: BookOpenIcon,
      roles: ['ADMIN'],
      children: [
        {
          label: 'Planteles',
          route: '/catalogos/planteles',
          roles: [Role.ACCESO, Role.ADMIN],
          permissions: ['CATALOGOS_READ'],
        },
        {
          label: 'Actividades',
          route: '/catalogos/actividades',
          roles: [Role.ACCESO, Role.ADMIN],
          permissions: ['CATALOGOS_READ'],
        },
        {
          label: 'Bancos',
          route: '/catalogos/bancos',
          roles: ['ADMIN'],
        },
        {
          label: 'Vehículos',
          route: '/catalogos/vehiculos',
          roles: ['ADMIN'],
        },
        {
          label: 'Municipios',
          route: '/catalogos/municipios',
          roles: ['ADMIN'],
        },
        {
          label: 'Zonas',
          route: '/catalogos/zonas',
          roles: ['ADMIN', 'SUPERVISOR'],
        },
        {
          label: 'Tabulador',
          route: '/catalogos/tabulador',
          roles: ['ADMIN'],
        },
      ],
    },
    {
      label: 'Procesos',
      icon: FileTextIcon,
      roles: ['ADMIN', 'CAPTURISTA'],
      children: [
        {
          label: 'Solicitudes',
          route: '/procesos/solicitudes',
          roles: ['ADMIN', 'CAPTURISTA'],
        },
      ],
    },
  ];
}
