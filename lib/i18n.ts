// The report's own labels, in the language the reader picked. The analysis text itself
// comes back from the model already in that language (see lib/prompt.ts).

export const LANGUAGES = {
  en: { name: 'English', native: 'English' },
  pl: { name: 'Polish', native: 'Polski' },
  uk: { name: 'Ukrainian', native: 'Українська' },
  es: { name: 'Spanish', native: 'Español' },
  de: { name: 'German', native: 'Deutsch' },
} as const;

export type Lang = keyof typeof LANGUAGES;

export function isLang(v: unknown): v is Lang {
  return typeof v === 'string' && v in LANGUAGES;
}

type Strings = {
  scanAnother: string;
  traps: (n: number) => string;
  watchOuts: (n: number) => string;
  fair: (n: number) => string;
  theySay: string;
  reallyCosts: string;
  overMonths: (n: number) => string;
  overTerm: string;
  noPrices: string;
  fairness: string;
  howWeGotIt: string;
  total: string;
  tapHint: string;
  pickHint: string;
  tagRed: string;
  tagYellow: string;
  tagGreen: string;
  whyItMatters: string;
  whatToDo: string;
  close: string;
  ask: string;
  letterCancel: string;
  letterChange: string;
  copy: string;
  copied: string;
  subject: string;
  letterTip: string;
  remindTitle: string;
  remindBody: (days: number | null) => string;
  remindStart: string;
  remindButton: string;
  remindDeadline: string;
  save: string;
  footer: string;
  notesHeading: string;
  topThree: string;
  readAloud: string;
  stopReading: string;
  compareTitle: string;
  cheaperBy: (amount: string) => string;
  fairer: string;
  perMonth: string;
  openFull: string;
  backToCompare: string;
  currencyMismatch: string;
  sameCost: string;
};

export const strings: Record<Lang, Strings> = {
  en: {
    scanAnother: '← Scan another',
    traps: (n) => `${n} ${n === 1 ? 'trap' : 'traps'}`,
    watchOuts: (n) => `${n} ${n === 1 ? 'watch-out' : 'watch-outs'}`,
    fair: (n) => `${n} fair`,
    theySay: 'They say',
    reallyCosts: 'It really costs',
    overMonths: (n) => `over ${n} months`,
    overTerm: 'over the term',
    noPrices: 'No prices in this document, so there’s nothing to add up.',
    fairness: 'Fairness',
    howWeGotIt: 'How we got that number',
    total: 'Total',
    tapHint: 'Tap anything highlighted.',
    pickHint: 'Pick a highlight on the page to see what it means for you.',
    tagRed: 'Trap',
    tagYellow: 'Watch out',
    tagGreen: 'In your favour',
    whyItMatters: 'Why it matters',
    whatToDo: 'What to do',
    close: 'Close',
    ask: 'Before you sign, ask',
    letterCancel: 'Your way out, already written',
    letterChange: 'Ask them to change it',
    copy: 'Copy letter',
    copied: 'Copied',
    subject: 'Subject',
    letterTip: 'Fill in the [brackets]. Send it the way the contract says, and keep a copy.',
    remindTitle: 'Don’t miss the way out',
    remindBody: (d) =>
      d ? `You have to give ${d} days’ notice before the term ends.` : 'The contract sets a notice rule for leaving.',
    remindStart: 'When does (or did) it start?',
    remindButton: 'Add reminder to calendar',
    remindDeadline: 'Last day to send notice',
    save: 'Save as PDF',
    footer: 'Not legal advice. This report isn’t saved anywhere — close the tab and it’s gone.',
    notesHeading: 'Every marked clause',
    topThree: 'If you read nothing else',
    readAloud: 'Read it out loud',
    stopReading: 'Stop reading',
    compareTitle: 'Side by side',
    cheaperBy: (a) => `Cheaper by ${a}`,
    fairer: 'Fairer deal',
    perMonth: 'a month, on average',
    openFull: 'Open the full report',
    backToCompare: '← Back to the comparison',
    currencyMismatch: 'Different currencies, so the totals aren’t directly comparable.',
    sameCost: 'Same total cost',
  },
  pl: {
    scanAnother: '← Sprawdź kolejną',
    traps: (n) => `${n} ${n === 1 ? 'pułapka' : n < 5 ? 'pułapki' : 'pułapek'}`,
    watchOuts: (n) => `${n} do uwagi`,
    fair: (n) => `${n} w porządku`,
    theySay: 'Mówią',
    reallyCosts: 'Naprawdę kosztuje',
    overMonths: (n) => `przez ${n} mies.`,
    overTerm: 'przez cały okres',
    noPrices: 'W tym dokumencie nie ma cen, więc nie ma czego sumować.',
    fairness: 'Uczciwość',
    howWeGotIt: 'Skąd ta kwota',
    total: 'Razem',
    tapHint: 'Stuknij w zaznaczony fragment.',
    pickHint: 'Wybierz zaznaczenie w umowie, żeby zobaczyć, co dla ciebie znaczy.',
    tagRed: 'Pułapka',
    tagYellow: 'Uwaga',
    tagGreen: 'Na twoją korzyść',
    whyItMatters: 'Dlaczego to ważne',
    whatToDo: 'Co zrobić',
    close: 'Zamknij',
    ask: 'Zanim podpiszesz, zapytaj',
    letterCancel: 'Twoje wyjście, już napisane',
    letterChange: 'Poproś o zmianę',
    copy: 'Kopiuj list',
    copied: 'Skopiowano',
    subject: 'Temat',
    letterTip: 'List jest w języku umowy, bo trafi do drugiej strony. Uzupełnij [nawiasy], wyślij tak, jak każe umowa, i zachowaj kopię.',
    remindTitle: 'Nie przegap terminu',
    remindBody: (d) =>
      d ? `Wypowiedzenie trzeba złożyć ${d} dni przed końcem okresu.` : 'Umowa określa zasady wypowiedzenia.',
    remindStart: 'Kiedy umowa się zaczyna (lub zaczęła)?',
    remindButton: 'Dodaj przypomnienie do kalendarza',
    remindDeadline: 'Ostatni dzień na wypowiedzenie',
    save: 'Zapisz jako PDF',
    footer: 'To nie jest porada prawna. Raport nie jest nigdzie zapisywany — zamknij kartę i znika.',
    notesHeading: 'Wszystkie zaznaczone zapisy',
    topThree: 'Jeśli nic więcej nie przeczytasz',
    readAloud: 'Przeczytaj na głos',
    stopReading: 'Przestań czytać',
    compareTitle: 'Obok siebie',
    cheaperBy: (a) => `Taniej o ${a}`,
    fairer: 'Uczciwsza umowa',
    perMonth: 'miesięcznie, średnio',
    openFull: 'Otwórz pełny raport',
    backToCompare: '← Wróć do porównania',
    currencyMismatch: 'Różne waluty, więc sum nie da się wprost porównać.',
    sameCost: 'Ten sam koszt',
  },
  uk: {
    scanAnother: '← Перевірити інший',
    traps: (n) => `${n} пастк${n === 1 ? 'а' : n < 5 ? 'и' : 'ок'}`,
    watchOuts: (n) => `${n} увага`,
    fair: (n) => `${n} чесно`,
    theySay: 'Кажуть',
    reallyCosts: 'Насправді коштує',
    overMonths: (n) => `за ${n} міс.`,
    overTerm: 'за весь термін',
    noPrices: 'У документі немає цін, тож нічого підсумовувати.',
    fairness: 'Чесність',
    howWeGotIt: 'Звідки ця сума',
    total: 'Разом',
    tapHint: 'Торкніться виділеного фрагмента.',
    pickHint: 'Оберіть виділення в договорі, щоб побачити, що воно означає для вас.',
    tagRed: 'Пастка',
    tagYellow: 'Увага',
    tagGreen: 'На вашу користь',
    whyItMatters: 'Чому це важливо',
    whatToDo: 'Що робити',
    close: 'Закрити',
    ask: 'Перш ніж підписати, запитайте',
    letterCancel: 'Ваш вихід, уже написаний',
    letterChange: 'Попросіть змінити',
    copy: 'Копіювати лист',
    copied: 'Скопійовано',
    subject: 'Тема',
    letterTip: 'Лист мовою договору, бо його отримає інша сторона. Заповніть [дужки], надішліть так, як вимагає договір, і збережіть копію.',
    remindTitle: 'Не пропустіть термін',
    remindBody: (d) =>
      d ? `Повідомити треба за ${d} днів до кінця терміну.` : 'Договір встановлює правила розірвання.',
    remindStart: 'Коли договір починається (почався)?',
    remindButton: 'Додати нагадування в календар',
    remindDeadline: 'Останній день для повідомлення',
    save: 'Зберегти як PDF',
    footer: 'Це не юридична консультація. Звіт ніде не зберігається — закрийте вкладку, і його немає.',
    notesHeading: 'Усі виділені пункти',
    topThree: 'Якщо більше нічого не прочитаєте',
    readAloud: 'Прочитати вголос',
    stopReading: 'Зупинити',
    compareTitle: 'Поруч',
    cheaperBy: (a) => `Дешевше на ${a}`,
    fairer: 'Чесніша угода',
    perMonth: 'на місяць, у середньому',
    openFull: 'Відкрити повний звіт',
    backToCompare: '← Назад до порівняння',
    currencyMismatch: 'Різні валюти, тож суми не можна порівняти напряму.',
    sameCost: 'Однакова вартість',
  },
  es: {
    scanAnother: '← Revisar otro',
    traps: (n) => `${n} ${n === 1 ? 'trampa' : 'trampas'}`,
    watchOuts: (n) => `${n} ojo`,
    fair: (n) => `${n} justas`,
    theySay: 'Dicen',
    reallyCosts: 'Realmente cuesta',
    overMonths: (n) => `en ${n} meses`,
    overTerm: 'en todo el plazo',
    noPrices: 'Este documento no tiene precios, así que no hay nada que sumar.',
    fairness: 'Justicia',
    howWeGotIt: 'De dónde sale la cifra',
    total: 'Total',
    tapHint: 'Toca cualquier parte resaltada.',
    pickHint: 'Elige un resaltado para ver qué significa para ti.',
    tagRed: 'Trampa',
    tagYellow: 'Ojo',
    tagGreen: 'A tu favor',
    whyItMatters: 'Por qué importa',
    whatToDo: 'Qué hacer',
    close: 'Cerrar',
    ask: 'Antes de firmar, pregunta',
    letterCancel: 'Tu salida, ya escrita',
    letterChange: 'Pide que lo cambien',
    copy: 'Copiar carta',
    copied: 'Copiada',
    subject: 'Asunto',
    letterTip: 'La carta está en el idioma del contrato, porque va para la otra parte. Rellena los [corchetes], envíala como dice el contrato y guarda una copia.',
    remindTitle: 'No pierdas la salida',
    remindBody: (d) =>
      d ? `Debes avisar con ${d} días de antelación antes del fin del plazo.` : 'El contrato fija cómo darse de baja.',
    remindStart: '¿Cuándo empieza (o empezó)?',
    remindButton: 'Añadir recordatorio al calendario',
    remindDeadline: 'Último día para avisar',
    save: 'Guardar como PDF',
    footer: 'No es asesoría legal. Este informe no se guarda en ningún sitio: cierra la pestaña y desaparece.',
    notesHeading: 'Todas las cláusulas marcadas',
    topThree: 'Si no lees nada más',
    readAloud: 'Leer en voz alta',
    stopReading: 'Dejar de leer',
    compareTitle: 'Lado a lado',
    cheaperBy: (a) => `Más barato por ${a}`,
    fairer: 'Trato más justo',
    perMonth: 'al mes, de media',
    openFull: 'Abrir el informe completo',
    backToCompare: '← Volver a la comparación',
    currencyMismatch: 'Monedas distintas, así que los totales no se pueden comparar directamente.',
    sameCost: 'Mismo coste total',
  },
  de: {
    scanAnother: '← Anderen prüfen',
    traps: (n) => `${n} ${n === 1 ? 'Falle' : 'Fallen'}`,
    watchOuts: (n) => `${n} Achtung`,
    fair: (n) => `${n} fair`,
    theySay: 'Beworben',
    reallyCosts: 'Kostet wirklich',
    overMonths: (n) => `über ${n} Monate`,
    overTerm: 'über die Laufzeit',
    noPrices: 'In diesem Dokument stehen keine Preise, also gibt es nichts zu addieren.',
    fairness: 'Fairness',
    howWeGotIt: 'Wie wir auf die Zahl kommen',
    total: 'Summe',
    tapHint: 'Tippe auf eine Markierung.',
    pickHint: 'Wähle eine Markierung, um zu sehen, was sie für dich bedeutet.',
    tagRed: 'Falle',
    tagYellow: 'Achtung',
    tagGreen: 'Zu deinen Gunsten',
    whyItMatters: 'Warum das zählt',
    whatToDo: 'Was tun',
    close: 'Schließen',
    ask: 'Vor dem Unterschreiben fragen',
    letterCancel: 'Dein Ausstieg, schon geschrieben',
    letterChange: 'Um Änderung bitten',
    copy: 'Brief kopieren',
    copied: 'Kopiert',
    subject: 'Betreff',
    letterTip: 'Der Brief ist in der Vertragssprache, weil er an die Gegenseite geht. Fülle die [Klammern] aus, schick ihn so, wie der Vertrag es verlangt, und behalte eine Kopie.',
    remindTitle: 'Verpasse den Ausstieg nicht',
    remindBody: (d) =>
      d ? `Du musst ${d} Tage vor Laufzeitende kündigen.` : 'Der Vertrag regelt, wie du kündigst.',
    remindStart: 'Wann beginnt (begann) der Vertrag?',
    remindButton: 'Erinnerung in den Kalender',
    remindDeadline: 'Letzter Tag für die Kündigung',
    save: 'Als PDF speichern',
    footer: 'Keine Rechtsberatung. Dieser Bericht wird nirgends gespeichert — Tab schließen, und er ist weg.',
    notesHeading: 'Alle markierten Klauseln',
    topThree: 'Wenn du sonst nichts liest',
    readAloud: 'Vorlesen',
    stopReading: 'Vorlesen stoppen',
    compareTitle: 'Nebeneinander',
    cheaperBy: (a) => `Günstiger um ${a}`,
    fairer: 'Fairerer Vertrag',
    perMonth: 'pro Monat im Schnitt',
    openFull: 'Ganzen Bericht öffnen',
    backToCompare: '← Zurück zum Vergleich',
    currencyMismatch: 'Unterschiedliche Währungen, die Summen sind nicht direkt vergleichbar.',
    sameCost: 'Gleiche Gesamtkosten',
  },
};
