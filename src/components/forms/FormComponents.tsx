'use client';

import React from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { getFieldError } from '../../lib/formValidation';

// Base input component
interface BaseInputProps {
  name: string;
  label?: string;
  placeholder?: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
  required?: boolean;
  disabled?: boolean;
  className?: string;
  error?: string;
}

export function BaseInput({
  name,
  label,
  placeholder,
  type = 'text',
  required = false,
  disabled = false,
  className = '',
  error,
}: BaseInputProps) {
  const { register } = useFormContext();

  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        {...register(name)}
        type={type}
        id={name}
        placeholder={placeholder}
        disabled={disabled}
        className={`
          w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          ${error ? 'border-red-300' : 'border-gray-300'}
          ${disabled ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'}
          ${className}
        `}
      />
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}

// Text input component
interface TextInputProps extends Omit<BaseInputProps, 'type'> {
  multiline?: boolean;
  rows?: number;
}

export function TextInput({ multiline = false, rows = 3, ...props }: TextInputProps) {
  const { register } = useFormContext();
  const { name, label, placeholder, required = false, disabled = false, className = '', error } = props;

  if (multiline) {
    return (
      <div className="space-y-1">
        {label && (
          <label htmlFor={name} className="block text-sm font-medium text-gray-700">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <textarea
          {...register(name)}
          id={name}
          rows={rows}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            ${error ? 'border-red-300' : 'border-gray-300'}
            ${disabled ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'}
            ${className}
          `}
        />
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
      </div>
    );
  }

  return <BaseInput {...props} />;
}

// Email input component
export function EmailInput(props: Omit<BaseInputProps, 'type'>) {
  return <BaseInput {...props} type="email" />;
}

// Password input component
export function PasswordInput(props: Omit<BaseInputProps, 'type'>) {
  return <BaseInput {...props} type="password" />;
}

// Number input component
interface NumberInputProps extends Omit<BaseInputProps, 'type'> {
  min?: number;
  max?: number;
  step?: number;
}

export function NumberInput({ min, max, step, ...props }: NumberInputProps) {
  const { register } = useFormContext();
  const { name, label, placeholder, required = false, disabled = false, className = '', error } = props;

  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        {...register(name, { valueAsNumber: true })}
        type="number"
        id={name}
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        className={`
          w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          ${error ? 'border-red-300' : 'border-gray-300'}
          ${disabled ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'}
          ${className}
        `}
      />
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}

// Select component
interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends Omit<BaseInputProps, 'type'> {
  options: SelectOption[];
  multiple?: boolean;
}

export function Select({ options, multiple = false, ...props }: SelectProps) {
  const { register } = useFormContext();
  const { name, label, required = false, disabled = false, className = '', error } = props;

  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <select
        {...register(name)}
        id={name}
        multiple={multiple}
        disabled={disabled}
        className={`
          w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          ${error ? 'border-red-300' : 'border-gray-300'}
          ${disabled ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'}
          ${className}
        `}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}

// Checkbox component
interface CheckboxProps extends Omit<BaseInputProps, 'type'> {
  description?: string;
}

export function Checkbox({ description, ...props }: CheckboxProps) {
  const { register } = useFormContext();
  const { name, label, required = false, disabled = false, className = '', error } = props;

  return (
    <div className="space-y-1">
      <div className="flex items-start">
        <div className="flex items-center h-5">
          <input
            {...register(name)}
            type="checkbox"
            id={name}
            disabled={disabled}
            className={`
              h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded
              ${disabled ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}
              ${className}
            `}
          />
        </div>
        <div className="ml-3 text-sm">
          {label && (
            <label htmlFor={name} className="font-medium text-gray-700">
              {label}
              {required && <span className="text-red-500 ml-1">*</span>}
            </label>
          )}
          {description && (
            <p className="text-gray-500">{description}</p>
          )}
        </div>
      </div>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}

// Radio group component
interface RadioOption {
  value: string;
  label: string;
  description?: string;
}

interface RadioGroupProps extends Omit<BaseInputProps, 'type'> {
  options: RadioOption[];
}

export function RadioGroup({ options, ...props }: RadioGroupProps) {
  const { register } = useFormContext();
  const { name, label, required = false, disabled = false, className = '', error } = props;

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="space-y-2">
        {options.map((option) => (
          <div key={option.value} className="flex items-start">
            <div className="flex items-center h-5">
              <input
                {...register(name)}
                type="radio"
                value={option.value}
                disabled={disabled}
                className={`
                  h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300
                  ${disabled ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}
                  ${className}
                `}
              />
            </div>
            <div className="ml-3 text-sm">
              <label className="font-medium text-gray-700">{option.label}</label>
              {option.description && (
                <p className="text-gray-500">{option.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}

// Rating component
interface RatingProps extends Omit<BaseInputProps, 'type'> {
  max?: number;
  showLabels?: boolean;
}

export function Rating({ max = 5, showLabels = true, ...props }: RatingProps) {
  const { control } = useFormContext();
  const { name, label, required = false, disabled = false, className = '', error } = props;

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <div className="flex items-center space-x-1">
            {Array.from({ length: max }, (_, i) => i + 1).map((rating) => (
              <button
                key={rating}
                type="button"
                disabled={disabled}
                onClick={() => field.onChange(rating)}
                className={`
                  text-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 rounded
                  ${field.value >= rating ? 'text-yellow-400' : 'text-gray-300'}
                  ${disabled ? 'cursor-not-allowed' : 'cursor-pointer hover:text-yellow-400'}
                  ${className}
                `}
              >
                ★
              </button>
            ))}
            {showLabels && field.value && (
              <span className="ml-2 text-sm text-gray-600">
                {field.value} out of {max}
              </span>
            )}
          </div>
        )}
      />
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}

// File input component
interface FileInputProps extends Omit<BaseInputProps, 'type'> {
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in MB
}

export function FileInput({ accept, multiple = false, maxSize, ...props }: FileInputProps) {
  const { register } = useFormContext();
  const { name, label, required = false, disabled = false, className = '', error } = props;

  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        {...register(name)}
        type="file"
        id={name}
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        className={`
          w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          ${error ? 'border-red-300' : 'border-gray-300'}
          ${disabled ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'}
          ${className}
        `}
      />
      {maxSize && (
        <p className="text-xs text-gray-500">Maximum file size: {maxSize}MB</p>
      )}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}

// Form field wrapper with error handling
interface FormFieldProps {
  name: string;
  children: React.ReactNode;
}

export function FormField({ name, children }: FormFieldProps) {
  const { formState: { errors } } = useFormContext();
  const error = getFieldError(errors, name);

  return (
    <div className="space-y-1">
      {children}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}

// Form submit button
interface SubmitButtonProps {
  children: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}

export function SubmitButton({ children, loading = false, disabled = false, className = '' }: SubmitButtonProps) {
  const { formState: { isSubmitting, isValid } } = useFormContext();

  return (
    <button
      type="submit"
      disabled={disabled || isSubmitting || !isValid}
      className={`
        w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white
        bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
        disabled:bg-gray-400 disabled:cursor-not-allowed
        ${className}
      `}
    >
      {loading || isSubmitting ? (
        <div className="flex items-center">
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading...
        </div>
      ) : (
        children
      )}
    </button>
  );
}
