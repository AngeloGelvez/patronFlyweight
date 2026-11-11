import { Entrada } from './entrada';

const nueva = () => new Entrada({ zona: 'Lateral Oeste', fila: 12, asiento: 8, precio: 85 });

describe('Entrada (patrón State)', () => {
  it('empieza disponible', () => {
    expect(nueva().estadoActual.id).toBe('disponible');
  });

  it('recorre el camino feliz: reservar → pagar → entrar', () => {
    const entrada = nueva();
    expect(entrada.reservar().ok).toBeTrue();
    expect(entrada.estadoActual.id).toBe('reservada');
    expect(entrada.pagar().ok).toBeTrue();
    expect(entrada.estadoActual.id).toBe('pagada');
    expect(entrada.entrar().ok).toBeTrue();
    expect(entrada.estadoActual.id).toBe('usada');
  });

  it('una reserva cancelada vuelve a estar disponible', () => {
    const entrada = nueva();
    entrada.reservar();
    expect(entrada.cancelar().ok).toBeTrue();
    expect(entrada.estadoActual.id).toBe('disponible');
  });

  it('rechaza las acciones que no tocan y no cambia de estado', () => {
    const entrada = nueva();
    expect(entrada.pagar().ok).toBeFalse();
    expect(entrada.entrar().ok).toBeFalse();
    expect(entrada.cancelar().ok).toBeFalse();
    expect(entrada.estadoActual.id).toBe('disponible');
  });

  it('una entrada pagada no se devuelve', () => {
    const entrada = nueva();
    entrada.reservar();
    entrada.pagar();
    const r = entrada.cancelar();
    expect(r.ok).toBeFalse();
    expect(r.mensaje).toContain('devoluciones');
    expect(entrada.estadoActual.id).toBe('pagada');
  });

  it('una entrada usada no puede entrar dos veces', () => {
    const entrada = nueva();
    entrada.reservar();
    entrada.pagar();
    entrada.entrar();
    expect(entrada.entrar().ok).toBeFalse();
    expect(entrada.estadoActual.id).toBe('usada');
  });

  it('guarda el historial de cada intento', () => {
    const entrada = nueva();
    entrada.pagar();
    entrada.reservar();
    expect(entrada.historial.length).toBe(2);
  });
});
