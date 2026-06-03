import React, { useId, useMemo } from 'react';

export interface EditableSelectOption {
  value: string;
  label: string;
}

interface EditableSelectProps {
  value?: string;
  defaultValue?: string;
  options: Array<string | EditableSelectOption>;
  onChange?: (value: string) => void;
  name?: string;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

const EditableSelect: React.FC<EditableSelectProps> = ({
  value,
  defaultValue,
  options,
  onChange,
  name,
  placeholder,
  className,
  required,
}) => {
  const generatedId = useId();
  const normalizedOptions = useMemo(
    () => options.map((option) => (typeof option === 'string' ? { value: option, label: option } : option)),
    [options]
  );

  const displayValue = value === undefined
    ? undefined
    : normalizedOptions.find((option) => option.value === value)?.label || value;

  const displayDefaultValue = defaultValue === undefined
    ? undefined
    : normalizedOptions.find((option) => option.value === defaultValue)?.label || defaultValue;

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const typedValue = event.target.value;
    const matchedOption = normalizedOptions.find((option) => option.label === typedValue);
    onChange?.(matchedOption?.value || typedValue);
  };

  return (
    <>
      <input
        className={className ? `editable-select ${className}` : 'editable-select'}
        list={generatedId}
        name={name}
        value={displayValue}
        defaultValue={displayDefaultValue}
        onChange={handleChange}
        placeholder={placeholder}
        required={required}
        autoComplete="off"
      />
      <datalist id={generatedId}>
        {normalizedOptions.map((option) => (
          <option key={`${option.value}-${option.label}`} value={option.label} />
        ))}
      </datalist>
    </>
  );
};

export default EditableSelect;
