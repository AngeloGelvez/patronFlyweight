import type { ItemEntrada } from '../catalogo';
import type { Pedido } from '../pedido';
import { Accion, Resultado } from '../resultado';

export type EstadoPedidoId = 'carrito' | 'pendiente' | 'pagado' | 'cancelado' | 'reembolsado';

/**
 * ESTADO. Una operación por cada acción posible sobre un pedido. Los estados
 * concretos implementan solo las suyas; el resto cae en `rechazar`.
 */
export abstract class EstadoPedido {
  abstract readonly id: EstadoPedidoId;
  abstract readonly nombre: string;
  abstract readonly descripcion: string;

  anadirEntrada(_pedido: Pedido, _item: ItemEntrada): Resultado {
    return this.rechazar('añadir entradas');
  }
  quitarEntrada(_pedido: Pedido, _posicion: number): Resultado {
    return this.rechazar('quitar entradas');
  }
  confirmar(_pedido: Pedido): Resultado {
    return this.rechazar('confirmar');
  }
  pagar(_pedido: Pedido): Resultado {
    return this.rechazar('pagar');
  }
  rechazarPago(_pedido: Pedido): Resultado {
    return this.rechazar('rechazar el pago');
  }
  expirar(_pedido: Pedido): Resultado {
    return this.rechazar('expirar');
  }
  cancelar(_pedido: Pedido): Resultado {
    return this.rechazar('cancelar');
  }
  reembolsar(_pedido: Pedido): Resultado {
    return this.rechazar('reembolsar');
  }

  protected rechazar(accion: Accion): Resultado {
    return { ok: false, mensaje: `No se puede ${accion} un pedido ${this.nombre.toLowerCase()}.` };
  }
}
