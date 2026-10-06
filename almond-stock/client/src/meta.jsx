import { createContext, useContext } from 'react';

const MetaContext = createContext(null);
export const MetaProvider = MetaContext.Provider;
// { grades, lowStockKg, defaultRate }
export const useMeta = () => useContext(MetaContext);
