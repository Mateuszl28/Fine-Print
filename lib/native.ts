// Inside the Android app, Capacitor injects `window.Capacitor` into the page, with the
// native plugins installed in android/. In a normal browser this is all undefined.

type SharePlugin = { share(opts: { title?: string; text?: string; url?: string; dialogTitle?: string }): Promise<unknown> };
type TtsPlugin = {
  speak(opts: { text: string; lang?: string; rate?: number }): Promise<void>;
  stop(): Promise<void>;
};

type CapacitorGlobal = {
  isNativePlatform?: () => boolean;
  isPluginAvailable?: (name: string) => boolean;
  Plugins?: { Share?: SharePlugin; TextToSpeech?: TtsPlugin };
};

function cap(): CapacitorGlobal | undefined {
  if (typeof window === 'undefined') return undefined;
  const c = (window as unknown as { Capacitor?: CapacitorGlobal }).Capacitor;
  return c?.isNativePlatform?.() ? c : undefined;
}

export function nativeShare(): SharePlugin | undefined {
  const c = cap();
  return c?.isPluginAvailable?.('Share') ? c.Plugins?.Share : undefined;
}

export function nativeTts(): TtsPlugin | undefined {
  const c = cap();
  return c?.isPluginAvailable?.('TextToSpeech') ? c.Plugins?.TextToSpeech : undefined;
}
