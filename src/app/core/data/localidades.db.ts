/**
 * "Tabla" de localidades del estadio.
 *
 * Cada localidad agrupa miles de asientos que comparten exactamente la misma
 * información: precio, color, beneficios y términos y condiciones. Ese es el
 * estado intrínseco que el patrón Flyweight va a compartir.
 */
export type LocalidadId =
  | 'VIP'
  | 'PALCO'
  | 'PREFERENCIAL'
  | 'OCCIDENTAL'
  | 'ORIENTAL'
  | 'GENERAL';

export interface LocalidadRegistro {
  readonly id: LocalidadId;
  readonly nombre: string;
  readonly descripcion: string;
  /** Precio en euros. */
  readonly precio: number;
  /** Color con el que se pinta el asiento en el mapa. */
  readonly color: string;
  readonly beneficios: readonly string[];
  /** Texto legal largo (~2 KB) que el usuario acepta al comprar. */
  readonly terminosYCondiciones: string;
}

/** Cláusulas que aplican a todas las localidades. */
const TERMINOS_GENERALES: readonly string[] = [
  '1. La entrada da derecho a acceder a un único partido, en la fecha, hora y asiento indicados. No es válida para partidos aplazados a otra sede salvo comunicación oficial del organizador.',
  '2. El acceso se realiza exclusivamente con el código QR digital asociado a la compra. Cada código se valida una sola vez; las capturas de pantalla, copias o reventas no autorizadas pueden ser anuladas sin derecho a reembolso.',
  '3. Las puertas del estadio se abren dos (2) horas antes del inicio del partido. El organizador no garantiza el acceso de los espectadores que lleguen una vez iniciada la primera parte.',
  '4. Está prohibido introducir armas, objetos punzantes, bengalas, petardos, bebidas alcohólicas, sustancias estupefacientes, paraguas, cascos, cadenas y cualquier objeto que pueda usarse como proyectil.',
  '5. Todo espectador está sujeto a registro por parte del personal de seguridad y de la Policía Nacional. Negarse al registro implica la pérdida del derecho de acceso sin reembolso del importe pagado.',
  '6. El espectador autoriza el uso de su imagen captada durante el partido en retransmisiones de televisión, plataformas digitales y material promocional del organizador, sin que ello genere contraprestación alguna.',
  '7. Las entradas no admiten cambios ni devoluciones, salvo en caso de suspensión definitiva del partido. En ese caso se reembolsará el importe de la entrada, sin incluir los gastos de gestión, en un plazo de treinta (30) días hábiles.',
  '8. Los menores de catorce (14) años deben acceder acompañados por un adulto responsable y contar con su propia entrada. Por motivos de seguridad no se permite el acceso de menores de cinco (5) años.',
  '9. El espectador debe ocupar únicamente el asiento indicado en su entrada. El personal de seguridad podrá reubicar o desalojar a quien ocupe un asiento distinto o permanezca en escaleras y vías de evacuación.',
  '10. Las conductas violentas, racistas, xenófobas o intolerantes darán lugar a la expulsión inmediata del estadio y a las sanciones previstas en la Ley 19/2007, contra la violencia, el racismo, la xenofobia y la intolerancia en el deporte.',
];

/** Arma el texto legal completo con las cláusulas propias de cada localidad. */
function terminos(...clausulasPropias: string[]): string {
  return [...TERMINOS_GENERALES, ...clausulasPropias].join('\n\n');
}

export const LOCALIDADES: readonly LocalidadRegistro[] = [
  {
    id: 'PALCO',
    nombre: 'Palco',
    descripcion:
      'Zona privada en el anfiteatro del lateral oeste, con la mejor vista panorámica del terreno de juego.',
    precio: 450,
    color: '#4a3aa7',
    beneficios: [
      'Acceso por puerta exclusiva sin colas',
      'Catering y bebidas durante todo el partido',
      'Asiento acolchado con reposabrazos',
      'Plaza de aparcamiento cubierta incluida',
      'Bufanda oficial de regalo',
    ],
    terminosYCondiciones: terminos(
      '11. El servicio de catering comienza dos (2) horas antes del partido y finaliza al terminar la segunda parte. Las bebidas alcohólicas solo se sirven a mayores de edad dentro del palco.',
      '12. La plaza de aparcamiento incluida está sujeta a disponibilidad y se asigna por orden de llegada. El vehículo debe retirarse como máximo una (1) hora después de finalizado el partido.',
    ),
  },
  {
    id: 'VIP',
    nombre: 'VIP',
    descripcion:
      'Primeras filas del lateral oeste, en el centro del campo y a pie de césped.',
    precio: 280,
    color: '#eda100',
    beneficios: [
      'Acceso preferente por la puerta 1',
      'Zona lounge con comida y bebida',
      'Asiento acolchado numerado',
      'Bufanda oficial de regalo',
    ],
    terminosYCondiciones: terminos(
      '11. El acceso a la zona lounge requiere la pulsera entregada en la puerta 1. La pulsera es personal e intransferible y su pérdida no da derecho a reposición.',
    ),
  },
  {
    id: 'PREFERENCIAL',
    nombre: 'Preferencia',
    descripcion:
      'Grada baja central del lateral este, frente a las cámaras de televisión y a los banquillos.',
    precio: 160,
    color: '#e34948',
    beneficios: [
      'Acceso por la puerta 5 con colas reducidas',
      'Asiento numerado con respaldo',
      'Zona de restauración exclusiva de la grada',
    ],
    terminosYCondiciones: terminos(
      '11. La zona de restauración exclusiva funciona hasta el final del descanso. Los precios de la comida y la bebida no están incluidos en la entrada.',
    ),
  },
  {
    id: 'OCCIDENTAL',
    nombre: 'Lateral Oeste',
    descripcion: 'Grada lateral oeste, bajo la cubierta que protege de la lluvia y del sol.',
    precio: 110,
    color: '#2a78d6',
    beneficios: ['Asiento numerado', 'Grada cubierta', 'Videomarcador frente a la grada'],
    terminosYCondiciones: terminos(),
  },
  {
    id: 'ORIENTAL',
    nombre: 'Lateral Este',
    descripcion: 'Grada lateral este, con vista completa del terreno de juego desde el costado.',
    precio: 90,
    color: '#1baf7a',
    beneficios: ['Asiento numerado', 'Vista lateral de todo el campo'],
    terminosYCondiciones: terminos(),
  },
  {
    id: 'GENERAL',
    nombre: 'Fondo',
    descripcion: 'Fondos norte y sur, detrás de las porterías. El ambiente más animado del estadio.',
    precio: 55,
    color: '#eb6834',
    beneficios: ['Asiento numerado', 'Ambiente de animación detrás de la portería'],
    terminosYCondiciones: terminos(
      '11. En los fondos solo se permite el acceso de banderas sin mástil y de instrumentos musicales autorizados previamente por el organizador.',
    ),
  },
];

/**
 * Simula una consulta a la base de datos: busca una localidad por su id.
 */
export function obtenerLocalidad(id: LocalidadId): LocalidadRegistro {
  const localidad = LOCALIDADES.find((l) => l.id === id);
  if (!localidad) {
    throw new Error(`La localidad "${id}" no existe en la base de datos.`);
  }
  return localidad;
}
