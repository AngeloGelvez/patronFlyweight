import { LOCALIDADES } from '../core/data/localidades.db';
import { LocalidadFactory } from './localidad.factory';

describe('LocalidadFactory', () => {
  it('devuelve la misma instancia para la misma localidad', () => {
    const fabrica = new LocalidadFactory();

    expect(fabrica.obtenerLocalidad('VIP')).toBe(fabrica.obtenerLocalidad('VIP'));
    expect(fabrica.cantidad).toBe(1);
  });

  it('crea una sola instancia por localidad aunque se pida miles de veces', () => {
    const fabrica = new LocalidadFactory();

    for (let i = 0; i < 1_000; i++) {
      for (const { id } of LOCALIDADES) {
        fabrica.obtenerLocalidad(id);
      }
    }

    expect(fabrica.cantidad).toBe(LOCALIDADES.length);
  });

  it('entrega localidades inmutables', () => {
    const vip = new LocalidadFactory().obtenerLocalidad('VIP');

    expect(Object.isFrozen(vip)).toBeTrue();
    expect(Object.isFrozen(vip.datos)).toBeTrue();
    expect(Object.isFrozen(vip.datos.beneficios)).toBeTrue();
  });
});
