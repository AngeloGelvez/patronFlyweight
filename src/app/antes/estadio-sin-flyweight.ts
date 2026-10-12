import { EstadioGenerado } from '../core/data/estadio.generator';
import { obtenerLocalidad } from '../core/data/localidades.db';
import { EstadisticasMapa, MapaDeSillas, SillaSeleccionada } from '../core/models/mapa-de-sillas';
import { ESCALA_ICONO, OPACIDAD_POR_ESTADO } from '../core/render/icono-silla';
import { buscarMasCercano } from '../core/utils/geometria';
import { SillaPesada } from './silla-pesada';

/**
 * ❌ SIN FLYWEIGHT
 *
 * Mapa del estadio donde cada silla es un objeto pesado e independiente.
 */
export class EstadioSinFlyweight implements MapaDeSillas {
  private readonly sillas: SillaPesada[];

  constructor(readonly plano: EstadioGenerado) {
    this.sillas = plano.sillas.map((registro) => {
      // Simula un API que responde cada silla con los datos de su localidad
      // incluidos (respuesta "desnormalizada"): al llegar como JSON, cada
      // silla trae su propia copia de los textos, aunque sean idénticos.
      const localidad = structuredClone(obtenerLocalidad(registro.localidadId));
      return new SillaPesada(registro, localidad);
    });
  }

  dibujar(ctx: CanvasRenderingContext2D): void {
    const tamano = this.plano.separacionSillas * ESCALA_ICONO;
    const mitad = tamano / 2;

    for (const silla of this.sillas) {
      ctx.globalAlpha = OPACIDAD_POR_ESTADO[silla.estado];
      ctx.drawImage(silla.icono, silla.x - mitad, silla.y - mitad, tamano, tamano);
    }

    ctx.globalAlpha = 1;
  }

  seleccionarSilla(x: number, y: number): SillaSeleccionada | null {
    const silla = buscarMasCercano(this.sillas, x, y, this.plano.separacionSillas / 2);
    return silla ? { detalle: silla.detalle(), obtenerVista: () => silla.obtenerVista() } : null;
  }

  estadisticas(): EstadisticasMapa {
    return {
      sillas: this.sillas.length,
      copiasDeLocalidad: this.sillas.length,
      iconos: this.sillas.length,
      vistasRenderizadas: this.sillas.filter((s) => s.tieneVista).length,
      memoriaEstimadaBytes: this.sillas.reduce((total, s) => total + s.memoriaEstimadaBytes(), 0),
    };
  }
}
