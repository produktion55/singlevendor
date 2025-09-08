import type { FormBuilderSchema, Field } from '@shared/types/formBuilder';

interface LegacyCustomField {
  name: string;
  label: string;
  type: string;
  required: boolean;
}

/**
 * Converts legacy custom fields to the new FormBuilder schema format
 */
export function migrateCustomFieldsToFormBuilder(
  customFields: LegacyCustomField[],
  productName: string = 'Generator'
): FormBuilderSchema {
  const fields: Field[] = customFields.map((field) => {
    const baseField: any = {
      name: field.name,
      label: field.label,
      required: field.required
    };

    // Map field types
    switch (field.type) {
      case 'text':
        return {
          ...baseField,
          type: 'text',
          placeholder: `Enter ${field.label.toLowerCase()}`
        };
      
      case 'number':
        return {
          ...baseField,
          type: 'number',
          placeholder: `Enter ${field.label.toLowerCase()}`,
          min: 0,
          step: 1
        };
      
      case 'email':
        return {
          ...baseField,
          type: 'email',
          placeholder: 'example@email.com'
        };
      
      case 'date':
        return {
          ...baseField,
          type: 'date'
        };
      
      case 'textarea':
        return {
          ...baseField,
          type: 'textarea',
          placeholder: `Enter ${field.label.toLowerCase()}`,
          rows: 4
        };
      
      default:
        // Default to text field
        return {
          ...baseField,
          type: 'text',
          placeholder: `Enter ${field.label.toLowerCase()}`
        };
    }
  });

  const schema: FormBuilderSchema = {
    sections: [
      {
        id: 1,
        name: `${productName} Configuration`,
        width: 100,
        isPadding: true,
        collapsible: false,
        expanded: true,
        fields: fields
      }
    ]
  };

  return schema;
}

/**
 * Formats the FormBuilder JSON for display
 */
export function formatFormBuilderJson(json: string | object): string {
  try {
    const obj = typeof json === 'string' ? JSON.parse(json) : json;
    return JSON.stringify(obj, null, 2);
  } catch {
    return typeof json === 'string' ? json : JSON.stringify(json, null, 2);
  }
}

/**
 * Validates if a JSON string is a valid FormBuilder schema
 */
export function validateFormBuilderJson(json: string): { valid: boolean; error?: string } {
  try {
    const parsed = JSON.parse(json);
    
    if (!parsed.sections || !Array.isArray(parsed.sections)) {
      return { valid: false, error: 'Missing required field: sections (must be an array)' };
    }

    for (const section of parsed.sections) {
      if (!section.id || !section.name || !section.fields) {
        return { valid: false, error: 'Invalid section structure: missing required fields' };
      }

      if (!Array.isArray(section.fields)) {
        return { valid: false, error: 'Section fields must be an array' };
      }

      for (const field of section.fields) {
        if (!field.type || !field.name || !field.label) {
          return { valid: false, error: 'Invalid field structure: missing required properties' };
        }
      }
    }

    return { valid: true };
  } catch (error) {
    return { 
      valid: false, 
      error: error instanceof Error ? error.message : 'Invalid JSON format' 
    };
  }
}