import { useEffect } from "react";
import { Route, Routes, useLocation, useParams } from "react-router-dom";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { HomePage } from "./pages/HomePage";
import { ConcretePage } from "./pages/ConcretePage";
import { RodWeightPage } from "./pages/RodWeightPage";
import { PilePage } from "./pages/PilePage";
import { BeamPage } from "./pages/BeamPage";
import { ColumnPage } from "./pages/ColumnPage";
import { GenericToolPage } from "./pages/GenericToolPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { GENERIC_SPECS } from "./specs/allSpecs";

function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname, hash]);
  return null;
}

function GenericToolRoute() {
  const { slug } = useParams();
  const spec = GENERIC_SPECS.find((s) => s.slug === slug);
  if (!spec) return <NotFoundPage />;
  return <GenericToolPage key={spec.slug} spec={spec} />;
}

export function App() {
  return (
    <>
      <ScrollToTop />
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/tools/concrete" element={<ConcretePage />} />
        <Route path="/tools/rod-weight" element={<RodWeightPage />} />
        <Route path="/tools/pile" element={<PilePage />} />
        <Route path="/tools/beam" element={<BeamPage />} />
        <Route path="/tools/column" element={<ColumnPage />} />
        <Route path="/tools/:slug" element={<GenericToolRoute />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <Footer />
    </>
  );
}
