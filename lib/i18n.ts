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
  letterKinds: string;
  kindCancel: string;
  kindChange: string;
  kindComplaint: string;
  letterComplaint: string;
  letterPick: string;
  letterHappened: string;
  letterHappenedHint: string;
  letterWrite: string;
  letterWriting: string;
  letterFailed: string;
  letterBusy: string;
  letterRedo: string;
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
  share: string;
  linkCopied: string;
  shareNote: string;
  sharedBanner: string;
  savedHere: string;
  viewText: string;
  viewPhoto: string;
  photoNote: string;
  photoWorking: string;
  photoMissing: (n: number) => string;
  photoFailed: string;
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
    letterKinds: 'Which letter',
    kindCancel: 'Cancel',
    kindChange: 'Ask to change',
    kindComplaint: 'Complain',
    letterComplaint: 'Something went wrong? Complain',
    letterPick: 'Which clauses should the letter be about?',
    letterHappened: 'What happened? (optional)',
    letterHappenedHint: 'e.g. They charged the $49 fee twice in March. Any language is fine.',
    letterWrite: 'Write this letter',
    letterWriting: 'Writing it in the contract’s language…',
    letterFailed: 'Couldn’t write the letter. Try again.',
    letterBusy: 'That’s a lot of letters for one hour. Try again later.',
    letterRedo: 'Change what it covers',
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
    share: 'Send it to someone',
    linkCopied: 'Link copied',
    shareNote: 'The link carries the whole report, contract text included. It isn’t stored anywhere else.',
    sharedBanner: 'Someone sent you this report. It lives only in the link.',
    savedHere: 'Kept on this device under “Your recent reads”.',
    viewText: 'On the text',
    viewPhoto: 'On your photo',
    photoNote: 'Each mark sits where its words were found on your photo, read right here on your device.',
    photoWorking: 'Reading your photo to find the marks…',
    photoMissing: (n) => `${n} ${n === 1 ? 'clause wasn’t' : 'clauses weren’t'} found on the photo; ${n === 1 ? 'it’s' : 'they’re'} still marked in the text view.`,
    photoFailed: 'Couldn’t read the photo well enough to place the marks. The text view has them all.',
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
    letterKinds: 'Rodzaj listu',
    kindCancel: 'Wypowiedz',
    kindChange: 'Poproś o zmianę',
    kindComplaint: 'Złóż reklamację',
    letterComplaint: 'Coś poszło nie tak? Reklamacja',
    letterPick: 'Których klauzul ma dotyczyć list?',
    letterHappened: 'Co się stało? (opcjonalnie)',
    letterHappenedHint: 'np. W marcu dwa razy pobrali opłatę 49 zł. Pisz po polsku, list i tak będzie w języku umowy.',
    letterWrite: 'Napisz ten list',
    letterWriting: 'Piszę go w języku umowy…',
    letterFailed: 'Nie udało się napisać listu. Spróbuj ponownie.',
    letterBusy: 'Za dużo listów w tej godzinie. Spróbuj później.',
    letterRedo: 'Zmień, czego dotyczy',
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
    share: 'Wyślij komuś',
    linkCopied: 'Link skopiowany',
    shareNote: 'Link zawiera cały raport, razem z treścią umowy. Nie jest nigdzie indziej zapisywany.',
    sharedBanner: 'Ktoś wysłał ci ten raport. Istnieje tylko w linku.',
    savedHere: 'Zapisany na tym urządzeniu w „Your recent reads”.',
    viewText: 'Na tekście',
    viewPhoto: 'Na twoim zdjęciu',
    photoNote: 'Każde zaznaczenie leży tam, gdzie jego słowa znaleziono na zdjęciu, odczytanym tu, na twoim urządzeniu.',
    photoWorking: 'Czytam zdjęcie, żeby znaleźć zaznaczenia…',
    photoMissing: (n) => `${n} ${n === 1 ? 'zapisu nie znaleziono' : 'zapisów nie znaleziono'} na zdjęciu; nadal są zaznaczone w widoku tekstu.`,
    photoFailed: 'Nie udało się odczytać zdjęcia na tyle dobrze. Wszystkie zaznaczenia są w widoku tekstu.',
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
    letterKinds: 'Вид листа',
    kindCancel: 'Розірвати',
    kindChange: 'Попросити змінити',
    kindComplaint: 'Поскаржитися',
    letterComplaint: 'Щось пішло не так? Скарга',
    letterPick: 'Яких пунктів має стосуватися лист?',
    letterHappened: 'Що сталося? (необов’язково)',
    letterHappenedHint: 'напр. У березні двічі списали плату 49 €. Пишіть українською, лист однаково буде мовою договору.',
    letterWrite: 'Написати цей лист',
    letterWriting: 'Пишу його мовою договору…',
    letterFailed: 'Не вдалося написати лист. Спробуйте ще раз.',
    letterBusy: 'Забагато листів за годину. Спробуйте пізніше.',
    letterRedo: 'Змінити, чого він стосується',
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
    share: 'Надіслати комусь',
    linkCopied: 'Посилання скопійовано',
    shareNote: 'Посилання містить увесь звіт разом із текстом договору. Більше ніде не зберігається.',
    sharedBanner: 'Хтось надіслав вам цей звіт. Він існує лише в посиланні.',
    savedHere: 'Збережено на цьому пристрої в «Your recent reads».',
    viewText: 'На тексті',
    viewPhoto: 'На вашому фото',
    photoNote: 'Кожна позначка там, де її слова знайдено на фото, прочитаному прямо на вашому пристрої.',
    photoWorking: 'Читаю фото, щоб знайти позначки…',
    photoMissing: (n) => `${n} пункт(и) не знайдено на фото; вони й далі позначені в текстовому вигляді.`,
    photoFailed: 'Не вдалося достатньо добре прочитати фото. Усі позначки є в текстовому вигляді.',
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
    letterKinds: 'Tipo de carta',
    kindCancel: 'Cancelar',
    kindChange: 'Pedir cambios',
    kindComplaint: 'Reclamar',
    letterComplaint: '¿Algo salió mal? Reclama',
    letterPick: '¿Sobre qué cláusulas debe ser la carta?',
    letterHappened: '¿Qué pasó? (opcional)',
    letterHappenedHint: 'p. ej. En marzo cobraron dos veces la cuota de 49 €. Escribe en español; la carta irá en el idioma del contrato.',
    letterWrite: 'Escribir esta carta',
    letterWriting: 'Escribiéndola en el idioma del contrato…',
    letterFailed: 'No se pudo escribir la carta. Inténtalo de nuevo.',
    letterBusy: 'Demasiadas cartas en una hora. Inténtalo más tarde.',
    letterRedo: 'Cambiar de qué trata',
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
    share: 'Enviárselo a alguien',
    linkCopied: 'Enlace copiado',
    shareNote: 'El enlace lleva todo el informe, con el texto del contrato. No se guarda en ningún otro sitio.',
    sharedBanner: 'Alguien te envió este informe. Solo existe en el enlace.',
    savedHere: 'Guardado en este dispositivo en «Your recent reads».',
    viewText: 'En el texto',
    viewPhoto: 'En tu foto',
    photoNote: 'Cada marca está donde se encontraron sus palabras en tu foto, leída aquí mismo en tu dispositivo.',
    photoWorking: 'Leyendo tu foto para encontrar las marcas…',
    photoMissing: (n) => `${n} ${n === 1 ? 'cláusula no se encontró' : 'cláusulas no se encontraron'} en la foto; siguen marcadas en la vista de texto.`,
    photoFailed: 'No se pudo leer la foto lo bastante bien. La vista de texto las tiene todas.',
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
    letterKinds: 'Art des Briefs',
    kindCancel: 'Kündigen',
    kindChange: 'Änderung erbitten',
    kindComplaint: 'Beschweren',
    letterComplaint: 'Etwas ist schiefgelaufen? Beschwerde',
    letterPick: 'Um welche Klauseln soll es im Brief gehen?',
    letterHappened: 'Was ist passiert? (optional)',
    letterHappenedHint: 'z. B. Im März wurde die Gebühr von 49 € zweimal abgebucht. Schreib auf Deutsch; der Brief kommt in der Vertragssprache.',
    letterWrite: 'Diesen Brief schreiben',
    letterWriting: 'Ich schreibe ihn in der Vertragssprache…',
    letterFailed: 'Der Brief konnte nicht geschrieben werden. Versuch es noch einmal.',
    letterBusy: 'Zu viele Briefe in einer Stunde. Versuch es später.',
    letterRedo: 'Ändern, worum es geht',
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
    share: 'An jemanden schicken',
    linkCopied: 'Link kopiert',
    shareNote: 'Der Link enthält den ganzen Bericht samt Vertragstext. Er wird nirgends sonst gespeichert.',
    sharedBanner: 'Jemand hat dir diesen Bericht geschickt. Er existiert nur im Link.',
    savedHere: 'Auf diesem Gerät unter „Your recent reads“ gespeichert.',
    viewText: 'Im Text',
    viewPhoto: 'Auf deinem Foto',
    photoNote: 'Jede Markierung liegt dort, wo ihre Wörter auf deinem Foto gefunden wurden – gelesen direkt auf deinem Gerät.',
    photoWorking: 'Lese dein Foto, um die Markierungen zu finden…',
    photoMissing: (n) => `${n} ${n === 1 ? 'Klausel wurde' : 'Klauseln wurden'} auf dem Foto nicht gefunden; in der Textansicht sind sie markiert.`,
    photoFailed: 'Das Foto ließ sich nicht gut genug lesen. Die Textansicht hat alle Markierungen.',
  },
};
