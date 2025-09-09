import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import type { 
  FormBuilderSchema, 
  FormDisplayMode, 
  FormSubmissionData,
  FormValidationResult
} from '@shared/types/formBuilder';
import SectionRenderer from './SectionRenderer';

interface FormRendererProps {
  formBuilderSchema: FormBuilderSchema | null;
  formDisplayMode: FormDisplayMode;
  onDataChange?: (data: FormSubmissionData) => void;
  onPriceChange?: (price: number) => void;
  initialData?: FormSubmissionData;
  readOnly?: boolean;
  className?: string;
  formTitle?: string;
  formDescription?: string;
}

export default function FormRenderer({
  formBuilderSchema,
  formDisplayMode,
  onDataChange,
  onPriceChange,
  initialData = {},
  readOnly = false,
  className = '',
  formTitle,
  formDescription
}: FormRendererProps) {
  const [formData, setFormData] = useState<FormSubmissionData>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Calculate dynamic pricing based on selected options
  const totalPrice = useMemo(() => {
    if (!formBuilderSchema || !formBuilderSchema.sections || !Array.isArray(formBuilderSchema.sections)) return 0;
    
    let price = 0;
    
    // Iterate through all sections and fields to calculate price
    formBuilderSchema.sections.forEach(section => {
      if (section && section.fields && Array.isArray(section.fields)) {
        section.fields.forEach(field => {
          const fieldValue = formData[field.name];
          
          // Add option prices for select fields (and potentially text fields with options)
          if ('optionPrices' in field && field.optionPrices && fieldValue) {
            let selectedIndex = -1;
            
            // For select fields, find the index of the selected option
            if (field.type === 'select' && 'options' in field) {
              selectedIndex = field.options.indexOf(fieldValue as string);
            }
            // For text fields with options (autocomplete), also check
            else if ('options' in field && field.options) {
              selectedIndex = field.options.indexOf(fieldValue as string);
            }
            
            if (selectedIndex >= 0 && field.optionPrices[selectedIndex] !== undefined) {
              const optionPrice = field.optionPrices[selectedIndex];
              if (optionPrice && optionPrice !== 0) {
                price += optionPrice;
              }
            }
          }
        });
      }
    });
    
    return price;
  }, [formBuilderSchema, formData]);

  // Update parent component when data changes
  useEffect(() => {
    if (onDataChange) {
      onDataChange(formData);
    }
  }, [formData, onDataChange]);

  // Update parent component when price changes
  useEffect(() => {
    if (onPriceChange) {
      onPriceChange(totalPrice);
    }
  }, [totalPrice, onPriceChange]);

  const handleFieldChange = (fieldName: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
    
    // Clear error for this field when it changes
    if (errors[fieldName]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  const validateField = (fieldName: string, value: any): string | null => {
    if (!formBuilderSchema || !formBuilderSchema.sections) return null;
    
    // Find the field definition
    let fieldDef: any = null;
    for (const section of formBuilderSchema.sections) {
      if (section && section.fields && Array.isArray(section.fields)) {
        const field = section.fields.find(f => f.name === fieldName);
        if (field) {
          fieldDef = field;
          break;
        }
      }
    }
    
    if (!fieldDef) return null;
    
    // Check required
    if (fieldDef.required && !value) {
      return `${fieldDef.label} is required`;
    }
    
    // Check string validations (support both nested and flat properties)
    if (typeof value === 'string') {
      // Check minLength (flat or nested)
      const minLength = fieldDef.minLength ?? fieldDef.validation?.minLength;
      if (minLength && value.length < minLength) {
        return `${fieldDef.label} must be at least ${minLength} characters`;
      }
      
      // Check maxLength (flat or nested)
      const maxLength = fieldDef.maxLength ?? fieldDef.validation?.maxLength;
      if (maxLength && value.length > maxLength) {
        return `${fieldDef.label} must be no more than ${maxLength} characters`;
      }
      
      // Check alphanumeric (flat or nested)
      const alphanumeric = fieldDef.alphanumeric ?? fieldDef.validation?.alphanumeric;
      if (alphanumeric && !/^[a-zA-Z0-9]+$/.test(value)) {
        return `${fieldDef.label} must contain only letters and numbers`;
      }
      
      // Check pattern (flat or nested)
      const pattern = fieldDef.pattern ?? fieldDef.validation?.pattern;
      if (pattern) {
        const regex = new RegExp(pattern);
        if (!regex.test(value)) {
          return `${fieldDef.label} format is invalid`;
        }
      }
      
      // Email validation
      if (fieldDef.type === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return `${fieldDef.label} must be a valid email address`;
      }
    }
    
    // Check number validations (support both flat and nested)
    if (typeof value === 'number') {
      // Check min (flat or nested)
      const min = fieldDef.min ?? fieldDef.validation?.min;
      if (min !== undefined && min !== null && value < min) {
        return `${fieldDef.label} must be at least ${min}`;
      }
      
      // Check max (flat or nested)
      const max = fieldDef.max ?? fieldDef.validation?.max;
      if (max !== undefined && max !== null && value > max) {
        return `${fieldDef.label} must be no more than ${max}`;
      }
    }
    
    return null;
  };

  const handleFieldBlur = (fieldName: string) => {
    const value = formData[fieldName];
    const error = validateField(fieldName, value);
    
    if (error) {
      setErrors(prev => ({
        ...prev,
        [fieldName]: error
      }));
    }
  };

  const validateForm = (): FormValidationResult => {
    const newErrors: Record<string, string> = {};
    
    if (formBuilderSchema && formBuilderSchema.sections && Array.isArray(formBuilderSchema.sections)) {
      formBuilderSchema.sections.forEach(section => {
        if (section && section.fields && Array.isArray(section.fields)) {
          section.fields.forEach(field => {
            const error = validateField(field.name, formData[field.name]);
            if (error) {
              newErrors[field.name] = error;
            }
          });
        }
      });
    }
    
    setErrors(newErrors);
    return {
      isValid: Object.keys(newErrors).length === 0,
      errors: newErrors
    };
  };

  if (!formBuilderSchema) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No form configuration available for this product.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6 space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  const containerClass = formDisplayMode === 'sidebar' 
    ? 'space-y-4' 
    : 'grid gap-4 md:grid-cols-4';

  return (
    <div className={`form-renderer ${className}`}>
      {formTitle && (
        <h2 className="text-2xl font-semibold mb-4">{formTitle}</h2>
      )}
      
      {formDescription && (
        <p className="text-muted-foreground mb-6">{formDescription}</p>
      )}
      
      <div className={containerClass}>
        {formBuilderSchema.sections && Array.isArray(formBuilderSchema.sections) &&
          formBuilderSchema.sections.map((section, index) => (
            <SectionRenderer
              key={section.id || index}
              section={section}
              formData={formData}
              errors={errors}
              displayMode={formDisplayMode}
              readOnly={readOnly}
              onFieldChange={handleFieldChange}
              onFieldBlur={handleFieldBlur}
            />
          ))}
      </div>
      
      {totalPrice > 0 && (
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <div className="flex justify-between items-center">
            <span className="font-medium">Additional Options Price:</span>
            <span className="text-lg font-bold">+{totalPrice.toFixed(2)}€</span>
          </div>
        </div>
      )}
    </div>
  );
}
