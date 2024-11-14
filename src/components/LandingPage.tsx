import Image from "next/image";
import bgCity from "../assets/background.png";
import formBg from "../assets/form-bg.png";
import formShield from "../assets/form-shield.png";
import { TechButton } from "./TechBtn";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ElectricHeader } from "./ElectricHeader";
import topBorder from "../assets/top-border.png";
import botBorder from "../assets/bot-border.png";

export const LandingPage = () => {
  const { address } = useAccount();
  
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
        className="top-nav"
        style={{
          background: `url(${topBorder.src})`,
          backgroundSize: "100%",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "bottom",
        }}
      >
        <div className="d-flex justify-content-between">
        <p>Namespace</p>
        <TechButton text="Connect"></TechButton>
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
        <div className="d-flex justify-content-between">
        <p>Namespace</p>

        </div>
      </div>
      <div className="landing-container">
        <div className="page-form">
          <div className="form-header mb-3">
            <h1>OpPunk</h1>
            <p className="subtext">GET YOUR OP PUNK</p>
          </div>
          <div className="form-tech-container">
            <div
              style={{
                background: `url(${formBg.src})`,
                backgroundSize: "100% 100%",
              }}
              className="form-tech-content d-flex flex-column justify-content-end"
            >
              <div className="p-3">
                <div className="d-flex">
                  <div className="tech-avatar-cont mb-3 d-flex justify-content-center m-auto"></div>
                </div>
                <input
                  placeholder="Your name here...."
                  className="tech-input"
                ></input>
                <TechButton text={"register"} className="mt-2">
                  Register
                </TechButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
