import { useLeaguePreferences } from '../context/LeaguePreferencesContext';
import { Dialog, Modal, ModalOverlay } from 'react-aria-components';
import { PressButton } from '../ui/PressButton';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
}

export function LeagueSelectionSheet({ isOpen, onClose, title = 'Select Leagues' }: Props) {
    const {
        allLeagues,
        selectedLeagueIds,
        toggleLeague,
        selectAllLeagues,
        clearSelectedLeagues,
    } = useLeaguePreferences();

    return (
        <ModalOverlay
            isOpen={isOpen}
            onOpenChange={(open) => {
                if (!open) onClose();
            }}
            className="fixed inset-0 z-[70] bg-slate-900/45 p-4"
        >
            <Modal className="mx-auto mt-24 w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl ring-1 ring-slate-100">
                <Dialog aria-label={title} className="outline-none">
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-base font-bold text-slate-800">{title}</h3>
                        <PressButton
                            onPress={onClose}
                            className="rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600"
                        >
                            Done
                        </PressButton>
                    </div>

                    <div className="mb-4 flex gap-2">
                        <PressButton
                            onPress={selectAllLeagues}
                            className="rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700"
                        >
                            Select all
                        </PressButton>
                        <PressButton
                            onPress={clearSelectedLeagues}
                            className="rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700"
                        >
                            Clear all
                        </PressButton>
                    </div>

                    <div className="max-h-[55vh] space-y-2 overflow-y-auto pr-1">
                        {allLeagues.map((league) => {
                            const isSelected = selectedLeagueIds.includes(league.id);
                            return (
                                <PressButton
                                    key={league.id}
                                    onPress={() => toggleLeague(league.id)}
                                    className={`flex w-full items-start justify-between rounded-2xl border px-3 py-3 text-left transition ${
                                        isSelected
                                            ? 'border-emerald-300 bg-emerald-50'
                                            : 'border-slate-200 bg-white'
                                    }`}
                                >
                                    <div>
                                        <div className="text-sm font-semibold text-slate-800">{league.name}</div>
                                        <div className="mt-1 text-xs text-slate-500">
                                            {league.divisions.length} division{league.divisions.length === 1 ? '' : 's'}
                                        </div>
                                    </div>
                                    <span
                                        className={`mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-md border text-[10px] font-bold ${
                                            isSelected
                                                ? 'border-emerald-500 bg-emerald-500 text-white'
                                                : 'border-slate-300 text-slate-300'
                                        }`}
                                    >
                                        ✓
                                    </span>
                                </PressButton>
                            );
                        })}
                    </div>
                </Dialog>
            </Modal>
        </ModalOverlay>
    );
}
