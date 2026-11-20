import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { PinModal } from './PinModal';
import { useNavigate } from 'react-router-dom';

interface ProtectedStaffRouteProps {
  children: React.ReactNode;
}

export const ProtectedStaffRoute: React.FC<ProtectedStaffRouteProps> = ({ children }) => {
  const { isStaffAuthed } = useAuth();
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState<boolean>(!isStaffAuthed);

  if (!isStaffAuthed) {
    return (
      <div className="min-h-screen bg-gray-800 flex items-center justify-center p-4">
        <PinModal 
          isOpen={modalOpen} 
          onSuccess={() => setModalOpen(false)}
          onCancel={() => navigate('/')}
        />
      </div>
    );
  }

  return <>{children}</>;
};
