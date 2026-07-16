import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from '../../components/sidebar/sidebar';
import { Header } from '../../components/header/header';
import { Breadcrumbs } from '../../components/breadcrumbs/breadcrumbs';

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, Sidebar, Header, Breadcrumbs],
  templateUrl: './main-layout.html',
})
export class MainLayout {

  isSidebarCollapsed = signal(false); //Sidebar inicia expandido

  toggleSidebar() {
    this.isSidebarCollapsed.update(value => !value);
  }

 }
