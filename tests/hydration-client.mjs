import('@angular/compiler')
  .then(async () => {
    const [{ bootstrapApplication, provideClientHydration }, { EmrSsrHostComponent }] = await Promise.all([
      import('@angular/platform-browser'),
      import('./ssr-host.mjs')
    ]);
    return bootstrapApplication(EmrSsrHostComponent, { providers: [provideClientHydration()] });
  })
  .then(() => { globalThis.__emrHydrated = true; })
  .catch(error => {
    globalThis.__emrHydrationError = String(error?.stack ?? error);
    throw error;
  });
