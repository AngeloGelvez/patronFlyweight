import { ItemEntrada, MAX_ENTRADAS_POR_PEDIDO } from '../catalogo';
import type { Pedido } from '../pedido';
import { Resultado } from '../resultado';
import { Cancelado } from './cancelado';
import { EstadoPedido } from './estado-pedido';
import { PendienteDePago } from './pendiente-de-pago';

/** El pedido se está armando: es el único estado donde se pueden tocar las entradas. */
export class EnCarrito extends EstadoPedido {
  readonly id = 'carrito';
  readonly nombre = 'En carrito';
  readonly descripcion = 'Se están eligiendo las entradas.';

  override anadirEntrada(pedido: Pedido, item: ItemEntrada): Resultado {
    if (pedido.entradas.length >= MAX_ENTRADAS_POR_PEDIDO) {
      return { ok: false, mensaje: `Máximo ${MAX_ENTRADAS_POR_PEDIDO} entradas por pedido.` };
    }
    pedido.agregar(item);
    return { ok: true, mensaje: `Añadida: ${item.nombre}.` };
  }

  override quitarEntrada(pedido: Pedido, posicion: number): Resultado {
    const item = pedido.entradas[posicion];
    if (!item) return { ok: false, mensaje: 'Esa entrada no está en el carrito.' };
    pedido.retirar(posicion);
    return { ok: true, mensaje: `Quitada: ${item.nombre}.` };
  }

  override confirmar(pedido: Pedido): Resultado {
    if (pedido.entradas.length === 0) {
      return { ok: false, mensaje: 'El carrito está vacío: añade al menos una entrada.' };
    }
    pedido.cambiarEstado(new PendienteDePago(), 'El cliente confirmó el pedido.');
    return { ok: true, mensaje: 'Pedido confirmado. Paga antes de que expire la reserva.' };
  }

  override cancelar(pedido: Pedido): Resultado {
    pedido.cambiarEstado(new Cancelado(), 'El cliente abandonó el carrito.');
    return { ok: true, mensaje: 'Pedido cancelado.' };
  }
}
