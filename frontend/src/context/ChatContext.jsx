import { createContext, useContext } from 'react';

export const ChatContext = createContext(null);

export const useChatContext = () => {
    const context = useContext(ChatContext);
    if (!context) {
        throw new Error("useChatContext doit être utilisé à l'intérieur d'un ChatContext.Provider");
    }
    return context;
};