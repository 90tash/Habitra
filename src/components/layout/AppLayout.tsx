import React from 'react';
import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto relative">
      <main>
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}