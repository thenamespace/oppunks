import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    text: string
}

export const TechButton = forwardRef(
  (props: ButtonProps, ref) => {
    //@ts-ignore
    return (
      <button className="cybr-btn disabled tech-small">
        {props.text}<span aria-hidden>_</span>
        <span aria-hidden className="cybr-btn__glitch">
          {props.text}
        </span>
      </button>
    );
  }
);
