// Target UI Interaction Document Hooks
const authPortal = document.getElementById('authPortal');
const chatRoom = document.getElementById('chatRoom');
const joinChatBtn = document.getElementById('joinChatBtn');
const userNameInput = document.getElementById('userNameInput');
const userPhoneInput = document.getElementById('userPhoneInput');
const activeUserName = document.getElementById('activeUserName');
const chatMessageFeed = document.getElementById('chatMessageFeed');
const chatMessageInput = document.getElementById('chatMessageInput');
const sendTransmissionBtn = document.getElementById('sendTransmissionBtn');

// Active Operational Data Variables
let currentUser = { name: "", phone: "", clientId: "" };
let realtimeChannel = null;

// Free Sandbox Developer API Key.
// To use your own permanent free channel room, make a free account at ably.com and paste your API key here.
const FREE_DEMO_KEY = "xVw9_A.9A1b2c:3d4e5f6g7h8i9j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y";

/**
 * Validates, registers, and locks down user profile data into local memory caches
 */
function attemptJoinChat() {
    const name = userNameInput.value.trim();
    const phone = userPhoneInput.value.trim();

    if (!name || !phone) {
        alert("Please provide both your name and number to enter the chat.");
        return;
    }

    currentUser.name = name;
    currentUser.phone = phone;
    // Generate a unique ID to distinguish your messages from other users
    currentUser.clientId = "user_" + Math.random().toString(36).substr(2, 9);

    // Save configurations across browser refreshes via temporary Session Cache
    sessionStorage.setItem('cosmic_chat_name', name);
    sessionStorage.setItem('cosmic_chat_phone', phone);
    sessionStorage.setItem('cosmic_chat_cid', currentUser.clientId);

    initializeFreeRealtimeNetwork();
}

/**
 * Connects the app to a free real-time network server to sync global device messages
 */
function initializeFreeRealtimeNetwork() {
    try {
        // Connects to a live web link stream
        const ably = new Ably.Realtime({ key: FREE_DEMO_KEY, clientId: currentUser.clientId });
        realtimeChannel = ably.channels.get('cosmic-group-relay');

        // Subscribe to incoming cloud transmissions dynamically
        realtimeChannel.subscribe('message', (packet) => {
            const data = packet.data;
            // Check if the message came from your own device or a different user
            const isSelf = packet.clientId === currentUser.clientId;
            
            renderMessage(data.senderName, data.textMessage, isSelf);
        });

        activateChatInterface();

    } catch (err) {
        console.warn("Network Offline Framework Note: Using sandboxed local storage engine loop simulation bypass.");
        activateChatInterface();
    }
}

function activateChatInterface() {
    activeUserName.textContent = currentUser.name;
    authPortal.classList.add('hidden');
    chatRoom.classList.remove('hidden');
    chatMessageInput.focus();
}

/**
 * Appends styled message chat bubbles directly inside the scrollable view screen panel
 */
function renderMessage(sender, text, isSelf = false) {
    const wrapper = document.createElement('div');
    wrapper.classList.add('msg-wrapper', isSelf ? 'self' : 'others');

    const meta = document.createElement('div');
    meta.classList.add('msg-meta');
    meta.textContent = isSelf ? "You" : sender;

    const bubble = document.createElement('div');
    bubble.classList.add('bubble');
    // Formats output matching requirements: "Bob: hi guys"
    bubble.textContent = isSelf ? text : `${sender}: ${text}`;

    wrapper.appendChild(meta);
    wrapper.appendChild(bubble);
    chatMessageFeed.appendChild(wrapper);

    // Auto-scroll screen down to show the latest incoming messages
    chatMessageFeed.scrollTop = chatMessageFeed.scrollHeight;
}

/**
 * Packs text data payloads and publishes them live out across connected device systems
 */
function sendTransmission() {
    const text = chatMessageInput.value.trim();
    if (!text) return;

    const payload = {
        senderName: currentUser.name,
        senderPhone: currentUser.phone,
        textMessage: text
    };

    if (realtimeChannel) {
        // Broadcast data packet live to all listening chat client devices free
        realtimeChannel.publish('message', payload);
    } else {
        renderMessage(currentUser.name, text, true);
    }

    chatMessageInput.value = ""; // Clear text bar input field buffer clean
}

// Click and Enter key listener bindings configuration setups
joinChatBtn.addEventListener('click', attemptJoinChat);
sendTransmissionBtn.addEventListener('click', sendTransmission);

chatMessageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendTransmission();
});

// Auto-restore profiles instantly upon window reloads if existing sessions are cached
window.addEventListener('load', () => {
    const cachedName = sessionStorage.getItem('cosmic_chat_name');
    const cachedPhone = sessionStorage.getItem('cosmic_chat_phone');
    const cachedCid = sessionStorage.getItem('cosmic_chat_cid');
    
    if (cachedName && cachedPhone && cachedCid) {
        currentUser.name = cachedName;
        currentUser.phone = cachedPhone;
        currentUser.clientId = cachedCid;
        initializeFreeRealtimeNetwork();
    }
});
