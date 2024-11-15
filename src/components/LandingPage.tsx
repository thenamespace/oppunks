import Image from "next/image";
import bgCity from "../assets/background.png";
import leftGliphs from "../assets/left-glips.png";
import rightGliphs from "../assets/right-glips.png";
import { TechButton } from "./TechBtn";
import { useAccount } from "wagmi";
import { ConnectButton, useConnectModal } from "@rainbow-me/rainbowkit";
import { ElectricHeader } from "./ElectricHeader";
import topBorder from "../assets/top-border.png";
import botBorder from "../assets/bot-border.png";
import { useEffect, useState } from "react";
import OpenAI from "openai";
import { UserProfile } from "./UserProfile";
import { MintForm } from "./MintForm";
import { Spinner } from "./Spinner";


export const LandingPage = () => {
  const { address, isConnected } = useAccount();
  const { openConnectModal, connectModalOpen } = useConnectModal();

  useEffect(() => {
    
  }, []);

  return (
    <div
      className="landing-page"
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
          backgroundRepeat: "no-repeat"
        }}
      ></div>
         <div
        className="right-gliph"
        style={{
          background: `url(${rightGliphs.src})`,
          backgroundSize: "contain",
          backgroundPosition: "right",
          backgroundRepeat: "no-repeat"
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
        <div className="d-flex justify-content-between">
          <p className="mb-0" style={{fontSize:20}}>OP_PUNK_</p>
          {!isConnected ? <TechButton
            onClick={() => openConnectModal?.()}
            text="Connect"
          ></TechButton>: <UserProfile/>}
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
          <p style={{margin:0, opacity:"0.4", fontSize:11, letterSpacing:"0px"}}>Created by Namespace. Optimism Network</p>
        </div>
      </div>
      <div className="landing-container">
        <div className="page-form d-flex flex-column justify-content-center">
          <div className="form-header mb-3">
            <h1>OpPunk</h1>
            <p className="subtext">GET YOUR OP PUNK</p>
          </div>
         <MintForm/>
        </div>
      </div>
    </div>
  );
};
