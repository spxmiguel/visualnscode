interface Window {
  readonly visualnscode?: {
    readonly platform: string;
    readonly versions: Readonly<Record<'chrome' | 'electron' | 'node', string>>;
  };
}
