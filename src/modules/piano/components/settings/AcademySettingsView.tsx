import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { usePermissions } from '@/core/auth/usePermissions';
import { StorageService } from '@/services/storage';
import { PageHeader } from '@/shared/components';
import { AcademySettings } from '@/types';
import { getDefaultAttendanceSettings } from '@/core/attendance/features';
import { getProductModuleSettings } from '@/core/products/features';
import { StoreBackupPanel } from '@/core/backup';
import {
  Settings,
  Building,
  Save,
  Package,
} from 'lucide-react';
import { AcademySubjectsPanel } from '@/modules/academy/components/settings/AcademySubjectsPanel';
import { CurrencyInput } from '@/shared/components/CurrencyInput';

export const AcademySettingsView: React.FC = () => {
  const { showToast } = useApp();
  const { industry } = usePermissions();

  const [settings, setSettings] = useState<AcademySettings>(() => StorageService.getSettings());
  const attendanceDefaults = getDefaultAttendanceSettings(industry);
  const attendanceEnabled = settings.features?.attendance?.enabled ?? attendanceDefaults.enabled;
  const productDefaults = getProductModuleSettings(settings, industry);
  const productsEnabled = settings.features?.products?.enabled ?? productDefaults.enabled;
  const productCaps = {
    ...productDefaults.capabilities,
    ...settings.features?.products?.capabilities,
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    StorageService.saveSettings(settings);
    showToast('학원 기본 정보가 안전하게 저장되었습니다.', 'success');
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        icon={<Settings className="w-6 h-6" />}
        title="학원 운영 및 환경 설정"
        description="매장명, 대표자 정보, 기능 모듈 및 데이터 백업/복원"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Settings Form */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
          <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
            <Building className="w-4 h-4 text-indigo-600" />
            학원 기본 프로필
          </h3>

          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  학원명 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={settings.name}
                  onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  원장님 성명 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={settings.directorName}
                  onChange={(e) => setSettings({ ...settings, directorName: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  학원 대표 전화번호 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={settings.phone}
                  onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  사업자 등록번호 (선택)
                </label>
                <input
                  type="text"
                  value={settings.businessNumber || ''}
                  onChange={(e) => setSettings({ ...settings, businessNumber: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                학원 소재지 주소
              </label>
              <input
                type="text"
                value={settings.address}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
              />
            </div>

            <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  기본 월 수강료 기준 (₩)
                </label>
                <CurrencyInput
                  value={settings.defaultTuitionFee}
                  onChange={(val) => setSettings({ ...settings, defaultTuitionFee: val })}
                  showQuickButtons
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  기본 결제일
                </label>
                <select
                  value={settings.defaultPaymentDay}
                  onChange={(e) => setSettings({ ...settings, defaultPaymentDay: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-bold"
                >
                  <option value={1}>매월 1일</option>
                  <option value={5}>매월 5일</option>
                  <option value={10}>매월 10일</option>
                  <option value={15}>매월 15일</option>
                  <option value={20}>매월 20일</option>
                  <option value={25}>매월 25일</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                수납용 계좌번호 안내 (영수증 및 청구서에 표기)
              </label>
              <input
                type="text"
                placeholder="예: 국민은행 123456-04-123456 (예금주: 선율음악학원)"
                value={settings.bankAccount || ''}
                onChange={(e) => setSettings({ ...settings, bankAccount: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
              />
            </div>

            {industry === 'academy' && (
              <AcademySubjectsPanel settings={settings} onChange={setSettings} />
            )}

            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold text-slate-700">출결 Industry Module</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    PIN 입·퇴실 기능 (학원·태권도장 등). 필라테스·피부관리샵 등은 비활성화 권장
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={attendanceEnabled}
                  onClick={() =>
                    setSettings({
                      ...settings,
                      features: {
                        ...settings.features,
                        attendance: { enabled: !attendanceEnabled },
                      },
                    })
                  }
                  className={`relative w-12 h-7 rounded-full transition-colors ${
                    attendanceEnabled ? 'bg-indigo-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                      attendanceEnabled ? 'translate-x-5' : ''
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5" />
                    상품 카탈로그 Module
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    매장별 상품 등록·판매·리포트. 유형은 상품 화면에서 자유롭게 추가
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={productsEnabled}
                  onClick={() =>
                    setSettings({
                      ...settings,
                      features: {
                        ...settings.features,
                        products: {
                          ...settings.features?.products,
                          enabled: !productsEnabled,
                          labels: settings.features?.products?.labels || productDefaults.labels,
                          productTypes:
                            settings.features?.products?.productTypes ||
                            productDefaults.productTypes,
                          capabilities: productCaps,
                        },
                      },
                    })
                  }
                  className={`relative w-12 h-7 rounded-full transition-colors ${
                    productsEnabled ? 'bg-amber-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                      productsEnabled ? 'translate-x-5' : ''
                    }`}
                  />
                </button>
              </div>

              {productsEnabled && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(
                    [
                      ['canCreate', '등록'],
                      ['canEdit', '수정'],
                      ['canDelete', '삭제'],
                      ['canSell', '판매'],
                      ['trackInventory', '재고'],
                      ['showReport', '리포트'],
                    ] as const
                  ).map(([key, label]) => (
                    <label
                      key={key}
                      className="flex items-center gap-2 px-3 py-2 min-h-[44px] rounded-xl bg-slate-50 border border-slate-100 text-xs font-semibold text-slate-700"
                    >
                      <input
                        type="checkbox"
                        checked={productCaps[key] !== false}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            features: {
                              ...settings.features,
                              products: {
                                ...settings.features?.products,
                                enabled: true,
                                labels:
                                  settings.features?.products?.labels || productDefaults.labels,
                                productTypes:
                                  settings.features?.products?.productTypes ||
                                  productDefaults.productTypes,
                                capabilities: {
                                  ...productCaps,
                                  [key]: e.target.checked,
                                },
                              },
                            },
                          })
                        }
                        className="rounded"
                      />
                      {label} 허용
                    </label>
                  ))}
                </div>
              )}

              {productsEnabled && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      메뉴 이름
                    </label>
                    <input
                      type="text"
                      value={
                        settings.features?.products?.labels?.catalog ||
                        productDefaults.labels.catalog
                      }
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          features: {
                            ...settings.features,
                            products: {
                              ...settings.features?.products,
                              enabled: true,
                              capabilities: productCaps,
                              productTypes:
                                settings.features?.products?.productTypes ||
                                productDefaults.productTypes,
                              labels: {
                                ...productDefaults.labels,
                                ...settings.features?.products?.labels,
                                catalog: e.target.value,
                              },
                            },
                          },
                        })
                      }
                      className="w-full px-3 py-2 min-h-[44px] text-xs bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      단수 명칭
                    </label>
                    <input
                      type="text"
                      value={
                        settings.features?.products?.labels?.singular ||
                        productDefaults.labels.singular
                      }
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          features: {
                            ...settings.features,
                            products: {
                              ...settings.features?.products,
                              enabled: true,
                              capabilities: productCaps,
                              productTypes:
                                settings.features?.products?.productTypes ||
                                productDefaults.productTypes,
                              labels: {
                                ...productDefaults.labels,
                                ...settings.features?.products?.labels,
                                singular: e.target.value,
                              },
                            },
                          },
                        })
                      }
                      className="w-full px-3 py-2 min-h-[44px] text-xs bg-slate-50 border border-slate-200 rounded-xl"
                      placeholder="상품 / 제품 / 교보재"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                설정 정보 저장
              </button>
            </div>
          </form>
        </div>

        {/* Data Backup & Restore Panel */}
        <div className="space-y-6">
          <StoreBackupPanel />
        </div>
      </div>
    </div>
  );
};
