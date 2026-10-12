import { Injectable } from '@angular/core';

export interface Medicion<T> {
  readonly resultado: T;
  readonly ms: number;
}

/** `performance.memory` no es estándar: solo existe en navegadores Chromium. */
type PerformanceConMemoria = Performance & {
  readonly memory?: { readonly usedJSHeapSize: number };
};

/**
 * Mide cuánto tarda una tarea.
 *
 * `console.time` / `console.timeEnd` dejan el registro en la consola de
 * DevTools, pero no devuelven el valor. Por eso se mide en paralelo con
 * `performance.now()`, que sí entrega el número para mostrarlo en pantalla.
 */
@Injectable({ providedIn: 'root' })
export class PerformanceMonitorService {
  medir<T>(etiqueta: string, tarea: () => T): Medicion<T> {
    console.time(etiqueta);
    const inicio = performance.now();

    try {
      const resultado = tarea();
      return { resultado, ms: performance.now() - inicio };
    } finally {
      // Se cierra el temporizador incluso si la tarea lanza un error.
      console.timeEnd(etiqueta);
    }
  }

  /** Heap de JavaScript en uso, o `null` si el navegador no lo expone. */
  heapUsadoBytes(): number | null {
    return (performance as PerformanceConMemoria).memory?.usedJSHeapSize ?? null;
  }
}
