import { EstadioGenerado } from '../core/data/estadio.generator';
import { EstadisticasMapa, MapaDeSillas, SillaSeleccionada } from '../core/models/mapa-de-sillas';
import { ESCALA_ICONO } from '../core/render/icono-silla';
import { buscarMasCercano } from '../core/utils/geometria';
import { LocalidadFactory } from './localidad.factory';
import { Silla } from './silla';
import { VistaPreviaFactory } from './vista-previa.factory';

/**
 * ✅ CLIENTE
 *
 * Mapa del estadio con Flyweight. Pide las localidades y las vistas previas a
 * sus fábricas, así que miles de sillas terminan compartiendo 6 localidades y
 * como máximo 7 vistas de la cancha (una por zona).
 */
export class EstadioConFlyweight implements MapaDeSillas {
  private readonly localidades = new LocalidadFactory();
  private readonly vistas = new VistaPreviaFactory();
  private readonly sillas: Silla[];

  constructor(readonly plano: EstadioGenerado) {
    this.sillas = plano.sillas.map(
      (registro) => new Silla(registro, this.localidades.obtenerLocalidad(registro.localidadId)),
    );
  }

  dibujar(ctx: CanvasRenderingContext2D): void {
    const tamano = this.plano.separacionSillas * ESCALA_ICONO;

    for (const silla of this.sillas) {
      silla.dibujar(ctx, tamano);
    }

    ctx.globalAlpha = 1;
  }

  seleccionarSilla(x: number, y: number): SillaSeleccionada | null {
    const silla = buscarMasCercano(this.sillas, x, y, this.plano.separacionSillas / 2);
    return silla
      ? { detalle: silla.detalle(), obtenerVista: () => this.vistas.obtenerVista(silla.zona) }
      : null;
  }

  estadisticas(): EstadisticasMapa {
    const memoriaSillas = this.sillas.reduce((total, s) => total + s.memoriaEstimadaBytes(), 0);
    const memoriaLocalidades = this.localidades
      .localidades()
      .reduce((total, l) => total + l.memoriaEstimadaBytes(), 0);

    return {
      sillas: this.sillas.length,
      copiasDeLocalidad: this.localidades.cantidad,
      iconos: this.localidades.cantidad,
      vistasRenderizadas: this.vistas.cantidad,
      memoriaEstimadaBytes: memoriaSillas + memoriaLocalidades + this.vistas.memoriaEstimadaBytes(),
    };
  }
}
