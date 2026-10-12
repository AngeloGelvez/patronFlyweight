import { TestBed } from '@angular/core/testing';
import { EstadioSinFlyweight } from '../../antes/estadio-sin-flyweight';
import { EstadioConFlyweight } from '../../despues/estadio-con-flyweight';
import { BenchmarkService } from './benchmark.service';
import { ResultadosService } from './resultados.service';

describe('BenchmarkService', () => {
  let servicio: BenchmarkService;
  let resultados: ResultadosService;

  beforeEach(() => {
    sessionStorage.clear();
    spyOn(console, 'time');
    spyOn(console, 'timeEnd');
    spyOn(console, 'group');
    spyOn(console, 'groupEnd');
    spyOn(console, 'table');
    servicio = TestBed.inject(BenchmarkService);
    resultados = TestBed.inject(ResultadosService);
  });

  it('mide la versión con Flyweight y registra el resultado', () => {
    const renderizar = jasmine.createSpy('renderizar');

    const { mapa, resultado } = servicio.ejecutar({
      version: 'despues',
      cantidad: 1_000,
      crearMapa: (plano) => new EstadioConFlyweight(plano),
      renderizar,
    });

    expect(renderizar).toHaveBeenCalledOnceWith(mapa);
    expect(resultado.cantidad).toBe(1_000);
    expect(resultado.copiasDeLocalidad).toBe(6);
    expect(resultado.iconos).toBe(6);
    expect(resultado.totalMs).toBeCloseTo(
      resultado.cargaDatosMs + resultado.creacionMs + resultado.renderMs,
    );
    expect(resultados.despues()).toEqual(resultado);
  });

  it('usa una etiqueta de console.time por paso', () => {
    servicio.ejecutar({
      version: 'antes',
      cantidad: 500,
      crearMapa: (plano) => new EstadioSinFlyweight(plano),
      renderizar: () => undefined,
    });

    expect(console.time).toHaveBeenCalledWith('[Sin Flyweight] 500 sillas · 1. Cargar datos');
    expect(console.time).toHaveBeenCalledWith('[Sin Flyweight] 500 sillas · 2. Crear objetos');
    expect(console.time).toHaveBeenCalledWith('[Sin Flyweight] 500 sillas · 3. Dibujar mapa');
    expect(console.timeEnd).toHaveBeenCalledTimes(3);
    expect(console.groupEnd).toHaveBeenCalled();
  });

  it('crea una copia de la localidad por silla en la versión sin Flyweight', () => {
    const { resultado } = servicio.ejecutar({
      version: 'antes',
      cantidad: 500,
      crearMapa: (plano) => new EstadioSinFlyweight(plano),
      renderizar: () => undefined,
    });

    expect(resultado.copiasDeLocalidad).toBe(500);
    expect(resultado.iconos).toBe(500);
  });
});
