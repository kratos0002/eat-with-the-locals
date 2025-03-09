import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import RecipeDetails from './pages/RecipeDetails';
import SubmitRecipe from './pages/SubmitRecipe';
import Favorites from './pages/Favorites';
import AdminModeration from './pages/AdminModeration';

function App() {
  return (
    <div className="app">
      <Navbar />
      <main className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/recipe/:id" element={<RecipeDetails />} />
          <Route path="/submit" element={<SubmitRecipe />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/admin/moderation" element={<AdminModeration />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App; 