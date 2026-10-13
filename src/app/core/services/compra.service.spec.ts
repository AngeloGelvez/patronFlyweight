import { TestBed } from '@angular/core/testing';
import { DetalleSilla } from '../models/mapa-de-sillas';
import { CompraService, DatosAsistente } from './compra.service';

const SILLA: DetalleSilla = {
  id: 'OCC-102-F1-N5',
  tribuna: 'OCCIDENTAL',
  zona: 'VIP',
  seccion: 'OCC-102',
  fila: 1,
  numero: 5,
  x: 900,
  y: 760,
  estado: 'DISPONIBLE',
  localidad: {
    id: 'VIP',
    nombre: 'VIP',
    descripcion: '',
    precio: 280,
    color: '#eda100',
    beneficios: [],
    terminosYCondiciones: '',
  },
};

const ASISTENTE: DatosAsistente = {
  nombre: 'Ana Gómez',
  tipoDocumento: 'DNI',
  documento: '12345678Z',
  correo: 'ana@ejemplo.com',
  celular: '612345678',
};

describe('CompraService', () => {
  let compra: CompraService;

  beforeEach(() => {
    sessionStorage.clear();
    compra = TestBed.inject(CompraService);
  });

  it('recorre los pasos hasta la boleta', () => {
    expect(compra.paso()).toBe('silla');

    compra.elegirSilla(SILLA, 25_000);
    expect(compra.paso()).toBe('datos');

    compra.guardarDatos(ASISTENTE);
    expect(compra.paso()).toBe('pago');

    compra.pagar('TARJETA');
    expect(compra.paso()).toBe('boleta');
    expect(compra.codigo()).toMatch(/^MET-[0-9A-Z]{7}$/);
  });

  it('suma el 10 % de gastos de gestión', () => {
    compra.elegirSilla(SILLA, 25_000);

    expect(compra.cargoServicio()).toBe(28);
    expect(compra.total()).toBe(308);
  });

  it('descarta la silla si el mapa se carga con otro aforo', () => {
    compra.elegirSilla(SILLA, 25_000);
    compra.sincronizarAforo(50_000);

    expect(compra.silla()).toBeNull();
    expect(compra.paso()).toBe('silla');
  });

  it('conserva una boleta ya comprada aunque cambie el aforo', () => {
    compra.elegirSilla(SILLA, 25_000);
    compra.guardarDatos(ASISTENTE);
    compra.pagar('BIZUM');
    compra.sincronizarAforo(50_000);

    expect(compra.paso()).toBe('boleta');
    expect(compra.silla()?.id).toBe(SILLA.id);
  });

  it('recupera la compra después de recargar la página', () => {
    compra.elegirSilla(SILLA, 25_000);

    const recargada = new CompraService();
    expect(recargada.silla()?.id).toBe(SILLA.id);
    expect(recargada.paso()).toBe('datos');
  });
});
