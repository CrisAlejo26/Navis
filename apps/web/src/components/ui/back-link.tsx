import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router';

/**
 * Volver a la pantalla de la que se viene.
 *
 * Existe porque el navegador tiene su botón de atrás pero la aplicación no
 * decía **a dónde** se vuelve: de un listado se vuelve a su portada, y de una
 * ficha, a su listado. El texto nombra el destino en vez de decir «atrás», que
 * es lo único que convierte un enlace en una orientación.
 *
 * Va arriba del todo y a la izquierda, que es donde se busca.
 */
export function BackLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="gap-1.5 group text-sm inline-flex w-fit items-center rounded-md text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <ArrowLeft
        size={15}
        aria-hidden
        className="group-hover:-translate-x-0.5 transition-transform duration-200"
      />
      {label}
    </Link>
  );
}
