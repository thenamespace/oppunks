import { ReactElement, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { PlainBtn } from "./TechBtn";

export const SideModal = ({
  open,
  onClose,
  children
}: {
  open: boolean;
  onClose?: () => void;
  children?: ReactElement
}) => {
    const [isClient, setIsClient] = useState(false);


    useEffect(() => {
      setIsClient(true);
    }, []);
  
    if (!isClient || !open) {
      return null; // Render nothing on the server side
    }

    console.log(children, "CHILDREN!!")

    return createPortal(
      <div className="side-modal-cont">
        <div className="side-modal">
       <div className="btn-container">
         <PlainBtn onClick={() => onClose?.()}>Close</PlainBtn>
       </div>
      </div>
      <div className="content">
        {children}
      </div>
         <div className="backdrop" onClick={() => {
         onClose?.();
      }}>
      </div>
        </div>,
      document.body // This will only run on the client side
    );
};
