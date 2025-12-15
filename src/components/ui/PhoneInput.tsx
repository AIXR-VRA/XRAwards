import React, { forwardRef } from 'react';
import PhoneInputBase from 'react-phone-number-input';
import type { E164Number } from 'libphonenumber-js/core';
import 'react-phone-number-input/style.css';

interface PhoneInputProps {
  value?: E164Number | string;
  onChange?: (value: E164Number | undefined) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  name?: string;
  required?: boolean;
  error?: boolean;
}

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ value, onChange, placeholder = 'Enter phone number', className = '', id, name, required = false, error = false }, ref) => {
    return (
      <div className={`phone-input ${error ? 'error' : ''} ${className}`}>
        <PhoneInputBase
          international
          defaultCountry="US"
          value={value as E164Number}
          onChange={onChange}
          placeholder={placeholder}
          id={id}
          name={name}
          required={required}
          className={`w-full px-2.5 py-2 border ${
            error ? 'border-red-300' : 'border-gray-300'
          } rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500`}
        />
        <style jsx global>{`
          .phone-input .PhoneInputInput {
            border: none;
            outline: none;
            background: transparent;
            width: 100%;
            padding: 0;
            font-size: inherit;
            font-family: inherit;
          }
          .phone-input .PhoneInputInput:focus {
            outline: none;
          }
          .phone-input .PhoneInputCountry {
            margin-right: 0.5rem;
          }
          .phone-input.error .PhoneInputInput {
            color: #dc2626;
          }
        `}</style>
      </div>
    );
  }
);

PhoneInput.displayName = 'PhoneInput';

