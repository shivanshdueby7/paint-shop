import { Route, Routes } from 'react-router-dom';
import Shell from './components/Shell';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductPage from './pages/ProductPage';
import Shades from './pages/Shades';
import Wall from './pages/Wall';
import Calculator from './pages/Calculator';
import Services from './pages/Services';
import Offers from './pages/Offers';
import Trade from './pages/Trade';
import Visit from './pages/Visit';
import NotFound from './pages/NotFound';
import AdminApp from './admin/AdminApp';

export default function App() {
  return (
    <Routes>
      <Route element={<Shell />}>
        <Route index element={<Home />} />
        <Route path="products" element={<Products />} />
        <Route path="products/:slug" element={<ProductPage />} />
        <Route path="shades" element={<Shades />} />
        <Route path="wall" element={<Wall />} />
        <Route path="calculator" element={<Calculator />} />
        <Route path="services" element={<Services />} />
        <Route path="offers" element={<Offers />} />
        <Route path="trade" element={<Trade />} />
        <Route path="visit" element={<Visit />} />
        <Route path="*" element={<NotFound />} />
      </Route>
      <Route path="/admin/*" element={<AdminApp />} />
    </Routes>
  );
}
