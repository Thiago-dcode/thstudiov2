import type { Messages } from "./en";

const messages = {
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
        alreadyExists:
          '{email} ya está en la lista de espera. Revisa tu correo. Si esto no es correcto, <supportLink>contacta con soporte</supportLink>.',
      },
      disclaimer: "Gratis para empezar · No se requiere tarjeta",
      scrollToNextSection: "Ir a la siguiente sección",
      disciplinesAria: "Disciplinas bienvenidas",
      disciplines: {
        photography: "Fotografía",
        illustration: "Ilustración",
        painting: "Pintura",
        sculpture: "Escultura",
        tattoo: "Tatuaje",
        design: "Diseño",
        fashion: "Moda",
        animation: "Animación",
        digitalArt: "Arte digital",
        architecture: "Arquitectura",
        film: "Cine",
      },
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
    howItWorks: {
      badge: "Cómo funciona",
      title: "Desde la subida hasta tu primer cliente",
      description:
        "Un portafolio que construye tu carrera, no solo muestra tu trabajo.",
      steps: {
        organize: {
          title: "Organiza y personaliza",
          description:
            "Sube tu trabajo y organízalo en un portafolio impactante. Personaliza el diseño como si editaras una publicación en redes — sin código, sin fricción.",
        },
        ai: {
          title: "La IA te posiciona",
          description:
            "La IA genera tu biografía, descripciones y etiquetas. Optimiza tu portafolio para buscadores para que las personas adecuadas te encuentren.",
        },
        connect: {
          title: "Los clientes conectan",
          description:
            "Coleccionistas, agencias y colaboradores descubren tu portafolio y te contactan directamente. Relaciones reales, sin intermediarios.",
        },
      },
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
  error: {
    title: "Algo salió mal",
    description:
      "Tuvimos un error inesperado. Inténtalo de nuevo o vuelve al inicio.",
    tryAgain: "Intentar de nuevo",
    backToHome: "Volver al inicio",
  },
  siteHeader: {
    openNavigation: "Abrir navegación",
    closeNavigation: "Cerrar navegación",
    navigation: "Navegación",
  },
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
      ariaLabel: "Tipo de búsqueda",
    },
    headerArtistSearch: {
      placeholder: "Buscar artistas…",
      ariaLabel: "Buscar artistas",
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
      searchButton: "Buscar",
      removeFilter: "Quitar filtro {label}",
      categoryFallback: "Categoría #{id}",
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
      categoriesAndLocation: "Categorías y ubicación",
      ariaLabel: "Filtros de categorías y ubicación",
      useMyLocation: "Usar mi ubicación",
    },
    locationFilter: {
      ariaLabel: "Filtros de ubicación",
      country: "País",
      state: "Estado / región",
      city: "Ciudad",
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
    unavailable: {
      heading: "Soporte no disponible temporalmente",
      description:
        "No pudimos cargar el formulario de soporte en este momento. Inténtalo de nuevo en unos minutos.",
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
  benefitSubscriptionDialog: {
    trigger: "Canjear beneficio",
    title: "Canjea tu beneficio",
    description:
      "Como <name>{label}</name>, disfruta de <free>{months, plural, one {# mes gratis} other {# meses gratis}}</free> en el plan {planName}.",
    noPayment:
      "No se requieren datos de pago. Tu <access>acceso gratuito de {months, plural, one {# mes} other {# meses}}</access> se activa al instante.",
    plan: "Plan",
    billingCycle: "Ciclo de facturación",
    freePeriod: "Periodo gratuito",
    freeMonths: "{months, plural, one {# mes} other {# meses}}",
    subscribe: "Suscribirse",
    activatingTitle: "Activando tu beneficio",
    activatingSubtitle: "Configurando tu suscripción…",
    errorTitle: "Algo salió mal",
    billingTypes: {
      MONTHLY: "Mensual",
      QUARTERLY: "Trimestral",
      YEARLY: "Anual",
      LIFETIME: "De por vida",
    },
    benefitTypes: {
      EARLY_USER: "Usuario anticipado",
      VIP: "VIP",
      FOUNDER: "Fundador",
    },
  },
  auth: {
    login: {
      title: "Hola de nuevo",
      subtitle: "Inicia sesión para acceder a tu cuenta",
      problemWithLogin: "¿Problemas para iniciar sesión?",
      agreePrefix: "Al iniciar sesión, aceptas nuestros",
      termsOfService: "Términos de servicio",
      and: "y",
      privacyPolicy: "Política de privacidad",
      emailLabel: "Correo electrónico",
      emailPlaceholder: "tu@ejemplo.com",
      passwordLabel: "Contraseña",
      passwordPlaceholder: "Introduce tu contraseña",
      submit: "Iniciar sesión",
    },
    register: {
      title: "Crea tu cuenta",
      subtitle: "Y empieza a construir el portafolio de tus sueños",
      alreadyHaveAccount: "¿Ya tienes una cuenta?",
      emailLabel: "Correo electrónico",
      emailPlaceholder: "tu@ejemplo.com",
      usernameLabel: "Nombre de usuario",
      usernamePlaceholder: "usuario",
      passwordLabel: "Contraseña *",
      passwordPlaceholder: "Introduce tu contraseña",
      submit: "Registrarse",
    },
    twoFa: {
      titleValidateEmail: "Valida tu correo",
      titleDeviceVerification: "Verificación del dispositivo",
      codeSentTo: "Hemos enviado un código de verificación a",
      havingTrouble: "¿Tienes problemas?",
      backToLogin: "Volver al inicio de sesión",
      codePlaceholder: "Introduce el código de 6 dígitos",
    },
    passwordRecovery: {
      title: "Recuperación de contraseña",
      subtitle: "Introduce tu correo y te enviaremos un enlace de recuperación",
      rememberPassword: "¿Recuerdas tu contraseña?",
      needHelp: "¿Necesitas ayuda?",
      contactSupport: "Contactar con soporte",
      emailLabel: "Correo electrónico",
      emailPlaceholder: "tu@correo.com",
      submit: "Enviar",
      checkEmailTitle: "Revisa tu correo",
      checkEmailSubtitle:
        "Hemos enviado un enlace de recuperación de contraseña a tu correo electrónico",
      didntReceiveEmail: "¿No recibiste el correo?",
      rememberPasswordShort: "¿Recuerdas la contraseña?",
      tryAgain: "Intentar de nuevo",
      tryAgainIn: "Inténtalo de nuevo en",
      setNewPasswordTitle: "Establecer nueva contraseña",
      setNewPasswordSubtitle: "Elige una contraseña segura para tu cuenta",
      changedYourMind: "¿Cambiaste de opinión?",
      backToSignIn: "Volver a iniciar sesión",
      newPasswordLabel: "Nueva contraseña",
      newPasswordPlaceholder: "Introduce tu nueva contraseña",
      resetSubmit: "Restablecer contraseña",
      successTitle: "Contraseña actualizada con éxito",
      successSubtitle:
        "Tu contraseña ha sido cambiada. Ya puedes iniciar sesión con tu nueva contraseña.",
      continueToSignIn: "Continuar para iniciar sesión",
    },
    expiresIn: {
      remaining:
        "Te quedan {minutes, plural, =0 {} one {# minuto} other {# minutos}}{minutes, plural, =0 {} other { y }}{seconds, plural, one {# segundo} other {# segundos}}",
    },
  },
  getStarted: {
    stepOf: "Paso {current} de {total}",
    steps: {
      profile: {
        title: "Completa tu perfil",
        subtitle: "Cuéntanos un poco sobre ti para empezar",
      },
      photo: {
        title: "Selecciona tu foto de perfil",
        subtitle: "Esta será tu imagen ante posibles clientes",
      },
      categories: {
        title: "Selecciona hasta 5 categorías",
        subtitle: "Estas categorías ayudarán a que descubran tu perfil",
      },
      location: {
        title: "Añade tu ubicación",
        subtitle: "Ayuda a los clientes a descubrir tu perfil por ubicación",
      },
      plan: {
        title: "Elige tu plan",
        subtitle: "Selecciona el plan perfecto para tu camino creativo",
      },
    },
    actions: {
      continue: "Continuar",
      finish: "Finalizar",
      continueWithoutBenefits: "Continuar sin beneficios",
      tryAgainLater: "Intentar más tarde",
      stepBack: "volver atrás",
      somethingWentWrong: "algo salió mal",
    },
  },
  plans: {
    card: {
      popular: "Popular",
      bestValue: "Mejor valor",
      getStarted: "Empezar",
      goPlan: "Ir a {planName}",
    },
    price: {
      free: "Gratis",
      from: "desde",
      perMonth: "/mes",
    },
    features: {
      unlimited: "Ilimitado",
      ofMediaStorage: "de almacenamiento de contenido",
      projects: "Proyectos",
      portfolios: "Portafolios",
      services: "Servicios",
      clients: "Clientes",
      mediaCompression: "Compresión de contenido",
      mediaCompressionTooltip:
        "Elige el nivel de compresión preferido al subir fotos. Equilibra la calidad de imagen y el tamaño del archivo para optimizar tu almacenamiento y los tiempos de carga.",
      aiCredits: "Créditos de IA",
      aiCreditsTooltip:
        "Aprovecha la IA para automatizar tareas repetitivas. Genera automáticamente títulos, descripciones y etiquetas para tu contenido basándote en el análisis, ahorrándote tiempo y esfuerzo.",
    },
    portal: {
      loading: "Cargando…",
      manageSubscription: "Gestionar tu suscripción",
    },
  },
  changeSubscriptionDialog: {
    processing: "Procesando...",
    errorTitle: "Algo salió mal",
    thisPlanIncludes: "Este plan incluye:",
    billingCycle: "Ciclo de facturación",
    total: "Total",
    perMonth: "/mes",
    billed: "facturado {billingType}",
    paymentMethod: "Método de pago",
    completePayment: "Completar pago",
    trustPaymentAlt: "pago seguro",
  },
  userBenefitModal: {
    title: "Tienes un regalo esperándote",
    description:
      "Como <name>{label}</name> obtienes <free>{months, plural, one {# mes gratis} other {# meses gratis}}</free>.",
    claimBelow:
      "Canjéalo justo abajo. Te guiaremos para obtener el beneficio",
    claimAfterSetup:
      "Cuando termines la configuración de bienvenida te guiaremos para obtener el beneficio.",
    claimNow: "Canjear ahora",
    maybeLater: "Quizá más tarde",
    gotItThanks: "Entendido, ¡gracias!",
  },
  userAccountBanned: {
    title: "Cuenta suspendida",
    description:
      "Tu cuenta ha sido suspendida por incumplir las políticas.",
    restrictionsLiftedOn: "Las restricciones se levantarán el {date}.",
    contactSupport: "Contacta con soporte si crees que es un error",
    logout: "Cerrar sesión",
  },
  emailPreferences: {
    metadata: {
      title: "Preferencias de correo - A11STUDIO",
      description:
        "Actualiza los tipos de correos que quieres recibir de A11STUDIO.",
    },
    page: {
      eyebrow: "Preferencias de correo",
      title: "Gestiona las preferencias de tu bandeja de entrada",
      subtitle:
        "Elige las actualizaciones que quieres conservar y respetaremos tu elección.",
    },
    form: {
      toastUpdated: "Preferencias actualizadas",
      managingFor: "Gestionando preferencias de",
      marketingLabel: "Correos de marketing",
      marketingDescription:
        "Novedades del producto, lanzamientos y actualizaciones ocasionales.",
      notificationsLabel: "Notificaciones",
      notificationsDescription:
        "Alertas de la cuenta y avisos relevantes de la plataforma.",
      waitlistLabel: "Actualizaciones de la lista de espera",
      waitlistDescription:
        "Actualizaciones sobre el progreso de la lista de espera y cambios de acceso.",
      save: "Guardar preferencias",
    },
  },
  webHeader: {
    accessProfile: "Acceder al perfil",
    goToAtelier: "Ir a Atelier",
    signIn: "Iniciar sesión",
    openAtelier: "Abrir Atelier",
    tagline: "La plataforma de portafolios creada para artistas.",
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
  artists: {
    shareProfile: "Compartir perfil",
    breadcrumb: {
      goBack: "Volver",
    },
    header: {
      atelier: "Atelier",
      contact: "Contacto",
      menu: "Menú",
      nav: {
        portfolios: "Portafolios",
        collections: "Colecciones",
        services: "Servicios",
        about: "Acerca de",
      },
    },
    contactDialog: {
      contactButton: "Contacto",
      contactTitle: "Contactar a {name}",
      contactTitleFallback: "Contacto",
      description: "Envía un mensaje directamente a este artista.",
      selfContact: "No puedes contactarte a ti mismo.",
      form: {
        nameLabel: "Nombre",
        namePlaceholder: "Tu nombre",
        emailLabel: "Correo electrónico",
        emailPlaceholder: "tu@correo.com",
        subjectLabel: "Asunto",
        subjectPlaceholder: "Consulta por encargo",
        messageLabel: "Mensaje",
        messagePlaceholder: "Cuéntale al artista sobre tu proyecto...",
        submit: "Enviar mensaje",
      },
      successToast: "¡Mensaje enviado con éxito!",
    },
    sections: {
      portfolios: "Portafolios",
      collections: "Colecciones",
      services: "Servicios",
      viewAll: "Ver todo",
      viewAllPortfolios: "Ver todos los portafolios",
      viewAllCollections: "Ver todas las colecciones",
      viewAllServices: "Ver todos los servicios",
      emptyState: {
        title: "{name} aún no ha publicado ningún trabajo.",
        subtitle: "Vuelve pronto, o contáctanos para iniciar una conversación.",
        cta: "Ponte en contacto",
      },
    },
    notFound: {
      heading: "Artista no encontrado",
      description:
        "El perfil que buscas no existe o pudo haber sido eliminado.",
      backHome: "Volver al inicio",
    },
    resourceNotFound: {
      heading: "Recurso no encontrado",
      backToProfile: "Volver al perfil",
      portfolio:
        "El portafolio que buscas no existe o pudo haber sido eliminado.",
      collection:
        "La colección que buscas no existe o pudo haber sido eliminada.",
      service: "El servicio que buscas no existe o pudo haber sido eliminado.",
      media: "El contenido que buscas no existe o pudo haber sido eliminado.",
    },
    profile: {
      getInTouch: "Ponte en contacto",
      aboutHeading: "Acerca de {name}",
    },
    editAria: {
      editPortfolio: "Editar portafolio",
      editCollection: "Editar colección",
      editService: "Editar servicio",
      editMedia: "Editar contenido",
      editAboutPage: "Editar página Acerca de",
    },
    portfolios: {
      pageTitle: "Portafolios",
      empty: "Aún no hay portafolios.",
      galleryEmpty: "Este portafolio está vacío por ahora.",
    },
    collections: {
      pageTitle: "Colecciones",
      empty: "Aún no hay colecciones.",
      galleryEmpty: "Esta colección está vacía por ahora.",
    },
    services: {
      pageTitle: "Servicios",
      empty: "Aún no hay servicios.",
      whatsIncluded: "Qué incluye",
      terms: "Términos",
      relatedPortfolio: "Portafolio relacionado",
    },
    about: {
      notShared: "Este artista aún no ha compartido su historia.",
      heading: "Acerca de",
      getInTouch: "Ponte en contacto",
    },
    media: {
      untitled: "Sin título",
      editAria: "Editar contenido",
    },
    fullscreen: {
      enter: "Ver en pantalla completa",
      exit: "Salir de pantalla completa",
    },
  },
  validation: {
    required: "{field} es obligatorio",
    invalid: "{field} no es válido",
    tooLong: "{field} es demasiado largo",
    minLength: "{field} debe tener al menos {min} caracteres",
    maxLength: "{field} debe tener como máximo {max} caracteres",
    email: {
      invalid: "Correo electrónico no válido",
    },
    slug: {
      tooShort: "El slug debe tener al menos 3 caracteres",
      invalidFormat:
        "El slug solo puede contener letras minúsculas, números y guiones",
    },
    avatarUrlInvalid: "URL de avatar no válida",
    fallbackUrlInvalid: "URL de respaldo no válida",
    thumbnailRequired: "La miniatura es obligatoria",
    maxCategories: "Los portafolios pueden tener hasta {max} categorías",
    maxPortfolioItems: "Los portafolios pueden tener hasta {max} elementos",
    minCollectionMedia: "Se requiere al menos un elemento multimedia",
    maxCollectionMedia: "Las colecciones pueden tener hasta {max} archivos",
    file: {
      tooLarge: "{field} debe pesar menos de {mb}MB",
      invalidType: "{field} debe ser una imagen (JPEG, PNG o WebP)",
    },
    aboutPage: {
      titleType: "El título debe ser una cadena de texto válida",
      titleMin: "El título debe tener al menos 5 caracteres",
      titleMax: "El título debe tener menos de 255 caracteres",
      descriptionRequired:
        "La descripción es obligatoria y debe ser una cadena de texto válida",
      descriptionType: "La descripción debe ser una cadena de texto válida",
      descriptionMin: "La descripción debe tener al menos 20 caracteres",
      descriptionMax: "La descripción debe tener menos de 1000 caracteres",
      userIdRequired:
        "El ID de usuario es obligatorio y debe ser un número válido",
      userIdPositive: "El ID de usuario debe ser un número positivo",
    },
    auth: {
      invalidEmail: "Correo electrónico no válido",
      invalidPassword: "Contraseña no válida",
      invalidUsername: "Nombre de usuario no válido",
      usernameAllowedChars:
        "El nombre de usuario solo puede contener letras, números, guiones bajos y guiones",
      invalidCode: "Código no válido",
      codeLength: "El código debe tener {length} dígitos",
      invalidFallbackUrl: "URL de respaldo no válida",
    },
    subscription: {
      urlMustBeAppOrigin: "La URL debe pertenecer al dominio de la app",
    },
    service: {
      featureTitleRequired: "El título de la característica es obligatorio",
      termTitleRequired: "El título del término es obligatorio",
    },
    emailPreference: {
      tokenRequired: "Falta el token",
    },
    user: {
      usernameAlphanumeric:
        "El nombre de usuario debe ser alfanumérico y sin espacios",
      passwordMustContainNumber: "La contraseña debe contener al menos un número",
      passwordNoSpaces: "La contraseña no puede contener espacios",
    },
  },
  fields: {
    title: "Título",
    name: "Nombre",
    surname: "Apellido",
    subject: "Asunto",
    message: "Mensaje",
    artistId: "ID del artista",
    username: "Nombre de usuario",
    password: "Contraseña",
    profession: "Profesión",
    biography: "Biografía",
    shortBiography: "Biografía breve",
    currentPassword: "Contraseña actual",
    newPassword: "Contraseña",
    thumbnail: "Miniatura",
    avatar: "Avatar",
    banner: "Banner",
    photo: "Foto",
    file: "Archivo",
    userId: "ID de usuario",
    mediaId: "ID de archivo",
  },
  portfolios: {
    toastCreated: "Portafolio creado con éxito",
    toastUpdated: "Portafolio actualizado con éxito",
  },
  atelier: {
    common: {
      viewPublicPage: "Ver página pública",
      cancel: "Cancelar",
      save: "Guardar",
      update: "Actualizar",
      create: "Crear",
      close: "Cerrar",
      add: "Añadir",
      loading: "Cargando...",
      loadMore: "Cargar más",
      blocked: "Bloqueado",
      editingCollection: "Editando colección",
      creatingCollection: "Creando colección",
      editingPortfolio: "Editando portafolio",
      creatingPortfolio: "Creando portafolio",
      editingService: "Editando servicio",
      creatingService: "Creando servicio",
      planLimitReached: "Límite del plan alcanzado",
      planLimitDescription:
        "Has usado <strong>{count}</strong> de <strong>{limit}</strong> {label} permitidos en tu plan actual. Actualiza tu plan para crear más, o gestiona tus {label} existentes.",
      goBack: "Volver",
      upgradePlan: "Mejorar plan",
      planLimitToast:
        "Has alcanzado el límite de tu plan para {label} ({count}/{limit}). Mejora tu plan para crear más.",
      logout: "Cerrar sesión",
      logoutConfirmTitle: "Cerrar sesión",
      logoutConfirmDescription:
        "¿Seguro que quieres cerrar sesión? Tendrás que iniciar sesión de nuevo para acceder a tu cuenta.",
      completeProfileTitle: "Completa tu perfil",
      completeProfileDescription:
        "¡Ya casi está! Completa la configuración de tu perfil para desbloquear todas las funciones y tener la mejor experiencia.",
      continueSettingUp: "Continuar configuración",
      skipForNow: "Omitir por ahora",
      metrics: {
        noDataAvailable: "No hay datos disponibles",
        media: "Contenido",
        storage: "Almacenamiento",
        clients: "Clientes",
        portfolios: "Portafolios",
        collections: "Colecciones",
        projects: "Proyectos",
        services: "Servicios",
        aiCredits: "Créditos de IA",
        planSuffix: "Plan",
      },
      submit: {
        updateCollectionTitle: "Actualizar colección",
        saveCollectionTitle: "Guardar colección",
        updateCollectionDescription:
          "Tus cambios se guardarán y se aplicarán a tu colección en vivo.",
        createCollectionDescription:
          "Tu colección se creará y se guardará en tu cuenta.",
        updatePortfolioTitle: "Actualizar portafolio",
        savePortfolioTitle: "Guardar portafolio",
        updatePortfolioDescription:
          "Tus cambios se guardarán y se aplicarán a tu portafolio en vivo.",
        createPortfolioDescription:
          "Tu portafolio se creará y se guardará en tu cuenta.",
        updateServiceLabel: "Actualizar servicio",
        createServiceLabel: "Crear servicio",
        updateServiceTitle: "Actualizar servicio",
        createServiceTitle: "Crear servicio",
        updateServiceDescription:
          "Tus cambios se guardarán y se aplicarán a tu servicio en vivo.",
        createServiceDescription:
          "Tu servicio se creará y se guardará en tu cuenta.",
      },
    },
    portfolios: {
      pageTitle: "Portafolios",
      pageInfo:
        "Los portafolios representan categorías amplias de tu trabajo, como 'Fotografía de viajes' o 'Fotografía de bodas'. Están diseñados para mostrar tus mejores piezas a los clientes y pueden incluir tanto contenido individual como colecciones.",
      createButtonLabel: "Crear portafolio",
      emptyStateDescription:
        "Aún no has creado portafolios. Empieza agrupando tu trabajo.",
      loadError: "Algo salió mal",
      createTitle: "Crear un portafolio",
      editTitlePrefix: "Editar: {title}",
      blockedBadge: "Bloqueado",
      deletePortfolio: {
        ariaLabel: "Eliminar portafolio",
        title: "Eliminar portafolio",
        description:
          "<strong>{title}</strong> se eliminará permanentemente. Esta acción no se puede deshacer.",
        cancel: "Cancelar",
        delete: "Eliminar",
        successToast: "Portafolio eliminado",
      },
      form: {
        blockedNotice:
          "Este portafolio ha sido bloqueado. Puedes revisarlo aquí, pero no se puede editar hasta que se levante el bloqueo.",
        back: "Atrás",
        next: "Siguiente",
        stepOf: "Paso {current} de {total}",
        thumbnailHint:
          "Añade una imagen de miniatura para tu portafolio (obligatorio)",
        thumbnailAlt: "Vista previa de la miniatura",
        titleLabel: "Título",
        titlePlaceholder: "Mi portafolio",
        slugLabel: "Slug",
        slugPlaceholder: "mi-portafolio",
        slugInfo:
          "Un slug es una versión de tu título apta para URL (ej. 'mi-portafolio-genial'). Debe ser único, ya que se usa en la URL del portafolio para identificarlo y facilitar su búsqueda.",
        slugChecking: "Comprobando disponibilidad...",
        slugAvailable: "✓ Este slug está disponible",
        slugTaken: "✗ Este slug ya está en uso",
        slugInvalidFormat: "✗ Formato de slug no válido. Ejemplo: mi-portafolio",
        descriptionLabel: "Descripción",
        descriptionPlaceholder: "Describe tu portafolio...",
        categoriesLabel: "Categorías",
        categoriesCountHint:
          "{count} / {max} categorías · Opcional. Selecciona categorías que describan este portafolio.",
        showOnProfile: "Mostrar en la página de perfil",
        showOnProfileInfo:
          "Cuando está activado, este portafolio se destaca en tu perfil público de artista para que los visitantes lo encuentren más fácilmente. Puedes destacar hasta {limit} portafolios en tu página de perfil.",
        highlightLimitReached:
          "Has alcanzado el límite de {limit} portafolios destacados en tu página de perfil.",
        active: "Activo",
        activeInfo:
          "Cuando está desactivado, este portafolio se oculta de tu perfil público de artista y de los listados. Aún puedes editarlo en el atelier.",
      },
      items: {
        noItems: "Aún no se han añadido contenidos ni colecciones",
        itemsCountLabel: "{count} / {limit} elementos",
        dragToReorder: "· Arrastra para reordenar",
        countInfo:
          "Este conteo incluye cada contenido que añades directamente, más cada elemento dentro de cualquier colección que agregues. Por ejemplo, una colección con 10 imágenes cuenta como 10 elementos del límite de {limit}.",
        removeItem: "Eliminar {label}",
        untitled: "Sin título",
      },
      layout: {
        label: "Diseño",
        info: "El diseño se adapta al tamaño de pantalla del visitante.",
        columnsInfo:
          "Para el diseño en columnas, el número que elijas es el máximo usado en pantallas grandes. Los dispositivos más pequeños muestran menos columnas — hasta {mobile} en móvil y {tablet} en tablet — de modo que elegir {max} columnas igual muestra solo {mobile} en un teléfono.",
        ariaGroup: "Diseño del portafolio",
        previewAria: "Previsualizar diseño",
        editSettingsAria: "Editar ajustes de diseño",
        previewTitle: "Vista previa del diseño",
        previewDescription:
          "Una vista previa de tus elementos seleccionados usando el diseño {layoutName}. El resultado se adapta al tamaño de pantalla del visitante.",
        previewEmpty: "Añade elementos para previsualizar el diseño.",
        settingsTitle: "Ajustes de diseño",
        settingsDescription:
          "Elige cuántas columnas mostrar en pantallas grandes. Los dispositivos más pequeños usan menos automáticamente.",
        columns: "Columnas",
        selectedFallback: "seleccionado",
      },
    },
    services: {
      pageTitle: "Servicios",
      pageInfo:
        "Los servicios son las ofertas que brindas a tus clientes, como 'Fotografía de bodas' o 'Diseño web'.",
      createButtonLabel: "Crear servicio",
      emptyStateDescription:
        "Aún no has creado servicios. Empieza añadiendo lo que ofreces a tus clientes.",
      loadError: "Algo salió mal",
      createTitle: "Crear un servicio",
      editTitlePrefix: "Editar: {title}",
      toastCreated: "Servicio creado con éxito",
      toastUpdated: "Servicio actualizado con éxito",
      form: {
        blockedNotice:
          "Este servicio ha sido bloqueado. Puedes revisarlo aquí, pero no se puede editar hasta que se levante el bloqueo.",
        slugChecking: "Comprobando disponibilidad...",
        slugAvailable: "✓ Este slug está disponible",
        slugTaken: "✗ Este slug ya está en uso",
        titleLabel: "Título",
        titlePlaceholder: "Fotografía de retrato",
        slugLabel: "Slug",
        slugPlaceholder: "fotografia-de-retrato",
        slugInfo:
          "Identificador apto para URL. Solo letras minúsculas, números y guiones.",
        slugInvalidFormat:
          "✗ Formato de slug no válido. Ejemplo: fotografia-de-retrato",
        descriptionLabel: "Descripción",
        descriptionPlaceholder: "Describe tu servicio...",
        priceLabel: "Precio",
        priceInfo: "El precio es opcional, déjalo en 0.",
        showPrice: "Mostrar precio",
        active: "Activo",
        showOnProfile: "Mostrar en la página de perfil",
        showOnProfileInfo:
          "Cuando está activado, este servicio se destaca en tu perfil público de artista para que los visitantes lo encuentren más fácilmente. Puedes destacar hasta {limit} servicios en tu página de perfil.",
        highlightLimitReached:
          "Has alcanzado el límite de {limit} servicios destacados en tu página de perfil.",
        thumbnailLabel: "Miniatura",
        thumbnailAlt: "Vista previa de la miniatura",
        featuresLabel: "Características",
        featuresPlaceholder: "ej. sesión de 2 horas",
        termsLabel: "Términos",
        termsPlaceholder: "ej. depósito del 50% requerido",
        portfolioLinkLabel: "Vincular a un portafolio (opcional)",
        portfolioSelectPlaceholder: "Selecciona un portafolio...",
        portfolioLinkInfo:
          "Vincula un portafolio para que los clientes vean fotos relacionadas con este servicio.",
      },
    },
    collections: {
      pageTitle: "Colecciones",
      pageInfo:
        "Las colecciones son conjuntos simples de contenido relacionado, agrupados por un evento o tema específico, como 'La boda de Juan' o 'Marruecos 2026'.",
      createButtonLabel: "Crear colección",
      emptyStateDescription:
        "Aún no has creado colecciones. Empieza añadiendo un conjunto de contenido relacionado.",
      loadError: "Algo salió mal",
      createTitle: "Crear una colección",
      editTitlePrefix: "Editar: {title}",
      toastCreated: "Colección creada con éxito",
      toastUpdated: "Colección actualizada con éxito",
      drawer: {
        addCollection: "Añadir colección",
        title: "Añadir colección",
        refreshAria: "Actualizar colecciones",
        hint: "Haz clic para añadir a tu portafolio · {count} disponibles",
        alreadyAdded: "Ya añadida",
        addToPortfolio: "Añadir al portafolio",
        itemCount: "{count, plural, one {# elemento} other {# elementos}}",
        emptyTitle: "Aún no hay colecciones",
        emptySubtitle: "Crea tu primera colección para empezar",
        itemsSelected:
          "{count, plural, one {# elemento seleccionado} other {# elementos seleccionados}}",
      },
      deleteCollection: {
        ariaLabel: "Eliminar colección",
        title: "Eliminar colección",
        description:
          "<strong>{title}</strong> se eliminará permanentemente. Esta acción no se puede deshacer.",
        cancel: "Cancelar",
        delete: "Eliminar",
        successToast: "Colección eliminada",
      },
      form: {
        blockedNotice:
          "Esta colección ha sido bloqueada. Puedes revisarla aquí, pero no se puede editar hasta que se levante el bloqueo.",
        titleLabel: "Título",
        titlePlaceholder: "Mi colección",
        slugLabel: "Slug",
        slugPlaceholder: "mi-coleccion",
        slugInfo:
          "Un slug es una versión de tu título apta para URL (ej. 'mi-coleccion-genial'). Debe ser único, ya que se usa en la URL de la colección.",
        slugChecking: "Comprobando disponibilidad...",
        slugAvailable: "✓ Este slug está disponible",
        slugTaken: "✗ Este slug ya está en uso",
        slugInvalidFormat: "✗ Formato de slug no válido. Ejemplo: mi-coleccion",
        descriptionLabel: "Descripción",
        descriptionPlaceholder: "Describe tu colección...",
        showOnProfile: "Mostrar en la página de perfil",
        showOnProfileInfo:
          "Cuando está activado, esta colección se destaca en tu perfil público de artista para que los visitantes la encuentren más fácilmente. Puedes destacar hasta {limit} colecciones en tu página de perfil.",
        highlightLimitReached:
          "Has alcanzado el límite de {limit} colecciones destacadas en tu página de perfil.",
        active: "Activo",
        activeInfo:
          "Cuando está desactivado, esta colección se oculta de tu perfil público de artista y de los listados. Aún puedes editarla en el atelier.",
      },
      media: {
        sectionLabel: "Contenido",
        dragToReorder: "· Arrastra para reordenar",
        countInfo:
          "Cada elemento multimedia que añadas a esta colección cuenta para este límite. Puedes incluir hasta {limit} elementos en total.",
        countLabel: "{count} / {limit} contenidos",
        noMedia: "Aún no se ha añadido contenido",
        removeMedia: "Eliminar {label}",
        mediaFallback: "contenido",
        untitled: "Sin título",
      },
    },
    media: {
      pageTitle: "Contenido",
      tabs: {
        overallInfo: "Información general",
        seo: "SEO",
      },
      upload: {
        maxFilesError:
          "Se permiten un máximo de {max} archivos. Puedes añadir {remaining} más.",
        globalCompression: "Compresión global",
        compressionTooltipTitle: "Nivel de compresión",
        compressionTooltipBody:
          "Controla el equilibrio entre la calidad de imagen y el tamaño de archivo. Una compresión menor (VERY_LOW, LOW) conserva más detalle pero genera archivos más grandes. Una compresión mayor (HIGH, VERY_HIGH) reduce el tamaño pero puede reducir ligeramente la calidad.",
        compressionTooltipHint:
          "Este ajuste se aplica a todos los archivos subidos. Puedes ajustar archivos individuales con los controles de abajo.",
        allFiles: "Todos los archivos",
        upgradeRequired: "Actualización necesaria:",
        upgradeRequiredBody:
          "El control de compresión no está disponible en tu plan actual. Actualiza para acceder a esta función.",
        aiSeoGeneration: "Generación de SEO con IA",
        aiSeoTooltipBody:
          "Genera automáticamente título, descripción, texto alternativo y nombre de archivo SEO para cada imagen usando análisis de visión por IA.",
        aiSeoCreditsHint:
          "Cuesta 1 crédito de IA por imagen. Te quedan {count} {count, plural, one {crédito} other {créditos}}.",
        creditsLabel: "{count} {count, plural, one {crédito} other {créditos}}",
        noCreditsTitle: "Sin créditos de IA:",
        noCreditsBody:
          "Has usado todos tus créditos de IA. Mejora tu plan o espera al próximo reinicio.",
        filesCount: "{count}/{max} archivos",
        maxReached: "Límite alcanzado",
        compressionLabel: "Compresión",
        upgradeToAdjust: "Mejora tu plan para ajustar",
        previewAlt: "Vista previa {index}",
        createNewMedia: "Crear nuevo contenido",
        uploadUpToImages: "Sube hasta {max} imágenes (JPEG, PNG, WebP)",
        uploadButton: "¡Subir!",
        close: "Cerrar",
        createMedia: "Crear contenido",
        addMedia: "Añadir contenido",
        storageFullTitle: "Almacenamiento lleno: {used} / {limit} GB usados",
        uploadInProgress: "Subida en curso...",
      },
      card: {
        deleteFailed: "No se pudo eliminar el contenido",
        titleLabel: "Título",
        titlePlaceholder: "Introduce el título",
        descriptionLabel: "Descripción",
        descriptionPlaceholder: "Introduce la descripción",
        seoTitleLabel: "Título SEO",
        seoTitlePlaceholder: "Introduce el título SEO",
        seoTitleInfo:
          "El título que aparece en los resultados de búsqueda y en las pestañas del navegador. Mejora la visibilidad en buscadores.",
        seoDescriptionLabel: "Descripción SEO",
        seoDescriptionPlaceholder: "Introduce la descripción SEO",
        seoDescriptionInfo:
          "Un breve resumen que aparece en los resultados de búsqueda. Ayuda a los usuarios a entender de qué trata la imagen antes de hacer clic.",
        altTextLabel: "Texto alternativo",
        altTextPlaceholder: "Introduce el texto alternativo para accesibilidad",
        altTextInfo:
          "Una descripción textual de la imagen para lectores de pantalla y cuando las imágenes no cargan. Mejora la accesibilidad y el SEO.",
        filenameLabel: "Nombre de archivo",
        filenamePlaceholder: "Introduce el nombre de archivo",
        filenameInfo:
          "El nombre de archivo usado con fines de SEO. Puede editarse para mejorar la visibilidad en buscadores.",
        lastUpdated: "Última actualización",
        noPreview: "Sin vista previa",
        altFallback: "Contenido de {username}",
        untitled: "Sin título",
        editMedia: "Editar contenido",
        mediaPreview: "Vista previa del contenido",
        generateSeo: "Generar SEO",
        noCreditsAvailable:
          "No hay créditos de IA disponibles. Necesitas al menos 1 crédito para generar metadatos SEO. Mejora tu plan o espera a que se reinicien los créditos.",
        generateSeoTooltip:
          "Genera automáticamente los campos SEO con IA. Analiza el contenido de tu imagen y genera títulos, descripciones, texto alternativo y nombres de archivo optimizados para mejorar la visibilidad en búsquedas.",
        noCreditsSuffix: " (Sin créditos)",
        delete: "Eliminar",
        deleteConfirm: "¿Seguro que quieres eliminar este contenido?",
        cancel: "Cancelar",
        discardTitle: "¿Descartar cambios?",
        discardBody:
          "¿Seguro que quieres cancelar? Se perderán todos los cambios sin guardar.",
        keepEditing: "Seguir editando",
        discardChanges: "Descartar cambios",
        saveChanges: "Guardar cambios",
        edit: "Editar",
        close: "Cerrar",
      },
      grid: {
        generateSeoCount: "Generar SEO ({count})",
        generateSeoTitle: "Generar SEO con IA",
        generateSeoDescription:
          "¿Generar metadatos SEO con IA para {count} {count, plural, one {contenido seleccionado} other {contenidos seleccionados}}?",
        creditsAvailable: "Créditos disponibles:",
        creditsNeeded: "Créditos necesarios:",
        overAiLimit:
          "Límite: selecciona hasta {max} elementos (quita {excess}).",
        insufficientCredits:
          "Créditos insuficientes. Necesitas {needed} créditos más.",
        cancel: "Cancelar",
        selectMedia: "Seleccionar contenido",
        cancelSelection: "Cancelar selección",
        noMediaFiltered:
          "No se encontró contenido, prueba otra combinación de filtros",
        noMediaEmpty:
          "Aún no has subido contenido. Empieza añadiendo tu primera imagen.",
        updateItems:
          "Actualizar {count} {count, plural, one {elemento} other {elementos}}",
        confirmUpdatesTitle: "Confirmar actualizaciones",
        confirmUpdatesDescription:
          "¿Seguro que quieres actualizar {count} {count, plural, one {contenido} other {contenidos}}? Esta acción guardará todos los cambios pendientes.",
        updateAll: "Actualizar todo",
      },
      search: {
        placeholder: "Buscar contenido…",
        all: "Todos",
      },
      drawer: {
        addMedia: "Añadir contenido",
        title: "Añadir contenido",
        refreshAria: "Actualizar contenido",
        filterAll: "Todos",
        hint: "Haz clic para añadir a tu portafolio · {count} disponibles",
        hintMax: "· hasta {max} elementos",
        alreadyAdded: "Ya añadido",
        addToPortfolio: "Añadir al portafolio",
        emptyTitle: "Aún no hay contenido",
        emptySubtitle: "Sube tu primera imagen para empezar",
        itemsSelected:
          "{count, plural, one {# elemento seleccionado} other {# elementos seleccionados}}",
        itemsSelectedWithMax:
          "{count} / {max} {count, plural, one {elemento} other {elementos}} seleccionados",
      },
      uploadStatus: {
        uploadComplete: "Subida completa",
        uploadingFiles: "Subiendo archivos",
        remaining: "{count} restantes",
        success: "correcto",
        failed: "fallido",
        allComplete: "Todo completo",
        queued: "En cola...",
        uploading: "Subiendo...",
        updating: "Actualizando...",
        generatingSeo: "Generando SEO...",
        deleting: "Eliminando...",
        uploaded: "Subido",
        updated: "Actualizado",
        seoGenerated: "SEO generado",
        deleted: "Eliminado",
        failedFallback: "Fallido",
        preparingUpload: "Preparando subida...",
        previewAlt: "Vista previa",
        noPreview: "Sin vista previa",
        unknownFile: "Archivo desconocido",
      },
    },
    home: {
      pageTitle: "Panel",
    },
    nav: {
      dashboard: "Panel",
      home: "Inicio",
      media: "Contenido",
      collections: "Colecciones",
      portfolios: "Portafolios",
      services: "Servicios",
      about: "Sobre mí",
      settings: "Ajustes",
      closeMenuAria: "Cerrar menú",
    },
    topNav: {
      openMenuAria: "Abrir menú",
      expandSidebarAria: "Expandir barra lateral",
      collapseSidebarAria: "Contraer barra lateral",
      upgrade: "Mejorar plan",
      viewProfile: "Ver perfil",
    },
    about: {
      pageTitle: "Página Sobre mí",
      pageInfo:
        "Comparte tu trayectoria, tu recorrido artístico y todo lo que te gustaría que tu audiencia supiera sobre ti.",
      emptyStateDescription:
        "Aún no has creado una página Sobre mí. Comparte tu trayectoria y tu recorrido artístico.",
      form: {
        createButton: "Crear página Sobre mí",
        editButton: "Editar página Sobre mí",
        createTitle: "Crear página Sobre mí",
        updateTitle: "Actualizar página Sobre mí",
        titleLabel: "Título",
        titlePlaceholder: "La historia detrás del lienzo",
        descriptionLabel: "Descripción",
        descriptionPlaceholder:
          "Comparte tu recorrido como artista. ¿Qué te inspira? ¿Qué impulsa tu visión creativa? Deja que los visitantes conecten con la persona detrás del arte...",
        createSubmit: "Crear",
        updateSubmit: "Actualizar",
        photoPreview: "Vista previa de la foto:",
        photoPreviewAlt: "Vista previa de la foto",
        choosePhotoHint:
          "Elige una foto (preferiblemente tuya) para mostrar en tu página Sobre mí.",
        photoAlt: "Foto de la página Sobre mí",
      },
    },
    settings: {
      pageTitle: "Ajustes",
      account: {
        heading: "Cuenta",
        usernameInfo:
          "Tu nombre de usuario aparece en tu URL pública. Elige algo corto y memorable — no podrás cambiarlo con frecuencia.",
        usernameLabel: "Nombre de usuario",
        emailLabel: "Correo electrónico",
      },
      language: {
        heading: "Idioma",
        description: "Elige el idioma de tu panel",
      },
      security: {
        heading: "Seguridad",
        passwordLabel: "Contraseña",
        passwordDescription: "Actualiza la contraseña de tu cuenta",
      },
      subscription: {
        heading: "Suscripción",
        trial: "Prueba",
        freeTrialEnds: "La prueba gratuita termina el {date}",
        renews: "Se renueva el {date}",
        cancels: "Se cancela el {date}",
        onFreePlan: "Estás en el plan gratuito",
        upgrade: "Mejorar plan",
        change: "Cambiar",
        freePlanName: "Gratis",
      },
      changePlan: {
        pageTitle: "Cambiar plan",
        backToSettings: "Volver a Ajustes",
        alreadyOnBest: "Ya tienes el plan más completo.",
        currentPlanIs:
          "Tu plan actual es <strong>{planName}</strong> — no hay nada superior a lo que actualizar por ahora.",
        currentPlanFallback: "tu plan actual",
        goBackToSettings: "Volver a Ajustes",
        cancel: "Cancelar",
      },
      changePassword: {
        triggerLabel: "Cambiar contraseña",
        title: "Cambiar contraseña",
        description: "Introduce tu contraseña actual y elige una nueva.",
        monthlyLimitReached: "Límite mensual alcanzado",
        usedAllChanges:
          "Has usado los {max} cambios de contraseña permitidos para este periodo.",
        availableAgainOn:
          "Disponible de nuevo el <strong>{date}</strong>.",
        currentPasswordLabel: "Contraseña actual",
        newPasswordLabel: "Nueva contraseña",
        newPasswordInfo: "8–20 caracteres, al menos un número, sin espacios",
        remainingChanges:
          "{remaining} de {max} {remaining, plural, one {cambio} other {cambios}} restantes este mes",
        resetsOn: " · se reinicia el {date}",
        submit: "Actualizar contraseña",
        successToast: "¡Contraseña actualizada con éxito!",
      },
      changeUsername: {
        title: "Cambiar nombre de usuario",
        description: "Elige un nuevo nombre de usuario para tu cuenta.",
        monthlyLimitReached: "Límite mensual alcanzado",
        usedAllChanges:
          "Has usado los {max} cambios de nombre de usuario permitidos para este periodo.",
        availableAgainOn:
          "Disponible de nuevo el <strong>{date}</strong>.",
        newUsernameLabel: "Nuevo nombre de usuario",
        newUsernameInfo: "3–20 caracteres, solo letras y números",
        remainingChanges:
          "{remaining} de {max} {remaining, plural, one {cambio} other {cambios}} restantes este mes",
        resetsOn: " · se reinicia el {date}",
        submit: "Actualizar nombre de usuario",
        successToast: "¡Nombre de usuario actualizado con éxito!",
      },
    },
  },
  actions: {
    unauthorized: "No autorizado",
    slugAlreadyExists: "El slug ya existe",
    genericError: "Algo salió mal. Inténtalo de nuevo más tarde.",
    formDataRequired: "Se requieren los datos del formulario",
    passwordRecoveryCooldown:
      "Debes esperar 1 minuto y 30 segundos antes de volver a intentarlo",
    noFieldsToUpdate: "No hay campos para actualizar",
    invalidMediaId: "ID de archivo no válido",
    unexpectedError: "Ocurrió un error inesperado",
    userIdAndMediaIdRequired: "Se requieren user_id y media_id",
  },
} satisfies Messages;

export default messages;
