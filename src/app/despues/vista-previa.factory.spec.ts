import { VistaPreviaFactory } from './vista-previa.factory';

describe('VistaPreviaFactory', () => {
  it('dibuja una sola vista por zona y la reutiliza', () => {
    const fabrica = new VistaPreviaFactory();

    const primera = fabrica.obtenerVista('GENERAL_SUR');
    const segunda = fabrica.obtenerVista('GENERAL_SUR');

    expect(segunda).toBe(primera);
    expect(fabrica.cantidad).toBe(1);
  });

  it('crea vistas distintas para zonas distintas', () => {
    const fabrica = new VistaPreviaFactory();

    expect(fabrica.obtenerVista('GENERAL_NORTE')).not.toBe(fabrica.obtenerVista('GENERAL_SUR'));
    expect(fabrica.cantidad).toBe(2);
  });
});
