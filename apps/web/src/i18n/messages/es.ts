import type { Messages } from './en';

const messages: Messages = {
  landing: {
    hero: {
      titlePrefix: "Haz que tu",
      titleAccent: "arte",
      titleSuffix: "sea descubierto.",
      subtitle:
        "Crea un perfil de artista hermoso como un sitio web profesional y personalizalo tan rapido como actualizar tu feed social.",
      primaryCtaLoggedIn: "Acceder a Atelier",
      primaryCtaLoggedOut: "Empieza gratis ahora",
      secondaryCta: "Explorar artistas",
      disclaimer: "Gratis para empezar · No se requiere tarjeta",
    },
    valuePillars: {
      header: {
        badge: "Por que A11STUDIO",
        title: "Hecho por un artista para artistas",
        description:
          "Un hogar profesional para tu trabajo, con la inteligencia para hacer crecer tu carrera y la simplicidad para no frenarte.",
      },
      items: [
        {
          title: "Tu sitio. Tan facil como redes sociales.",
          description:
            "Se ve y funciona como un sitio web personalizado, pero puedes reorganizar, actualizar y publicar tan rapido como subir una historia. Organiza todo tu trabajo de forma hermosa, sin tocar una linea de codigo.",
        },
        {
          title: "La IA hace el trabajo pesado",
          description:
            "No sabes que poner en tu bio? Deja que la IA la genere. Necesitas descripciones, etiquetas o SEO? La IA escribe, optimiza y posiciona tu portafolio para que la audiencia correcta te encuentre.",
        },
        {
          title: "Creado para conexiones reales",
          description:
            "Esto no es un feed que esconde tu trabajo. Clientes, coleccionistas y colaboradores llegan a tu portafolio y te contactan directamente. Una plataforma pensada para la relacion artista-cliente.",
        },
      ],
    },
    socialProof: {
      highlights: [
        "Calidad de web profesional, facilidad de red social",
        "La IA escribe tus bios, etiquetas y posicionamiento",
        "Los clientes te descubren y te contactan directo",
      ],
      cta: "Empieza gratis ahora",
    },
    featureCategories: {
      header: {
        badge: "Explorar",
        title: "Categorias destacadas",
        description:
          "Descubre artistas por disciplina: cada ruta te lleva a resultados curados.",
      },
      card: {
        browse: "Ver",
        ariaBrowseArtistsIn: "Explorar artistas en",
      },
    },
    featuredArtists: {
      header: {
        badge: "Descubrir",
        title: "Artistas con quienes puedes conectar hoy",
        description:
          "Cada portafolio es una linea directa entre artista y cliente. Navega, descubre e inicia una conversacion.",
      },
      browseAll: "Ver todos los artistas",
    },
    cta: {
      badge: "Listo para empezar?",
      title: "Tu proximo cliente esta buscando a alguien como tu",
      description:
        "Crea un portafolio impactante en minutos, deja que la IA se encargue del resto y empieza a ser descubierto. Gratis para empezar, sin tarjeta y sin condiciones.",
      button: "Crea tu portafolio",
    },
  },
  faqs: {
    title: "Preguntas frecuentes",
    stillHaveQuestions: "¿Aún tienes preguntas? Estamos aquí para <link>ayudar</link>",
    items: [
      {
        question: "¿Qué es A11STUDIO?",
        answer:
          "A11STUDIO es una plataforma de portafolios creada para artistas visuales que se encuentra justo entre un sitio web profesional y la facilidad de las redes sociales. Obtienes un sitio pulido y con aspecto personalizado, pero actualizarlo es tan sencillo como publicar una historia. Sin código, sin habilidades de diseño web, solo arrastra, suelta y publica.",
      },
      {
        question: "¿Qué es un portafolio?",
        answer:
          "Un portafolio es tu resumen destacado: una selección cuidada de tu mejor trabajo dentro de una disciplina o estilo. Por ejemplo, un portafolio de \"Fotografía de Bodas\" presentaría las mejores fotos de todas las bodas que has cubierto. Es lo que los clientes ven para juzgar tu habilidad y contratarte.",
      },
      {
        question: "¿Qué es una colección?",
        answer:
          "Una colección es un proyecto o evento específico agrupado. Por ejemplo, \"Boda de María y Juan 2024\" sería una colección que contiene todas las fotos entregadas de esa sesión en particular. Es cómo organizas trabajos individuales, sesiones o cuerpos de trabajo.",
      },
      {
        question: "¿Cuál es la diferencia entre un portafolio y una colección?",
        answer:
          "Un portafolio es lo mejor de lo mejor: una vitrina que abarca múltiples proyectos para demostrar tu experiencia en una disciplina (por ejemplo, \"Fotografía de Bodas\"). Una colección es un solo proyecto o evento (por ejemplo, \"Boda de María y Juan 2024\"). Piensa en los portafolios como lo que te consigue el trabajo y las colecciones como cómo organizas cada trabajo.",
      },
      {
        question: "¿Por qué A11STUDIO usa IA?",
        answer:
          "Para que puedas concentrarte en lo que mejor haces: crear arte. La IA se encarga de todo lo demás entre bastidores: genera títulos, descripciones y etiquetas optimizados para SEO para tu trabajo, categoriza tus medios automáticamente y escribe texto alternativo para que los motores de búsqueda y los asistentes de IA puedan encontrarte. Nunca necesitas aprender sobre SEO o marketing: solo sube tus mejores piezas y la IA se asegura de que la audiencia correcta las descubra.",
      },
      {
        question: "¿Puedo usar A11STUDIO gratis?",
        answer:
          "¡Sí! A11STUDIO ofrece un plan gratuito que te permite crear tu perfil, construir portafolios y comenzar a mostrar tu trabajo de inmediato. Los planes premium desbloquean funciones adicionales como herramientas impulsadas por IA, más almacenamiento y opciones avanzadas de personalización.",
      },
    ],
  },
  language: "Idioma",
  support: {
    contactLabel: "Contactar con Soporte",
    title: "¿Necesitas ayuda? Envíanos un mensaje.",
    description:
      "Cuéntanos tu problema y elige el tema más adecuado para que podamos dirigir tu solicitud más rápido. Nuestro equipo responderá al correo que proporciones.",
    formContainer: {
      nameLabel: "Nombre",
      namePlaceholder: "Tu nombre",
      emailLabel: "Correo electrónico",
      emailPlaceholder: "tu@correo.com",
      subjectLabel: "Asunto",
      messageLabel: "Mensaje",
      messagePlaceholder: "Cuéntanos cómo podemos ayudarte...",
      submitButton: "Enviar a soporte",
      successToast: "Tu mensaje fue enviado a soporte.",
    },
    subjects: [
      { value: "General question", label: "Pregunta general" },
      { value: "Technical issue", label: "Problema técnico" },
      { value: "Billing and plans", label: "Facturación y planes" },
      { value: "Account access", label: "Acceso a la cuenta" },
      { value: "Feature request", label: "Solicitud de función" },
      { value: "Partnership", label: "Colaboración" },
    ],
  },
};

export default messages;
