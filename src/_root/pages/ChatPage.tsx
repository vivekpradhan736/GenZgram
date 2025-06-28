import { useEffect, useRef , useState } from "react";
import MyChats from "../../components/shared/MyChats.tsx";
import { useUserContext } from "@/context/AuthContext.tsx";
import Chatbox from "@/components/shared/Chatbox.tsx";

type MyChatsHandle = {
  refetchChats: () => void;
};

const Chatpage = () => {
  const child2Ref = useRef<MyChatsHandle>(null);
  const [fetchAgain, setFetchAgain] = useState(false);
  const { user } = useUserContext();

  const triggerChild2Function = () => {
    child2Ref?.current?.refetchChats();
  };

  useEffect(() => {
    localStorage.removeItem("selectedChat");
  }, [])
  

  return (
    <div style={{ width: "100%" }} >
      <div className="flex w-full h-[91.5vh] p-2">
        {user && <MyChats fetchAgain={fetchAgain} ref={child2Ref} />}
        {user && (
          <Chatbox fetchAgain={fetchAgain} setFetchAgain={setFetchAgain} triggerChild2Function={triggerChild2Function} />
        )}
      </div>
    </div>
  );
};

export default Chatpage;