import { ChangeDetectionStrategy, Component } from '@angular/core';
import { EstadioGenerado } from '../core/data/estadio.generator';
import { MapaDeSillas } from '../core/models/mapa-de-sillas';
import { BoleteriaComponent } from '../shared/components/boleteria/boleteria.component';
import { EstadioSinFlyweight } from './estadio-sin-flyweight';

/**
 * Sitio de venta de entradas SIN el patrón Flyweight. La explicación
 * del patrón y la comparación de rendimiento están en la presentación.
 */
@Component({
  selector: 'app-antes-page',
  imports: [BoleteriaComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<app-boleteria version="antes" [crearMapa]="crearMapa" />`,
})
export class AntesPage {
  protected readonly crearMapa = (plano: EstadioGenerado): MapaDeSillas => new EstadioSinFlyweight(plano);
}
