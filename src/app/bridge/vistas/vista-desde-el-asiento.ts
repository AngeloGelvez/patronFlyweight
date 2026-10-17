import { Dibujante } from '../dibujante';
import { VistaDelEstadio } from './vista-del-estadio';

/** Colores de la ropa del público, repartidos de forma fija. */
const PALETA_PUBLICO = ['#1e293b', '#f8fafc', '#dc2626', '#1d4ed8', '#facc15', '#64748b'];

const HORIZONTE = 210;

/**
 * ABSTRACCIÓN REFINADA · Lo que se ve del campo desde una zona.
 *
 * Es una escena sencilla en perspectiva, hecha solo con rectángulos, líneas
 * y un círculo. Como todo se describe con figuras básicas, el mismo código
 * sirve para los tres motores.
 */
export class VistaDesdeElAsiento extends VistaDelEstadio {
  readonly titulo = 'Vista desde el asiento';
  readonly descripcion = 'Cómo se ve el terreno de juego desde la zona elegida.';
  readonly ancho = 900;
  readonly alto = 500;

  constructor(
    dibujante: Dibujante,
    private readonly zona: string,
    private readonly colorLocalidad: string,
  ) {
    super(dibujante);
  }

  protected dibujarContenido(): void {
    const blanco = { borde: '#ffffff', grosor: 3 } as const;

    this.dibujante.rectangulo(0, 0, this.ancho, HORIZONTE, {
      relleno: '#cfe6f7',
      etiqueta: 'cielo',
    });

    // Grada de enfrente, con el público encima.
    this.dibujante.rectangulo(0, 86, this.ancho, 124, {
      relleno: '#dbe3ec',
      etiqueta: 'grada de enfrente',
    });
    this.dibujarPublico();

    this.dibujante.rectangulo(0, 198, this.ancho, 12, {
      relleno: '#aebbc9',
      etiqueta: 'muro perimetral',
    });

    // Césped con sus franjas de corte.
    this.dibujante.rectangulo(0, HORIZONTE, this.ancho, 240, {
      relleno: '#4c9a45',
      etiqueta: 'césped',
    });
    for (let i = 0; i < 6; i += 2) {
      this.dibujante.rectangulo(i * 150, HORIZONTE, 150, 240, {
        relleno: '#58a950',
        etiqueta: 'franja de césped',
      });
    }

    // Las líneas se abren hacia el espectador para dar sensación de distancia.
    this.dibujante.linea(300, 234, 600, 234, { ...blanco, etiqueta: 'línea de fondo' });
    this.dibujante.linea(300, 234, 0, 448, { ...blanco, etiqueta: 'banda izquierda' });
    this.dibujante.linea(600, 234, 900, 448, { ...blanco, etiqueta: 'banda derecha' });
    this.dibujante.linea(140, 330, 760, 330, { ...blanco, etiqueta: 'línea de medio campo' });
    this.dibujante.circulo(450, 330, 48, { ...blanco, etiqueta: 'círculo central' });
    this.dibujante.rectangulo(360, 234, 180, 44, { ...blanco, etiqueta: 'área de portería' });
    this.dibujante.rectangulo(405, 206, 90, 28, { ...blanco, etiqueta: 'portería' });

    // Barandilla en primer plano, del color de la localidad.
    this.dibujante.rectangulo(0, 450, this.ancho, 50, {
      relleno: this.colorLocalidad,
      etiqueta: 'barandilla de la grada',
    });
    this.dibujante.texto(24, 476, `Vista desde ${this.zona}`, {
      tamano: 24,
      negrita: true,
      color: '#ffffff',
    });
  }

  private dibujarPublico(): void {
    for (let fila = 0; fila < 4; fila++) {
      for (let i = 0; i < 56; i++) {
        this.dibujante.rectangulo(8 + i * 16, 94 + fila * 26, 10, 14, {
          relleno: PALETA_PUBLICO[(i * 7 + fila * 3) % PALETA_PUBLICO.length],
          radio: 3,
          etiqueta: 'espectador',
        });
      }
    }
  }
}
