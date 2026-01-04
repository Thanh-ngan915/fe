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
    
    websocketService.on('GET_ROOM_CHAT_MES', handleMessages);
    
    websocketService.on('SEND_CHAT', (data) => {
      // Data trả về đôi khi nằm trong data.data hoặc trực tiếp trong data
      const msg = data.data || data; 
      dispatch(addMessage(msg));
    });

    return () => {
      websocketService.off('GET_ROOM_CHAT_MES', handleMessages);
    };
  }, [dispatch]);
};

export default useMessages;