import { useEffect, useState } from "react";

/** Router mínimo basado en el hash de la URL (#/retos, #/retos/:id, #/ranking, #/docente). */
export function useRoute(): string[] {
  const read = () => window.location.hash.replace(/^#\/?/, "").split("/").filter(Boolean);
  const [parts, setParts] = useState(read);
  useEffect(() => {
    const onChange = () => { setParts(read()); window.scrollTo(0, 0); };
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return parts;
}
export const go = (path: string) => { window.location.hash = path; };
