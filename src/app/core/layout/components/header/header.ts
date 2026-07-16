import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import {
  MenuIcon
} from 'lucide-angular';

/*
import { LucideAngularModule } from 'lucide-angular';
import {
  LayoutDashboardIcon,
  BookOpenIcon,
  FileTextIcon,
  ChevronDownIcon,
} from 'lucide-angular';
*/

@Component({
  selector: 'app-header',
  imports: [LucideAngularModule],
  templateUrl: './header.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Header {
  MenuIcon = MenuIcon;
  toggleSidebar = output<void>();
 }
