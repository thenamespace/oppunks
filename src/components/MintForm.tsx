import { createNamespaceClient, Listing } from "namespace-sdk";
import { TechButton } from "./TechBtn";
import { optimism } from "viem/chains";
import { useCallback, useState } from "react";
import { Spinner } from "./Spinner";
import { debounce } from "lodash";
import { useAccount, useSwitchChain, useWalletClient } from "wagmi";

const namespaceClient = createNamespaceClient({
  chainId: optimism.id,
  mintSource: "oppunks",
});

const ETH_COIN = 60;
const OP_COIN = 2147483658;

const oppunksListing: Listing = {
  fullName: "oppunk.eth",
  label: "oppunk",
  network: "mainnet",
  node: "0x0193fecccb6981fb38c1b799ef8809de13b65730a4b7d38ab79c3a8ffdf5a237",
  listingType: "l2",
  registryNetwork: "optimism",
};

const testAvatar =
  "https://cdn.openart.ai/uploads/image_RVj0fNCw_1731704971746_512.webp";

export const MintForm = () => {
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
              value: testAvatar,
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
        abi: params.abi
    })

    console.log(tx, "TRANSACTION")

  };

  const debouncedCheckAvailable = useCallback(
    debounce((label: string) => checkAvailable(label), 300),
    []
  );

  const mintBtnDisabled =
    searchLabel.length === 0 || indicator.isChecking || !indicator.isAvailable;
  const isTaken = searchLabel.length > 0 && !indicator.isChecking && !indicator.isAvailable;

  return (
    <>
      <div className="form-tech-container mint-form d-flex flex-column justify-content-end p-4">
        <div className="d-flex">
          <div className="tech-avatar-cont mb-3 d-flex justify-content-center m-auto">
            <img src={testAvatar} width={150}></img>
          </div>
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
    </>
  );
};