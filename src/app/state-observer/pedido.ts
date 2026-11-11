import { ItemEntrada } from './catalogo';
import { EnCarrito } from './estados/en-carrito';
import { EstadoPedido } from './estados/estado-pedido';
import { EventoPedido, Sujeto, TipoEvento } from './observador';
import { Resultado } from './resultado';

let contadorPedidos = 0;

/**
 * CONTEXTO (State) y SUJETO (Observer) a la vez.
 *
 *  - Como contexto: delega cada acción en su estado actual.
 *  - Como sujeto: cada vez que algo importante ocurre, avisa a sus observadores.
 *
 * Los dos patrones no se estorban: el estado decide QUÉ pasa y a qué estado se
 * va; el observador solo se entera DESPUÉS de que ocurrió.
 */
export class Pedido extends Sujeto {
  readonly id = ++contadorPedidos;
  /** Días que faltan para el partido (lo cambia la página para probar el reembolso). */
  diasParaElPartido = 30;

  private estado: EstadoPedido = new EnCarrito();
  private _entradas: ItemEntrada[] = [];
  private _pagosRechazados = 0;

  constructor(private readonly ahora: () => Date = () => new Date()) {
    super();
  }

  get estadoActual(): EstadoPedido {
    return this.estado;
  }
  get entradas(): readonly ItemEntrada[] {
    return this._entradas;
  }
  get total(): number {
    return this._entradas.reduce((suma, item) => suma + item.precio, 0);
  }
  get pagosRechazados(): number {
    return this._pagosRechazados;
  }

  /** Avisa de que el pedido existe; se llama una vez, después de suscribir a los observadores. */
  anunciarCreacion(): void {
    this.emitir('pedido-creado', null, 'Pedido creado.');
  }

  // --- Acciones públicas: todas se delegan al estado actual -------------------
  anadirEntrada(item: ItemEntrada): Resultado {
    return this.estado.anadirEntrada(this, item);
  }
  quitarEntrada(posicion: number): Resultado {
    return this.estado.quitarEntrada(this, posicion);
  }
  confirmar(): Resultado {
    return this.estado.confirmar(this);
  }
  pagar(): Resultado {
    return this.estado.pagar(this);
  }
  rechazarPago(): Resultado {
    return this.estado.rechazarPago(this);
  }
  expirar(): Resultado {
    return this.estado.expirar(this);
  }
  cancelar(): Resultado {
    return this.estado.cancelar(this);
  }
  reembolsar(): Resultado {
    return this.estado.reembolsar(this);
  }

  // --- Operaciones que usan los estados ---------------------------------------
  cambiarEstado(nuevo: EstadoPedido, detalle: string): void {
    const anterior = this.estado;
    this.estado = nuevo;
    this.emitir('estado-cambiado', anterior, detalle);
  }

  agregar(item: ItemEntrada): void {
    this._entradas = [...this._entradas, item];
    this.emitir('entrada-añadida', null, `Se añadió ${item.nombre} (${item.precio} €).`);
  }

  retirar(posicion: number): void {
    const quitada = this._entradas[posicion];
    this._entradas = this._entradas.filter((_, i) => i !== posicion);
    this.emitir('entrada-quitada', null, `Se quitó ${quitada.nombre}.`);
  }

  /** Cuenta un pago rechazado, avisa y devuelve cuántos van. */
  registrarPagoRechazado(): number {
    this._pagosRechazados++;
    this.emitir('pago-rechazado', null, `Pago rechazado (${this._pagosRechazados}).`);
    return this._pagosRechazados;
  }

  private emitir(tipo: TipoEvento, de: EstadoPedido | null, detalle: string): void {
    const evento: EventoPedido = {
      tipo,
      pedidoId: this.id,
      de: de?.id ?? null,
      a: this.estado.id,
      detalle,
      entradas: this._entradas.length,
      total: this.total,
      pagosRechazados: this._pagosRechazados,
      momento: this.ahora(),
    };
    this.notificar(evento);
  }
}
