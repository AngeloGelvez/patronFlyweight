import { Dibujante } from './dibujante';
import { DibujanteCanvas } from './dibujantes/dibujante-canvas';
import { DibujanteSvg } from './dibujantes/dibujante-svg';
import { DibujanteTexto } from './dibujantes/dibujante-texto';
import { crearEscena } from './escena';
import { EntradaImprimible } from './vistas/entrada-imprimible';
import { MapaDeAsientos } from './vistas/mapa-de-asientos';
import { VistaDelEstadio } from './vistas/vista-del-estadio';
import { VistaDesdeElAsiento } from './vistas/vista-desde-el-asiento';

/** Menos asientos que en la página: las pruebas van más rápido. */
const ASIENTOS = 200;

function contextoCanvas(): CanvasRenderingContext2D {
  const ctx = document.createElement('canvas').getContext('2d');
  if (!ctx) throw new Error('Sin contexto 2D en el navegador de pruebas.');
  return ctx;
}

describe('Patrón Bridge', () => {
  const escena = crearEscena(ASIENTOS);

  /** Las tres abstracciones, cada una lista para recibir cualquier motor. */
  const vistas: readonly ((dibujante: Dibujante) => VistaDelEstadio)[] = [
    (d) => new MapaDeAsientos(d, escena.plano),
    (d) => new VistaDesdeElAsiento(d, escena.zona.nombre, escena.localidad.color),
    (d) => new EntradaImprimible(d, escena.entrada),
  ];

  /** Los tres motores. */
  const motores: readonly (() => Dibujante)[] = [
    () => new DibujanteCanvas(contextoCanvas()),
    () => new DibujanteSvg(),
    () => new DibujanteTexto(),
  ];

  it('combina las 3 vistas con los 3 motores: 9 combinaciones con 6 clases', () => {
    const combinaciones = vistas.flatMap((crearVista) =>
      motores.map((crearMotor) => crearVista(crearMotor()).dibujar()),
    );

    expect(combinaciones.length).toBe(9);
    expect(combinaciones.every((resultado) => resultado.tipo !== undefined)).toBeTrue();
  });

  it('la misma vista produce una salida distinta según el motor', () => {
    const [crearMapa] = vistas;

    expect(crearMapa(new DibujanteCanvas(contextoCanvas())).dibujar().tipo).toBe('canvas');
    expect(crearMapa(new DibujanteSvg()).dibujar().tipo).toBe('svg');
    expect(crearMapa(new DibujanteTexto()).dibujar().tipo).toBe('texto');
  });

  it('el motor de texto describe un asiento por cada silla del plano', () => {
    const resultado = new MapaDeAsientos(new DibujanteTexto(), escena.plano).dibujar();
    if (resultado.tipo !== 'texto') throw new Error('Se esperaba una salida de texto.');

    const asientos = resultado.lineas
      .filter((linea) => linea.includes('× asiento'))
      .reduce((total, linea) => total + Number(linea.trim().split(' ')[0]), 0);

    expect(asientos).toBe(ASIENTOS);
  });

  it('el motor SVG convierte la etiqueta en texto alternativo', () => {
    const resultado = new MapaDeAsientos(new DibujanteSvg(), escena.plano).dibujar();
    if (resultado.tipo !== 'svg') throw new Error('Se esperaba una salida SVG.');

    expect(resultado.marcado).toContain('<svg');
    expect(resultado.marcado).toContain('<title>césped</title>');
  });

  it('la entrada no repite el nombre cuando la zona coincide con la localidad', () => {
    expect(escena.entrada.ubicacion).not.toMatch(/^(.+) · \1$/);
  });
});
