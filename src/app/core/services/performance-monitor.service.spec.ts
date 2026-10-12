import { TestBed } from '@angular/core/testing';
import { PerformanceMonitorService } from './performance-monitor.service';

describe('PerformanceMonitorService', () => {
  let servicio: PerformanceMonitorService;

  beforeEach(() => {
    servicio = TestBed.inject(PerformanceMonitorService);
    spyOn(console, 'time');
    spyOn(console, 'timeEnd');
  });

  it('devuelve el resultado de la tarea y su duración', () => {
    const medicion = servicio.medir('tarea', () => 42);

    expect(medicion.resultado).toBe(42);
    expect(medicion.ms).toBeGreaterThanOrEqual(0);
  });

  it('abre y cierra console.time con la misma etiqueta', () => {
    servicio.medir('Crear objetos', () => null);

    expect(console.time).toHaveBeenCalledWith('Crear objetos');
    expect(console.timeEnd).toHaveBeenCalledWith('Crear objetos');
  });

  it('cierra console.time aunque la tarea falle', () => {
    expect(() =>
      servicio.medir('falla', () => {
        throw new Error('boom');
      }),
    ).toThrowError('boom');

    expect(console.timeEnd).toHaveBeenCalledWith('falla');
  });
});
