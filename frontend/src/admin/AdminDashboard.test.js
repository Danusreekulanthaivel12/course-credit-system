import { render, screen } from '@testing-library/react';
import AdminDashboard from './AdminDashboard';
import { ToastProvider } from '../components/ui/Toast';

// Mock react-router-dom with virtual: true to bypass module resolution issues
jest.mock('react-router-dom', () => ({
    NavLink: ({ to, children, className }) => {
        // Simulate isActive being false for simplicity
        const isActive = false;
        // Handle function className (commonly used in NavLink)
        const cssClass = typeof className === 'function' ? className({ isActive }) : className;
        return <a href={to} className={cssClass}>{children}</a>;
    },
    Routes: ({ children }) => <div data-testid="routes">{children}</div>,
    Route: ({ element }) => <div data-testid="route">{element}</div>,
    Navigate: () => <div data-testid="navigate">Redirected</div>,
    BrowserRouter: ({ children }) => <div>{children}</div>,
    useLocation: () => ({ pathname: '/admin/departments' }),
}), { virtual: true });

test('renders admin dashboard sidebar items', () => {
    render(
        <ToastProvider>
            <AdminDashboard />
        </ToastProvider>
    );

    // Check for Sidebar Header
    expect(screen.getByText(/Admin Portal/i)).toBeInTheDocument();

    // Check for Navigation Items (Links)
    expect(screen.getByRole('link', { name: /Departments/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Courses/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Students/i })).toBeInTheDocument();

    // Check that removed items are NOT present
    // queryByRole returns null if not found
    expect(screen.queryByRole('link', { name: /Semester Limits/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Registration Stats/i })).not.toBeInTheDocument();
});
