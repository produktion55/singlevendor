/**
 * Form Builder Type Definitions
 * Comprehensive TypeScript interfaces for the JSON form builder system
 */

/**
 * Main form builder schema structure
 */
export interface FormBuilderSchema {
  sections: Section[];
}

/**
 * Section configuration
 */
export interface Section {
  id: string | number;  // Support both string and number IDs
  name: string;
  width: 25 | 50 | 75 | 100;
  isPadding?: boolean;
  collapsible?: boolean;
  expanded?: boolean;
  fields: Field[];
}

/**
 * Field types supported by the form builder
 */
export type FieldType = 'text' | 'select' | 'textarea' | 'date' | 'number' | 'email';

/**
 * Option pricing type for select fields
 */
export type OptionPriceType = 'fixed' | 'percentage';

/**
 * Conditional logic for field visibility
 */
export interface ConditionalLogic {
  enabled: boolean;
  fieldId: string;
  value: string;
}

/**
 * Field validation rules
 */
export interface FieldValidation {
  alphanumeric?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;  // For number fields
  max?: number;  // For number fields
  pattern?: string;  // Regex pattern for custom validation
  email?: boolean;  // For email validation
}

/**
 * Option pricing configuration for select fields
 */
export interface OptionPricing {
  prices: number[];
  type: OptionPriceType;
}

/**
 * Base field interface with common properties
 * Supports both nested validation object and flat field-level validation properties
 */
interface BaseField {
  id?: string | number;  // Support field IDs for better tracking
  type: FieldType;
  label: string;
  name: string;
  placeholder?: string;
  defaultValue?: string | number | string[];  // Allow string[] for select fields
  description?: string;
  required?: boolean;
  conditionalLogic?: ConditionalLogic;
  
  // Support both nested validation object (current style)
  validation?: FieldValidation;
  
  // AND flat field-level validation properties (new style)
  alphanumeric?: boolean;
  minLength?: number | null;
  maxLength?: number | null;
  min?: number | null;  // For number fields
  max?: number | null;  // For number fields
  pattern?: string;  // Regex pattern
  
  readonly?: boolean;
  disabled?: boolean;
}

/**
 * Text field specific interface
 */
export interface TextField extends BaseField {
  type: 'text';
  defaultValue?: string;
  // Text-specific validation can be at field level or in validation object
  options?: string[];  // Support for autocomplete/suggestions (future enhancement)
  optionPrices?: number[];  // For compatibility with dynamic forms
  optionPriceType?: OptionPriceType;
}

/**
 * Email field specific interface
 */
export interface EmailField extends BaseField {
  type: 'email';
  defaultValue?: string;
}

/**
 * Textarea field specific interface
 */
export interface TextareaField extends BaseField {
  type: 'textarea';
  defaultValue?: string;
  rows?: number;
  cols?: number;
}

/**
 * Number field specific interface
 */
export interface NumberField extends Omit<BaseField, 'min' | 'max'> {
  type: 'number';
  defaultValue?: number;
  step?: number;
  min?: number | null;  // Override for number-specific
  max?: number | null;  // Override for number-specific
}

/**
 * Date field specific interface
 */
export interface DateField extends Omit<BaseField, 'min' | 'max'> {
  type: 'date';
  defaultValue?: string;
  min?: string | null;  // Override for date-specific (ISO date string)
  max?: string | null;  // Override for date-specific (ISO date string)
}

/**
 * Select field specific interface with pricing options
 */
export interface SelectField extends BaseField {
  type: 'select';
  options: string[];
  optionPrices?: number[];
  optionPriceType?: OptionPriceType;
  multiple?: boolean;
  defaultValue?: string | string[];
}

/**
 * Union type for all field types
 */
export type Field = TextField | EmailField | TextareaField | NumberField | DateField | SelectField;

/**
 * Form display mode options
 */
export type FormDisplayMode = 'sidebar' | 'fullwidth';

/**
 * Form submission data structure
 */
export interface FormSubmissionData {
  [fieldName: string]: string | number | string[] | boolean | Date | null;
}

/**
 * Calculated pricing based on form selections
 */
export interface FormPricingCalculation {
  basePrice: number;
  additionalCharges: Array<{
    fieldName: string;
    label: string;
    charge: number;
    type: 'fixed' | 'percentage';
  }>;
  totalPrice: number;
}

/**
 * Form validation result
 */
export interface FormValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * Helper type to extract field names from a form schema
 */
export type ExtractFieldNames<T extends FormBuilderSchema> = T['sections'][number]['fields'][number]['name'];

/**
 * Helper type to create a type-safe form data structure from a schema
 */
export type FormDataFromSchema<T extends FormBuilderSchema> = {
  [K in ExtractFieldNames<T>]?: string | number | string[] | boolean | Date | null;
};