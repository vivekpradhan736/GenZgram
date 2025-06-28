import { useToast } from "../../components/ui/use-toast";
import { Loader, UserCard } from "../../components/shared";
import { useGetUsers } from "../../lib/react-query/queries";
import { useUserContext } from "@/context/AuthContext";

const AllUsers = () => {
  const { toast } = useToast();

  const { data: creators, isLoading, isError: isErrorCreators } = useGetUsers();
  const { user } = useUserContext();

  if (isErrorCreators) {
    toast({ title: "Something went wrong." });
    
    return;
  }

  return (
    <div className="common-container">
      <div className="user-container">
        <h2 className="h3-bold md:h2-bold text-left w-full">All Users</h2>
        {isLoading && !creators ? (
          <Loader />
        ) : (
          <ul className="user-grid">
            {creators?.documents.map((creator) => 
              user.id === creator._id ? null : (
              <li key={creator?._id} className="flex-1 min-w-[200px] w-full  ">
                <UserCard user={creator} />
              </li>
              )
            )}
          </ul>
        )}
      </div>
    </div>
  );
};

export default AllUsers;