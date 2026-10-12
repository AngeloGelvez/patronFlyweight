import { EstadioGenerado } from '../core/data/estadio.generator';
import { DetalleSilla, EstadisticasMapa, MapaDeSillas } from '../core/models/mapa-de-sillas';
import { ESCALA_ICONO } from '../core/render/icono-silla';
import { buscarMasCercano } from '../core/utils/geometria';
import { LocalidadFactory } from './localidad.factory';
import { Silla } from './silla';

/**
 * ✅ CLIENTE
 *
 * Mapa del estadio con Flyweight. Pide las localidades a la fábrica, así que
 * miles de sillas terminan compartiendo las mismas 6 instancias.
 */
export class EstadioConFlyweight implements MapaDeSillas {
  private readonly fabrica = new LocalidadFactory();
  private readonly sillas: Silla[];

  constructor(readonly plano: EstadioGenerado) {
    this.sillas = plano.sillas.map(
      (registro) => new Silla(registro, this.fabrica.obtenerLocalidad(registro.localidadId)),
    );
  }

  dibujar(ctx: CanvasRenderingContext2D): void {
    const tamano = this.plano.separacionSillas * ESCALA_ICONO;

    for (const silla of this.sillas) {
      silla.dibujar(ctx, tamano);
    }

    ctx.globalAlpha = 1;
  }

  buscarSilla(x: number, y: number): DetalleSilla | null {
    const silla = buscarMasCercano(this.sillas, x, y, this.plano.separacionSillas / 2);
    return silla ? silla.detalle() : null;
  }

  estadisticas(): EstadisticasMapa {
    const memoriaSillas = this.sillas.reduce((total, s) => total + s.memoriaEstimadaBytes(), 0);
    const memoriaLocalidades = this.fabrica
      .localidades()
      .reduce((total, l) => total + l.memoriaEstimadaBytes(), 0);

    return {
      sillas: this.sillas.length,
      copiasDeLocalidad: this.fabrica.cantidad,
      iconos: this.fabrica.cantidad,
      memoriaEstimadaBytes: memoriaSillas + memoriaLocalidades,
    };
  }
}
