import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import websocketService from '../services/websocketService';
import { setMessages, addMessage } from '../redux/slices/chatSlice';

const useMessages = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    // Xử lý khi nhận danh sách tin nhắn cũ
    const handleMessages = (data) => {
      if (data.data && Array.isArray(data.data)) {
        dispatch(setMessages(data.data));
      }
    };
    
    // Đăng ký sự kiện lấy danh sách tin nhắn
    websocketService.on('GET_ROOM_CHAT_MES', handleMessages);
    
    // Đăng ký sự kiện có tin nhắn mới tới
    websocketService.on('SEND_CHAT', (data) => {
      // Data trả về đôi khi nằm trong data.data hoặc trực tiếp trong data
      const msg = data.data || data; 
      dispatch(addMessage(msg));
    });

    return () => {
      websocketService.off('GET_ROOM_CHAT_MES', handleMessages);
      // Không off SEND_CHAT để duy trì nhận tin realtime
    };
  }, [dispatch]);
};

export default useMessages;