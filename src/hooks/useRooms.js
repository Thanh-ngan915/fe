import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import websocketService from '../services/websocketService';
import { addRoom, addJoinedRoom } from '../redux/slices/chatSlice';

const useRooms = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    // Xử lý khi tạo phòng thành công
    const handleRoomCreation = (data) => {
      if (data?.status !== 'error') {
        const roomName = data?.data?.name || data;
        dispatch(addRoom({ name: roomName }));
        // Tự động join vào phòng vừa tạo
        websocketService.send('JOIN_ROOM', { name: roomName });
      }
    };

    websocketService.on('CREATE_ROOM', handleRoomCreation);
    
    // Xử lý khi đã join vào phòng
    websocketService.on('JOIN_ROOM', (data) => {
      const name = data?.data?.name || data?.room;
      if (name) {
        dispatch(addJoinedRoom(name));
      }
    });

    return () => {
      websocketService.off('CREATE_ROOM', handleRoomCreation);
    };
  }, [dispatch]);
};

export default useRooms;