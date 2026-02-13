import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route, Outlet } from 'react-router-dom';
import AdminDashboard from './AdminDashboard';
import '@testing-library/jest-dom';

// Mock child components to verify rendering
jest.mock('./DepartmentManagement', () => () => <div data-testid="dept-page">Department Page</div>);
jest.mock('./CourseManagement', () => () => <div data-testid="course-page">Course Page</div>);
jest.mock('./StudentManagement', () => () => <div data-testid="student-page">Student Page</div>);

// Mock Outlet if necessary, but we want to test that AdminDashboard renders Outlet
// Actually, since we are testing AdminDashboard's integration with Routes, we don't mock Outlet.
// But AdminDashboard IMPORTS Outlet.

describe('AdminDashboard Routing', () => {
    test('renders nested Department route by default or when navigated', async () => {
        render(
            <MemoryRouter initialEntries={['/admin/departments']}>
                <Routes>
                    <Route path="/admin" element={<AdminDashboard />}>
                        <Route path="departments" element={<div data-testid="dept-page">Department Page</div>} />
                        <Route path="courses" element={<div data-testid="course-page">Course Page</div>} />
                    </Route>
                </Routes>
            </MemoryRouter>
        );

        // Check if Sidebar is visible
        expect(screen.getByText(/Admin Portal/i)).toBeInTheDocument();

        // Check if main content (Outlet) renders the Department Page
        expect(screen.getByTestId('dept-page')).toBeInTheDocument();
    });

    test('renders nested Course route when navigated', async () => {
        render(
            <MemoryRouter initialEntries={['/admin/courses']}>
                <Routes>
                    <Route path="/admin" element={<AdminDashboard />}>
                        <Route path="departments" element={<div data-testid="dept-page">Department Page</div>} />
                        <Route path="courses" element={<div data-testid="course-page">Course Page</div>} />
                    </Route>
                </Routes>
            </MemoryRouter>
        );

        // Check if Sidebar is visible
        expect(screen.getByText(/Admin Portal/i)).toBeInTheDocument();

        // Check if main content (Outlet) renders the Course Page
        expect(screen.getByTestId('course-page')).toBeInTheDocument();
    });
});
