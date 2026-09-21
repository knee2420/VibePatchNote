import { createContext, useContext } from 'react';

export interface IdeArboristContextValue {
  onSelectSlot?: (slotId: string, pageNumber: number) => void;
  onApplySuggested?: (slotId: string) => void;
  onUnbindSlot?: (slotId: string) => void;
}

export const IdeArboristContext = createContext<IdeArboristContextValue>({});
export const useIdeArboristContext = () => useContext(IdeArboristContext);
