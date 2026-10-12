import { computed, Injectable, signal } from '@angular/core';
import { Comparacion, ResultadoEjecucion, VersionMapa } from '../models/resultado-ejecucion';

type Resultados = Record<VersionMapa, ResultadoEjecucion | null>;

const CLAVE_ALMACENAMIENTO = 'flyweight.resultados';
const SIN_RESULTADOS: Resultados = { antes: null, despues: null };

/** Evita divisiones entre cero cuando una medición da 0 ms. */
const MS_MINIMO = 0.1;

/**
 * Guarda la última ejecución de cada versión para compararlas aunque estén en
 * rutas distintas.
 *
 * Los resultados se guardan también en `sessionStorage`, así sobreviven a una
 * recarga de la pestaña (recomendada para medir cada versión con la memoria
 * limpia).
 */
@Injectable({ providedIn: 'root' })
export class ResultadosService {
  private readonly resultados = signal<Resultados>(leerAlmacenados());

  readonly antes = computed(() => this.resultados().antes);
  readonly despues = computed(() => this.resultados().despues);

  readonly comparacion = computed<Comparacion | null>(() => {
    const antes = this.antes();
    const despues = this.despues();
    return antes && despues ? comparar(antes, despues) : null;
  });

  registrar(resultado: ResultadoEjecucion): void {
    this.resultados.update((actuales) => ({ ...actuales, [resultado.version]: resultado }));
    guardar(this.resultados());
  }

  limpiar(): void {
    this.resultados.set(SIN_RESULTADOS);
    guardar(SIN_RESULTADOS);
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
    return texto ? { ...SIN_RESULTADOS, ...(JSON.parse(texto) as Partial<Resultados>) } : SIN_RESULTADOS;
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
