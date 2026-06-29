import { initReactI18next } from 'react-i18next';
import i18n from 'i18next';


const resources = {
  en: {
    translation: {
      "home": "Home",
      "history": "History",
      "about": "About",
      "analytics": "Analytics",
      "logout": "Logout",
      "login": "Login",
      "signup": "Signup",
      "initiate_debate": "Initiate AI Debate",
      "start_debate": "Start Debate",
      "suggested_topics": "Suggested Topics",
      "verdict_delivered": "Verdict Delivered",
      "winner": "Winner",
      "judges_analysis": "Judge's Analysis",
      "start_new_debate": "Start New Debate",
      "replay_mode": "Replay Mode",
      "translate_button": "Translate",
      "original_lang": "Original Language",
      "preferred_lang": "Preferred Language"
    }
  },
  te: {
    translation: {
      "home": "హోమ్",
      "history": "చరిత్ర",
      "about": "గురించి",
      "analytics": "విశ్లేషణ",
      "logout": "లాగ్ అవుట్",
      "login": "లాగిన్",
      "signup": "సైన్ అప్",
      "initiate_debate": "AI చర్చను ప్రారంభించండి",
      "start_debate": "చర్చ ప్రారంభించు",
      "suggested_topics": "సూచించిన అంశాలు",
      "verdict_delivered": "తీర్పు ఇవ్వబడింది",
      "winner": "విజేత",
      "judges_analysis": "న్యాయమూర్తి విశ్లేషణ",
      "start_new_debate": "కొత్త చర్చను ప్రారంభించండి",
      "replay_mode": "రీప్లే మోడ్",
      "translate_button": "అనువదించు",
      "original_lang": "అసలు భాష",
      "preferred_lang": "ఇష్టపడే భాష"
    }
  },
  hi: {
    translation: {
      "home": "होम",
      "history": "इतिहास",
      "about": "के बारे में",
      "analytics": "विश्लेषण",
      "logout": "लॉग आउट",
      "login": "लॉगिन",
      "signup": "साइन अप",
      "initiate_debate": "एआई बहस शुरू करें",
      "start_debate": "बहस शुरू करें",
      "suggested_topics": "सुझाए गए विषय",
      "verdict_delivered": "निर्णय दिया गया",
      "winner": "विजेता",
      "judges_analysis": "न्यायाधीश का विश्लेषण",
      "start_new_debate": "नई बहस शुरू करें",
      "replay_mode": "रिप्ले मोड",
      "translate_button": "अनुवाद करें",
      "original_lang": "मूल भाषा",
      "preferred_lang": "पसंदीदा भाषा"
    }
  },
  ta: {
    translation: {
      "home": "முகப்பு",
      "history": "வரலாறு",
      "about": "பற்றி",
      "analytics": "பகுப்பாய்வு",
      "logout": "வெளியேறு",
      "login": "உள்நுழை",
      "signup": "பதிவுசெய்",
      "initiate_debate": "AI విவாதத்தைத் தொடங்கு",
      "start_debate": "விவாதத்தைத் தொடங்கு",
      "suggested_topics": "பரிந்துரைக்கப்பட்ட தலைப்புகள்",
      "verdict_delivered": "தீர்ப்பு வழங்கப்பட்டது",
      "winner": "வெற்றியாளர்",
      "judges_analysis": "நீதிபதியின் பகுப்பாய்வு",
      "start_new_debate": "புதிய విவாதத்தைத் தொடங்கு",
      "replay_mode": "மறுமுறை இயக்கு",
      "translate_button": "மொழிபெயர்",
      "original_lang": "அசல் மொழி",
      "preferred_lang": "விருப்பமான மொழி"
    }
  },
  es: {
    translation: {
      "home": "Inicio",
      "history": "Historial",
      "about": "Acerca de",
      "analytics": "Análisis",
      "logout": "Cerrar sesión",
      "login": "Iniciar sesión",
      "signup": "Registrarse",
      "initiate_debate": "Iniciar debate de IA",
      "start_debate": "Comenzar debate",
      "suggested_topics": "Temas sugeridos",
      "verdict_delivered": "Vedicto entregado",
      "winner": "Ganador",
      "judges_analysis": "Análisis del juez",
      "start_new_debate": "Iniciar nuevo debate",
      "replay_mode": "Modo de reproducción",
      "translate_button": "Traducir",
      "original_lang": "Idioma original",
      "preferred_lang": "Idioma preferido"
    }
  },
  fr: {
    translation: {
      "home": "Accueil",
      "history": "Historique",
      "about": "À propos",
      "analytics": "Analytique",
      "logout": "Déconnexion",
      "login": "Connexion",
      "signup": "S'inscrire",
      "initiate_debate": "Lancer le débat IA",
      "start_debate": "Commencer le débat",
      "suggested_topics": "Sujets suggérés",
      "verdict_delivered": "Verdict rendu",
      "winner": "Vainqueur",
      "judges_analysis": "Analyse du juge",
      "start_new_debate": "Lancer un nouveau débat",
      "replay_mode": "Mode relecture",
      "translate_button": "Traduire",
      "original_lang": "Langue originale",
      "preferred_lang": "Langue préférée"
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('ui_lang') || 'en', // Default language matching user preference stored locally
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false // React already escapes values
    }
  });

export default i18n;

