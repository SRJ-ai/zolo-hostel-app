import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthPage } from './pages/auth';
import { SetupWizard } from './pages/setup';
import { Dashboard } from './pages/dashboard';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AuthPage />} />
        <Route path="/setup" element={<SetupWizard />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
