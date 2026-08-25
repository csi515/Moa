import { useEffect, useMemo, useState } from 'react';
import { parsePublicBookingCode } from '@/core/organizations/publicCode';
import {
  fetchPublicConsultationBookingContext,
  submitPublicConsultationBooking,
} from '../public/publicConsultationBookingService';
import { getAvailableSlotsForDate, getSelectableDates } from '../slotUtils';
import type { PublicConsultationBookingContext } from '../types';

export function usePublicConsultationBooking() {
  const publicCode = parsePublicBookingCode();
  const [loading, setLoading] = useState(true);
  const [context, setContext] = useState<PublicConsultationBookingContext | null>(null);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [content, setContent] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTime, setPreferredTime] = useState('');

  useEffect(() => {
    if (!publicCode) {
      setErrorKey('not_found');
      setLoading(false);
      return;
    }

    fetchPublicConsultationBookingContext(publicCode).then((result) => {
      if ('error' in result) {
        setErrorKey(result.error);
      } else {
        setContext(result);
        const dates = getSelectableDates(result.settings, result.bookedSlots);
        if (dates[0]) setPreferredDate(dates[0]);
      }
      setLoading(false);
    });
  }, [publicCode]);

  const selectableDates = useMemo(() => {
    if (!context) return [];
    return getSelectableDates(context.settings, context.bookedSlots);
  }, [context]);

  const availableTimes = useMemo(() => {
    if (!context || !preferredDate) return [];
    return getAvailableSlotsForDate(preferredDate, context.settings, context.bookedSlots);
  }, [context, preferredDate]);

  useEffect(() => {
    if (availableTimes.length > 0 && !availableTimes.includes(preferredTime)) {
      setPreferredTime(availableTimes[0]);
    } else if (availableTimes.length === 0) {
      setPreferredTime('');
    }
  }, [availableTimes, preferredTime]);

  const submit = async () => {
    if (!publicCode || !preferredDate || !preferredTime) return;

    setSubmitting(true);
    setErrorKey(null);

    const result = await submitPublicConsultationBooking({
      publicCode,
      name,
      phone,
      content,
      preferredDate,
      preferredTime,
    });

    setSubmitting(false);

    if ('error' in result) {
      setErrorKey(result.error);
      return;
    }

    setSubmitted(true);
  };

  return {
    publicCode,
    loading,
    context,
    errorKey,
    submitted,
    submitting,
    name,
    setName,
    phone,
    setPhone,
    content,
    setContent,
    preferredDate,
    setPreferredDate,
    preferredTime,
    setPreferredTime,
    selectableDates,
    availableTimes,
    submit,
  };
}
