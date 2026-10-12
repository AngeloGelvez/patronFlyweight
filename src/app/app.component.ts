import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BarraDemoComponent } from './shared/components/barra-demo/barra-demo.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, BarraDemoComponent],
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  /**
   * Con `<base href="/">`, un enlace "#contenido" navegaría a "/#contenido" y
   * el router cambiaría de ruta. Por eso el foco se mueve manualmente.
   */
  protected saltarAlContenido(evento: Event, contenido: HTMLElement): void {
    evento.preventDefault();
    contenido.focus();
  }
}
