import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { FormBuilderSchema, FormSubmissionData } from '@shared/types/formBuilder';

interface FormSummaryProps {
  formBuilderSchema: FormBuilderSchema | null;
  formData: FormSubmissionData;
  showTitle?: boolean;
  showEmpty?: boolean;
  compact?: boolean;
  className?: string;
}

export default function FormSummary({
  formBuilderSchema,
  formData,
  showTitle = true,
  showEmpty = false,
  compact = false,
  className = ''
}: FormSummaryProps) {
  if (!formBuilderSchema || Object.keys(formData).length === 0) {
    if (!showEmpty) {
      return null;
    }
    
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">No form data provided</p>
        </CardContent>
      </Card>
    );
  }

  // Build summary items from form data
  const summaryItems: Array<{ label: string; value: any; section?: string }> = [];
  
  formBuilderSchema.sections.forEach(section => {
    section.fields.forEach(field => {
      const value = formData[field.name];
      
      // Skip empty values unless showEmpty is true
      if (!showEmpty && (value === undefined || value === null || value === '')) {
        return;
      }
      
      // Format the value based on field type
      let formattedValue = value;
      
      if (field.type === 'select' && 'options' in field) {
        const selectField = field as any;
        // If value is in options array, use it as-is (it's already the display value)
        formattedValue = value;
        
        // Add price info if available
        const optionIndex = selectField.options?.indexOf(value);
        if (optionIndex >= 0 && selectField.optionPrices?.[optionIndex]) {
          const price = selectField.optionPrices[optionIndex];
          formattedValue = `${value} (+${price.toFixed(2)}€)`;
        }
      } else if (field.type === 'date' && value) {
        formattedValue = new Date(value as string).toLocaleDateString();
      } else if (typeof value === 'boolean') {
        formattedValue = value ? 'Yes' : 'No';
      } else if (Array.isArray(value)) {
        formattedValue = value.join(', ');
      }
      
      summaryItems.push({
        label: field.label,
        value: formattedValue,
        section: section.name
      });
    });
  });

  if (summaryItems.length === 0 && !showEmpty) {
    return null;
  }

  const renderCompact = () => {
    return (
      <div className={`space-y-2 ${className}`}>
        {summaryItems.map((item, index) => (
          <div key={index} className="flex justify-between items-start text-sm">
            <span className="text-muted-foreground">{item.label}:</span>
            <span className="font-medium text-right ml-2">{item.value || '-'}</span>
          </div>
        ))}
      </div>
    );
  };

  const renderFull = () => {
    // Group items by section
    const groupedItems: Record<string, typeof summaryItems> = {};
    summaryItems.forEach(item => {
      const section = item.section || 'General';
      if (!groupedItems[section]) {
        groupedItems[section] = [];
      }
      groupedItems[section].push(item);
    });

    return (
      <Card className={className}>
        {showTitle && (
          <CardHeader>
            <CardTitle>Form Summary</CardTitle>
          </CardHeader>
        )}
        <CardContent className={showTitle ? '' : 'pt-6'}>
          <div className="space-y-4">
            {Object.entries(groupedItems).map(([section, items], sectionIndex) => (
              <div key={sectionIndex}>
                {Object.keys(groupedItems).length > 1 && (
                  <>
                    {sectionIndex > 0 && <Separator className="my-3" />}
                    <h4 className="font-medium text-sm mb-2">{section}</h4>
                  </>
                )}
                <div className="space-y-2">
                  {items.map((item, index) => (
                    <div key={index} className="flex justify-between items-start">
                      <span className="text-sm text-muted-foreground">{item.label}:</span>
                      <div className="text-sm font-medium text-right ml-2">
                        {item.value !== undefined && item.value !== null && item.value !== '' ? (
                          typeof item.value === 'string' && item.value.length > 50 ? (
                            <Badge variant="secondary" className="max-w-[200px] truncate" title={item.value}>
                              {item.value}
                            </Badge>
                          ) : (
                            <span>{item.value}</span>
                          )
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  return compact ? renderCompact() : renderFull();
}
