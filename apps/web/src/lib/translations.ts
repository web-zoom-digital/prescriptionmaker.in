export type LanguageCode = 'en' | 'hi' | 'mr' | 'bn' | 'te'

export const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिंदी (Hindi)' },
  { code: 'mr', label: 'मराठी (Marathi)' },
  { code: 'bn', label: 'বাংলা (Bengali)' },
  { code: 'te', label: 'తెలుగు (Telugu)' }
]

export const TRANSLATIONS: Record<LanguageCode, Record<string, string>> = {
  en: {
    // Timings
    'before_food': 'Before food',
    'after_food': 'After food',
    'with_food': 'With food',
    'empty_stomach': 'Empty stomach',
    'bedtime': 'At bedtime',
    
    // Frequencies
    'OD': 'Once a day (OD)',
    'BD': 'Twice a day (BD)',
    'TDS': 'Three times a day (TDS)',
    'QID': 'Four times a day (QID)',
    'SOS': 'As needed (SOS)',
    '1-1-1': 'Morning, Afternoon, Night',
    '1-0-1': 'Morning and Night',
    '1-0-0': 'Morning only',
    '0-0-1': 'Night only',
    
    // UI elements on PDF
    'rx': 'Rx',
    'advice': 'Advice:',
    'investigations': 'Investigations:',
    'follow_up': 'Follow-up Date:',
    'date': 'Date:',
    'age': 'Age',
    'weight': 'Wt',
    'gender': 'Gender',
    'patient_name': 'Patient Name'
  },
  hi: {
    'before_food': 'खाना खाने से पहले',
    'after_food': 'खाना खाने के बाद',
    'with_food': 'खाने के साथ',
    'empty_stomach': 'खाली पेट',
    'bedtime': 'रात को सोते समय',
    
    'OD': 'दिन में एक बार',
    'BD': 'दिन में दो बार (सुबह-शाम)',
    'TDS': 'दिन में तीन बार (सुबह-दोपहर-रात)',
    'QID': 'दिन में चार बार',
    'SOS': 'ज़रूरत पड़ने पर',
    '1-1-1': 'सुबह, दोपहर, रात',
    '1-0-1': 'सुबह और शाम',
    '1-0-0': 'केवल सुबह',
    '0-0-1': 'केवल रात को',

    'rx': 'दवाइयाँ (Rx)',
    'advice': 'सलाह:',
    'investigations': 'जाँच (Tests):',
    'follow_up': 'अगली मुलाकात:',
    'date': 'दिनांक:',
    'age': 'उम्र',
    'weight': 'वजन',
    'gender': 'लिंग',
    'patient_name': 'मरीज का नाम'
  },
  mr: {
    'before_food': 'जेवणापूर्वी',
    'after_food': 'जेवणानंतर',
    'with_food': 'जेवणासोबत',
    'empty_stomach': 'रिकाम्या पोटी',
    'bedtime': 'झोपताना',
    
    'OD': 'दिवसातून एकदा',
    'BD': 'दिवसातून दोनदा (सकाळ-संध्याकाळ)',
    'TDS': 'दिवसातून तीनदा',
    'QID': 'दिवसातून चार वेळा',
    'SOS': 'गरज पडल्यास',
    '1-1-1': 'सकाळ, दुपार, रात्र',
    '1-0-1': 'सकाळ आणि रात्र',
    '1-0-0': 'फक्त सकाळी',
    '0-0-1': 'फक्त रात्री',

    'rx': 'औषधे (Rx)',
    'advice': 'सल्ला:',
    'investigations': 'तपासणी (Tests):',
    'follow_up': 'पुढील भेट:',
    'date': 'दिनांक:',
    'age': 'वय',
    'weight': 'वजन',
    'gender': 'लिंग',
    'patient_name': 'रुग्णाचे नाव'
  },
  bn: {
    'before_food': 'খাওয়ার আগে',
    'after_food': 'খাওয়ার পরে',
    'with_food': 'খাবারের সাথে',
    'empty_stomach': 'খালি পেটে',
    'bedtime': 'ঘুমানোর সময়',
    
    'OD': 'দিনে একবার',
    'BD': 'দিনে দুবার (সকাল-সন্ধ্যা)',
    'TDS': 'দিনে তিনবার',
    'QID': 'দিনে চারবার',
    'SOS': 'প্রয়োজন হলে',
    '1-1-1': 'সকাল, দুপুর, রাত',
    '1-0-1': 'সকাল এবং রাত',
    '1-0-0': 'শুধু সকালে',
    '0-0-1': 'শুধু রাতে',

    'rx': 'ওষুধ (Rx)',
    'advice': 'পরামর্শ:',
    'investigations': 'পরীক্ষা (Tests):',
    'follow_up': 'পরবর্তী ভিজিট:',
    'date': 'তারিখ:',
    'age': 'বয়স',
    'weight': 'ওজন',
    'gender': 'লিঙ্গ',
    'patient_name': 'রোগীর নাম'
  },
  te: {
    'before_food': 'భోజనానికి ముందు',
    'after_food': 'భోజనం తర్వాత',
    'with_food': 'ఆహారంతో',
    'empty_stomach': 'ఖాళీ కడుపుతో',
    'bedtime': 'పడుకునే ముందు',
    
    'OD': 'రోజుకు ఒకసారి',
    'BD': 'రోజుకు రెండుసార్లు',
    'TDS': 'రోజుకు మూడుసార్లు',
    'QID': 'రోజుకు నాలుగుసార్లు',
    'SOS': 'అవసరమైనప్పుడు',
    '1-1-1': 'ఉదయం, మధ్యాహ్నం, రాత్రి',
    '1-0-1': 'ఉదయం మరియు రాత్రి',
    '1-0-0': 'ఉదయం మాత్రమే',
    '0-0-1': 'రాత్రి మాత్రమే',

    'rx': 'మందులు (Rx)',
    'advice': 'సలహా:',
    'investigations': 'పరీక్షలు (Tests):',
    'follow_up': 'తదుపరి సందర్శన:',
    'date': 'తేదీ:',
    'age': 'వయస్సు',
    'weight': 'బరువు',
    'gender': 'లింగం',
    'patient_name': 'రోగి పేరు'
  }
}

export function t(key: string, lang: LanguageCode = 'en'): string {
  if (!key) return ''
  // If the exact key exists, return it
  if (TRANSLATIONS[lang] && TRANSLATIONS[lang][key]) {
    return TRANSLATIONS[lang][key]
  }
  // Try to match ignoring case/spaces for timings/frequencies
  const normalizedKey = key.trim()
  for (const [k, v] of Object.entries(TRANSLATIONS[lang] || {})) {
    if (k.toLowerCase() === normalizedKey.toLowerCase()) {
      return v
    }
  }
  // Fallback to English if translation missing
  if (lang !== 'en' && TRANSLATIONS['en'][key]) {
    return TRANSLATIONS['en'][key]
  }
  return key
}

export const COMMON_ADVICE_TEMPLATES = [
  { en: 'Drink plenty of fluids', hi: 'खूब सारा पानी पिएं', mr: 'भरपूर पाणी प्या', bn: 'প্রচুর পরিমাণে তরল পান করুন', te: 'చాలా ద్రవాలు త్రాగాలి' },
  { en: 'Take rest for 3 days', hi: '3 दिन तक आराम करें', mr: '3 दिवस विश्रांती घ्या', bn: '৩ দিন বিশ্রাম নিন', te: '3 రోజులు విశ్రాంతి తీసుకోండి' },
  { en: 'Avoid spicy and oily food', hi: 'मसालेदार और तैलीय भोजन से बचें', mr: 'मसालेदार आणि तेलकट पदार्थ टाळा', bn: 'মসলাযুক্ত ও তৈলাক্ত খাবার এড়িয়ে চলুন', te: 'స్పైసీ మరియు జిడ్డుగల ఆహారాన్ని నివారించండి' },
  { en: 'Avoid cold food and drinks', hi: 'ठंडे भोजन और पेय पदार्थों से बचें', mr: 'थंड अन्न आणि पेये टाळा', bn: 'ঠান্ডা খাবার ও পানীয় এড়িয়ে চলুন', te: 'చల్లని ఆహారం మరియు పానీయాలకు దూరంగా ఉండండి' }
]
