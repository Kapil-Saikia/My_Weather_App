import React from "react";

export default function InstallPrompt() {
  const [deferred, setDeferred] = React.useState<any>(null);
  const [canInstall, setCanInstall] = React.useState(false);

  React.useEffect(() => {
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferred(e as any);
      setCanInstall(true);
    };
    const onAppInstalled = () => {
      setDeferred(null);
      setCanInstall(false);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onAppInstalled);

    // If already in standalone, hide
    const standalone = (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) || (navigator as any).standalone === true;
    if (standalone) setCanInstall(false);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  if (!canInstall) return null;

  return (
    <button
      onClick={async () => {
        try {
          const ev = deferred;
          setDeferred(null);
          const res = await ev.prompt();
          await ev.userChoice;
          setCanInstall(false);
        } catch {}
      }}
      className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/60 px-3 py-2 text-sm shadow-sm ring-1 ring-black/5 backdrop-blur transition hover:bg-white/80 dark:bg-black/30 dark:hover:bg-black/40"
    >
      Install app
    </button>
  );
}
