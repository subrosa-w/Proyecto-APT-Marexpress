// Textos y datos del sitio público.
// Si cambia un teléfono o un servicio, se cambia aquí y se actualiza en todas las páginas.

import fotoCamiones from '../assets/camiones-marexpress.png'

const mensajeWhatsapp = 'Hola Marexpress, quiero cotizar un despacho.'

export const contacto = {
  telefono: '+56 9 3532 2898',
  // ?text= deja el mensaje ya escrito en WhatsApp al abrirlo
  whatsappUrl: `https://wa.me/56935322898?text=${encodeURIComponent(mensajeWhatsapp)}`,
  web: 'transportesmarexpress.cl',
}

// Redes sociales del footer. "color" es la clase del color de cada marca al pasar el mouse.
// PENDIENTE: reemplazar los '#' por los links reales de la empresa.
export const redes = [
  { nombre: 'WhatsApp', url: contacto.whatsappUrl, color: 'hover:bg-[#25D366]' },
  { nombre: 'Facebook', url: '#', color: 'hover:bg-[#1877F2]' },
  { nombre: 'Instagram', url: '#', color: 'hover:bg-linear-to-tr hover:from-[#FEDA75] hover:via-[#D62976] hover:to-[#4F5BD5]' },
  { nombre: 'LinkedIn', url: '#', color: 'hover:bg-[#0A66C2]' },
]

export const menu = [
  { texto: 'Inicio', ruta: '/' },
  { texto: 'Servicios', ruta: '/servicios' },
  { texto: 'Cobertura', ruta: '/cobertura' },
  { texto: 'Nosotros', ruta: '/nosotros' },
  { texto: 'Seguimiento', ruta: '/seguimiento' },
]

// Imágenes generadas por Stitch. Son links externos: conviene descargarlas
// a src/assets/ e importarlas, porque estos links pueden dejar de funcionar.
export const imagenes = {
  // Foto real de los camiones de la empresa (esta sí está guardada en el proyecto)
  camiones: fotoCamiones,
  camionRuta:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBsrIGS2YHDhwHeIuv6ykxnqMeX9wF5pOGkz5Jz9z3FDiD2sBcTDIPL3ubdngBV0Do4Dg69VdIkv657p3oodk3HgYJjsKGAZwF9-cKEV6A_5HQuzQ1gGPF2ogWc3fS2OyZhzMvtd2f_5EEWJVA-t5M_fHu53nJolrrPEot17aF5et2fG7cgsH-QTsW9TMP7FtTA9Bw2EyAmhB3R8JaOc9k9IMvOTY-Jn0QSEpf9AYMj0evQTGfm89ET',
  transporte:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBQtSyNnhHKKiNGxy3K5k1f3Hn_cZkWSRl8Ts38j9VykpGQMYrxyXrngRQVOSzNqgA0mmLJif6OWKrtubAi2bKGlonYHBQPflWKK4vCShbq8hGDMvcqb_XQpqnAdxpY99fLJk2uDOCUimfVre3dB38PxumazwSKy7wZ7MS7MWdhcK7n0XJBZUzor_9Xz5_rM97nEgcAa-zGQL6q5H0EQwcsj3ofUq8Y7sKVqN0j-f_YF_icaJOupRyB',
  distribucion:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuC5DikcdnontjCZVX8Y2U9hm0gaK0ziBymy4VhTCLfqEFEDUCTwJInXhksRGJhoVJJzdD3yB6kchzf5ukdKRE795U20wMoCGhrUqDGS7yllk6P_gF4BshNxZd8WKNRtJvoRJ99_wElg6wRklJG6EL3447llFZrX613V6xb0T1tmikdT3wCpB6IHGNxMu9bj18BoHxFij_3YdAaYfgENNgISlpeTXL2iv_KDUBG8oYAq1KgJjVBYzBlw',
  almacenaje:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCThP_tcMhFYrS9SU-_3KE8iV3fT_2mYxxjR4rg6Hqg3yhuBbF20GGO_bjYYb-cTimDZK59_rnnNehVX36-ioS0jXqzk0GTvrMMPfBqTq7d6_-noEhmlmG-WUl5kr5KxiR_83fzA5N4Yfg9oGcQ0qADFgV7sauRCVdvbodBij8fO1E3nLKZBenxyQaMvJS9WDqZ9hV2bvV5sOY1Tm4Q-dXj3xMuKvsS6A-hvWxuQVtUOgzHGaoloP0Y',
  bodega:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAYaGG3trug9e2fRshn7YFPhoR2KT86h9ajLgHJhWVsukUZ8XyKJ35JYmjMqhhjuGF82s2oDXcAjj-7aI-NQnqLrvJpH7dQqsawHZacBbgYPmZ8Hganbgb-A8_o7QA2zeNMbKjbvJtwnRfIBlWjP-5EPpE7j9CZwmZgmHXNlHqsFzQHwk-4doHXR7b1oRe594BvDVGPykNzBEn3p1blfry328mPz552DyjN6G4x_3Pd1CBIjSgRZq8D',
  carretera:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCNsNcjq0Lj8eXtFiVGUvWLzOlZgeJ-K7YwPeWn3Vb7kN7wZFIGIQVy4yKUhZceTYSI9ylXUCl00mSiuMQt21dL6irQNxVZc4uKIzEPLi95FWZMVbt8HQIxEJs1Qn_41At6Gvfjt-4mNXJ9rvlUxElUo4Pf5D7SkHrth7e-_mypaCB9jBZG2Y8BGYVmaKnarNzxdsO6DzsQMxE-H2-W3AVHxLYuxJa0apOKJzCi-Fg0HKGKAq489TYk',
}

export const estadisticas = [
  { icono: 'map', valor: '4 zonas', detalle: 'Santiago, Puerto Montt, Osorno, Chiloé' },
  { icono: 'warehouse', valor: '2 depósitos', detalle: 'propios en Santiago y Puerto Montt' },
  { icono: 'forklift', valor: '90%', detalle: 'de la flota con montacargas' },
  { icono: 'home_pin', valor: 'Sin costo', detalle: 'entrega a domicilio en Chiloé' },
]

export const pasos = [
  'Solicitas el despacho',
  'Emitimos la orden de transporte',
  'Tu carga viaja con manifiesto',
  'Entregamos y registramos la entrega',
]

export const servicios = [
  {
    titulo: 'Transporte de carga',
    icono: 'local_shipping',
    resumen:
      'Traslado de mercadería entre nuestras cuatro zonas de cobertura, con orden de transporte por cada despacho.',
    descripcion:
      'Traslado de mercadería entre Santiago, Puerto Montt, Osorno y Chiloé, con orden de transporte emitida por cada despacho y seguimiento disponible en línea.',
    imagen: imagenes.transporte,
    puntos: [
      'Carga paletizada y bultos sueltos',
      'Orden de transporte con remitente, destinatario y detalle de encomienda',
      'Manifiesto de carga por cada viaje',
    ],
  },
  {
    titulo: 'Distribución',
    icono: 'home_pin',
    tituloLargo: 'Distribución y última milla',
    resumen:
      'Entrega directa al domicilio del destinatario, sin costo en Puerto Montt y Chiloé.',
    descripcion:
      'Entrega directa al domicilio del destinatario, sin costo adicional en Puerto Montt y Chiloé.',
    imagen: imagenes.distribucion,
    puntos: [
      'Entrega a domicilio sin costo en Puerto Montt y Chiloé',
      'Registro de la recepción con fecha y hora',
      'Coordinación previa con el destinatario',
    ],
  },
  {
    titulo: 'Almacenaje',
    icono: 'warehouse',
    resumen: 'Depósitos propios en Santiago y Puerto Montt para acopiar mercadería.',
    descripcion:
      'Depósitos propios en Santiago y Puerto Montt para acopiar mercadería antes de su distribución.',
    imagen: imagenes.almacenaje,
    puntos: [
      'Depósito en Santiago',
      'Depósito en Puerto Montt',
      '90% de la flota equipada con montacargas para carga y descarga',
    ],
  },
]

export const zonas = [
  { nombre: 'Santiago', detalle: 'Depósito propio. Origen de la carga hacia el sur.' },
  {
    nombre: 'Puerto Montt',
    detalle: 'Depósito propio. Centro de operaciones. Entrega a domicilio sin costo.',
  },
  { nombre: 'Osorno', detalle: 'Zona de distribución en ruta.' },
  { nombre: 'Chiloé', detalle: 'Distribución en la isla. Entrega a domicilio sin costo.' },
]
