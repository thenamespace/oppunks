import { createNamespaceClient, Listing } from "namespace-sdk";
import { PlainBtn, TechButton } from "./TechBtn";
import { optimism } from "viem/chains";
import { useCallback, useEffect, useState } from "react";
import { Spinner } from "./Spinner";
import { debounce } from "lodash";
import { useAccount, useSwitchChain, useWalletClient } from "wagmi";

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

export const MintForm = () => {
  const [punkAvatar, setPunkAvatar] = useState<{
    generating: boolean;
    value: string;
  }>({
    generating: true,
    value: getRandomPunkImage(),
  });
  const [searchLabel, setSearchLabel] = useState("");
  const { data: walletClient } = useWalletClient({ chainId: optimism.id });
  const { switchChainAsync } = useSwitchChain();
  const { address, chain } = useAccount();
  const [indicator, setIndicator] = useState<{
    isChecking: boolean;
    isAvailable: boolean;
  }>({
    isChecking: false,
    isAvailable: false,
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

    if (!chain || chain.id !== optimism.id) {
      switchChainAsync({ chainId: optimism.id });
    }

    const params = await namespaceClient.getMintTransactionParameters(
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

    //@ts-ignore
    const tx = await walletClient.writeContract({
      address: params.contractAddress,
      value: params.value,
      function: params.functionName,
      args: params.args,
      abi: params.abi,
    });
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
            {isTaken && <p className="err-message m-0">Already Registered_</p>}
          </div>
        </div>
      </div>
    </>
  );
};
