import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  text?: string;
  disabled?: boolean
}

export const TechButton = forwardRef((props: ButtonProps, ref) => {
  //@ts-ignore

  const { disabled, onClick } = props;
  const onClickFn = disabled ? undefined : onClick;

  return (
    <button className={`cybr-btn ${props.className || ""} ${disabled ? "disabled" : ""} tech-small`} onClick={onClickFn}>
      {props.text}
      <span aria-hidden>_</span>
      <span aria-hidden className="cybr-btn__glitch">
        {props.text}
      </span>
    </button>
  );
});

export const PlainBtn = (props: ButtonProps) => {

  const { disabled, onClick } = props;
  const onClickFn = disabled ? undefined : onClick;

  return <button {...props} onClick={onClickFn} className={`btn-plain ${props.disabled ? "disabled" : ""} ${props.className || ""}`}>
    {props.children}
  </button>
}
