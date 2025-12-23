import { ReactNode } from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';

interface DashboardLayoutProps {
    children: ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Navbar />
            <div className="flex flex-1">
                <aside className="hidden md:block w-64 flex-shrink-0">
                    <Sidebar className="h-full" />
                </aside>
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50/50 p-4 md:p-6 lg:p-8">
                    <div className="mx-auto max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};
