import {
  createNamespaceClient,
  Listing,
  MintTransactionParameters,
} from "namespace-sdk";
import { PlainBtn, TechButton } from "./TechBtn";
import { optimism } from "viem/chains";
import { useCallback, useEffect, useState } from "react";
import { Spinner } from "./Spinner";
import { debounce } from "lodash";
import { useAccount, usePublicClient, useSwitchChain, useWalletClient } from "wagmi";
import { toast } from "react-toastify";
import Link from "next/link";

const namespaceClient = createNamespaceClient({
  chainId: optimism.id,
  mintSource: "oppunks",
});

const ETH_COIN = 60;
const OP_COIN = 2147483658;

const MAX_COUNT = 469;

const getRandomPunkImage = () => {
  const randomIndex = Math.floor(Math.random() * MAX_COUNT) + 1;

  return `https://punks.namespace.ninja/punk_${randomIndex}.jpg`;
};

const oppunksListing: Listing = {
  fullName: "oppunk.eth",
  label: "oppunk",
  network: "mainnet",
  node: "0x0193fecccb6981fb38c1b799ef8809de13b65730a4b7d38ab79c3a8ffdf5a237",
  listingType: "l2",
  registryNetwork: "optimism",
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
  const [mintStep, setMintStep] = useState<MintSteps>(MintSteps.Start);
  const [searchLabel, setSearchLabel] = useState("");
  const { data: walletClient } = useWalletClient({ chainId: optimism.id });
  const publicClient = usePublicClient({chainId: optimism.id })
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
    setSearchLabel(value);

    if (value.length > 0) {
      setIndicator({ isAvailable: false, isChecking: true });
      debouncedCheckAvailable(value);
    }
  };

  const checkAvailable = async (value: string) => {
    const isAvailable = await namespaceClient.isSubnameAvailable(
      oppunksListing,
      value
    );
    setIndicator({
      isChecking: false,
      isAvailable: isAvailable,
    });
  };

  const generateAvatar = () => {
    setPunkAvatar({ ...punkAvatar, generating: true });
    setTimeout(() => {
      setPunkAvatar({ value: getRandomPunkImage(), generating: false });
    }, 3000);
  };

  const handleMint = async () => {
    if (!walletClient || !address) {
      return;
    }

    setMintState({...mintState, waitingWallet: true})
    let params: MintTransactionParameters;
    try {
      if (!chain || chain.id !== optimism.id) {
        switchChain({ chainId: optimism.id });
      }
      params = await namespaceClient.getMintTransactionParameters(
        oppunksListing,
        {
          minterAddress: address,
          subnameLabel: searchLabel,
          expiryInYears: 1,
          records: {
            texts: [
              {
                key: "avatar",
                value: punkAvatar.value,
              },
            ],
            addresses: [
              {
                address: address,
                coinType: ETH_COIN,
              },
              {
                address: address,
                coinType: OP_COIN,
              },
            ],
          },
          subnameOwner: address,
        }
      );
    } catch (err: any) {
      setMintState({...mintState, waitingWallet: false})
      if (err.details) {
        toast(err.details)
      } else if(err?.response?.data) {
        toast(err.response?.data?.message)
      }
      return;
    } 

    try {
      //@ts-ignore
      const tx = await walletClient.writeContract({
        address: params.contractAddress,
        value: params.value,
        function: params.functionName,
        args: params.args,
        abi: params.abi,
      });
      setMintStep(MintSteps.PendingTx)
      setMintState({waitingWallet: false, waitingTx: true, txHash: tx})
      setTimeout(() => {
        setMintStep(MintSteps.Success)
      }, 10000)

    } catch (err: any) {
      setMintStep(MintSteps.Start)
      const deniedErr =
        err.details.includes("User rejected the request") ||
        err.details.includes("User denied transaction signature");
      if (!deniedErr) {
        toast(err.details);
      }
    } finally {
      setMintState({...mintState, waitingTx: false, waitingWallet: false})
    }
  };

  const debouncedCheckAvailable = useCallback(
    debounce((label: string) => checkAvailable(label), 300),
    []
  );

  const mintBtnDisabled =
    searchLabel.length === 0 || indicator.isChecking || !indicator.isAvailable;
  const isTaken =
    searchLabel.length > 0 && !indicator.isChecking && !indicator.isAvailable;

  return (
    <>
      <div className="mint-form d-flex flex-column justify-content-end p-4">
        <div className="form-header mb-3">
          <h1>OpPunk</h1>
          <p className="subtext">GET YOUR OP PUNK</p>
        </div>
        <div className="form-tech-container">
          {mintStep === MintSteps.Start && (
            <>
              <div className="d-flex flex-column align-items-center">
                <div className="tech-avatar-cont mb-3 d-flex align-items-center justify-content-center m-auto">
                  {!punkAvatar.generating && (
                    <img src={punkAvatar.value} width={150} height={150}></img>
                  )}
                  {punkAvatar.generating && <Spinner size="big" />}
                </div>
                <p
                  className={`generate-txt ${
                    punkAvatar.generating ? "disabled" : ""
                  }`}
                  onClick={
                    punkAvatar.generating ? undefined : () => generateAvatar()
                  }
                >
                  ReGenerate_
                </p>
              </div>
              <p className="text-center">
                <span style={{ color: "white" }}>
                  {searchLabel.length ? searchLabel : "{name}"}
                </span>
                .oppunk.eth
              </p>
              <div className="tech-input-container">
                <input
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Your name here...."
                  className="tech-input"
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
            <TransactionPending hash="0x0" />
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
    <div className="d-flex flex-column align-items-center">
      <p>Punk_</p>
      <p>{name}</p>
      <p>Created succcessfully!</p>
      <img src={avatar} width={150}></img>
      <Link href={"/punks?selected=" + name}>
        <PlainBtn>Check</PlainBtn>
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
