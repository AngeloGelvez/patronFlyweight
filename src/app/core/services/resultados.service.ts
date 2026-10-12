import { computed, Injectable, signal } from '@angular/core';
import { ALTO_VISTA, ANCHO_VISTA } from '../render/vista-cancha';
import { bytesDeImagen } from '../utils/memoria';
import {
  Comparacion,
  MetricasVistas,
  ResultadoEjecucion,
  VersionMapa,
} from '../models/resultado-ejecucion';

interface Resultados {
  readonly mapas: Record<VersionMapa, ResultadoEjecucion | null>;
  readonly vistas: Record<VersionMapa, MetricasVistas | null>;
}

const CLAVE_ALMACENAMIENTO = 'flyweight.resultados';
const SIN_RESULTADOS: Resultados = {
  mapas: { antes: null, despues: null },
  vistas: { antes: null, despues: null },
};

/** Evita divisiones entre cero cuando una medición da 0 ms. */
const MS_MINIMO = 0.1;

/**
 * Guarda la última ejecución de cada versión para compararlas aunque estén en
 * rutas distintas.
 *
 * Los resultados se guardan también en `sessionStorage`, así sobreviven a la
 * recarga que ocurre al cambiar de versión (para medir con la memoria limpia).
 */
@Injectable({ providedIn: 'root' })
export class ResultadosService {
  private readonly resultados = signal<Resultados>(leerAlmacenados());

  readonly antes = computed(() => this.resultados().mapas.antes);
  readonly despues = computed(() => this.resultados().mapas.despues);
  readonly vistasAntes = computed(() => this.resultados().vistas.antes);
  readonly vistasDespues = computed(() => this.resultados().vistas.despues);

  readonly comparacion = computed<Comparacion | null>(() => {
    const antes = this.antes();
    const despues = this.despues();
    return antes && despues ? comparar(antes, despues) : null;
  });

  /** Registra la carga de un mapa nuevo; sus vistas previas empiezan de cero. */
  registrar(resultado: ResultadoEjecucion): void {
    this.actualizar((r) => ({
      mapas: { ...r.mapas, [resultado.version]: resultado },
      vistas: { ...r.vistas, [resultado.version]: null },
    }));
  }

  /**
   * Registra una vista previa pedida al seleccionar una silla.
   *
   * @param renderizadas vistas distintas que existen ahora en memoria.
   */
  registrarVista(version: VersionMapa, ms: number, renderizadas: number): void {
    this.actualizar((r) => {
      const previas = r.vistas[version];
      const vistas: MetricasVistas = {
        solicitadas: (previas?.solicitadas ?? 0) + 1,
        renderizadas,
        ultimaMs: ms,
        totalMs: (previas?.totalMs ?? 0) + ms,
        memoriaEstimadaBytes: renderizadas * bytesDeImagen(ANCHO_VISTA, ALTO_VISTA),
      };
      return { ...r, vistas: { ...r.vistas, [version]: vistas } };
    });
  }

  limpiar(): void {
    this.actualizar(() => SIN_RESULTADOS);
  }

  private actualizar(cambio: (actuales: Resultados) => Resultados): void {
    this.resultados.update(cambio);
    guardar(this.resultados());
  }
}

function comparar(antes: ResultadoEjecucion, despues: ResultadoEjecucion): Comparacion {
  const veces = (lento: number, rapido: number) =>
    Math.max(lento, MS_MINIMO) / Math.max(rapido, MS_MINIMO);

  return {
    mismaCantidad: antes.cantidad === despues.cantidad,
    aceleracionCreacion: veces(antes.creacionMs, despues.creacionMs),
    aceleracionRender: veces(antes.renderMs, despues.renderMs),
    aceleracionTotal: veces(antes.totalMs, despues.totalMs),
    reduccionMemoria:
      antes.memoriaEstimadaBytes > 0
        ? 1 - despues.memoriaEstimadaBytes / antes.memoriaEstimadaBytes
        : 0,
    copiasEvitadas: antes.copiasDeLocalidad - despues.copiasDeLocalidad,
  };
}

// El almacenamiento puede no estar disponible (modo privado, sitio bloqueado),
// así que cualquier error se ignora y la app sigue funcionando sin él.

function leerAlmacenados(): Resultados {
  try {
    const texto = sessionStorage.getItem(CLAVE_ALMACENAMIENTO);
    if (!texto) return SIN_RESULTADOS;
    const guardados = JSON.parse(texto) as Partial<Resultados>;
    return {
      mapas: { ...SIN_RESULTADOS.mapas, ...guardados.mapas },
      vistas: { ...SIN_RESULTADOS.vistas, ...guardados.vistas },
    };
  } catch {
    return SIN_RESULTADOS;
  }
}

function guardar(resultados: Resultados): void {
  try {
    sessionStorage.setItem(CLAVE_ALMACENAMIENTO, JSON.stringify(resultados));
  } catch {
    // Sin almacenamiento: los resultados solo duran mientras no se recargue.
  }
}
