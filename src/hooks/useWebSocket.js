// hooks/useWebSocket.js
import { useEffect } from 'react';
import websocketService from '../services/websocketService';

const useWebSocket = (eventName, onMessageReceived) => {
    useEffect(() => {
        // 1. Đảm bảo có kết nối (nếu chưa có thì service tự lo)
        websocketService.connect();

        // 2. Đăng ký lắng nghe sự kiện cụ thể
        // Ví dụ: eventName là 'GET_PEOPLE_CHAT_MES' hoặc 'MESSAGE'
        if (eventName && onMessageReceived) {
            websocketService.on(eventName, onMessageReceived);
        }

        // 3. Cleanup function (chạy khi component bị hủy)
        return () => {
            // QUAN TRỌNG: Chỉ hủy đăng ký lắng nghe (off), KHÔNG ngắt kết nối (disconnect)
            if (eventName && onMessageReceived) {
                websocketService.off(eventName, onMessageReceived);
            }
        };
    }, [eventName, onMessageReceived]);
};

export default useWebSocket;