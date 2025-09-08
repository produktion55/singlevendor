import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { 
  Section, 
  FormDisplayMode, 
  FormSubmissionData
} from '@shared/types/formBuilder';
import FieldRenderer from './FieldRenderer';
import ConditionalWrapper from './ConditionalWrapper';

interface SectionRendererProps {
  section: Section;
  formData: FormSubmissionData;
  errors: Record<string, string>;
  displayMode: FormDisplayMode;
  readOnly?: boolean;
  onFieldChange: (fieldName: string, value: any) => void;
  onFieldBlur: (fieldName: string) => void;
}

export default function SectionRenderer({
  section,
  formData,
  errors,
  displayMode,
  readOnly = false,
  onFieldChange,
  onFieldBlur
}: SectionRendererProps) {
  const [isCollapsed, setIsCollapsed] = useState(!section.expanded);

  // Determine grid column span based on section width
  const getGridClass = () => {
    if (displayMode === 'sidebar') {
      return 'col-span-full';
    }
    
    switch (section.width) {
      case 25:
        return 'col-span-1';
      case 50:
        return 'col-span-1 md:col-span-2';
      case 75:
        return 'col-span-1 md:col-span-3';
      case 100:
      default:
        return 'col-span-full';
    }
  };

  const renderSectionContent = () => {
    return (
      <div className="space-y-4">
        {section.fields.map((field, index) => (
          <ConditionalWrapper
            key={field.name || index}
            conditionalLogic={field.conditionalLogic}
            formData={formData}
          >
            <FieldRenderer
              field={field}
              value={formData[field.name]}
              error={errors[field.name]}
              readOnly={readOnly}
              onChange={(value) => onFieldChange(field.name, value)}
              onBlur={() => onFieldBlur(field.name)}
            />
          </ConditionalWrapper>
        ))}
      </div>
    );
  };

  const sectionClass = `section-renderer ${getGridClass()}`;

  if (section.collapsible) {
    return (
      <Card className={sectionClass}>
        <Collapsible open={!isCollapsed} onOpenChange={(open) => setIsCollapsed(!open)}>
          <CardHeader className={section.isPadding ? 'pb-2' : ''}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-between p-0 hover:bg-transparent"
              >
                <CardTitle className="text-left">{section.name}</CardTitle>
                {isCollapsed ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronUp className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className={section.isPadding ? 'pt-2' : ''}>
              {renderSectionContent()}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    );
  }

  return (
    <Card className={sectionClass}>
      {section.name && (
        <CardHeader className={section.isPadding ? 'pb-2' : ''}>
          <CardTitle>{section.name}</CardTitle>
        </CardHeader>
      )}
      <CardContent className={`${section.name ? '' : 'pt-6'} ${section.isPadding ? 'py-4' : ''}`}>
        {renderSectionContent()}
      </CardContent>
    </Card>
  );
}