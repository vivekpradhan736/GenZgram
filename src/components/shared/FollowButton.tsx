import { Models } from "appwrite";
import { Button } from "../ui"
import { useFollowUser, useGetFollowingByUserId, useUnfollowUser } from "@/lib/react-query/queries";
import { Loader } from ".";
import { useUserContext } from "@/context/AuthContext";
import { useState } from "react";

type FollowButtonProps = {
  user: Models.Document;
};

const FollowButton = ({ user }: FollowButtonProps) => {
  const [followButtonClicked, setFollowButtonClicked] = useState(false);
  const [unFollowButtonClicked, setUnFollowButtonClicked] = useState(false);
  const { user:currentUser } = useUserContext();

  const { mutate: followUser, isPending: followPending  } = useFollowUser();
  const { mutate: unfollowUser, isPending: unFollowPending } = useUnfollowUser();

  const { data: following, isLoading: isFollowingLoading, isError: isErrorFollowing, refetch: refetchFollowing } = useGetFollowingByUserId(currentUser.id);

  const isFollowing = following?.some((oneFollowing: any) => oneFollowing?.toUsers?._id === user?._id) || false;

  
  const handleUnFollow = () => {
    if (!unFollowButtonClicked) {
      setFollowButtonClicked(false);
      unfollowUser({ userId: user._id, currentUserId: currentUser.id });
      refetchFollowing()
      setUnFollowButtonClicked(true);
    }
  };

  const handleFollow = () => {
    if (!followButtonClicked) {
      setUnFollowButtonClicked(false);
      followUser({ userId: user._id, currentUserId: currentUser.id });
      refetchFollowing()
      setFollowButtonClicked(true);
    }
  };

  return (
    <>
    {
      isFollowing ? (
        <Button type="button" size="sm" className="shad-button_primary px-5" onClick={handleUnFollow} disabled={unFollowButtonClicked} >
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
      ) : (
        <Button type="button" size="sm" className="shad-button_primary px-5" onClick={handleFollow} disabled={followButtonClicked} >
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
    }
    </>
  )
}

export default FollowButton
