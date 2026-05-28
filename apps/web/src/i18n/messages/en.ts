export interface FaqItem {
  question: string;
  answer: string;
}

export interface FaqsMessages {
  title: string;
  stillHaveQuestions: string;
  items: FaqItem[];
}

export interface SupportSubject {
  value: string;
  label: string;
}

export interface SupportMessages {
  contactLabel: string;
  title: string;
  description: string;
  formContainer: {
    nameLabel: string;
    namePlaceholder: string;
    emailLabel: string;
    emailPlaceholder: string;
    subjectLabel: string;
    messageLabel: string;
    messagePlaceholder: string;
    submitButton: string;
    successToast: string;
  };
  subjects: SupportSubject[];
}

export interface LandingMessages {
  hero: {
    titlePrefix: string;
    titleAccent: string;
    titleSuffix: string;
    subtitle: string;
    primaryCtaLoggedIn: string;
    primaryCtaLoggedOut: string;
    secondaryCta: string;
    disclaimer: string;
  };
  valuePillars: {
    header: {
      badge: string;
      title: string;
      description: string;
    };
    items: {
      title: string;
      description: string;
    }[];
  };
  socialProof: {
    highlights: string[];
    cta: string;
  };
  featureCategories: {
    header: {
      badge: string;
      title: string;
      description: string;
    };
    card: {
      browse: string;
      ariaBrowseArtistsIn: string;
    };
  };
  featuredArtists: {
    header: {
      badge: string;
      title: string;
      description: string;
    };
    browseAll: string;
  };
  cta: {
    badge: string;
    title: string;
    description: string;
    button: string;
  };
}

export interface Messages {
  faqs: FaqsMessages;
  landing: LandingMessages;
  language: string;
  support: SupportMessages;
}

const messages: Messages = {
  landing: {
    hero: {
      titlePrefix: "Let your",
      titleAccent: "art",
      titleSuffix: "be found.",
      subtitle:
        "Build a beautiful artist profile like a professional website - and customize it as fast as updating your social feed.",
      primaryCtaLoggedIn: "Access Atelier",
      primaryCtaLoggedOut: "Start Free Now",
      secondaryCta: "Find artists",
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

export default messages;
