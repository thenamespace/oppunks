import bgCity from "../assets/background.jpg";
import leftGliphs from "../assets/left-glips.png";
import rightGliphs from "../assets/right-glips.png";
import { TechButton } from "./TechBtn";
import topBorder from "../assets/top-border.png";
import botBorder from "../assets/bot-border.png";
import { UserProfile } from "./UserProfile";
import { useAccount } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { PropsWithChildren } from "react";
import Link from "next/link";
import opLogo from "../assets/chains/op.svg";
import Image from "next/image";

export const TechContainerBg = (props: PropsWithChildren) => {
  const { isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();

  return (
    <div
      className="tech-container"
      style={{
        background: `url(${bgCity.src})`,
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div
        className="left-gliph"
        style={{
          background: `url(${leftGliphs.src})`,
          backgroundSize: "contain",
          backgroundPosition: "start",
          backgroundRepeat: "no-repeat",
        }}
      ></div>
      <div
        className="right-gliph"
        style={{
          background: `url(${rightGliphs.src})`,
          backgroundSize: "contain",
          backgroundPosition: "right",
          backgroundRepeat: "no-repeat",
        }}
      ></div>
      <div
        className="top-nav"
        style={{
          background: `url(${topBorder.src})`,
          backgroundSize: "100%",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "bottom",
        }}
      >
        <div className="row">
          <div className="col-lg-6 col-sm-12 logo-col">
            <Link href="/" className="d-flex align-items-center">
              <Image className="me-2" alt="Optimism" width={25} src={opLogo}></Image>
              <p
                className="mb-0"
                style={{ fontSize: 20, textDecoration: "none" }}
              >
                OP_PUNK_
              </p>
            </Link>
          </div>
          <div className="col-lg-6 col-sm-12 nav-col">
            {!isConnected ? (
              <TechButton
                onClick={() => openConnectModal?.()}
                text="Connect"
              ></TechButton>
            ) : (
              <UserProfile />
            )}
          </div>
        </div>
      </div>
      <div
        className="bot-nav"
        style={{
          background: `url(${botBorder.src})`,
          backgroundSize: "100%",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "top",
        }}
      >
        <div className="d-flex text-center justify-content-center">
          <p
            style={{
              margin: 0,
              opacity: "0.4",
              fontSize: 11,
              letterSpacing: "0px",
              zIndex: 99,
              position: "relative"
            }}
          >
            Created by Namespace. Optimism Network
          </p>
        </div>
      </div>
      <div className="landing-container">{props.children}</div>
    </div>
  );
};
