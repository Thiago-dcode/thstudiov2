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
        badge: "Portafolio destacado",
        title: "Inspírate con este portafolio",
        description:
          "Un portafolio real en A11STUDIO — curado, pulido y listo para compartir.",
      },
      by: "Creado por",
      viewProfile: "Ver el perfil de @{username}",
      exploreMore: "Inspírate",
    },
    cta: {
      badge: "¿Listo para empezar?",
      title: "Tu próximo cliente está buscando a alguien como tú",
      description:
        "Crea un portafolio profesional en minutos, deja que la IA se encargue del resto y empieza a ser descubierto. Gratis para empezar, sin tarjeta y sin condiciones.",
      button: "Crear mi portafolio",
      waitListButton: "Únete a la lista de espera",
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
  about: {
    metadata: {
      title: "Acerca de — A11STUDIO",
      description:
        "Conoce A11STUDIO — la plataforma de portafolios que combina sitios web profesionales con la facilidad de las redes sociales, creada por un artista para artistas.",
    },
    hero: {
      label: "Acerca de",
      title: "La plataforma de portafolios creada para artistas",
      lead: "A11STUDIO une el acabado de un portafolio profesional con la simplicidad de las redes sociales — para que nunca tengas que elegir entre uno u otro.",
    },
    what: {
      title: "¿Qué es A11STUDIO?",
      paragraphs: [
        "Los sitios web tradicionales dan a los artistas control total sobre cómo presentan su obra. Las redes sociales hacen que publicar sea sencillo y ayudan a construir comunidad. A11STUDIO nació para unir estos dos mundos.",
        "En lugar de obligar a los artistas a elegir entre un portafolio hermoso o una plataforma fácil de usar, A11STUDIO ofrece ambos. Eliminamos las barreras técnicas — puedes crear un portafolio profesional en minutos mientras la plataforma se encarga del SEO, la optimización y el mantenimiento.",
      ],
    },
    bridge: {
      title: "Lo mejor de ambos mundos",
      websiteLabel: "Lo que ofrece un sitio web tradicional",
      websiteItems: [
        "Una presencia online profesional",
        "Un portafolio que refuerza tu marca personal",
        "Proyectos y galerías organizados",
        "Mayor visibilidad en buscadores",
        "Un hogar permanente para tu arte",
      ],
      socialLabel: "Lo que ofrecen las redes sociales",
      socialItems: [
        "Publicación de contenido muy sencilla",
        "Creación rápida de perfil sin programar",
        "Configuración técnica mínima",
        "Actualizaciones dinámicas de contenido",
        "Una comunidad alrededor de tu obra",
      ],
      closing:
        "Los sitios web son potentes, pero suelen exigir conocimientos técnicos, SEO, hosting y mantenimiento continuo. Muchos artistas solo quieren crear — no pasar horas aprendiendo tecnología. A11STUDIO cierra esa brecha.",
    },
    mission: {
      title: "Nuestra misión",
      statement:
        "Ayudar a los artistas a dedicar menos tiempo a la tecnología y más a crear arte con significado.",
      body: "Los artistas no deberían preocuparse por SEO, indexación, optimización web, programación ni configuraciones complejas. Tu única responsabilidad es crear y compartir tu mejor trabajo. A11STUDIO se encarga del resto.",
    },
    vision: {
      title: "Nuestra visión",
      paragraphs: [
        "Creemos que los artistas merecen una plataforma diseñada en torno a sus necesidades — no a los algoritmos. Con demasiada frecuencia, obras increíbles quedan enterradas bajo feeds interminables, tendencias y métricas de engagement.",
        "Aquí, la obra siempre es la protagonista. Cada decisión de diseño, cada función y cada sección tiene un solo objetivo: mostrar el arte de la mejor manera posible.",
      ],
    },
    values: {
      title: "Nuestros valores",
      items: [
        {
          title: "Creado por un artista, para artistas",
          description:
            "A11STUDIO no fue creado por una empresa que intenta entrar en la industria creativa. Fue construido por alguien que entiende las frustraciones de ser artista. Cada función existe porque resuelve un problema real.",
        },
        {
          title: "El arte primero",
          description:
            "La plataforma no está diseñada para maximizar el tiempo en pantalla, sino la presentación de tu obra. La interfaz se mantiene limpia, elegante y sin distracciones para que los visitantes se concentren en lo que importa: tu arte.",
        },
        {
          title: "La tecnología debe desaparecer",
          description:
            "La tecnología debe empoderar a los artistas — no abrumarlos. SEO, desarrollo web, optimización de rendimiento y mantenimiento ocurren entre bastidores.",
        },
        {
          title: "El tiempo es valioso",
          description:
            "Los artistas deberían invertir su tiempo creando, no configurando sitios web. A11STUDIO automatiza todo lo posible para que cada minuto ahorrado sea un minuto más dedicado al arte.",
        },
        {
          title: "Conectar artistas y clientes",
          description:
            "Un portafolio debe hacer más que mostrar obra — debe crear oportunidades. A11STUDIO ayuda a los artistas a presentarse profesionalmente y facilita que los clientes descubran gran talento.",
        },
      ],
    },
    why: {
      title: "Por qué existe A11STUDIO",
      intro:
        "Las redes sociales actuales premian la publicación constante más que los portafolios con significado. Muchos artistas sienten presión por crear contenido para algoritmos en lugar de arte que realmente aman. Los sitios web tradicionales resuelven eso, pero introducen otro problema: son difíciles de construir y mantener.",
      items: [
        "La profesionalidad de un sitio web personal",
        "La simplicidad de las redes sociales",
        "La visibilidad del SEO",
        "La facilidad de publicar contenido",
        "Una experiencia hermosa diseñada específicamente para artistas",
      ],
    },
    who: {
      title: "Para quién es",
      intro: "A11STUDIO es para artistas que:",
      items: [
        "Quieren un portafolio online hermoso",
        "Valoran su tiempo",
        "No quieren aprender desarrollo web",
        "Quieren ser descubiertos por clientes",
        "Les importa la presentación y la calidad",
        "Prefieren crear arte en lugar de gestionar tecnología",
      ],
      closing:
        "Ya seas fotógrafo, cineasta, ilustrador, pintor, diseñador, escultor u otro profesional creativo, A11STUDIO ayuda a que tu obra destaque.",
    },
    philosophy: {
      title: "Cómo decidimos",
      question: "¿Esto ayuda a los artistas a mostrar mejor su obra?",
      answer:
        "Si la respuesta es sí, pertenece aquí. Si no, no. La plataforma existe para servir a los artistas — no al revés.",
    },
    creator: {
      title: "Sobre el creador",
      paragraphs: [
        "Hola, soy Thiago. Soy ingeniero de software, pero antes que nada, soy artista. La fotografía y el cine siempre han sido mis mayores pasiones.",
        "Después de años creando contenido para redes sociales, sentí que hacía trabajo para algoritmos y no para mí. El burnout me llevó a alejarme del arte — y eventualmente hacia la programación, donde descubrí una nueva forma de construir cosas que ayudan a las personas.",
        "La idea de una plataforma para fotógrafos y artistas no me abandonó. En el verano de 2025, empecé A11STUDIO — combinando arte, diseño, fotografía, cine y programación en un solo producto.",
        "A11STUDIO no es solo otro proyecto. Es la plataforma que siempre deseé que existiera cuando era un artista intentando compartir mi obra con el mundo.",
      ],
    },
    cta: {
      title: "¿Listo para mostrar tu obra?",
      description:
        "Crea un portafolio profesional en minutos. Gratis para empezar — no se requiere tarjeta.",
      button: "Empezar",
    },
  },
  language: "Idioma",
  footer: {
    tagline: "La plataforma de portafolios creada para artistas.",
    cta: {
      getStarted: "Empezar",
    },
    legal: {
      heading: "Legal",
      privacy: "Política de privacidad",
      terms: "Términos de servicio",
      cookies: "Política de cookies",
    },
    contact: {
      heading: "Contacto",
      about: "Acerca de",
      support: "Soporte",
    },
    copyright: "© {year} A11STUDIO. Todos los derechos reservados.",
  },
  search: {
    segments: {
      artists: "Artistas",
      portfolios: "Portafolios",
    },
    headerArtistSearch: {
      registrationClosedToast:
        "La búsqueda de artistas no está disponible mientras el registro esté cerrado. Únete a la lista de espera para obtener acceso anticipado.",
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
