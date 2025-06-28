import { GridPostList, Loader } from "../../components/shared";
import { useGetCurrentUser, useGetRecentPosts } from "../../lib/react-query/queries";

const LikedPosts = () => {
  const { data: currentUser } = useGetCurrentUser();
  const { data: posts, isLoading: isPostLoading, isError: isErrorPosts } = useGetRecentPosts();
  const likedPosts = posts?.documents?.filter((post: any) => post.likes.some((user: any) => user._id === currentUser._id));

  if (!currentUser)
    return (
      <div className="flex-center w-full h-full">
        <Loader />
      </div>
    );

  return (
    <>
      {/* {likedPosts?.length === 0 && (
        <p className="text-light-4">No liked posts</p>
      )} */}

      <GridPostList posts={likedPosts} showStats={false} />
    </>
  );
};

export default LikedPosts;