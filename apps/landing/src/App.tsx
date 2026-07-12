import { APP_NAME } from '@visualnscode/config';
import { Button } from '@visualnscode/ui';

export function App() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 text-zinc-100">
      <section className="max-w-3xl text-center">
        <p className="mb-5 text-sm font-semibold uppercase tracking-[0.3em] text-violet-400">
          Em construção
        </p>
        <h1 className="text-5xl font-bold tracking-tight sm:text-7xl">{APP_NAME}</h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-zinc-400">
          Uma IDE orientada por IA, simples para começar e poderosa para evoluir.
        </p>
        <div className="mt-10">
          <Button disabled>Lista de espera em breve</Button>
        </div>
      </section>
    </main>
  );
}
