import { CATALOGO } from './catalogo';
import { EventoPedido, Observador } from './observador';
import { AlertaAntifraude } from './observadores/alerta-antifraude';
import { NotificadorCorreo } from './observadores/notificador-correo';
import { PanelTaquilla } from './observadores/panel-taquilla';
import { Pedido } from './pedido';

const [FONDO, , , VIP] = CATALOGO;

function pedidoConEntrada(): Pedido {
  const pedido = new Pedido();
  pedido.anadirEntrada(FONDO);
  return pedido;
}

describe('Pedido · State', () => {
  it('no deja confirmar un carrito vacío', () => {
    const pedido = new Pedido();
    expect(pedido.confirmar().ok).toBeFalse();
    expect(pedido.estadoActual.id).toBe('carrito');
  });

  it('respeta el máximo de entradas por pedido', () => {
    const pedido = new Pedido();
    for (let i = 0; i < 4; i++) expect(pedido.anadirEntrada(FONDO).ok).toBeTrue();
    expect(pedido.anadirEntrada(FONDO).ok).toBeFalse();
    expect(pedido.entradas.length).toBe(4);
  });

  it('solo se tocan las entradas en el carrito', () => {
    const pedido = pedidoConEntrada();
    pedido.confirmar();
    expect(pedido.anadirEntrada(VIP).ok).toBeFalse();
    expect(pedido.quitarEntrada(0).ok).toBeFalse();
    expect(pedido.entradas.length).toBe(1);
  });

  it('camino feliz: carrito → pendiente → pagado', () => {
    const pedido = pedidoConEntrada();
    pedido.confirmar();
    expect(pedido.estadoActual.id).toBe('pendiente');
    expect(pedido.pagar().ok).toBeTrue();
    expect(pedido.estadoActual.id).toBe('pagado');
  });

  it('un pago rechazado no cambia de estado hasta el tercero, que cancela', () => {
    const pedido = pedidoConEntrada();
    pedido.confirmar();
    pedido.rechazarPago();
    pedido.rechazarPago();
    expect(pedido.estadoActual.id).toBe('pendiente');
    pedido.rechazarPago();
    expect(pedido.estadoActual.id).toBe('cancelado');
  });

  it('expirar la reserva cancela el pedido', () => {
    const pedido = pedidoConEntrada();
    pedido.confirmar();
    pedido.expirar();
    expect(pedido.estadoActual.id).toBe('cancelado');
  });

  it('el reembolso depende de los días que faltan', () => {
    const pedido = pedidoConEntrada();
    pedido.confirmar();
    pedido.pagar();
    pedido.diasParaElPartido = 3;
    expect(pedido.reembolsar().ok).toBeFalse();
    expect(pedido.estadoActual.id).toBe('pagado');
    pedido.diasParaElPartido = 10;
    expect(pedido.reembolsar().ok).toBeTrue();
    expect(pedido.estadoActual.id).toBe('reembolsado');
  });

  it('un pedido pagado no se cancela y los estados finales no admiten nada', () => {
    const pedido = pedidoConEntrada();
    pedido.confirmar();
    pedido.pagar();
    expect(pedido.cancelar().ok).toBeFalse();
    pedido.reembolsar();
    expect(pedido.pagar().ok).toBeFalse();
    expect(pedido.estadoActual.id).toBe('reembolsado');
  });
});

describe('Pedido · Observer', () => {
  it('avisa a todos los suscritos y deja de avisar a quien se da de baja', () => {
    const recibidos: EventoPedido[] = [];
    const observador: Observador = { nombre: 'espía', actualizar: (e) => recibidos.push(e) };
    const pedido = new Pedido();
    const baja = pedido.suscribir(observador);
    pedido.anadirEntrada(FONDO);
    expect(recibidos.length).toBe(1);
    baja();
    pedido.anadirEntrada(FONDO);
    expect(recibidos.length).toBe(1);
  });

  it('el evento de cambio de estado trae el estado anterior y el nuevo', () => {
    const recibidos: EventoPedido[] = [];
    const pedido = pedidoConEntrada();
    pedido.suscribir({ nombre: 'espía', actualizar: (e) => recibidos.push(e) });
    pedido.confirmar();
    expect(recibidos[0].tipo).toBe('estado-cambiado');
    expect(recibidos[0].de).toBe('carrito');
    expect(recibidos[0].a).toBe('pendiente');
  });

  it('una acción rechazada no notifica nada', () => {
    const recibidos: EventoPedido[] = [];
    const pedido = new Pedido();
    pedido.suscribir({ nombre: 'espía', actualizar: (e) => recibidos.push(e) });
    pedido.pagar();
    expect(recibidos.length).toBe(0);
  });

  it('el panel de taquilla suma pagos y resta reembolsos de varios pedidos', () => {
    const panel = new PanelTaquilla();
    const a = pedidoConEntrada();
    const b = new Pedido();
    for (const p of [a, b]) {
      p.suscribir(panel);
      p.anunciarCreacion();
    }
    b.anadirEntrada(VIP);
    for (const p of [a, b]) {
      p.confirmar();
      p.pagar();
    }
    expect(panel.ingresos()).toBe(45 + 280);
    expect(panel.entradasVendidas()).toBe(2);
    expect(panel.pedidosPorEstado().pagado).toBe(2);
    b.reembolsar();
    expect(panel.ingresos()).toBe(45);
    expect(panel.pedidosPorEstado().pagado).toBe(1);
    expect(panel.pedidosPorEstado().reembolsado).toBe(1);
    expect(panel.pedidosPorEstado().carrito).toBe(0);
  });

  it('el correo solo se escribe al cambiar de estado', () => {
    const correo = new NotificadorCorreo();
    const pedido = pedidoConEntrada();
    pedido.suscribir(correo);
    expect(correo.correos().length).toBe(0);
    pedido.confirmar();
    pedido.pagar();
    expect(correo.correos().length).toBe(2);
    expect(correo.correos()[0].asunto).toContain('listas');
  });

  it('el antifraude avisa al segundo rechazo y bloquea al tercero', () => {
    const antifraude = new AlertaAntifraude();
    const pedido = pedidoConEntrada();
    pedido.suscribir(antifraude);
    pedido.confirmar();
    pedido.rechazarPago();
    expect(antifraude.alertas().length).toBe(0);
    pedido.rechazarPago();
    expect(antifraude.alertas().length).toBe(1);
    pedido.rechazarPago();
    expect(antifraude.alertas().length).toBe(2);
  });
});
