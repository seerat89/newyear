// Shared greetings, in the language set in lib/locale.ts (the browser's language by
// default, never the physical location; English as the fallback). Add a language by
// adding a row here, in strings.ts and in locale.ts.
import { isRtl } from './locale'

export type GreetingKind = 'christmas' | 'newyear'

type Row = { christmas: string; newyear: string }

const GREETINGS: Record<string, Row> = {
  en: { christmas: 'Merry Christmas', newyear: 'Happy New Year' },
  fi: { christmas: 'Hyvää joulua', newyear: 'Hyvää uutta vuotta' },
  sv: { christmas: 'God jul', newyear: 'Gott nytt år' },
  de: { christmas: 'Frohe Weihnachten', newyear: 'Frohes neues Jahr' },
  fr: { christmas: 'Joyeux Noël', newyear: 'Bonne année' },
  es: { christmas: 'Feliz Navidad', newyear: 'Feliz año nuevo' },
  it: { christmas: 'Buon Natale', newyear: 'Buon anno' },
  pt: { christmas: 'Feliz Natal', newyear: 'Feliz Ano Novo' },
  fa: { christmas: 'کریسمس مبارک', newyear: 'سال نو مبارک' },
  ar: { christmas: 'عيد ميلاد مجيد', newyear: 'سنة جديدة سعيدة' },
  tr: { christmas: 'Mutlu Noeller', newyear: 'Mutlu yıllar' },
  ru: { christmas: 'С Рождеством', newyear: 'С Новым годом' },
  uk: { christmas: 'З Різдвом', newyear: 'З Новим роком' },
  zh: { christmas: '圣诞快乐', newyear: '新年快乐' },
  ja: { christmas: 'メリークリスマス', newyear: 'あけましておめでとうございます' },
  ko: { christmas: '메리 크리스마스', newyear: '새해 복 많이 받으세요' },
  hi: { christmas: 'क्रिसमस की शुभकामनाएँ', newyear: 'नव वर्ष की शुभकामनाएँ' },
  pl: { christmas: 'Wesołych Świąt', newyear: 'Szczęśliwego Nowego Roku' },
  nl: { christmas: 'Prettige kerst', newyear: 'Gelukkig nieuwjaar' },
  el: { christmas: 'Καλά Χριστούγεννα', newyear: 'Καλή Χρονιά' },
  ro: { christmas: 'Crăciun fericit', newyear: 'La mulți ani' },
  cs: { christmas: 'Veselé Vánoce', newyear: 'Šťastný nový rok' },
  hu: { christmas: 'Boldog karácsonyt', newyear: 'Boldog új évet' },
  da: { christmas: 'Glædelig jul', newyear: 'Godt nytår' },
  no: { christmas: 'God jul', newyear: 'Godt nytt år' },
}

/** The greeting text, its language code and its writing direction. */
export function getGreeting(kind: GreetingKind, lang: string) {
  const row = GREETINGS[lang] ?? GREETINGS.en
  return { text: row[kind], lang, dir: isRtl(lang) ? ('rtl' as const) : ('ltr' as const) }
}
