import { MessageCircle, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCreateChat, useFollowUser, useGetCurrentUserWithFollower, useGetCurrentUserWithFollowing, useGetFollowingByUserId, useGetUserPosts, useUnfollowUser } from "@/lib/react-query/queries";
import { useUserContext } from "@/context/AuthContext";
import { useState } from "react";
import { Loader } from ".";
import { Link, useNavigate } from "react-router-dom";
import { ChatState } from "@/context/ChatContext";
import { useToast } from "../ui";

const ProfileCard = ({user}) => {
  const { toast } = useToast();
  const navigate = useNavigate();
    const [followButtonClicked, setFollowButtonClicked] = useState(false);
      const [unFollowButtonClicked, setUnFollowButtonClicked] = useState(false);
    const { user: currentUser } = useUserContext();
    const { chats, setChats, selectedChat, setSelectedChat } = ChatState();

    const { mutate: followUser, isPending: followPending  } = useFollowUser();
    const { mutate: unfollowUser, isPending: unFollowPending } = useUnfollowUser();

    const { data: userPosts, isLoading: isUserPostLoading } = useGetUserPosts(user?._id);
    const { data: myFollowingUser, isLoading: isMyFollowingUserLoading, refetch: refetchFollowingUser } = useGetCurrentUserWithFollowing(user?._id);
    const { data: myFollower, isLoading: isMyFollowerLoading, refetch: refetchFollower } = useGetCurrentUserWithFollower(user?._id);

    const { data: following, isLoading: isFollowingLoading, isError: isErrorFollowing, refetch: refetchFollowing } = useGetFollowingByUserId(currentUser.id);

    const { mutateAsync: createChat, isPending: isPendingCreate } = useCreateChat();
    
    const isFollowing = following?.some((oneFollowing: any) => oneFollowing?.toUsers?._id === user?._id) || false;


    const handleUnFollow = () => {
    if (!unFollowButtonClicked) {
      setFollowButtonClicked(false);
      unfollowUser({ userId: user?._id, currentUserId: currentUser?.id });
      refetchFollowing()
      setUnFollowButtonClicked(true);
    }
  };

  const handleFollow = () => {
    if (!followButtonClicked) {
      setUnFollowButtonClicked(false);
      followUser({ userId: user?._id, currentUserId: currentUser?.id });
      refetchFollowing()
      setFollowButtonClicked(true);
    }
  };

  const handleOpenChat = async (userId: string) => {
    // Search the chat that includes both the current user and the other user
  const existingChat = chats.find((chat: any) =>
    chat?.usersId?.includes(currentUser.id) &&
    chat?.usersId?.includes(userId)
  );

  if (existingChat) {
    setSelectedChat(existingChat);
    navigate("/chats");
  } else {
    console.warn("Chat not found with user:", userId);
    const newChat = await createChat({
      chatName: "Sender",
      isGroupChat: false,
      users: [userId],
      currentUserId: currentUser.id,
      usersId: [currentUser.id, userId]
    });
    if (!chats?.find((c: any) => c._id === newChat._id)) {
      setChats([newChat, ...chats])
    }
    setSelectedChat(newChat);
    navigate("/chats");

    if (!newChat) {
      toast({
        title: `Chat failed. Please try again.`,
      });
    }
  }
  }

  return (
    // <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className=" bg-black text-white border-gray-800 overflow-hidden">
        {/* Header Section */}
        <div className="p-1">
          <div className="flex items-start gap-4">
            {/* Profile Picture with Gradient Border */}
            <div className="relative">
              {/* <div className="w-18 h-18 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 p-0.5"> */}
                <div className="w-full h-full rounded-full bg-black p-0.5">
                  <img
                    src={user?.imageUrl || "/assets/icons/profile-placeholder.svg"}
                    alt="Profile"
                    className="w-14 h-14 rounded-full object-cover"
                  />
                </div>
              {/* </div> */}
            </div>

            {/* Profile Info */}
            <div className="flex flex-col justify-center items-start">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold">{user?.name}</h2>
                {/* <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div> */}
              </div>
              <p className="text-gray-300 text-[0.8rem] mb-2">{user?.username}</p>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="px-10 pb-4">
          <div className="flex justify-between text-center">
            <div>
              <div className="text-base font-semibold">{userPosts?.documents?.length}</div>
              <div className="text-gray-400 text-sm">posts</div>
            </div>
            <div>
              <div className="text-base font-semibold">{myFollower?.followers?.length}</div>
              <div className="text-gray-400 text-sm">followers</div>
            </div>
            <div>
              <div className="text-base font-semibold">{myFollowingUser?.following?.length}</div>
              <div className="text-gray-400 text-sm">following</div>
            </div>
          </div>
        </div>

        {/* Photo Grid */}
        <div className="px-0 pb-4">
          <div className="relative">
            <div className="grid grid-cols-3 gap-1">
                {userPosts?.documents?.[0] && (
                    <img
                src={userPosts?.documents?.[0]?.imageUrl}
                alt="Post 1"
                className="aspect-square object-cover rounded-sm"
              />
                )}
                {userPosts?.documents?.[1] && (
                    <img
                src={userPosts?.documents?.[1]?.imageUrl}
                alt="Post 2"
                className="aspect-square object-cover rounded-sm"
              />
                )}
                {userPosts?.documents?.[2] && (
                    <img
                src={userPosts?.documents?.[2]?.imageUrl}
                alt="Post 3"
                className="aspect-square object-cover rounded-sm"
              />
                )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-2 pb-6">
          <div className="flex gap-3">
            {user?._id === currentUser?.id ? (
                <Button type="button" variant="outline" className="flex-1 bg-[#877eff] hover:bg-[#796fff] border-gray-700 text-white">
                <Link
                                to={`/update-profile/${user?._id}`}>
              Edit profile
            </Link>
            </Button>
            ) : (
                isFollowing ? (
                    <>
            <Button type="button" className="flex-1 bg-[#877eff] hover:bg-[#796fff] text-white" onClick={() => handleOpenChat(user?._id)}>
              <MessageCircle className="w-4 h-4 mr-2" />
              Message
            </Button>
            <Button type="button" variant="outline" className="flex-1 bg-gray-800 border-gray-700 text-white hover:bg-gray-700" onClick={handleUnFollow} disabled={unFollowButtonClicked}>
              {isFollowingLoading ? (
            <div className="flex-center gap-2">
              <Loader /> Loading...
            </div>
          ) : unFollowPending ? (
            <div className="flex-center gap-2">
              <Loader /> Loading...
            </div>
          ) : (
            "Unfollow"
          )}
            </Button>
            </>
                ) : (
                    <Button type="button" variant="outline" className="flex-1 bg-[#877eff] hover:bg-[#796fff] border-gray-700 text-white" onClick={handleFollow} disabled={followButtonClicked}>
              {isFollowingLoading || followPending ? (
                          <div className="flex-center gap-2">
                            <Loader /> Loading...
                          </div>
                        ) : followPending ? (
                          <div className="flex-center gap-2">
                            <Loader /> Loading...
                          </div>
                        ) : (
                          "Follow"
                        )}
            </Button>
                )
          )}
          </div>
        </div>
      </div>
  )
}

export default ProfileCard
