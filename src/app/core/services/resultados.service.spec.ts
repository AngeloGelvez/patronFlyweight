import { TestBed } from '@angular/core/testing';
import { ResultadoEjecucion } from '../models/resultado-ejecucion';
import { ResultadosService } from './resultados.service';

function resultado(parcial: Partial<ResultadoEjecucion>): ResultadoEjecucion {
  return {
    version: 'antes',
    cantidad: 10_000,
    cargaDatosMs: 20,
    creacionMs: 1_000,
    renderMs: 200,
    totalMs: 1_220,
    copiasDeLocalidad: 10_000,
    iconos: 10_000,
    memoriaEstimadaBytes: 1_000_000,
    heapUsadoBytes: null,
    fecha: '2026-10-12T00:00:00.000Z',
    ...parcial,
  };
}

describe('ResultadosService', () => {
  beforeEach(() => sessionStorage.clear());

  it('no compara hasta tener ambas versiones', () => {
    const servicio = TestBed.inject(ResultadosService);
    servicio.registrar(resultado({ version: 'antes' }));

    expect(servicio.antes()?.version).toBe('antes');
    expect(servicio.comparacion()).toBeNull();
  });

  it('calcula cuánto mejora la versión con Flyweight', () => {
    const servicio = TestBed.inject(ResultadosService);
    servicio.registrar(resultado({ version: 'antes' }));
    servicio.registrar(
      resultado({
        version: 'despues',
        creacionMs: 10,
        renderMs: 50,
        totalMs: 80,
        copiasDeLocalidad: 6,
        iconos: 6,
        memoriaEstimadaBytes: 100_000,
      }),
    );

    const comparacion = servicio.comparacion()!;
    expect(comparacion.mismaCantidad).toBeTrue();
    expect(comparacion.aceleracionCreacion).toBe(100);
    expect(comparacion.aceleracionRender).toBe(4);
    expect(comparacion.reduccionMemoria).toBeCloseTo(0.9);
    expect(comparacion.copiasEvitadas).toBe(9_994);
  });

  it('avisa cuando las cantidades no coinciden', () => {
    const servicio = TestBed.inject(ResultadosService);
    servicio.registrar(resultado({ version: 'antes', cantidad: 10_000 }));
    servicio.registrar(resultado({ version: 'despues', cantidad: 50_000 }));

    expect(servicio.comparacion()!.mismaCantidad).toBeFalse();
  });

  it('recupera los resultados después de recargar la página', () => {
    TestBed.inject(ResultadosService).registrar(resultado({ version: 'despues' }));

    // Una nueva instancia simula la recarga de la pestaña.
    const recargado = new ResultadosService();
    expect(recargado.despues()?.version).toBe('despues');
  });

  it('limpia los resultados', () => {
    const servicio = TestBed.inject(ResultadosService);
    servicio.registrar(resultado({ version: 'antes' }));
    servicio.limpiar();

    expect(servicio.antes()).toBeNull();
    expect(new ResultadosService().antes()).toBeNull();
  });
});
