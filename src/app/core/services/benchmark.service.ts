import { inject, Injectable } from '@angular/core';
import { EstadioGenerado, generarEstadio } from '../data/estadio.generator';
import { ZONAS } from '../data/zonas.db';
import { MapaDeSillas, SillaSeleccionada } from '../models/mapa-de-sillas';
import { Lienzo } from '../render/icono-silla';
import { NOMBRE_VERSION, ResultadoEjecucion, VersionMapa } from '../models/resultado-ejecucion';
import { PerformanceMonitorService } from './performance-monitor.service';
import { ResultadosService } from './resultados.service';

export interface OpcionesEjecucion {
  readonly version: VersionMapa;
  readonly cantidad: number;
  /** Construye el mapa: aquí cada versión decide si usa Flyweight o no. */
  readonly crearMapa: (plano: EstadioGenerado) => MapaDeSillas;
  /** Dibuja el mapa en el canvas de la página. */
  readonly renderizar: (mapa: MapaDeSillas) => void;
}

export interface EjecucionCompletada {
  readonly mapa: MapaDeSillas;
  readonly resultado: ResultadoEjecucion;
}

/**
 * Ejecuta una versión del mapa paso a paso, mide cada paso y registra el
 * resultado para la comparación.
 *
 * Las dos versiones pasan exactamente por los mismos pasos y las mismas
 * mediciones; lo único que cambia es la función `crearMapa`.
 */
@Injectable({ providedIn: 'root' })
export class BenchmarkService {
  private readonly monitor = inject(PerformanceMonitorService);
  private readonly resultados = inject(ResultadosService);

  ejecutar({ version, cantidad, crearMapa, renderizar }: OpcionesEjecucion): EjecucionCompletada {
    const etiqueta = `[${NOMBRE_VERSION[version]}] ${cantidad.toLocaleString('es-ES')} asientos`;
    console.group(etiqueta);

    try {
      const carga = this.monitor.medir(`${etiqueta} · 1. Cargar datos`, () =>
        generarEstadio(cantidad),
      );
      const creacion = this.monitor.medir(`${etiqueta} · 2. Crear objetos`, () =>
        crearMapa(carga.resultado),
      );
      const mapa = creacion.resultado;
      const render = this.monitor.medir(`${etiqueta} · 3. Dibujar mapa`, () => renderizar(mapa));
      const estadisticas = mapa.estadisticas();

      const resultado: ResultadoEjecucion = {
        version,
        cantidad,
        cargaDatosMs: carga.ms,
        creacionMs: creacion.ms,
        renderMs: render.ms,
        totalMs: carga.ms + creacion.ms + render.ms,
        copiasDeLocalidad: estadisticas.copiasDeLocalidad,
        iconos: estadisticas.iconos,
        memoriaEstimadaBytes: estadisticas.memoriaEstimadaBytes,
        heapUsadoBytes: this.monitor.heapUsadoBytes(),
        fecha: new Date().toISOString(),
      };

      console.table({
        'Cargar datos (ms)': redondear(resultado.cargaDatosMs),
        'Crear objetos (ms)': redondear(resultado.creacionMs),
        'Dibujar mapa (ms)': redondear(resultado.renderMs),
        'Total (ms)': redondear(resultado.totalMs),
        'Copias de localidad': resultado.copiasDeLocalidad,
        'Iconos renderizados': resultado.iconos,
        'Memoria estimada (MB)': redondear(resultado.memoriaEstimadaBytes / 1_048_576),
      });

      this.resultados.registrar(resultado);
      return { mapa, resultado };
    } finally {
      console.groupEnd();
    }
  }

  /**
   * Obtiene la vista previa de la silla seleccionada y mide cuánto tarda. Sin
   * Flyweight se dibuja una imagen nueva por cada silla; con Flyweight solo la
   * primera vez de cada zona.
   */
  medirVista(version: VersionMapa, mapa: MapaDeSillas, silla: SillaSeleccionada): Lienzo {
    const zona = ZONAS[silla.detalle.zona].nombre;
    const etiqueta = `[${NOMBRE_VERSION[version]}] Vista previa · ${zona}`;
    const { resultado, ms } = this.monitor.medir(etiqueta, () => silla.obtenerVista());

    this.resultados.registrarVista(version, ms, mapa.estadisticas().vistasRenderizadas);
    return resultado;
  }
}

function redondear(valor: number): number {
  return Math.round(valor * 10) / 10;
}
