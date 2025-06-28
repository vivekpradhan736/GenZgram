import {
  Route,
  Routes,
  Link,
  Outlet,
  useParams,
  useLocation,
} from "react-router-dom";

import { LikedPosts } from "@/_root/pages";
import { useUserContext } from "@/context/AuthContext";
import { useGetUserById, useGetCurrentUserWithFollowing, useGetCurrentUserWithFollower, useGetUserPosts } from "@/lib/react-query/queries";
import { GridPostList, Loader } from "@/components/shared";
import { useEffect, useState, useRef } from "react";
import FollowButton from "@/components/shared/FollowButton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Check, Search } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface StabBlockProps {
  value: string | number;
  label: string;
  clickEvent?: () => void;
}

const StatBlock = ({ value, label, clickEvent }: StabBlockProps) => (
  <div className="flex-center gap-2 cursor-pointer" onClick={clickEvent}>
    <p className="small-semibold lg:body-bold text-primary-500">{value}</p>
    <p className="small-medium lg:base-medium text-light-2">{label}</p>
  </div>
);

const Profile = () => {
  const { id } = useParams();
  const { user } = useUserContext();
  const { pathname } = useLocation();
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [isOpenFollowerList, setIsOpenFollowerList] = useState(false)
  const [isOpenFollowingList, setIsOpenFollowingList] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const { data: currentUser } = useGetUserById(id || "");
  const { data: myFollowingUser, isLoading: isMyFollowingUserLoading, refetch: refetchFollowing } = useGetCurrentUserWithFollowing(id || "");
  const { data: myFollower, isLoading: isMyFollowerLoading, refetch: refetchFollower } = useGetCurrentUserWithFollower(id || "");
  const { data: userPosts, isLoading: isUserPostLoading } = useGetUserPosts(id || "");

  //  ----->> This code are work for Showing the User Profile Picture <<-----

  // Event handler to hide the modal when clicking outside of it
  const handleOutsideClick = (event: MouseEvent) => {
    if (modalVisible && modalRef.current && event.target === modalRef.current) {
      hideModal();
    }
  };
  // Attach the event listener to the window when the component mounts
  useEffect(() => {
    window.addEventListener('click', handleOutsideClick);
    // Cleanup the event listener when the component unmounts
    return () => {
      window.removeEventListener('click', handleOutsideClick);
    };
  }, [modalVisible]);

  // Function to show the modal
  const showModal = () => {
    setModalVisible(true);
  };

  // Function to hide the modal
  const hideModal = () => {
    setModalVisible(false);
  };

  const modalRef = useRef<HTMLDivElement>(null);


  if (!currentUser)
    return (
      <div className="flex-center w-full h-full">
        <Loader />
      </div>
    );


  return (
    <div className="profile-container">
      <div className="profile-inner_container">
        <div className="flex xl:flex-row flex-col max-xl:items-center flex-1 lg:gap-10 2xl:gap-20 gap-5">
          <img
            src={
              currentUser?.imageUrl || "/assets/icons/profile-placeholder.svg"
            }
            alt="profile"
            onClick={showModal}
            className="w-28 h-28 lg:mt-10 lg:h-36 lg:w-36 rounded-full hover:cursor-pointer"
          />

          {/* <!-- The Modal --> */}
          {modalVisible && (
            <div ref={modalRef} id="myModal" className="fixed z-30 pt-[100px] left-0 top-0 w-full h-full overflow-auto bg-[rgb(0,0,0)] bg-[rgba(0,0,0,0.6)] ">

              {/* <!-- Modal content --> */}
              <div className="bg-[#000000] m-auto p-[10px] w-[20%] rounded-2xl shadow-xl shadow-[#343333] ">
                <span onClick={hideModal} className="close text-[#aaaaaa] float-right text-3xl font-bold hover:text-[#fff] hover:no-underline hover:cursor-pointer ">&times;</span>
                <img src={
                  currentUser?.imageUrl || "/assets/icons/profile-placeholder.svg"
                } alt="profile" className="rounded-2xl" />
              </div>

            </div>
          )}

          <div className="flex flex-col flex-1 justify-between md:mt-2">
            <div className="flex flex-col w-full">
              <h1 className="text-center xl:text-left h3-bold md:h1-semibold w-full">
                {currentUser?.name}
              </h1>
              <p className="small-regular md:body-medium text-light-3 text-center xl:text-left">
                @{currentUser?.username}
              </p>
            </div>

            <div className="flex gap-8 mt-5 items-center justify-center xl:justify-start flex-wrap z-20">
              <StatBlock value={userPosts?.documents?.length} label="Posts" />
              <StatBlock value={myFollower?.followers?.length} label="Followers" clickEvent={()=> setIsOpenFollowerList(true)} />
              <StatBlock value={myFollowingUser?.following?.length} label="Following" clickEvent={()=> setIsOpenFollowingList(true)} />
            </div>

            <Dialog open={isOpenFollowerList} onOpenChange={setIsOpenFollowerList}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-md w-full h-[500px] p-0 flex flex-col">
          <DialogHeader className="p-4 pb-2 border-b border-gray-700">
            <DialogTitle className="text-center text-lg font-semibold">Followers</DialogTitle>
          </DialogHeader>
          {
            myFollower?.followers?.length > 0 ? (
              <>
          <div className="p-4 pb-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 pl-10 rounded-lg"
              />
            </div>
          </div>

          <ScrollArea className="flex-1 px-4">
            <div className="space-y-3 pb-4">
              {myFollower?.followers?.map((user: any) => (
                <div key={user?._id} className="flex items-center justify-between py-2">
                  <div className="flex items-center space-x-3 pl-1">
                    <div className="relative">
                      <Avatar className="h-11 w-11 ring-2 ring-gradient-to-r from-pink-500 via-red-500 to-yellow-500 ring-offset-2 ring-offset-gray-900">
                        <AvatarImage src={user?.imageUrl || "/assets/icons/profile-placeholder.svg"} alt={user?.username} />
                        <AvatarFallback className="bg-gray-700 text-white">
                          {user?.name?.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-1">
                        <span className="font-semibold text-sm text-white truncate">{user?.username}</span>
                        {user?.isVerified && (
                          <div className="bg-blue-500 rounded-full p-0.5 flex-shrink-0">
                            <Check className="h-2.5 w-2.5 text-white" />
                          </div>
                        )}
                      </div>
                      <p className="text-gray-400 text-sm truncate">{user?.name}</p>
                    </div>
                  </div>
                  <FollowButton user={user}/>
                </div>
              ))}
            </div>
          </ScrollArea>
          </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                <p className="text-gray-400 text-sm">No Follower</p>
              </div>
            )}
        </DialogContent>
      </Dialog>

            <Dialog open={isOpenFollowingList} onOpenChange={setIsOpenFollowingList}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-md w-full h-[500px] p-0 flex flex-col">
          <DialogHeader className="p-4 pb-2 border-b border-gray-700">
            <DialogTitle className="text-center text-lg font-semibold">Following</DialogTitle>
          </DialogHeader>
          {
            myFollowingUser?.following?.length > 0 ? (
              <>
          <div className="p-4 pb-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 pl-10 rounded-lg"
              />
            </div>
          </div>

          <ScrollArea className="flex-1 px-4">
            <div className="space-y-3 pb-4">
              {myFollowingUser?.following?.map((user: any) => (
                <div key={user?._id} className="flex items-center justify-between py-2">
                  <div className="flex items-center space-x-3 pl-1">
                    <div className="relative">
                      <Avatar className="h-11 w-11 ring-2 ring-gradient-to-r from-pink-500 via-red-500 to-yellow-500 ring-offset-2 ring-offset-gray-900">
                        <AvatarImage src={user?.imageUrl || "/assets/icons/profile-placeholder.svg"} alt={user?.username} />
                        <AvatarFallback className="bg-gray-700 text-white">
                          {user?.name?.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-1">
                        <span className="font-semibold text-sm text-white truncate">{user?.username}</span>
                        {user?.isVerified && (
                          <div className="bg-blue-500 rounded-full p-0.5 flex-shrink-0">
                            <Check className="h-2.5 w-2.5 text-white" />
                          </div>
                        )}
                      </div>
                      <p className="text-gray-400 text-sm truncate">{user?.name}</p>
                    </div>
                  </div>
                  <FollowButton user={user}/>
                </div>
              ))}
            </div>
          </ScrollArea>
          </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                <p className="text-gray-400 text-sm">No Following</p>
              </div>
            )}
        </DialogContent>
      </Dialog>

            {/* <p className="small-medium md:base-medium text-center xl:text-left mt-7 max-w-screen-sm">
                {currentUser.bio}
              </p> */}
            <div className="mt-7 max-w-screen-sm">
              {currentUser?.bio?.split('\n').map((paragraph: string, index: number) => (
                <p key={index} className="small-medium md:base-medium text-center xl:text-left">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>

          <div className="flex justify-center gap-4">
            <div className={`${user.id !== currentUser._id && "hidden"}`}>
              <Link
                to={`/update-profile/${currentUser._id}`}
                className={`h-12 bg-dark-4 px-5 text-light-1 flex-center gap-2 rounded-lg ${user.id !== currentUser._id && "hidden"
                  }`}>
                <img
                  src={"/assets/icons/edit.svg"}
                  alt="edit"
                  width={20}
                  height={20}
                />
                <p className="flex whitespace-nowrap small-medium">
                  Edit Profile
                </p>
              </Link>
            </div>
            <div className={`${user.id === id && "hidden"}`}>
            <FollowButton user={currentUser}/>
              {/* <Button type="button" className="shad-button_primary px-8">
                Follow
              </Button> */}
            </div>
          </div>
        </div>
      </div>

      {currentUser._id === user.id && (
        <div className="flex max-w-5xl w-full">
          <Link
            to={`/profile/${id}`}
            className={`profile-tab rounded-l-lg ${pathname === `/profile/${id}` && "!bg-dark-3"
              }`}>
            <img
              src={"/assets/icons/posts.svg"}
              alt="posts"
              width={20}
              height={20}
            />
            Posts
          </Link>
          <Link
            to={`/profile/${id}/liked-posts`}
            className={`profile-tab rounded-r-lg ${pathname === `/profile/${id}/liked-posts` && "!bg-dark-3"
              }`}>
            <img
              src={"/assets/icons/like.svg"}
              alt="like"
              width={20}
              height={20}
            />
            Liked Posts
          </Link>
        </div>
      )}

      <Routes>
        <Route
          index
          element={<GridPostList posts={userPosts?.documents} showUser={false} />}
        />
        {currentUser._id === user.id && (
          <Route path="/liked-posts" element={<LikedPosts />} />
        )}
      </Routes>
      <Outlet />
    </div>
  );
};

export default Profile;