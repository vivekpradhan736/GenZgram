import React, { useEffect, useRef, useState } from 'react';
import { databases, client } from '../../lib/appwrite/config.ts';
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Phone, Video, Info, Smile, Mic, ImageIcon, Heart, MessageCircle, Send } from 'lucide-react'
import { useUserContext } from '@/context/AuthContext.tsx';
import { formatDate, getReceiver } from '@/lib/validation/ChatLogics.ts';
import { ChatState } from '@/context/ChatContext.tsx';
import { useCreateMessage, useGetAllMessagesByChatId } from '@/lib/react-query/queries.ts';
import ScrollableChat from './ScrollableChat.tsx';
import io from "socket.io-client";
import { useToast } from '../ui/use-toast.ts';
import Lottie from "react-lottie";
import animationData from "../../animations/typing.json";

const ENDPOINT = "http://localhost:5000";

interface ReceiverDetails {
    name: string;
    email?: string;
    username?: string
    imageUrl?: string;
    
    // Add other fields as per your `getUserById` response
  }

  interface Props {
    fetchAgain: any;
    setFetchAgain: any;
    triggerChild2Function: any;
  }

const Chatbox = ({fetchAgain, setFetchAgain, triggerChild2Function} : Props) => {
  const { toast } = useToast();
  const socket = useRef<any>(null);
  const selectedChatCompare = useRef<any>(null);

  const { user: currentUser } = useUserContext();
  const { chats, setChats, selectedChat, setSelectedChat, notification, setNotification, } = ChatState();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [newMessageForPic, setNewMessageForPic] = useState("");
  const [fetchReceiversLoading, setFetchReceiversLoading] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [typing, setTyping] = useState(false);
  const [istyping, setIsTyping] = useState(false);
  const [userInteracted, setUserInteracted] = useState(false);
  const { mutateAsync: createMessage, isPending: isPendingCreateMessage, isError: isErrorCreateMessage } = useCreateMessage();
  const { data: allMessage, isLoading: isMessageLoading, isError: isErrorMessages } = useGetAllMessagesByChatId(selectedChat?._id);

  const [receivers, setReceivers] = useState<ReceiverDetails>();

  const defaultOptions = {
    loop: true,
    autoplay: true,
    animationData: animationData,
    rendererSettings: {
      preserveAspectRatio: "xMidYMid slice",
    },
  };

  useEffect(() => {
    const handleUserInteraction = () => {
      setUserInteracted(true);
      document.removeEventListener("click", handleUserInteraction);
    };

    document.addEventListener("click", handleUserInteraction);

    return () => {
      document.removeEventListener("click", handleUserInteraction);
    };
  }, []);

  useEffect(() => {
    const fetchReceivers = async () => {
      setFetchReceiversLoading(true);
        const receiverDetails = await getReceiver(currentUser.id, selectedChat?.usersId);

      setReceivers(receiverDetails);
      setFetchReceiversLoading(false);
    };
    
    fetchReceivers();
}, [selectedChat?.usersId]);

  useEffect(() => {
    if (allMessage && selectedChat) {
      // Filter messages based on the specific chat ID
      const filteredMessages = allMessage?.documents?.filter(
        (doc: any) => doc?.chat?._id === selectedChat?._id
      );
  
      // Set the filtered messages in state
      setMessages(filteredMessages);
    }
    if(allMessage){
      setMessages(allMessage?.documents);
    }
    if (socket.current) {
      socket.current.emit("join chat", selectedChat?._id);
    }

    selectedChatCompare.current = selectedChat;
  }, [selectedChat, allMessage]);

  useEffect(() => {
    socket.current = io(ENDPOINT);

    socket.current.emit("setup", currentUser);
    socket.current.on("connected", () => setSocketConnected(true));
    socket.current.on("typing", () => setIsTyping(true));
    socket.current.on("stop typing", () => setIsTyping(false));
  }, []);

  useEffect(() => {
    if (!socket.current) return;

    socket.current.on("message recieved", (newMessageRecieved: any) => {
      if (
        !selectedChatCompare.current || // if chat is not selected or doesn't match current chat
        selectedChatCompare.current._id !== newMessageRecieved.chat._id
      ) {
        if (!notification.includes(newMessageRecieved)) {
          setNotification([newMessageRecieved, ...notification]);
          localStorage.setItem(
            "notificationChat",
            JSON.stringify(notification)
          );
          notification_sound();
          // notification_toast();
          notification_toast(newMessageRecieved);
          setFetchAgain(!fetchAgain);
        }
      } else {
        setMessages(prevMessages => [...prevMessages, newMessageRecieved]);
        receive_sound();
      }
    });
  }, [socketConnected]);

  const notification_toast = (newMessageNotification: any) => {
    if (userInteracted) {
      toast({
        title: `New Message${newMessageNotification?.chat?.isGroupChat ? ` • ${newMessageNotification?.chat?.chatName}` : ''}`,
      description: (
        <div className="flex items-center gap-2 overflow-hidden mt-1">
          <Avatar>
            <AvatarImage src={newMessageNotification?.sender?.pic} />
            <AvatarFallback>{newMessageNotification?.sender?.name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col justify-around overflow-hidden">
            <h1 className="text-sm font-semibold line-clamp-1">{newMessageNotification?.sender?.name}</h1>
            <h1 className="text-sm text-[#ebebeb] font-normal line-clamp-1">{newMessageNotification?.content}</h1>
          </div>
        </div>
      ),
      duration: 5000,
      });
    }
  };

  // Function to send a new message
  const sendMessage = async (event: any) => {
    if (event.key === "Enter" && newMessage) {
      socket.current.emit("stop typing", selectedChat._id);
    try {
      const newCraeteMessage = await createMessage({
        content: newMessage,
        sender: currentUser?.id, // Replace with the logged-in user ID
        chat: selectedChat?._id,
        timestamp: new Date().toISOString(),
      });
      setNewMessage('');
      pop_sound();
      socket.current.emit("new message", newCraeteMessage);
      setMessages([...messages, newCraeteMessage]);
      triggerChild2Function();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }
  };

function notification_sound() {
  if (userInteracted) {
    const audio = new Audio('/notification.wav');
    audio.volume = 0.1;
    audio.play().catch(error => console.log("notification_sound error",error));
  }
}

function receive_sound() { 
    const audio = new Audio('/receive_sound.mp3');
    audio.volume = 0.1;
    audio.play(); 
}

function pop_sound() { 
    const audio = new Audio('/pop_sound.wav'); 
    audio.play(); 
} 

const typingHandler = (e: any) => {
    e.preventDefault();
    setNewMessage(e.target.value);

    if (!socketConnected) return;

    if (!typing) {
      setTyping(true);
      socket.current.emit("typing", selectedChat._id);
    }
    const lastTypingTime = new Date().getTime();
    const timerLength = 3000;
    setTimeout(() => {
      const timeNow = new Date().getTime();
      const timeDiff = timeNow - lastTypingTime;
      if (timeDiff >= timerLength && typing) {
        socket.current.emit("stop typing", selectedChat._id);
        setTyping(false);
      }
    }, timerLength);
  };

  const typingHandlerPicture = (e: any) => {
    e.preventDefault();
    setNewMessageForPic(e.target.value);

    if (!socketConnected) return;

    if (!typing) {
      setTyping(true);
      socket.current.emit("typing", selectedChat._id);
    }
    const lastTypingTime = new Date().getTime();
    const timerLength = 3000;
    setTimeout(() => {
      const timeNow = new Date().getTime();
      const timeDiff = timeNow - lastTypingTime;
      if (timeDiff >= timerLength && typing) {
        socket.current.emit("stop typing", selectedChat._id);
        setTyping(false);
      }
    }, timerLength);
  };

  return (
    <div className="w-[75%]">
      {selectedChat === null ? (
        <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-2 text-center">
        <div className="rounded-full border-2 border-blue-600 p-6">
        <Avatar className="h-12 w-12">
              <AvatarImage src="/assets/images/logo3.png" />
            </Avatar>
            </div>
          <h2 className="text-xl font-medium text-white">Your messages</h2>
          <p className="text-gray-400 text-sm">Send a message to start a chat.</p>
          <Button 
            className="mt-1 bg-[#0095FF] hover:bg-[#0095FF]/90 text-white"
            size="sm"
          >
            Send message
          </Button>
        </div>
      </div>
      ) : (
        <>
        <div className="flex-1 flex flex-col w-full">
        {/* Chat Messages */}
        <ScrollableChat receivers={receivers} selectedChat={selectedChat} messages={messages} isMessageLoading={isMessageLoading} fetchReceiversLoading={fetchReceiversLoading} />

        {/* Message Input Section */}
          {istyping ? (
                <div>
                  <Lottie
                    options={defaultOptions}
                    // height={50}
                    width={7}
                    style={{ marginBottom: 15, marginLeft: 0 }}
                  />
                </div>
              ) : (
                <></>
              )}
        <div className="p-4 bg-gray-800 sticky bottom-0 left-0 right-0 z-10">
                    <div className="flex items-center space-x-3">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-gray-400 hover:text-white"
                        >
                            <Smile className="h-6 w-6" />
                        </Button>
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => {
                              setNewMessage(e.target.value)
                              typingHandler
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && newMessage.trim()) {
                                  sendMessage(e);
                              }
                          }}
                            placeholder="Type your message..."
                            className="flex-1 p-3 bg-gray-700 rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-gray-400 hover:text-white"
                        >
                            <Mic className="h-6 w-6" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-gray-400 hover:text-white"
                        >
                            <ImageIcon className="h-6 w-6" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-gray-400 hover:text-white"
                        >
                            <Heart className="h-6 w-6" />
                        </Button>
                        <Button
                            onClick={sendMessage}
                            className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full"
                        >
                            <Send className="h-5 w-5" />
                        </Button>
                    </div>
                </div>
      </div>
      </>
      )}
    </div>
  );
};

export default Chatbox;