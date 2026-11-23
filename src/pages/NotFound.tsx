import { Link } from 'react-router-dom';
import { useTitle } from '../lib/useTitle';

export default function NotFound() {
  useTitle('Page not found — Rang Ghar Paint & Hardware');
  return (
    <div className="shell py-16 sm:py-24">
      <div className="relative overflow-hidden rounded-[2rem] border-2 border-ink bg-white px-6 py-12 shadow-hard sm:px-10 sm:py-16">
        <div aria-hidden="true" className="blob absolute -right-16 -top-20 h-56 w-56 bg-sun/40 blur-2xl" />
        <div aria-hidden="true" className="blob-2 absolute -bottom-24 left-10 h-56 w-56 bg-pink/20 blur-3xl" />
        <div className="relative max-w-xl">
          <span className="sticker rotate-[-3deg]">404 · empty shelf</span>
          <h1 className="h1 mt-5 max-w-[16ch]">This shelf is empty</h1>
          <p className="mt-4 max-w-md text-[0.92rem] leading-relaxed text-ink-2">
            The page you asked for is not here. The shade card and the catalogue are where most people are headed.
          </p>
          <div className="mt-6 flex flex-wrap gap-2.5">
            <Link to="/" className="btn btn-solid">
              Back to the shop
            </Link>
            <Link to="/shades" className="btn btn-sun">
              Shade card
            </Link>
            <Link to="/products" className="btn btn-quiet">
              Catalogue
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
