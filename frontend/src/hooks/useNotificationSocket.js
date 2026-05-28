import { useEffect, useRef } from 'react';

export const useNotificationSocket = (token, onNewNotification) => {
    const socketRef = useRef(null);

    useEffect(() => {
        if (!token) return;

        const baseUrl = import.meta.env.VITE_API_BASE_URL || "https://localhost";
        const wsBaseUrl = baseUrl.replace(/^http/, 'ws');
        const wsUrl = `${wsBaseUrl}/api/v1/ws`;

        console.log("Tentative de connexion WS sur :", wsUrl);

        socketRef.current = new WebSocket(wsUrl);

        socketRef.current.onopen = () => {
            console.log('Websocket connecté, envoi du token pour authentification');
            const authMessage = JSON.stringify({ token: token });
            socketRef.current.send(authMessage);
        };

        // à la reception d'un message :
        socketRef.current.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                onNewNotification(data);
            } catch (err) {
                console.error("Erreur de parsing du message WS :", err);
            }
        };

        // cas où il y a une erreur :
        socketRef.current.onerror = (error) => {
            console.error('Erreur Websocket :', error);
        };

        // déco :
        socketRef.current.onclose = (event) => {
            console.log(`Websocket déconnecté (Code: ${event.code})`);
        };

        return () => {
            if (socketRef.current) {
                // Code 1000 = Normal Closure
                socketRef.current.close(1000, "Déconnexion volontaire du front");
            }
        };
    }, [token, onNewNotification]);

    const sendMessage = (messageObject) => {
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify(messageObject));
        } else {
            console.warn("Impossible d'envoyer, Websocket non connecté.");
        }
    };

    return { sendMessage };
};