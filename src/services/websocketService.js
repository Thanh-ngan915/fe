/**
 * WebSocketService - Single Class Version
 * Kế thừa EventTarget để sử dụng cơ chế event native của trình duyệt.
 */
class WebSocketService extends EventTarget {
    constructor() {
        super();
        this.url = 'wss://chat.longapp.site/chat/chat';
        this.ws = null;

        this.retryCount = 0;
        this.maxRetries = 5;
        this.retryTimer = null;

        this.chatEvents = new Set([
            'REGISTER', 'LOGIN', 'RE_LOGIN', 'LOGOUT', 'CREATE_ROOM', 'JOIN_ROOM',
            'GET_ROOM_CHAT_MES', 'GET_PEOPLE_CHAT_MES', 'SEND_CHAT', 'CHECK_USER',
            'GET_USER_LIST', 'CHECK_USER_ONLINE', 'CHECK_USER_EXIST'
        ]);
    }

    // --- PUBLIC METHODS ---

    connect() {
        if (this.ws && [WebSocket.OPEN, WebSocket.CONNECTING].includes(this.ws.readyState)) {
            return Promise.resolve();
        }

        return new Promise((resolve) => {
            this.ws = new WebSocket(this.url);

            this.ws.onopen = () => {
                console.log('✓ WS Connected');
                this.retryCount = 0;
                resolve();
                this._dispatch('OPEN');
            };

            this.ws.onmessage = (event) => {
                this._handleMessage(event);
            };

            this.ws.onclose = () => {
                console.log('WS Closed. Reconnecting...');
                this._dispatch('CLOSE');
                this._attemptReconnect();
            };

            this.ws.onerror = (err) => {
                console.error("WS Error", err);
            };
        });
    }

    send(action, data = {}) {
        if (this.ws?.readyState !== WebSocket.OPEN) {
            console.warn('⚠️ Cannot send. WS is not OPEN.');
            return;
        }

        const payload = this._formatPayload(action, data);
        console.log(`📤 Sending [${action}]:`, payload);
        this.ws.send(JSON.stringify(payload));
    }

    disconnect() {
        if (this.retryTimer) clearTimeout(this.retryTimer);
        if (this.ws) {
            this.ws.onclose = null;
            this.ws.close();
        }
        this.ws = null;
    }


    _handleMessage(event) {
        try {
            const raw = JSON.parse(event.data);
            if (!raw || raw.action === 'error') return;

            let type = null;
            let detail = raw;

            if (raw.action === 'onchat' && raw.data?.event) {
                type = raw.data.event;
                // Làm phẳng data (Flatten) để bên ngoài dễ dùng
                const payload = (raw.data.data) ?? raw.data;
                detail = {
                    event: type,
                    status: raw.status || payload?.status || raw.data?.status,
                    mes: raw.mes || payload?.mes || raw.data?.mes,
                    data: payload?.data ?? payload
                };
            }
            else if (raw.event || raw.action) {
                type = raw.event || raw.action;
            }

            if (type) {
                this._dispatch(type, detail);
            }

            this._dispatch('*', raw);

        } catch (error) {
            console.error('Parse Message Error:', error);
        }
    }

    _formatPayload(action, data) {
        if (action === 'onchat') {
            return { action: 'onchat', data: data };
        }

        if (this.chatEvents.has(action)) {
            return { action: 'onchat', data: { event: action, data: data } };
        }

        // Mặc định
        return { action: action, data: data };
    }

    _attemptReconnect() {
        if (this.retryCount >= this.maxRetries) {
            console.error('❌ Max retries reached. Stopping reconnect.');
            return;
        }

        this.retryCount++;
        const timeout = Math.min(1000 * (2 ** this.retryCount), 30000);

        console.log(`🔄 Retry ${this.retryCount}/${this.maxRetries} in ${timeout/1000}s...`);
        this.retryTimer = setTimeout(() => this.connect(), timeout);
    }

    _dispatch(type, detail) {
        this.dispatchEvent(new CustomEvent(type, { detail }));
    }
}

const websocketService = new WebSocketService();
export default websocketService;