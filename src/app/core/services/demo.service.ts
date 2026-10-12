import { Injectable, signal } from '@angular/core';
import { CANTIDADES_DISPONIBLES } from '../data/estadio.generator';

const CLAVE_ALMACENAMIENTO = 'flyweight.aforo';
const AFORO_POR_DEFECTO = 25_000;

/**
 * Opciones de la barra de demostración (no forman parte del sitio real).
 * El aforo se conserva al cambiar de versión, porque ese cambio recarga la
 * página.
 */
@Injectable({ providedIn: 'root' })
export class DemoService {
  readonly aforos = CANTIDADES_DISPONIBLES;
  readonly aforo = signal<number>(leerAforo());

  cambiarAforo(aforo: number): void {
    this.aforo.set(aforo);
    try {
      sessionStorage.setItem(CLAVE_ALMACENAMIENTO, String(aforo));
    } catch {
      // Sin almacenamiento, el aforo vuelve al valor por defecto al recargar.
    }
  }
}

function leerAforo(): number {
  try {
    const guardado = Number(sessionStorage.getItem(CLAVE_ALMACENAMIENTO));
    return (CANTIDADES_DISPONIBLES as readonly number[]).includes(guardado) ? guardado : AFORO_POR_DEFECTO;
  } catch {
    return AFORO_POR_DEFECTO;
  }
}
