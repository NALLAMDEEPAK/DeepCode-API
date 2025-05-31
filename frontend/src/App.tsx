import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ProblemList } from './components/ProblemList';
import { ProblemPage } from './components/ProblemPage';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <div className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<ProblemList />} />
            <Route path="/problem/:id" element={<ProblemPage />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;