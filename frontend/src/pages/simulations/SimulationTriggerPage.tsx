import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getSimulations, createSimulation } from '@/api/simulations.api';
import { getDistricts } from '@/api/districts.api';
import { queryKeys } from '@/utils/queryKeys';
import { Button, DataTable, ColumnDef, FormField, Badge, Modal } from '@/components/ui';
import { SimulationDetailResponse } from '@/types';
import { useToast } from '@/components/shared/ToastProvider';
import { useDemoMode } from '@/hooks/useDemoMode';
import { ShieldAlert, Play, Zap, ListFilter } from 'lucide-react';
import { format } from 'date-fns';
import { ProbabilisticSimulationSection } from './ProbabilisticSimulationSection';

export const SimulationTriggerPage: React.FC = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const toast = useToast();
    const [activeTab, setActiveTab] = useState<'probabilistic' | 'stress_test'>('probabilistic');
    const [page, setPage] = useState(0);
    const [modalOpen, setModalOpen] = useState(false);
    const { isDemo, disabledReason } = useDemoMode();

    const { data, isLoading } = useQuery({
        queryKey: queryKeys.simulations.all,
        queryFn: () => getSimulations({ page, size: 10 }),
    });

    const columns: ColumnDef<SimulationDetailResponse>[] = [
        {
            header: 'İlçe',
            accessor: 'district.name' as any,
            render: (row) => <div className="font-medium text-gray-900">{row.district.name}</div>
        },
        {
            header: 'Büyüklük',
            accessor: 'magnitude',
        },
        {
            header: 'Durum',
            accessor: 'emailStatus',
            render: (row) => {
                const variants = {
                    QUEUED: 'neutral',
                    PROCESSING: 'warning',
                    COMPLETED: 'success',
                    PARTIAL_FAILURE: 'danger',
                } as const;
                const STATUS_TR: Record<string, string> = { QUEUED: 'Kuyrukta', PROCESSING: 'İşleniyor', COMPLETED: 'Tamamlandı', PARTIAL_FAILURE: 'Kısmi Hata' };
                return <Badge variant={variants[row.emailStatus]}>{STATUS_TR[row.emailStatus] || row.emailStatus}</Badge>;
            }
        },
        {
            header: 'Bildirim (Gönderilen/Toplam)',
            render: (row) => `${row.totalSent}/${row.totalQueued}`
        },
        {
            header: 'Tetikleyen',
            render: (row) => `${row.createdBy.firstName} ${row.createdBy.lastName}`
        },
        {
            header: 'Tetiklenme Zamanı',
            render: (row) => <span className="text-gray-500">{format(new Date(row.triggeredAt), 'PPp')}</span>
        },
        {
            header: 'İşlemler',
            render: (row) => (
                <Button variant="ghost" size="sm" onClick={() => navigate(`/simulations/${row.id}`)}>
                    Detayları Gör
                </Button>
            )
        }
    ];

    return (
        <div className="space-y-6">
            {/* Sayfa Başlığı */}
            <div className="sm:flex sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:tracking-tight flex items-center">
                        <ShieldAlert className="h-6 w-6 mr-2 text-indigo-600" />
                        Afet Simülasyon & Risk Yönetimi
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Olasılıksal hasar modelleriyle riskleri simüle edin ve acil bildirim altyapısını test edin.
                    </p>
                </div>

                {activeTab === 'stress_test' && (
                    <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
                        <Button
                            onClick={() => setModalOpen(true)}
                            variant="danger"
                            leftIcon={<Play className="h-4 w-4" />}
                            disabled={isDemo}
                            disabledReason={disabledReason}
                        >
                            Bildirim Testi Başlat
                        </Button>
                    </div>
                )}
            </div>

            {/* Modül Sekmeleri */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                    <button
                        type="button"
                        onClick={() => setActiveTab('probabilistic')}
                        className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-all ${
                            activeTab === 'probabilistic'
                                ? 'border-indigo-600 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        <Zap className="w-4 h-4" />
                        <span>Olasılıksal Afet & Hasar Analizi (Gözcü)</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('stress_test')}
                        className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-all ${
                            activeTab === 'stress_test'
                                ? 'border-indigo-600 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        <ListFilter className="w-4 h-4" />
                        <span>Sistem Bildirim & Hazırlık Testleri</span>
                    </button>
                </nav>
            </div>

            {/* Aktif Sekme İçeriği */}
            {activeTab === 'probabilistic' ? (
                <ProbabilisticSimulationSection />
            ) : (
                <div className="space-y-4">
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-xs text-amber-800">
                        Bu ekrandan başlatılan simülasyonlar, hedef ilçedeki koordinatör ve gönüllülere afet tatbikat e-postaları kuyruklayarak sistemin bildirim performansını ölçer.
                    </div>

                    <DataTable
                        columns={columns}
                        data={data?.content || []}
                        isLoading={isLoading}
                        emptyMessage="Henüz simülasyon başlatılmadı."
                        pagination={data ? { page: data.number, totalPages: data.totalPages } : undefined}
                        onPageChange={setPage}
                    />

                    <TriggerSimulationModal
                        isOpen={modalOpen}
                        onClose={() => setModalOpen(false)}
                        onSuccess={() => {
                            setModalOpen(false);
                            queryClient.invalidateQueries({ queryKey: queryKeys.simulations.all });
                            toast.success('Simülasyon başarıyla başlatıldı');
                        }}
                    />
                </div>
            )}
        </div>
    );
};

const TriggerSimulationModal: React.FC<{ isOpen: boolean; onClose: () => void; onSuccess: () => void }> = ({ isOpen, onClose, onSuccess }) => {
    const [districtId, setDistrictId] = useState('');
    const [magnitude, setMagnitude] = useState(7.0);
    const [notes, setNotes] = useState('');

    const { data: districts } = useQuery({ queryKey: queryKeys.districts.all, queryFn: getDistricts, enabled: isOpen });
    const toast = useToast();

    const mutation = useMutation({
        mutationFn: () => createSimulation({ districtId, magnitude, notes }),
        onSuccess,
        onError: (err: any) => toast.error(err.message || 'Simülasyon başlatılamadı'),
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!districtId) return toast.error('Lütfen bir ilçe seçin.');
        mutation.mutate();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Deprem Simülasyonu Başlat">
            <form onSubmit={handleSubmit} className="space-y-4">
                <FormField label="Hedef İlçe" required>
                    <select
                        value={districtId}
                        onChange={(e) => setDistrictId(e.target.value)}
                        className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                        disabled={mutation.isPending}
                    >
                        <option value="">İlçe seçin...</option>
                        {districts?.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                </FormField>

                <FormField label="Simüle Edilen Büyüklük" required hint="Richter ölçeği (1.0 - 10.0)">
                    <input
                        type="number"
                        step="0.1"
                        min="1.0"
                        max="10.0"
                        value={magnitude}
                        onChange={(e) => setMagnitude(parseFloat(e.target.value))}
                        className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                        disabled={mutation.isPending}
                    />
                </FormField>

                <FormField label="Notlar (İsteğe Bağlı)">
                    <textarea
                        rows={3}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                        disabled={mutation.isPending}
                        placeholder="Örn: Gece saati deprem stres testi"
                    />
                </FormField>

                <div className="pt-4 flex justify-end space-x-3 border-t border-gray-200">
                    <Button variant="ghost" onClick={onClose} type="button" disabled={mutation.isPending}>
                        İptal
                    </Button>
                    <Button variant="danger" type="submit" loading={mutation.isPending}>
                        Simülasyonu Başlat
                    </Button>
                </div>
            </form>
        </Modal>
    );
};
