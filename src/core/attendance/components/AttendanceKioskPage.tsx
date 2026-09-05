import React from 'react';
import { PinCheckInKioskView } from './PinCheckInKioskView';

/** 입구 태블릿용 전체화면 PIN 출석 — 사이드바/일반 내비 없음 */
export const AttendanceKioskPage: React.FC = () => (
  <PinCheckInKioskView method="kiosk" standalone />
);
