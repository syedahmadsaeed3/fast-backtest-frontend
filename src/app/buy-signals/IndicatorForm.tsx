import React from 'react';

type IndicatorInput = {
  name: string;
  label: string;
  type?: string;
};

type IndicatorFormProps = {
  indicator: string;
  inputs: IndicatorInput[];
  values: Record<string, any>;
  onChange: (field: string, value: any) => void;
};

export const IndicatorForm: React.FC<IndicatorFormProps> = ({
  indicator,
  inputs,
  values,
  onChange,
}) => {
  return (
    <div className="bg-[#001d3d] rounded-xl p-6 shadow-lg text-white w-full max-w-xl mb-6">
      <h2 className="text-xl font-bold mb-4">{indicator}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {inputs.map((input) => (
          <div key={input.name} className="flex flex-col">
            <label htmlFor={input.name} className="text-sm mb-1 text-gray-300">
              {input.label}
            </label>
            <input
              id={input.name}
              type={input.type || 'number'}
              className="px-3 py-2 rounded-lg text-black"
              placeholder={`Enter ${input.label}`}
              value={values[input.name] || ''}
              onChange={(e) => onChange(input.name, e.target.value)}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
