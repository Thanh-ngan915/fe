import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import websocketService from '../services/websocketService';
import {
    setConversations,
    setRooms,
    setMessages,
    addConversation
} from '../redux/slices/chatSlice';
import { parseConversationsFromResponse } from '../utils/chatUtils';

const useConversations = (isAuthenticated, currentUser) => {
    const dispatch = useDispatch();
    const searchTerm = useSelector(state => state.chat.searchTerm);


    const searchRef = useRef(searchTerm);

    useEffect(() => {
        searchRef.current = searchTerm;
    }, [searchTerm]);

    useEffect(() => {
        if (!isAuthenticated || !currentUser) return;

        const userName = currentUser.name || currentUser.user || currentUser.email;
        console.log('🔄 Syncing data for:', userName);

        // Lấy danh sách chat gần đây
        websocketService.send('GET_PEOPLE_CHAT_MES', {
            name: userName,
            page: 1,
        });

        const timer = setTimeout(() => {
            websocketService.send('GET_USER_LIST', {});
        }, 500);

        return () => clearTimeout(timer);
    }, [isAuthenticated, currentUser]);

    // 3. EFFECT 2: Đăng ký lắng nghe sự kiện (Chỉ chạy 1 lần duy nhất khi mount)
    useEffect(() => {

        const handlePeopleChatMes = (e) => {
            // Lưu ý: Với EventTarget, dữ liệu nằm trong e.detail
            const payload = e.detail;
            const listData = payload?.data || [];

            if (!Array.isArray(listData) || listData.length === 0) {
                const currentSearch = (searchRef.current && searchRef.current.trim()) || null;

                if (currentSearch) {
                    console.log('🔍 List rỗng, check user exist:', currentSearch);
                    websocketService.send('CHECK_USER_EXIST', { user: currentSearch });
                } else {
                    console.log('📂 List rỗng, fallback GET_USER_LIST');
                    websocketService.send('GET_USER_LIST', {});
                }
                return;
            }

            const firstItem = listData[0];
            // Kiểm tra kỹ hơn cấu trúc tin nhắn
            if (firstItem && typeof firstItem === 'object' && ('mes' in firstItem)) {
                dispatch(setMessages(listData));
                return;
            }

            const { people, rooms } = parseConversationsFromResponse(listData);
            dispatch(setConversations(people));
            dispatch(setRooms(rooms));
        };

        const handleUserList = (e) => {
            try {
                const payload = e.detail;
                const listData = payload?.data || [];

                if (Array.isArray(listData)) {
                    // Normalize data
                    const allUsers = listData.map(u => u.name || u.user || u);
                    dispatch(setConversations(allUsers));
                }
            } catch (err) {
                console.warn('Error parsing USER_LIST', err);
            }
        };

        const handleCheckUser = (e) => {
            try {
                const res = e.detail;
                // Logic check status linh hoạt hơn
                const isSuccess = res.status === 'success' || res.data?.status === 'success';
                const userExists = res.data?.exists === true;

                if ((isSuccess || userExists) && res.data?.user) {
                    dispatch(addConversation(res.data.user));
                }
            } catch (err) {
                console.warn('Error parsing CHECK_USER', err);
            }
        };

        // Vì websocketService giờ là EventTarget, ta dùng cú pháp chuẩn DOM
        websocketService.addEventListener('GET_PEOPLE_CHAT_MES', handlePeopleChatMes);
        websocketService.addEventListener('GET_USER_LIST', handleUserList);
        websocketService.addEventListener('CHECK_USER', handleCheckUser);

        return () => {
            websocketService.removeEventListener('GET_PEOPLE_CHAT_MES', handlePeopleChatMes);
            websocketService.removeEventListener('GET_USER_LIST', handleUserList);
            websocketService.removeEventListener('CHECK_USER', handleCheckUser);
        };

    }, [dispatch]); // Dependency array rất gọn, không chứa searchTerm
};

export default useConversations;