import { Dibujante } from '../dibujante';
import { VistaDelEstadio } from './vista-del-estadio';

/** Todo lo que necesita la entrada, ya preparado como texto. */
export interface DatosEntrada {
  readonly partido: string;
  readonly competicion: string;
  readonly fecha: string;
  /** Localidad y zona ya combinadas, p. ej. «Fondo · Fondo Sur». */
  readonly ubicacion: string;
  readonly color: string;
  readonly puerta: string;
  readonly seccion: string;
  readonly fila: number;
  readonly asiento: number;
  readonly precio: string;
  readonly codigo: string;
}

/**
 * ABSTRACCIÓN REFINADA · La entrada lista para imprimir.
 *
 * Es la vista que mejor explica por qué conviene tener varios motores: en
 * pantalla basta el canvas, pero para imprimirla sin que se vea pixelada
 * interesa el SVG. La entrada no cambia: solo cambia el dibujante.
 */
export class EntradaImprimible extends VistaDelEstadio {
  readonly titulo = 'Entrada imprimible';
  readonly descripcion = 'La entrada del asiento elegido, con su código de acceso.';
  readonly ancho = 900;
  readonly alto = 440;

  constructor(
    dibujante: Dibujante,
    private readonly datos: DatosEntrada,
  ) {
    super(dibujante);
  }

  protected dibujarContenido(): void {
    const d = this.datos;

    this.dibujante.rectangulo(0, 0, this.ancho, this.alto, {
      relleno: '#ffffff',
      borde: '#cbd5e1',
      grosor: 2,
      radio: 18,
      etiqueta: 'papel de la entrada',
    });
    this.dibujante.rectangulo(0, 0, this.ancho, 14, {
      relleno: d.color,
      etiqueta: 'banda de la localidad',
    });

    this.dibujante.texto(40, 56, d.competicion.toUpperCase(), {
      tamano: 16,
      negrita: true,
      color: '#047857',
    });
    this.dibujante.texto(40, 92, d.partido, { tamano: 32, negrita: true, color: '#0f172a' });
    this.dibujante.texto(40, 126, d.fecha, { tamano: 18, color: '#475569' });

    this.dibujante.linea(40, 154, 860, 154, { borde: '#e2e8f0', grosor: 2 });

    // Cuatro datos en fila: acceso, sección, fila y asiento.
    const columnas = [
      { etiqueta: 'ACCESO', valor: d.puerta },
      { etiqueta: 'SECCIÓN', valor: d.seccion },
      { etiqueta: 'FILA', valor: String(d.fila) },
      { etiqueta: 'ASIENTO', valor: String(d.asiento) },
    ];
    columnas.forEach((columna, i) => {
      const x = 40 + i * 150;
      this.dibujante.texto(x, 186, columna.etiqueta, { tamano: 14, color: '#64748b' });
      this.dibujante.texto(x, 214, columna.valor, { tamano: 24, negrita: true, color: '#0f172a' });
    });

    this.dibujante.texto(40, 262, 'LOCALIDAD', { tamano: 14, color: '#64748b' });
    this.dibujante.rectangulo(40, 280, 16, 16, { relleno: d.color, radio: 4, etiqueta: 'color de la localidad' });
    this.dibujante.texto(66, 288, d.ubicacion, {
      tamano: 22,
      negrita: true,
      color: '#0f172a',
    });

    this.dibujante.texto(40, 340, 'IMPORTE', { tamano: 14, color: '#64748b' });
    this.dibujante.texto(40, 368, d.precio, { tamano: 26, negrita: true, color: '#0f172a' });

    // Recuadro del código de acceso, separado por una línea vertical.
    this.dibujante.linea(640, 40, 640, 400, { borde: '#e2e8f0', grosor: 2 });
    this.dibujante.rectangulo(680, 110, 160, 160, {
      relleno: '#f1f5f9',
      borde: '#0f172a',
      grosor: 2,
      radio: 10,
      etiqueta: 'recuadro del código de acceso',
    });
    this.dibujante.texto(760, 190, 'CÓDIGO', { tamano: 16, color: '#64748b', alineacion: 'centro' });
    this.dibujante.texto(760, 300, d.codigo, {
      tamano: 22,
      negrita: true,
      color: '#0f172a',
      alineacion: 'centro',
    });
    this.dibujante.texto(760, 336, 'Presenta tu documento', {
      tamano: 14,
      color: '#64748b',
      alineacion: 'centro',
    });
  }
}
