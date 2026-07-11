import { useContext } from "react";
import { ModalContext } from "@/app/providers";

const useConnect = () => {
  const ctx = useContext(ModalContext);
  return {
    open: ctx?.connectOpen ?? false,
    openConnect: (): void => ctx?.setConnectOpen(true),
    closeConnect: (): void => ctx?.setConnectOpen(false),
  };
};

export default useConnect;
