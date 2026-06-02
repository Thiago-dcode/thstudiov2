

const messages = {
  landing: {
    hero: {
      titlePrefix: "Let your",
      titleAccent: "art",
      titleSuffix: "be found.",
      subtitle:
        "Get a professional website as easy as updating your social media feed.",
      primaryCtaLoggedIn: "Access Atelier",
      primaryCtaLoggedOut: "Start Free Now",
      secondaryCta: "Find artists",
      waitList: {
        hook: "Join the waitlist to get early access to the app.",
        label: "Join the artist waitlist",
        placeholder: "Enter your email address",
        button: "Join waitlist",
        buttonPending: "Joining...",
        hint: "Registration will be open soon. Join the waitlist and get early access.",
        hintTooltip:
          "Early spots are limited and filled in the order artists join.",
        positionCount: "{position}/{max}",
        spotWarning: "don't lose your spot",
        fullMessage: "The waitlist is full.",
        successToast: "You are on the waitlist. We will keep you posted.",
        successTitle: "Thanks for joining the waitlist!",
        successMessage: "Big things are coming. We'll be in touch soon.",
      },
      disclaimer: "Free to start · No credit card required",
    },
    valuePillars: {
      header: {
        badge: "Why A11STUDIO",
        title: "Made by an artist for artists",
        description:
          "A professional home for your work - with the intelligence to grow your career and the simplicity to never slow you down.",
      },
      items: [
        {
          title: "Your Site. Social-Media Easy.",
          description:
            "It looks and performs like a custom website - but you can rearrange, update, and publish as fast as posting a story. Organize your entire body of work beautifully, without touching a line of code.",
        },
        {
          title: "AI Does the Heavy Lifting",
          description:
            "Writer's block on your bio? Let AI generate it. Need descriptions, tags, or SEO? AI writes, optimizes, and positions your portfolio so the right audience finds you - not the other way around.",
        },
        {
          title: "Built for Real Connections",
          description:
            "This isn't a feed that buries your work. Clients, collectors, and collaborators land on your portfolio and reach you directly. A platform designed around the artist-client relationship.",
        },
      ],
    },
    socialProof: {
      highlights: [
        "Pro website quality, social-media ease",
        "AI writes your bios, tags & positioning",
        "Clients discover and connect directly",
      ],
      cta: "Start Free Now",
    },
    featureCategories: {
      header: {
        badge: "Explore",
        title: "Featured Categories",
        description:
          "Discover artists by discipline - each path leads to curated results.",
      },
      card: {
        browse: "Browse",
        ariaBrowseArtistsIn: "Browse artists in",
      },
    },
    featuredArtists: {
      header: {
        badge: "Discover",
        title: "Artists you can connect with today",
        description:
          "Every portfolio is a direct line between artist and client. Browse, discover, and start a conversation.",
      },
      browseAll: "Browse All Artists",
    },
    cta: {
      badge: "Ready to begin?",
      title: "Your next client is searching for someone like you",
      description:
        "Create a stunning portfolio in minutes, let AI handle the rest, and start getting discovered. Free to start - no credit card, no strings.",
      button: "Create Your Portfolio",
    },
  },
  faqs: {
    title: "Frequently asked questions",
    stillHaveQuestions: "Still have questions? We're here to <link>help</link>",
    items: [
      {
        question: "What is A11STUDIO?",
        answer:
          "A11STUDIO is a portfolio platform built for visual artists that sits right between a professional website and the ease of social media. You get a polished, custom-looking site — but updating it is as simple as posting a story. No code, no web design skills, just drag, drop, and publish.",
      },
      {
        question: "What is a portfolio?",
        answer:
          "A portfolio is your highlight reel — a curated showcase of your absolute best work within a discipline or style. For example, a \"Wedding Photography\" portfolio would feature the strongest shots across all the weddings you've ever shot. It's what clients see to judge your skill and hire you.",
      },
      {
        question: "What is a collection?",
        answer:
          "A collection is a specific project or event grouped together. For example, \"Mary & John Wedding 2024\" would be a collection containing all the delivered photos from that particular shoot. It's how you organize individual jobs, sessions, or bodies of work.",
      },
      {
        question: "What is the difference between a portfolio and a collection?",
        answer:
          "A portfolio is your best-of — a showcase that spans multiple projects to demonstrate your expertise in a discipline (e.g. \"Wedding Photography\"). A collection is a single project or event (e.g. \"Mary & John Wedding 2024\"). Think of portfolios as what gets you hired and collections as how you organize each job.",
      },
      {
        question: "Why does A11STUDIO use AI?",
        answer:
          "So you can focus on what you do best — creating art. AI handles everything else behind the scenes: it generates SEO-optimized titles, descriptions, and tags for your work, categorizes your media automatically, and writes alt text so search engines and AI assistants can find you. You never need to learn about SEO or marketing — just upload your best pieces and AI makes sure the right audience discovers them.",
      },
      {
        question: "Can I use A11STUDIO for free?",
        answer:
          "Yes! A11STUDIO offers a free tier that lets you create your profile, build portfolios, and start showcasing your work right away. Premium plans unlock additional features like AI-powered tools, more storage, and advanced customization options.",
      },
    ],
  },
  language: "Language",
  search: {
    segments: {
      artists: "Artists",
      portfolios: "Portfolios"
    },
    page: {
      description: "Browse artists on A11STUDIO. Discover portfolios, services, and creative professionals.",
      title: "Artists — A11STUDIO",
      errorHeading: "We couldn't load {segment}",
      errorMessage: "Something went wrong while searching. Please try again in a moment.",
      searchingFor: "Searching for {segment}",
      results: {
        foundArtists: "{count, number} {count, plural, one {artist} other {artists}} found{suffix}",
        foundPortfolios: "{count, number} {count, plural, one {portfolio} other {portfolios}} found{suffix}",
        forQuery: ' for "{query}"'
      },
      empty: {
        heading: "No {segment} found{suffix}",
        output: "Your filters didn't match any {segment}. Try broadening your search{end}",
        lookNear: " or look for {segment} near you."
      }
    },
    filters: {
      activeFilters: "Active filters",
      clearAll: "Clear all",
      searchAria: "Search {segment}",
      searchPlaceholder: "Search {segment} by name, style, category…",
      badge: {
        search: "Search: {value}",
        geoLocation: "My location",
        country: "Country: {value}",
        state: "State: {value}",
        city: "City: {value}"
      }
    },
    nearMe: {
      gettingLocation: "Getting location…",
      nearMe: "Near me · {radius} km",
      searchClose: "Search close to me",
      locationDenied: "Enable location in browser settings and try again.",
      locationUnavailable: "Couldn't get your location. Please try again."
    },
    primaryFilters: {
      categories: "Categories",
      location: "Location",
      ariaLabel: "Categories and location filters",
      useMyLocation: "Use my location"
    },
    combobox: {
      placeholder: "Search…",
      empty: {
        pending: "",
        noMatches: "No matches.",
        noItems: "—",
        searchingCategories: "Type to search categories."
      }
    },
    artistCard: {
      openProfile: "Open profile: {name}, @{username}",
      specialtiesTitle: "Specialties",
      locationDetailsTitle: "Location details on profile",
      noLocationTitle: "No location listed",
      viewAction: "View"
    }
  },
  support: {
    contactLabel: "Contact Support",
    title: "Need help? Send us a message.",
    description:
      "Share your issue and choose the best subject so we can route your request faster. Our team will reply to the email you provide.",
    formContainer: {
      nameLabel: "Name",
      namePlaceholder: "Your name",
      emailLabel: "Email",
      emailPlaceholder: "your@email.com",
      subjectLabel: "Subject",
      messageLabel: "Message",
      messagePlaceholder: "Tell us how we can help...",
      submitButton: "Send to support",
      successToast: "Your message was sent to support.",
    },
    subjects: [
      { value: "General question", label: "General question" },
      { value: "Technical issue", label: "Technical issue" },
      { value: "Billing and plans", label: "Billing and plans" },
      { value: "Account access", label: "Account access" },
      { value: "Feature request", label: "Feature request" },
      { value: "Partnership", label: "Partnership" },
    ],
  },
};

export type Translations = typeof messages;
export default messages;
