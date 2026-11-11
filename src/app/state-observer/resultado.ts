/** Lo que responde un pedido cuando se le pide una acción. */
export interface Resultado {
  readonly ok: boolean;
  readonly mensaje: string;
}

export type Accion =
  | 'añadir entradas'
  | 'quitar entradas'
  | 'confirmar'
  | 'pagar'
  | 'rechazar el pago'
  | 'expirar'
  | 'cancelar'
  | 'reembolsar';
