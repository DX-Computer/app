import { useContext } from "react";
import { ModalContext } from "@/app/providers";

const useWalkthrough = () => {
  const ctx = useContext(ModalContext);
  return {
    open: ctx?.walkthrough ?? false,
    openWalkthrough: (): void => ctx?.setWalkthrough(true),
    closeWalkthrough: (): void => ctx?.setWalkthrough(false),
  };
};

export default useWalkthrough;
