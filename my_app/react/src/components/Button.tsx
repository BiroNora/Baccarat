import React from 'react';

interface ButtonProps {
  onClick: () => void;
  label?: string;
}

const Button: React.FC<ButtonProps> = ({ onClick, label = "Fogadás indítása" }) => {
  return (
    <button onClick={onClick} type="button">
      {label}
    </button>
  );
};

export default Button;
