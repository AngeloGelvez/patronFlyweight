import { ChangeDetectionStrategy, Component } from '@angular/core';
import { EstadioGenerado } from '../core/data/estadio.generator';
import { MapaDeSillas } from '../core/models/mapa-de-sillas';
import { BoleteriaComponent } from '../shared/components/boleteria/boleteria.component';
import { EstadioConFlyweight } from './estadio-con-flyweight';

/**
 * Sitio de venta de entradas CON el patrón Flyweight. La explicación
 * del patrón y la comparación de rendimiento están en la presentación.
 */
@Component({
  selector: 'app-despues-page',
  imports: [BoleteriaComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<app-boleteria version="despues" [crearMapa]="crearMapa" />`,
})
export class DespuesPage {
  protected readonly crearMapa = (plano: EstadioGenerado): MapaDeSillas => new EstadioConFlyweight(plano);
}
