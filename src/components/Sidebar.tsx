import React from 'react';
import { X, Home, Settings, LayoutDashboard } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-20 z-30 transition-opacity lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full w-72 bg-white shadow-2xl z-40 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } rounded-r-3xl`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">T</span>
              </div>
              <span className="ml-3 text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                TaskFlow
              </span>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-xl"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              <li>
                <button className="w-full flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-xl transition-all hover:scale-[1.02]">
                  <Home size={20} className="mr-3 text-blue-600" />
                  <span className="font-medium">Dashboard</span>
                </button>
              </li>
              <li>
                <button className="w-full flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-xl transition-all hover:scale-[1.02]">
                  <LayoutDashboard size={20} className="mr-3 text-blue-600" />
                  <span className="font-medium">Boards</span>
                </button>
              </li>
              <li>
                <button className="w-full flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-xl transition-all hover:scale-[1.02]">
                  <Settings size={20} className="mr-3 text-blue-600" />
                  <span className="font-medium">Einstellungen</span>
                </button>
              </li>
            </ul>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-100">
            <div className="text-xs text-gray-500 text-center">
              TaskFlow v1.0 MVP
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
