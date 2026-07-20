import { Footer, Navigation } from './components/Layout';
import { ProductWorkspace } from './components/ProductWorkspace';
import {
  AgentsSection,
  AutomaticSetupSection,
  CallToAction,
  DeploymentSection,
  FaqSection,
  Hero,
  IntegrationsSection,
  ModesSection,
  ProblemSection,
  RoadmapSection,
  SecuritySection,
  SolutionSection,
} from './components/Sections';

export function App() {
  return (
    <div className="min-h-screen bg-[rgb(var(--page))] text-[rgb(var(--ink))] antialiased">
      <a className="skip-link" href="#main-content">
        Pular para o conteúdo
      </a>
      <Navigation />
      <main id="main-content">
        <Hero />
        <ProductWorkspace />
        <ProblemSection />
        <SolutionSection />
        <IntegrationsSection />
        <ModesSection />
        <AgentsSection />
        <AutomaticSetupSection />
        <SecuritySection />
        <DeploymentSection />
        <RoadmapSection />
        <FaqSection />
        <CallToAction />
      </main>
      <Footer />
    </div>
  );
}
