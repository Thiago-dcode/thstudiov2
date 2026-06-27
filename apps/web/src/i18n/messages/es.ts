import type { Translations } from "./en";

const messages: Translations = {
  landing: {
    hero: {
      titlePrefix: "Haz que tu",
      titleAccent: "arte",
      titleSuffix: "sea descubierto.",
      subtitle:
        "Crea un sitio web profesional para tu arte con la misma facilidad con la que actualizas tus redes sociales.",
      primaryCtaLoggedIn: "Acceder a Atelier",
      primaryCtaLoggedOut: "Empieza gratis ahora",
      secondaryCta: "Encuentra artistas",
      waitList: {
        hook: "Únete a la lista de espera para obtener acceso anticipado a la app.",
        label: "Únete a la lista de espera para artistas",
        placeholder: "Introduce tu correo electrónico",
        button: "Unirme a la lista",
        buttonPending: "Uniéndote...",
        hint: "Únete a la lista de espera, consigue acceso anticipado y beneficios.",
        hintTooltip:
          "Los cupos anticipados son limitados y se asignan en el orden en que los artistas se unen.",
        successToast: "Ya estás en la lista de espera. Te avisaremos pronto.",
        successTitle: "Solo falta un paso más: confirma tu correo.",
        successMessage:
          "Te enviamos un correo de confirmación. Ábrelo y haz clic en el enlace para asegurar tu acceso anticipado.",
        successReserveMessage: "Reservaremos tu correo después de validarlo.",
      },
      disclaimer: "Gratis para empezar · No se requiere tarjeta",
    },
    valuePillars: {
      header: {
        badge: "Por qué A11STUDIO",
        title: "Creado por un artista para artistas",
        description:
          "Un espacio profesional para tu obra, con la inteligencia necesaria para hacer crecer tu carrera y la simplicidad para no frenarte.",
      },
      items: [
        {
          title: "Tu sitio. Tan fácil como las redes sociales.",
          description:
            "Se ve y funciona como un sitio web personalizado, pero puedes reorganizar, actualizar y publicar tan rápido como subir una historia. Organiza toda tu obra de forma clara y atractiva, sin tocar una línea de código.",
        },
        {
          title: "La IA hace el trabajo pesado",
          description:
            "¿No sabes qué poner en tu biografía? Deja que la IA la genere. ¿Necesitas descripciones, etiquetas o SEO? La IA escribe, optimiza y posiciona tu portafolio para que la audiencia correcta te encuentre.",
        },
        {
          title: "Creado para conexiones reales",
          description:
            "Esto no es un feed que oculta tu trabajo. Clientes, coleccionistas y colaboradores llegan a tu portafolio y te contactan directamente. Una plataforma pensada para fortalecer la relación entre artista y cliente.",
        },
      ],
    },
    socialProof: {
      highlights: [
        "Calidad de web profesional, facilidad de red social",
        "La IA escribe tus biografías, etiquetas y posicionamiento",
        "Los clientes te descubren y te contactan directamente",
      ],
      cta: "Empieza gratis ahora",
    },
    featureCategories: {
      header: {
        badge: "Explorar",
        title: "Categorías destacadas",
        description:
          "Descubre artistas por disciplina: cada ruta te lleva a resultados seleccionados con criterio.",
      },
      card: {
        browse: "Ver",
        ariaBrowseArtistsIn: "Explorar artistas en",
      },
    },
    featuredArtists: {
      header: {
        badge: "Descubrir",
        title: "Artistas con quienes puedes conectar hoy mismo",
        description:
          "Cada portafolio es una línea directa entre artista y cliente. Explora, descubre e inicia una conversación.",
      },
      browseAll: "Ver todos los artistas",
    },
    featuredPortfolio: {
      header: {
        badge: "Inspírate",
        title: "Inspírate con este portafolio",
        description: "Esto es lo que podrás crear.",
      },
      by: "Creado por",
      viewProfile: "Ver el perfil de @{username}",
    },
    cta: {
      badge: "¿Listo para empezar?",
      title: "Tu próximo cliente está buscando a alguien como tú",
      description:
        "Crea un portafolio profesional en minutos, deja que la IA se encargue del resto y empieza a ser descubierto. Gratis para empezar, sin tarjeta y sin condiciones.",
      button: "Crear mi portafolio",
    },
  },
  faqs: {
    title: "Preguntas frecuentes",
    stillHaveQuestions:
      "¿Aún tienes preguntas? Estamos aquí para <link>ayudar</link>",
    items: [
      {
        question: "¿Qué es A11STUDIO?",
        answer:
          "A11STUDIO es una plataforma de portafolios creada para artistas visuales que combina la presencia de un sitio web profesional con la facilidad de uso de las redes sociales. Obtienes un sitio pulido y con aspecto personalizado, pero actualizarlo es tan sencillo como publicar una historia. Sin código, sin conocimientos de diseño web: solo arrastra, suelta y publica.",
      },
      {
        question: "¿Qué es un portafolio?",
        answer:
          'Un portafolio es tu selección destacada: una muestra cuidada de tu mejor trabajo dentro de una disciplina o estilo. Por ejemplo, un portafolio de "Fotografía de bodas" presentaría las mejores imágenes de todas las bodas que has cubierto. Es lo que los clientes ven para evaluar tu talento y contratarte.',
      },
      {
        question: "¿Qué es una colección?",
        answer:
          'Una colección agrupa un proyecto o evento específico. Por ejemplo, "Boda de María y Juan 2024" sería una colección con todas las fotos entregadas de esa sesión. Es la forma de organizar trabajos individuales, sesiones o cuerpos de obra.',
      },
      {
        question: "¿Cuál es la diferencia entre un portafolio y una colección?",
        answer:
          'Un portafolio reúne lo mejor de tu trabajo: una vitrina que abarca múltiples proyectos para demostrar tu experiencia en una disciplina (por ejemplo, "Fotografía de bodas"). Una colección corresponde a un solo proyecto o evento (por ejemplo, "Boda de María y Juan 2024"). Piensa en los portafolios como lo que te ayuda a conseguir clientes y en las colecciones como la forma de organizar cada trabajo.',
      },
      {
        question: "¿Por qué A11STUDIO usa IA?",
        answer:
          "Para que puedas concentrarte en lo que mejor haces: crear arte. La IA se encarga del trabajo detrás de escena: genera títulos, descripciones y etiquetas optimizados para SEO, categoriza tus medios automáticamente y escribe texto alternativo para que los motores de búsqueda y los asistentes de IA puedan encontrarte. No necesitas aprender SEO ni marketing: solo sube tus mejores piezas y la IA ayuda a que la audiencia correcta las descubra.",
      },
      {
        question: "¿Puedo usar A11STUDIO gratis?",
        answer:
          "Sí. A11STUDIO ofrece un plan gratuito que te permite crear tu perfil, construir portafolios y empezar a mostrar tu trabajo de inmediato. Los planes premium desbloquean funciones adicionales, como herramientas impulsadas por IA, más almacenamiento y opciones avanzadas de personalización.",
      },
    ],
  },
  language: "Idioma",
  footer: {
    tagline: "La plataforma de portafolios creada para artistas.",
    legal: {
      heading: "Legal",
      privacy: "Política de privacidad",
      terms: "Términos de servicio",
      cookies: "Política de cookies",
    },
    contact: {
      heading: "Contacto",
      support: "Soporte",
    },
    copyright: "© {year} A11STUDIO. Todos los derechos reservados.",
  },
  search: {
    segments: {
      artists: "Artistas",
      portfolios: "Portafolios",
    },
    page: {
      description:
        "Explora artistas en A11STUDIO. Descubre portafolios profesionales, servicios creativos y artistas visuales listos para colaborar.",
      title: "Artistas — A11STUDIO",
      errorHeading: "No pudimos cargar {segment}",
      errorMessage:
        "Algo salió mal durante la búsqueda. Inténtalo de nuevo en un momento.",
      searchingFor: "Buscando {segment}",
      results: {
        foundArtists:
          "{count, number} {count, plural, one {artista encontrado} other {artistas encontrados}}{suffix}",
        foundPortfolios:
          "{count, number} {count, plural, one {portafolio encontrado} other {portafolios encontrados}}{suffix}",
        forQuery: ' para "{query}"',
      },
      empty: {
        heading: "No se encontraron {segment}{suffix}",
        output:
          "Tus filtros no coinciden con ningún {segment}. Prueba ampliar tu búsqueda{end}",
        lookNear: " o busca {segment} cerca de ti.",
      },
    },
    filters: {
      activeFilters: "Filtros activos",
      clearAll: "Limpiar todo",
      searchAria: "Buscar {segment}",
      searchPlaceholder: "Buscar {segment} por nombre, estilo o categoría…",
      badge: {
        search: "Búsqueda: {value}",
        geoLocation: "Mi ubicación",
        country: "País: {value}",
        state: "Estado: {value}",
        city: "Ciudad: {value}",
      },
    },
    nearMe: {
      gettingLocation: "Obteniendo ubicación…",
      nearMe: "Cerca de mí · {radius} km",
      searchClose: "Buscar cerca de mí",
      locationDenied:
        "Activa la ubicación en la configuración del navegador e inténtalo de nuevo.",
      locationUnavailable:
        "No pudimos obtener tu ubicación. Inténtalo de nuevo.",
    },
    primaryFilters: {
      categories: "Categorías",
      location: "Ubicación",
      ariaLabel: "Filtros de categorías y ubicación",
      useMyLocation: "Usar mi ubicación",
    },
    combobox: {
      placeholder: "Buscar…",
      empty: {
        pending: "",
        noMatches: "No hay coincidencias.",
        noItems: "—",
        searchingCategories: "Escribe para buscar categorías.",
      },
    },
    artistCard: {
      openProfile: "Abrir perfil: {name}, @{username}",
      specialtiesTitle: "Especialidades",
      locationDetailsTitle: "Detalles de ubicación en el perfil",
      noLocationTitle: "Ubicación no disponible",
      viewAction: "Ver",
    },
  },
  support: {
    contactLabel: "Contactar con soporte",
    title: "¿Necesitas ayuda? Envíanos un mensaje.",
    description:
      "Cuéntanos qué ocurre y elige el tema más adecuado para que podamos dirigir tu solicitud más rápido. Nuestro equipo responderá al correo que proporciones.",
    formContainer: {
      nameLabel: "Nombre",
      namePlaceholder: "Tu nombre",
      emailLabel: "Correo electrónico",
      emailPlaceholder: "tu@correo.com",
      subjectLabel: "Asunto",
      messageLabel: "Mensaje",
      messagePlaceholder: "Cuéntanos cómo podemos ayudarte...",
      submitButton: "Enviar a soporte",
      successToast: "Tu mensaje se envió a soporte.",
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
  waitListValidate: {
    metadata: {
      title: "Validar correo - A11STUDIO",
      description:
        "Valida tu dirección de correo electrónico para confirmar tu lugar en la lista de espera.",
    },
    page: {
      label: "Lista de espera",
      title: "¡Correo validado!",
      description:
        "Gracias. Tu correo ha sido validado. Te enviaremos la invitación cuando esté lista.",
      status: "Ya está todo listo.",
    },
  },
  subscriptionCallback: {
    success: {
      title: "Activación completada.",
      subtitle: "Tu suscripción ya está activa.",
    },
    failed: {
      title: "Activación incompleta.",
      subtitle:
        "No pudimos activar tu suscripción. Por favor, inténtalo de nuevo.",
    },
    tryAgain: "Intentar de nuevo",
    continue: "Continuar",
    skipForNow: "Omitir por ahora",
    cancel: "Cancelar",
  },
  editUser: {
    banner: {
      alt: "Banner",
      editTitle: "Editar banner",
      preview: "Vista previa del banner:",
      previewAlt: "Vista previa del banner",
    },
    avatar: {
      editTitle: "Editar avatar",
      preview: "Vista previa del perfil:",
      previewAlt: "Vista previa del perfil",
      alt: "Avatar del usuario",
    },
    profile: {
      editTitle: "Editar perfil",
      professionFallback: "Título profesional",
      biographyFallback: "Biografía breve",
      firstName: {
        label: "Nombre",
        placeholder: "Leonardo",
      },
      lastName: {
        label: "Apellido",
        placeholder: "Piero da Vinci",
      },
      profession: {
        label: "Profesión",
        placeholder: "Polímata renacentista y soñador profesional",
      },
      shortBio: {
        label: "Biografía breve sobre ti",
        placeholder:
          "Dibujo máquinas voladoras en el desayuno y disecciono la curiosidad para vivir...",
      },
    },
    address: {
      editTitle: "Editar dirección",
      noAddress: "Sin dirección registrada",
      updateDescription:
        "Actualiza tu información de dirección a continuación.",
      warningDescription:
        "Advertencia: Actualizar tu dirección podría afectar tu descubrimiento y visibilidad en los resultados de búsqueda. Actualízala solo si realmente lo necesitas",
    },
    categories: {
      title: "Categorías",
      editTitle: "Editar categorías",
    },
    update: "Actualizar",
  },
  addressForm: {
    label: "Dirección",
    searchPlaceholder: "Busca tu dirección…",
    searching: "Buscando ubicaciones…",
    noLocations: "No se encontraron ubicaciones.",
    minCharsHint: "Escribe al menos 3 caracteres para buscar.",
    saving: "Guardando dirección…",
  },
  userCategories: {
    searchLabel: "Buscar una categoría",
    searchPlaceholder: "diseño...",
    clickHint: "Haz clic en las categorías que desees",
    noResults: "Sin resultados",
    loadMore: "más",
  },
};

export default messages;
