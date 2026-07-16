import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import {
  LucideAngularModule,
  SearchIcon,
} from 'lucide-angular';

@Component({
  selector: 'app-ui-empty-state',
  imports: [LucideAngularModule],
  templateUrl: './ui-empty-state.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiEmptyState {
  readonly SearchIcon = SearchIcon;

  title = input('No se encontraron registros');

  description = input('Intenta modificar los filtros de búsqueda.');
}
