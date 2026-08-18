'use client';

import PropertyPostingWizard from './PropertyPostingWizard';

export default function CreatePropertyPage({ propertyId }: { propertyId?: string }) {
  return <PropertyPostingWizard propertyId={propertyId} />;
}
