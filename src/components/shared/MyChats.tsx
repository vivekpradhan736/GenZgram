import { forwardRef, useEffect, useImperativeHandle, useState } from 'react'
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { UserPlus, Check } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast";
import useDebounce from "../../hooks/useDebounce";
import { useCreateChat, useGetChatsByUserId, useGetSearchUsers } from '@/lib/react-query/queries'
import { Skeleton } from "@/components/ui/skeleton"
import { useUserContext } from '@/context/AuthContext'
import { ChatState } from '@/context/ChatContext'
import { getReceiver } from '@/lib/validation/ChatLogics'

interface Props {
  fetchAgain: any;
}

type MyChatsHandle = {
  refetchChats: () => void;
};

const MyChats = forwardRef<MyChatsHandle, Props>(({ fetchAgain }, ref) => {
  const { toast } = useToast();
  const { user: currentUser } = useUserContext();
  const { chats, setChats, selectedChat, setSelectedChat } = ChatState();

  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [searchValue, setSearchValue] = useState("");
  const debouncedSearch = useDebounce(searchValue, 500);
  const { data: searchedUsers, isFetching: isSearchFetching, isLoading: isSearchedUsersLoading } = useGetSearchUsers(debouncedSearch, currentUser.id);

  const { data: chat, isLoading: isChatsLoading, error: isChatsError, refetch: refetchChats } = useGetChatsByUserId(currentUser?.id);

  useEffect(() => {
    if (chat) {
      setChats(chat);
    }
  }, [chat, setChats]);

  useImperativeHandle(ref, () => ({
    refetchChats
  }));

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const { mutateAsync: createChat, isPending: isPendingCreate } = useCreateChat();

  const handleCreateChat = async (userID: string) => {
    const newChat = await createChat({
      chatName: "Sender",
      isGroupChat: false,
      users: [userID],
      currentUserId: currentUser.id,
      usersId: [currentUser.id, userID]
    });
    if (!chats?.find((c: any) => c._id === newChat._id)) {
      setChats([newChat, ...chats])
    }
    setSelectedChat(newChat);
    setOpen(false);

    if (!newChat) {
      toast({
        title: `create chat failed. Please try again.`,
      });
    }
  };

  const [receivers, setReceivers] = useState<{ [key: string]: any }>({});

  useEffect(() => {
    const fetchReceivers = async () => {
      const receiverDetailsMap: { [key: string]: any } = {};
  
      for (const chat of chats) {
        const receiverDetails = await getReceiver(currentUser.id, chat.usersId);
        receiverDetailsMap[chat._id] = receiverDetails;
      }
  
      setReceivers(receiverDetailsMap);
    };

    if (chats) {
      fetchReceivers();
    }
  }, [currentUser, chats]);
  
  const onSelectedChat = localStorage.getItem("selectedChat");
  const selectUser = onSelectedChat ? JSON.parse(onSelectedChat) : null;

  const UserSkeleton = () => (
    <div className="flex items-center justify-between p-2">
      <div className="flex items-center gap-2 sm:gap-3">
        <Skeleton className="h-9 w-9 rounded-full bg-[#706f6fab] sm:h-10 sm:w-10" />
        <div className="flex flex-col items-start gap-2">
          <Skeleton className="h-3 w-32 bg-[#706f6fab] sm:w-40" />
          <Skeleton className="h-3 w-20 bg-[#706f6fab] sm:w-24" />
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex h-[100vh] w-[25%] bg-black text-white">
      {/* Left Sidebar */}
      <div className="w-full border-r border-gray-800">
        <div className="p-2 sm:p-3 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <Button variant="ghost" className="text-sm sm:text-base font-semibold truncate">
              {currentUser?.username}
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon" className="h-7 w-7 sm:h-8 sm:w-8">
                  <UserPlus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] max-w-[20rem] bg-[#2D2D2D] borderseekarten: border-gray-800 sm:max-w-[24rem]">
                <DialogHeader className="flex flex-row items-center justify-between border-b border-gray-800 pb-2 sm:pb-3">
                  <DialogTitle className="text-white text-sm sm:text-base">New message</DialogTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 text-gray-400 hover:text-white sm:h-6 sm:w-6"
                    onClick={() => setOpen(false)}
                  >
                  </Button>
                </DialogHeader>
                <div className="flex flex-col gap-2 sm:gap-3">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">To:</span>
                      <Input
                        type="text"
                        placeholder="Search..."
                        value={searchValue}
                        onChange={(e) => {
                          const { value } = e.target;
                          setSearchValue(value);
                        }}
                        className="flex-1 bg-transparent border-0 focus-visible:ring-0 text-white placeholder:text-gray-500 text-xs sm:text-sm"
                      />
                    </div>
                    <div className="h-px bg-gray-800" />
                  </div>
                  <ScrollArea className="h-[200px] pr-2 sm:h-[250px] sm:pr-3">
                    {isSearchedUsersLoading ? (
                      <div className="flex flex-col gap-2">
                        {[...Array(5)].map((_, index) => (
                          <UserSkeleton key={index} />
                        ))}
                      </div>
                    ) : searchedUsers && searchedUsers?.total > 0 ? (
                      <div className="flex flex-col gap-2">
                        {searchedUsers.documents.map((user) => (
                          <button
                            key={user._id}
                            onClick={() => handleCreateChat(user._id)}
                            className="flex items-center justify-between p-2 rounded hover:bg-[#444] transition-colors"
                          >
                            <div className="flex items-center gap-2 sm:gap-3">
                              <Avatar className="h-9 w-9 sm:h-10 sm:w-10">
                                <AvatarImage src={user.imageUrl} alt={user.name} />
                                <AvatarFallback>{user.name[0]}</AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col items-start gap-1">
                                <span className="text-white text-xs sm:text-sm truncate">{user.name}</span>
                                <span className="text-gray-400 text-xs truncate">{user.username}</span>
                              </div>
                            </div>
                            <div
                              className={`w-5 h-5 rounded-full border ${selectedUsers.includes(user._id)
                                  ? 'bg-blue-500 border-blue-500'
                                  : 'border-gray-400'
                                } flex items-center justify-center`}
                            >
                              {selectedUsers.includes(user._id) && (
                                <Check className="h-3 w-3 text-white" />
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400 text-xs sm:text-sm">
                        No account found.
                      </div>
                    )}
                  </ScrollArea>
                  <Button
                    className="w-full bg-[#0095F6] hover:bg-[#1877F2] text-white text-xs sm:text-sm"
                    disabled={!search}
                  >
                    Chat
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <ScrollArea className="h-[calc(100vh-80px)] max-w-[98%] sm:h-[calc(100vh-100px)]">
          {/* Chat List */}
          <div className="space-y-1 max-w-[100%]">
            {currentUser && chats &&
              chats?.map((chat: any) => {
                const receiver = receivers[chat._id];

                return (
                  <>
                    {!receiver ? (<UserSkeleton />) : (
                      <Button
                        key={chat._id}
                        variant="ghost"
                        className={`max-w-[100%] px-2 py-4 sm:py-6 flex space-x-2 ${selectedChat?._id === chat?._id ? 'bg-[#877effd8] hover:bg-[#877eff]' : 'bg-[#000000] hover:bg-[#877effb3]'}`}
                        onClick={() => {
                          setSelectedChat(chat)
                          localStorage.setItem('selectedChat', JSON.stringify(chat));
                        }}
                      >
                        <div className="flex justify-center items-center gap-2">
                          <Avatar className="h-8 w-8 sm:h-9 sm:w-9">
                            <AvatarImage src={receiver?.imageUrl || "/assets/icons/profile-placeholder.svg"} />
                            <AvatarFallback>{receiver?.name || "Loading..."}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 text-left overflow-hidden">
                            <p className="font-medium text-xs sm:text-sm truncate">{receiver?.name || "Loading..."}</p>
                            <p className={`text-xs ${selectedChat?._id === chat?._id ? 'text-gray-300' : 'text-gray-400'} truncate`}>
                              Vikram sent an attachment • 10w
                            </p>
                          </div>
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-medium text-xs truncate">{chat?.updatedAt}</p>
                          <p className={`text-xs ${selectedChat?._id === chat?._id ? 'text-gray-300' : 'text-gray-400'} truncate`}>
                            10w
                          </p>
                        </div>
                      </Button>
                    )}
                  </>
                );
              })}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
})

export default MyChats;