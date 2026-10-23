import React from 'react';

interface StatusPillProps {
  label: string;
  icon: React.ReactNode;
  variant?: 'active' | 'warning' | 'error' | 'neutral';
  tooltip?: string;
}

export const StatusPill: React.FC<StatusPillProps> = ({
  label,
  icon,
  variant = 'neutral',
  tooltip,
}) => {
  return (
    <span
      className={`status-pill ${variant}`}
      title={tooltip}
      role="status"
    >
      {icon}
      <span>{label}</span>
    </span>
  );
};
