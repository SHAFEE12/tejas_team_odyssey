import { BrowserRouter } from 'react-router-dom';
import { AuthProvider }   from './context/AuthContext';
import { AppProvider }    from './context/AppContext';
import AppRoutes          from './routes/AppRoutes';
import ErrorBoundary      from './components/common/ErrorBoundary';

/**
 * App — root component.
 * ErrorBoundary protects the entire application against unhandled render failures.
 * BrowserRouter provides routing context.
 * AuthProvider reads existing localStorage state and exposes it app-wide.
 * AppProvider loads the student skill profile and exposes it to all pages.
 * AppRoutes defines the full route tree (Landing Page, Login, Register, Dashboards).
 */
function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <AppProvider>
            <AppRoutes />
          </AppProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;