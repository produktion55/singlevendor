import React, { useMemo } from 'react';
import type { ConditionalLogic, FormSubmissionData } from '@shared/types/formBuilder';

interface ConditionalWrapperProps {
  conditionalLogic?: ConditionalLogic;
  formData: FormSubmissionData;
  children: React.ReactNode;
}

export default function ConditionalWrapper({
  conditionalLogic,
  formData,
  children
}: ConditionalWrapperProps) {
  const isVisible = useMemo(() => {
    // If no conditional logic or not enabled, always show
    if (!conditionalLogic || !conditionalLogic.enabled) {
      return true;
    }

    const { fieldId, value } = conditionalLogic;
    const fieldValue = formData[fieldId];

    // Simple equality check for now
    // In the future, this could be expanded to support more complex conditions
    if (value === '') {
      // Check if field is empty
      return !fieldValue || (typeof fieldValue === 'string' && fieldValue.trim() === '');
    } else {
      // Check if field equals the specified value
      return fieldValue === value;
    }
  }, [conditionalLogic, formData]);

  // Don't render anything if condition is not met
  if (!isVisible) {
    return null;
  }

  return <>{children}</>;
}