import {
  createMintClient,
  MintTransactionResponse,
} from "@namespacesdk/mint-manager"
import { PlainBtn, TechButton } from "./TechBtn";
import { optimism } from "viem/chains";
import { useCallback, useEffect, useState } from "react";
import { Spinner } from "./Spinner";
import { debounce } from "lodash";
import {
  useAccount,
  usePublicClient,
  useSwitchChain,
  useWalletClient,
} from "wagmi";
import { toast } from "react-toastify";
import Link from "next/link";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { SideModal } from "./SideModal";
import { TbAlertSquare } from "react-icons/tb";
import { normalise } from "@ensdomains/ensjs/utils";

const ENS_NAME = "oppunk.eth"

const mintClient = createMintClient({
  mintSource: "oppunks",
  cursomRpcUrls: {
    [optimism.id]: "https://opt-mainnet.g.alchemy.com/v2/p40cPshu1Od-btzLdd7JzAAFSiS93AfX"
  }
})


const ETH_COIN = 60;
const OP_COIN = 2147483658;

const MAX_COUNT = 737;

const getRandomPunkImage = () => {
  const randomIndex = Math.floor(Math.random() * MAX_COUNT) + 1;
  return `https://punks.namespace.ninja/punk_${randomIndex}.jpg`;
};


enum MintSteps {
  Start = 0,
  PendingTx = 1,
  Success = 2,
}

export const MintForm = () => {
  const [punkAvatar, setPunkAvatar] = useState<{
    generating: boolean;
    value: string;
  }>({
    generating: true,
    value: getRandomPunkImage(),
  });
  const { openConnectModal } = useConnectModal()
  const [mintStep, setMintStep] = useState<MintSteps>(MintSteps.Start);
  const [searchLabel, setSearchLabel] = useState("");
  const [showCostModal, setShowCostModal] = useState(false);
  const { data: walletClient } = useWalletClient({ chainId: optimism.id });
  const publicClient = usePublicClient({ chainId: optimism.id });
  const { switchChain } = useSwitchChain();
  const { address, chain } = useAccount();
  const [indicator, setIndicator] = useState<{
    isChecking: boolean;
    isAvailable: boolean;
  }>({
    isChecking: false,
    isAvailable: false,
  });
  const [mintState, setMintState] = useState<{
    waitingWallet: boolean;
    waitingTx: boolean;
    txHash: string;
  }>({
    txHash: "",
    waitingTx: false,
    waitingWallet: false,
  });

  useEffect(() => {
    generateAvatar();
  }, []);

  const handleSearch = async (value: string) => {
 
    const _value = value.toLocaleLowerCase();

    if (_value.includes(".")) {
      return;
    }

    try {
      normalise(_value);
    } catch (err) {
      return;
    }
    setSearchLabel(_value);

    if (_value.length > 0) {
      setIndicator({ isAvailable: false, isChecking: true });
      debouncedCheckAvailable(_value);
    }
  };

  const checkAvailable = async (value: string) => {
    const isAvailable = await mintClient.isL2SubnameAvailable(`${value}.${ENS_NAME}`, optimism.id);
    setIndicator({
      isChecking: false,
      isAvailable: isAvailable,
    });
  };

  const generateAvatar = () => {
    setPunkAvatar({ ...punkAvatar, generating: true });
    setTimeout(() => {
      setPunkAvatar({ value: getRandomPunkImage(), generating: false });
    }, 2000);
  };

  const handleMint = async () => {
    if (!walletClient || !address) {
      openConnectModal?.();
      return;
    }

    setMintState({ ...mintState, waitingWallet: true });
    let params: MintTransactionResponse
    let mintRequest: any
    try {
      if (!chain || chain.id !== optimism.id) {
        switchChain({ chainId: optimism.id });
      }

      params  = await mintClient.getMintTransactionParameters({
        label: searchLabel,
        minterAddress: address!,
        parentName: ENS_NAME,
        expiryInYears: 1,
        owner: address,
        records: {
          addresses: [
            {
              coin: ETH_COIN,
              value: address!
            },
            {
              coin: OP_COIN,
              value: address!
            }
          ],
          texts: [
            {
              key: "avatar",
              value: punkAvatar.value
            }
          ]
        }
      })

      const { request } = await publicClient!.simulateContract({
        abi: params.abi,
        address: params.contractAddress,
        functionName: params.functionName,
        args: params.args,
        value: params.value,
        account: address!
      })

      mintRequest = request;
  
    } catch (err: any) {
      setMintState({ ...mintState, waitingWallet: false });
      if (err.details && err.details.includes) {
        const deniedErr =
          err.details.includes("User rejected the request") ||
          err.details.includes("User denied transaction signature");
          const noFundsErr = err.details.includes("insufficient funds for gas")
        if (!deniedErr && !noFundsErr) {
          toast(err.details, { className: "tech-toasty", type: "error"});
        }

        if (noFundsErr) {
          toast("Insufficient balance", { className: "tech-toasty", type:"error" });
        }

      } else if (err.response && err.response?.data?.message) {
        toast(err.response?.data?.message, { className: "tech-toasty", type: "error"});
      } else {
        toast("Unexpected error happened :(", { className: "tech-toasty", type: "error"})
      }
      console.error(err, "HERE!!");
      return;
    }

    try {
      //@ts-ignore
      const tx = await walletClient!.writeContract(mintRequest);
      setMintStep(MintSteps.PendingTx);
      setMintState({ waitingWallet: false, waitingTx: true, txHash: tx });
      setTimeout(() => {
        publicClient?.waitForTransactionReceipt({hash:tx}).then(res => {
          setMintStep(MintSteps.Success);
        })
      }, 8000);
    } catch (err: any) {
      setMintStep(MintSteps.Start);
      console.error(err);
      if (err.details && err.details.includes) {
        const deniedErr =
          err.details.includes("User rejected the request") ||
          err.details.includes("User denied transaction signature");
        if (!deniedErr) {
          toast(err.details, { className: "tech-toasty", type: "error"});
        }
      } else {
        toast("Unexpected error happened :(", { className: "tech-toasty", type: "error"})
      }
    } finally {
      setMintState({ ...mintState, waitingTx: false, waitingWallet: false });
    }
  };

  const debouncedCheckAvailable = useCallback(
    debounce((label: string) => checkAvailable(label), 300),
    []
  );

  const mintBtnDisabled =
    searchLabel.length === 0 || indicator.isChecking || !indicator.isAvailable || mintState.waitingTx || mintState.waitingWallet;
  const isTaken =
    searchLabel.length > 0 && !indicator.isChecking && !indicator.isAvailable;

  return (
    <>
      <div className="mint-form d-flex flex-column justify-content-end p-4">
        <SideModal open={showCostModal} onClose={() => setShowCostModal(false)}>
          <div className="cost-modal">
            <p style={{fontSize:24, color:"white"}} className="text-center">Subname Cost</p>
            <div className="d-flex price justify-content-between align-items-center w-100" style={{color:"white"}}>
               <p>1 Characters</p>
               <p>50$</p>
            </div>
            <div className="d-flex price justify-content-between align-items-center w-100" style={{color:"white"}}>
               <p>2 Characters</p>
               <p>20$</p>
            </div>
            <div className="d-flex price justify-content-between align-items-center w-100" style={{color:"white"}}>
               <p>3 Characters</p>
               <p>5$</p>
            </div>
            <div className="d-flex price justify-content-between align-items-center w-100" style={{color:"white"}}>
               <p>4+ Characters</p>
               <p>Free</p>
            </div>
          </div>
        </SideModal>
        <div className="form-header mb-3">
          <h1>OpPunk</h1>
          <p className="subtext">GET YOUR OP PUNK</p>
        </div>
        <div className="form-tech-container">
          {mintStep === MintSteps.Start && (
            <>
              <div className="d-flex flex-column align-items-center">
                <div className="cost-info d-flex align-items-center" onClick={() => setShowCostModal(true)}>
                  <TbAlertSquare className="me-1"/>
                  <div>Subname cost</div>
                </div>
                <div className="tech-avatar-cont mb-3 d-flex align-items-center justify-content-center m-auto">
                  {!punkAvatar.generating && (
                    <img src={punkAvatar.value} width={150} height={150}></img>
                  )}
                  {punkAvatar.generating && <Spinner size="big" />}
                </div>
                <p
                  className={`generate-txt mb-1 ${
                    punkAvatar.generating ? "disabled" : ""
                  }`}
                  onClick={
                    punkAvatar.generating ? undefined : () => generateAvatar()
                  }
                >
                  Generate_
                </p>
              </div>
              <p className="text-center" style={{fontSize: 18}}>
                <span style={{ color: "white", fontSize: 18 }}>
                  {searchLabel.length ? searchLabel : "{name}"}
                </span>
                .oppunk.eth
              </p>
              <div className="tech-input-container">
                <input
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Your name here...."
                  className="tech-input"
                  value={searchLabel}
                ></input>
                <div className="loader-cont">
                  {indicator.isChecking && <Spinner />}
                </div>
              </div>
              <div>
                <TechButton
                  disabled={mintBtnDisabled}
                  text={"register"}
                  className="mt-2 w-100"
                  onClick={() => handleMint()}
                >
                  Register
                </TechButton>
              </div>
              <div className="err-container mt-2">
                {isTaken && (
                  <p className="err-message m-0">Already Registered_</p>
                )}
              </div>
            </>
          )}
          {mintStep === MintSteps.PendingTx && (
            <TransactionPending hash={mintState.txHash} />
          )}
          {mintStep === MintSteps.Success && (
            <SuccessScreen
              avatar={punkAvatar.value}
              name={`${searchLabel}.oppunk.eth`}
            />
          )}
        </div>
      </div>
    </>
  );
};

export const SuccessScreen = ({
  avatar,
  name,
}: {
  avatar: string;
  name: string;
}) => {
  return (
    <div className="d-flex flex-column align-items-center success-screen">
      <p className="mb-1">Registration succesfull</p>
      <p style={{ fontSize: 18, color: "white" }}>{name}</p>
      <div className="load-border">
        <img className="avatar" src={avatar} width={150}></img>
      </div>
      <Link
        className="mt-3"
        href={{ pathname: "/punks", query: { selected: name } }}
      >
        <PlainBtn>Confirm_</PlainBtn>
      </Link>
    </div>
  );
};

export const TransactionPending = ({ hash }: { hash: string }) => {
  return (
    <div
      className="d-flex flex-column align-items-center"
      style={{ height: 200 }}
    >
      <Spinner size="big" />
      <p className="mt-3 mb-0" style={{ fontSize: "22px" }}>
        Generating a Punk_
      </p>
      <a
        href={`https://optimistic.etherscan.io/tx/${hash}`}
        target="_blank"
        style={{ color: "rgb(255,255,255,0.8)", cursor: "pointer" }}
      >
        Transaction
      </a>
    </div>
  );
};
