import React from 'react';
import { OrganizationPublicCodeEditor } from '@/core/organizations/components/OrganizationPublicCodeEditor';
import { ConsultationQrPrintCard } from './ConsultationQrPrintCard';

interface Props {
  organizationId: string;
  publicCode: string;
  bookingEnabled: boolean;
  onPublicCodeUpdated: () => void | Promise<void>;
}

/** 업체 코드 + QR 인쇄 패널 */
export const ConsultationBookingQrPanel: React.FC<Props> = ({
  organizationId,
  publicCode,
  bookingEnabled,
  onPublicCodeUpdated,
}) => (
  <div className="space-y-4">
    <OrganizationPublicCodeEditor
      organizationId={organizationId}
      publicCode={publicCode}
      onUpdated={() => onPublicCodeUpdated()}
    />
    <ConsultationQrPrintCard publicCode={publicCode} enabled={bookingEnabled} />
  </div>
);
