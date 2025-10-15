import React, { useState, useMemo, useEffect, useRef } from 'react';
import { User, ChatMessage } from '../types';
import { ArrowLeftIcon, ChatBubbleLeftRightIcon, PaperAirplaneIcon, CheckCircleIcon, ChevronDownIcon } from './icons';

interface ChatProps {
    currentUser: User;
    users: User[];
    messages: ChatMessage[];
    onSendMessage: (receiverId: string, content: string) => void;
    onMarkMessagesAsRead: (senderId: string) => void;
}

const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
};

const formatLastMessageTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
        return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    }
    if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
    }
    return date.toLocaleDateString('en-GB');
};

const formatDateSeparator = (timestamp: string): string => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
        return 'Today';
    }
    if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
    }
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
};


const generateAvatarColor = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = [
        'bg-red-500', 'bg-orange-500', 'bg-amber-500',
        'bg-lime-500', 'bg-green-500', 'bg-emerald-500', 'bg-teal-500',
        'bg-cyan-500', 'bg-sky-500', 'bg-blue-500', 'bg-indigo-500',
        'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500', 'bg-pink-500', 'bg-rose-500'
    ];
    return colors[Math.abs(hash % colors.length)];
};

const getBubbleClasses = (isSender: boolean, isFirstInGroup: boolean, isLastInGroup: boolean) => {
    const classes = ['rounded-2xl'];
    if (isSender) {
        // Sent messages are on the right
        if (!isLastInGroup) classes.push('rounded-br-md');
        if (!isFirstInGroup) classes.push('rounded-tr-md');
    } else {
        // Received messages are on the left
        if (!isLastInGroup) classes.push('rounded-bl-md');
        if (!isFirstInGroup) classes.push('rounded-tl-md');
    }
    return classes.join(' ');
};


export const Chat: React.FC<ChatProps> = ({ currentUser, users, messages, onSendMessage, onMarkMessagesAsRead }) => {
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [messageContent, setMessageContent] = useState('');
    const [showScrollToBottom, setShowScrollToBottom] = useState(false);
    const [newMessagesCount, setNewMessagesCount] = useState(0);
    
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const isAtBottomRef = useRef(true);

    const colleagues = useMemo(() => users.filter(u => u.id !== currentUser.id), [users, currentUser.id]);

    const { unreadCounts, lastMessages } = useMemo(() => {
        const counts: { [senderId: string]: number } = {};
        const lastMessageMap = new Map<string, ChatMessage>();

        messages.forEach(msg => {
            if (msg.receiverId === currentUser.id && !msg.read) {
                counts[msg.senderId] = (counts[msg.senderId] || 0) + 1;
            }
            const otherUserId = msg.senderId === currentUser.id ? msg.receiverId : msg.senderId;
            const existing = lastMessageMap.get(otherUserId);
            if (!existing || new Date(msg.timestamp) > new Date(existing.timestamp)) {
                lastMessageMap.set(otherUserId, msg);
            }
        });
        return { unreadCounts: counts, lastMessages: lastMessageMap };
    }, [messages, currentUser.id]);


    const selectedChatMessages = useMemo(() => {
        if (!selectedUserId) return [];
        return messages
            .filter(msg => 
                (msg.senderId === currentUser.id && msg.receiverId === selectedUserId) ||
                (msg.senderId === selectedUserId && msg.receiverId === currentUser.id)
            )
            .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    }, [messages, selectedUserId, currentUser.id]);
    
    const scrollToBottom = (behavior: 'smooth' | 'auto' = 'smooth') => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTo({
                top: chatContainerRef.current.scrollHeight,
                behavior,
            });
        }
    };
    
    // Auto-scroll logic for new messages
    useEffect(() => {
        const lastMessage = selectedChatMessages[selectedChatMessages.length - 1];
        if (lastMessage) {
            // If the user is already near the bottom or sent the message, scroll them down.
            if (isAtBottomRef.current || lastMessage.senderId === currentUser.id) {
                scrollToBottom('auto');
            } else {
                // Otherwise, increment the new message counter.
                setNewMessagesCount(prev => prev + 1);
            }
        }
    }, [selectedChatMessages, currentUser.id]);

    // Reset scroll state and scroll to bottom when changing conversations
    useEffect(() => {
        isAtBottomRef.current = true;
        setShowScrollToBottom(false);
        setNewMessagesCount(0);
        scrollToBottom('auto');
    }, [selectedUserId]);


    const handleScroll = () => {
        const container = chatContainerRef.current;
        if (container) {
            const threshold = 200; // Show button if scrolled up more than 200px
            const atBottom = container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
            isAtBottomRef.current = atBottom;
            setShowScrollToBottom(!atBottom);
            if (atBottom) {
                setNewMessagesCount(0);
            }
        }
    };

    const handleSelectUser = (userId: string) => {
        setSelectedUserId(userId);
        if (unreadCounts[userId] > 0) {
          onMarkMessagesAsRead(userId);
        }
    };

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (messageContent.trim() && selectedUserId) {
            onSendMessage(selectedUserId, messageContent.trim());
            setMessageContent('');
        }
    };
    
    const selectedUser = users.find(u => u.id === selectedUserId);

    const colleagueList = (
        <div className="flex flex-col border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 h-full">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 shrink-0 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Colleagues</h2>
            </div>
            <div className="flex-1 overflow-y-auto">
                {colleagues.map(user => {
                    const lastMessage = lastMessages.get(user.id);
                    const unreadCount = unreadCounts[user.id] || 0;
                    const isActive = selectedUserId === user.id;

                    return (
                        <button
                            key={user.id}
                            onClick={() => handleSelectUser(user.id)}
                            className={`w-full text-left p-3 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors relative ${isActive ? 'bg-blue-50 dark:bg-blue-900/50' : ''}`}
                        >
                            {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-primary rounded-r-full"></div>}
                            <div className={`relative shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl ${generateAvatarColor(user.name)}`}>
                                {user.name.charAt(0).toUpperCase()}
                                {unreadCount > 0 && 
                                    <span className="absolute top-0 right-0 block h-3 w-3 rounded-full bg-danger ring-2 ring-white dark:ring-slate-800"></span>
                                }
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <div className="flex justify-between items-center">
                                    <p className={`font-semibold truncate ${isActive ? 'text-brand-primary' : 'text-slate-900 dark:text-slate-100'}`}>{user.name}</p>
                                    {lastMessage && <p className="text-xs text-slate-400 dark:text-slate-500 shrink-0 ml-2">{formatLastMessageTime(lastMessage.timestamp)}</p>}
                                </div>
                                <div className="flex justify-between items-start">
                                    <p className={`text-sm text-slate-500 dark:text-slate-400 truncate pr-2 ${unreadCount > 0 ? 'font-bold text-slate-700 dark:text-slate-300' : ''}`}>
                                        {lastMessage ? `${lastMessage.senderId === currentUser.id ? 'You: ' : ''}${lastMessage.content}` : `Say hi to ${user.name}!`}
                                    </p>
                                    {unreadCount > 0 && (
                                        <span className="bg-danger text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shrink-0">
                                            {unreadCount}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </button>
                    )
                })}
            </div>
        </div>
    );
    
    const chatView = (
        <div className="flex flex-col bg-slate-100 dark:bg-slate-900 h-full chat-bg">
            {selectedUser ? (
                <>
                    <div className="p-3 border-b border-slate-200 dark:border-slate-700 flex items-center gap-3 bg-white dark:bg-slate-800 shadow-sm z-10 shrink-0">
                        <button onClick={() => setSelectedUserId(null)} className="md:hidden text-slate-600 dark:text-slate-300 mr-2">
                            <ArrowLeftIcon className="w-6 h-6"/>
                        </button>
                        <div className={`relative shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-md ${generateAvatarColor(selectedUser.name)}`}>
                            {selectedUser.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h3 className="font-semibold text-slate-900 dark:text-slate-100">{selectedUser.name}</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{selectedUser.role}</p>
                        </div>
                    </div>
                    <div className="relative flex-1 overflow-hidden">
                        <div ref={chatContainerRef} onScroll={handleScroll} className="absolute inset-0 overflow-y-auto p-4 sm:p-6">
                            {selectedChatMessages.map((msg, index) => {
                                const isSender = msg.senderId === currentUser.id;
                                const prevMsg = selectedChatMessages[index - 1];
                                const nextMsg = selectedChatMessages[index + 1];

                                const isFirstInGroup = !prevMsg || prevMsg.senderId !== msg.senderId;
                                const isLastInGroup = !nextMsg || nextMsg.senderId !== msg.senderId;
                                
                                const showDateSeparator = !prevMsg || new Date(msg.timestamp).toDateString() !== new Date(prevMsg.timestamp).toDateString();
                                const bubbleClasses = getBubbleClasses(isSender, isFirstInGroup, isLastInGroup);

                                return (
                                    <React.Fragment key={msg.id}>
                                        {showDateSeparator && (
                                            <div className="flex justify-center my-4">
                                                <span className="bg-slate-200/80 dark:bg-slate-700/50 backdrop-blur-sm text-slate-600 dark:text-slate-300 text-xs font-semibold px-3 py-1 rounded-full">
                                                    {formatDateSeparator(msg.timestamp)}
                                                </span>
                                            </div>
                                        )}
                                        <div className={`flex items-end gap-2 ${isSender ? 'justify-end' : 'justify-start'} ${isFirstInGroup ? 'mt-4' : 'mt-1'} animate-slide-in-up`}>
                                            <div className="w-8 shrink-0 flex flex-col justify-end">
                                            {isLastInGroup && !isSender && 
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${generateAvatarColor(selectedUser.name)}`}>
                                                    {selectedUser.name.charAt(0).toUpperCase()}
                                                </div>
                                            }
                                            </div>
                                            <div className={`max-w-xs lg:max-w-lg px-4 py-3 shadow-md ${isSender ? 'bg-gradient-to-br from-blue-500 to-violet-600 text-white' : 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100'} ${bubbleClasses}`}>
                                                <p className="text-sm break-words">{msg.content}</p>
                                                { isLastInGroup && (
                                                    <div className={`flex items-center justify-end gap-1.5 text-xs mt-1 ${isSender ? 'text-blue-200' : 'text-slate-400 dark:text-slate-500'}`}>
                                                        {isSender && (
                                                            <CheckCircleIcon 
                                                                className={`w-4 h-4 ${msg.read ? 'text-sky-300' : 'text-blue-300/60'}`} 
                                                                aria-label={msg.read ? 'Read' : 'Delivered'}
                                                            />
                                                        )}
                                                        <span>{formatTimestamp(msg.timestamp)}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </React.Fragment>
                                );
                            })}
                        </div>
                         {showScrollToBottom && (
                            <button
                                onClick={() => scrollToBottom('smooth')}
                                aria-label="Scroll to latest messages"
                                className="absolute bottom-6 right-6 z-20 bg-brand-primary text-white w-12 h-12 rounded-full flex items-center justify-center shadow-lg hover:bg-brand-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary transition-all duration-300 opacity-0 animate-fade-in-up"
                            >
                                <ChevronDownIcon className="w-6 h-6" />
                                {newMessagesCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-danger text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center ring-2 ring-brand-primary">
                                        {newMessagesCount > 9 ? '9+' : newMessagesCount}
                                    </span>
                                )}
                            </button>
                        )}
                    </div>
                    <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 shrink-0">
                        <form onSubmit={handleSendMessage} className="flex gap-3 items-center">
                            <input
                                type="text"
                                value={messageContent}
                                onChange={e => setMessageContent(e.target.value)}
                                placeholder="Type a message..."
                                className="flex-1 p-3 border border-slate-300 dark:border-slate-600 rounded-full focus:outline-none focus:ring-2 focus:ring-brand-accent bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400"
                                aria-label="Chat message input"
                            />
                            <button type="submit" aria-label="Send message" className="bg-gradient-to-br from-blue-500 to-violet-600 text-white rounded-full h-12 w-12 flex items-center justify-center shrink-0 shadow-lg hover:from-blue-600 hover:to-violet-700 transition-all duration-300 transform hover:scale-105 disabled:from-slate-400 disabled:to-slate-500 disabled:scale-100 dark:disabled:from-slate-600 dark:disabled:to-slate-700" disabled={!messageContent.trim()}>
                                <PaperAirplaneIcon className="w-6 h-6"/>
                            </button>
                        </form>
                    </div>
                </>
            ) : (
                <div className="flex-1 flex flex-col justify-center items-center text-center text-slate-500 dark:text-slate-400 p-8">
                    <ChatBubbleLeftRightIcon className="w-24 h-24 text-slate-300 dark:text-slate-600"/>
                    <h3 className="mt-4 text-2xl font-semibold text-slate-800 dark:text-slate-200">Medzillo Chat</h3>
                    <p className="max-w-xs mt-2">Select a colleague from the list to start a private and secure conversation.</p>
                </div>
            )}
            <style>{`
                .chat-bg {
                    background-color: #f1f5f9;
                    background-image: radial-gradient(#cbd5e1 0.5px, transparent 0.5px);
                    background-size: 10px 10px;
                }
                .dark .chat-bg {
                    background-color: #0f172a;
                    background-image: radial-gradient(#334155 0.5px, transparent 0.5px);
                    background-size: 10px 10px;
                }
                @keyframes fade-in-up {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up {
                    animation: fade-in-up 0.3s ease-out forwards;
                }
            `}</style>
        </div>
    );
    
    return (
        <div className="h-full flex flex-col bg-white dark:bg-slate-800 shadow-sm rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="flex-1 grid md:grid-cols-3 lg:grid-cols-4 overflow-hidden">
                {/* Colleague List */}
                <div className={`h-full ${selectedUserId ? 'hidden md:block' : 'block'} md:col-span-1`}>
                    {colleagueList}
                </div>

                {/* Chat View */}
                <div className={`h-full ${selectedUserId ? 'block' : 'hidden'} md:block md:col-span-2 lg:col-span-3`}>
                    {chatView}
                </div>
            </div>
        </div>
    );
};