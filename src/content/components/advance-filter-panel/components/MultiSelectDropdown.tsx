import Select, { StylesConfig } from "react-select";

import { ALGORITHM_TAGS } from "@/shared/data/filter-panel-data";

import { styles as globalStyles } from "../styles"; // Import the shared styles

interface OptionType {
  value: string;
  label: string;
  description: string;
}

const customSelectStyles: StylesConfig<OptionType, true> = {
  control: (provided, state) => ({
    ...provided,
    ...globalStyles.input,
    borderColor: state.isFocused ? '#3b82f6' : globalStyles.input.borderColor,
    boxShadow: state.isFocused ? '0 0 0 3px rgba(59, 130, 246, 0.1)' : 'none',
    '&:hover': {
      borderColor: state.isFocused ? '#3b82f6' : '#9ca3af',
    },
    padding: '0', // Reduced padding to better align with other inputs
    minHeight: '38px', // Explicit height
  }),
  menu: (provided) => ({
    ...provided,
    ...globalStyles.dropdownContent,
    marginTop: '4px',
    padding: '0.5rem',
    zIndex: 20, // Ensure it appears above other elements
  }),
  option: (provided, state) => ({
    ...provided,
    ...globalStyles.checkboxItem,
    backgroundColor: state.isSelected ? '#dbeafe' : state.isFocused ? '#f3f4f6' : 'white',
    color: state.isSelected ? '#1e40af' : '#374151',
    '&:active': {
      backgroundColor: '#dbeafe',
    },
    padding: '0.75rem 0.5rem',
  }),
  multiValue: (provided) => ({
    ...provided,
    ...globalStyles.badge,
    margin: '2px',
  }),
  multiValueLabel: (provided) => ({
    ...provided,
    color: 'inherit',
    fontSize: 'inherit',
    fontWeight: 'inherit',
    padding: '0',
    paddingLeft: '0',
  }),
  multiValueRemove: (provided) => ({
    ...provided,
    color: 'inherit',
    '&:hover': {
      backgroundColor: 'rgba(0,0,0,0.1)',
      color: 'inherit',
    },
  }),
  placeholder: (provided) => ({
    ...provided,
    color: '#9ca3af',
  }),
  clearIndicator: (provided) => ({
    ...provided,
    color: '#9ca3af',
    '&:hover': {
      color: '#374151',
    }
  }),
  dropdownIndicator: (provided) => ({
    ...provided,
    color: '#9ca3af',
    '&:hover': {
      color: '#374151',
    }
  }),
};

const MultiSelectDropdown = () => (
  <div style={globalStyles.spaceY2}>
    <label style={globalStyles.label}>Tags</label>
    <Select
      isMulti
      name="tags"
      options={ALGORITHM_TAGS}
      styles={customSelectStyles}
      placeholder="Select tags..."
      className="basic-multi-select"
      classNamePrefix="select"
    />
  </div>
);

export default MultiSelectDropdown;
