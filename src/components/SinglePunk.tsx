import { useEffect, useMemo, useState } from "react";
import { PunkSubname } from "./Models";
import { KnownAddresses, WalletAddress } from "./records/Addresses";
import { getCoderByCoinType } from "@ensdomains/address-encoder";
import {
  encodeFunctionData,
  Hash,
  isAddress,
  namehash,
  parseAbi,
  toBytes,
  toHex,
  hexToBytes,
} from "viem";
import { PlainBtn } from "./TechBtn";
import chainIcon from "../assets/chains/circle.svg";
import { KnownText, KnownTexts } from "./records/TextRecords";
import { CgProfile } from "react-icons/cg";
import { IoShareSocialSharp } from "react-icons/io5";
import { getL2ChainContracts } from "namespace-sdk";
import {
  useAccount,
  usePublicClient,
  useSwitchChain,
  useWalletClient,
} from "wagmi";
import { optimism } from "viem/chains";
import { validate as isValidBtcAddress } from "bitcoin-address-validation";

const resolverAbi = parseAbi([
  "function setText(bytes32 node, string key, string value) external",
  "function setAddr(bytes32 node, uint256 coinType, bytes value) external",
]);
const opResolver = getL2ChainContracts("optimism").resolver;

export const SinglePunk = ({
  punk,
  onUpdate,
}: {
  punk: PunkSubname;
  onUpdate: () => void;
}) => {
  const publicClient = usePublicClient({ chainId: optimism.id });
  const { data: walletClient } = useWalletClient({ chainId: optimism.id });
  const { switchChain } = useSwitchChain();
  const { chain, address } = useAccount();

  const [selectedCoin, setSelectedCoin] = useState(60);
  const [selectedText, setSelectedText] = useState("");
  const [addresseValues, setAddressValues] = useState<Record<number, string>>(
    {}
  );

  const [textValues, setTextValues] = useState<Record<string, string>>({});
  const [currentNav, setCurrentNav] = useState<"text" | "addr">("addr");

  const hasAddress = (coin: number) => {
    const addrs = punk.addresses || {};
    return addrs[`${coin}`] !== undefined;
  };

  const isSelected = (coin: number) => {
    return selectedCoin === coin;
  };

  useEffect(() => {
    const _texts: Record<string, string> = {};
    const _addresses: Record<number, string> = {};

    Object.keys(punk.addresses || {}).forEach((coinType) => {
      const _coin = parseInt(coinType);
      const coder = getCoderByCoinType(_coin);
      if (coder) {
        _addresses[parseInt(coinType)] = coder.encode(hexToBytes(punk.addresses[coinType] as any))
      }
    });
    Object.keys(punk.texts || {}).forEach((textKey) => {
      _texts[textKey] = punk.texts[textKey];
    });

    setAddressValues(_addresses);
    setTextValues(_texts);
  }, [punk]);

  const addressMetadata: WalletAddress = useMemo(() => {
    return (
      KnownAddresses[selectedCoin] || {
        coinType: -1,
        icon: chainIcon.src,
        label: "unk",
        name: "Unknown",
      }
    );
  }, [selectedCoin]);

  const textMetadata: KnownText = useMemo(() => {
    const defaultt: KnownText = {
      key: "",
      label: "",
      type: "profile",
      disabled: false,
      placeholder: "set text value...",
    };

    if (!selectedText || !KnownTexts[selectedText]) {
      return defaultt;
    }

    return KnownTexts[selectedText];
  }, [selectedText]);

  const isAddressSet = (coin: number) => {
    return addresseValues[coin] && _isValidAddress(coin, addresseValues[coin]);
  };

  const isTextSet = (key: string) => {
    return textValues[key] && textValues[key].length > 0;
  };

  const _isValidAddress = (coin: number, value: string) => {
    if (coin === 0) {
      return isValidBtcAddress(value);
    }

    return isAddress(value);
  };

  const isValidAddress = useMemo(() => {
    const currentValue = addresseValues[selectedCoin];
    if (!currentValue || currentValue.length === 0) {
      return false;
    }

    return _isValidAddress(selectedCoin, currentValue);
  }, [selectedCoin, addresseValues]);

  const handleAddressChange = (selectedCoin: number, value: string) => {
    const _addrs = { ...addresseValues };
    _addrs[selectedCoin] = value;
    setAddressValues(_addrs);
  };

  const handleTextChange = (_selectedText: string, value: string) => {
    const _txts = { ...textValues };
    _txts[_selectedText] = value;
    setTextValues(_txts);
  };

  const getRecordsToUpdate = () => {
    const textsToChange: { key: string; value: string }[] = [];
    const addrsToChange: { coin: number; value: string }[] = [];

    Object.keys(textValues).forEach((txt) => {
      // if text is not present in exsiting texts, we all it to a transaction
      let shouldUpdate = false;
      const textValue = textValues[txt];
      const existingTexts: Record<string, string> = punk.texts;
      if (existingTexts[txt] && existingTexts[txt].length > 0) {
        if (textValue !== existingTexts[txt]) {
          shouldUpdate = true;
        }
      } else {
        shouldUpdate = true;
      }



      if (shouldUpdate) {
        textsToChange.push({ key: txt, value: textValue });
      }
    });

    Object.keys(addresseValues).forEach((coinType) => {
      const coin = parseInt(coinType);
      let shouldUpdate = false;
      const currentAddrValue = addresseValues[coin];
      const existingAddresses = punk.addresses;
      const addrCoder = getCoderByCoinType(coin);

      if (_isValidAddress(coin, currentAddrValue)) {
        if (
          existingAddresses[`${coinType}`] &&
          existingAddresses[`${coinType}`].length > 0
        ) {
          if (addrCoder) {
            const decodedValue = toHex(
              addrCoder.decode(existingAddresses[coinType])
            );
            
            if (
              decodedValue.toLocaleLowerCase() !==
              currentAddrValue.toLocaleLowerCase()
            ) {
              shouldUpdate = true;
            }
          }
        } else {
          shouldUpdate = true;
        }

        if (shouldUpdate) {
          addrsToChange.push({ coin, value: currentAddrValue });
        }
      }
    });
    return { texts: textsToChange, addrs: addrsToChange };
  };

  const hasRecordUpdates = useMemo(() => {
    const { texts, addrs } = getRecordsToUpdate();

    return texts.length > 0 || addrs.length > 0;
  }, [textValues, addresseValues]);

  const toResolverData = () => {
    const data: Hash[] = [];

    const nameNode = namehash(punk.name);
    const { texts, addrs } = getRecordsToUpdate();

    texts.forEach((txt) => {
      data.push(
        encodeFunctionData({
          abi: resolverAbi,
          args: [nameNode, txt.key, txt.value],
          functionName: "setText",
        })
      );
    });

    addrs.forEach((addr) => {
      const coder = getCoderByCoinType(addr.coin);
      if (coder) {
        let value = "0x";
        if (addr.value.length > 0) {
          const decodedAddr = coder.decode(addr.value);
          value = toHex(decodedAddr);
        }

        const encodedFunc = encodeFunctionData({
          functionName: "setAddr",
          abi: resolverAbi,
          args: [nameNode, BigInt(addr.coin), value as any],
        });
        data.push(encodedFunc)
      }
    });
    return data;
  };

  const handleUpdate = async () => {
    if (chain?.id !== optimism.id) {
      switchChain({ chainId: optimism.id });
    }

    const resolverData = toResolverData();

    const resp = await publicClient!!.simulateContract({
      abi: parseAbi(["function multicall(bytes[] data) external"]),
      address: opResolver,
      functionName: "multicall",
      args: [resolverData],
      account: address!!,
    });

    const tx = await walletClient!!.writeContract(resp.request);
    console.log(tx);
  };

  return (
    <div className="single-punk">
      <div className="d-flex align-items-center flex-column">
        <img className="avatar" src={punk.texts["avatar"]}></img>
        <p className="subtext mt-3 mb-0">{punk.name}</p>
      </div>
      <div className="d-flex justify-content-center">
        <div
          className={`mainnav me-2 ${currentNav === "addr" ? "active" : ""}`}
          onClick={() => setCurrentNav("addr")}
        >
          Addresses
        </div>
        <div
          className={`mainnav ${currentNav === "text" ? "active" : ""}`}
          onClick={() => setCurrentNav("text")}
        >
          Texts
        </div>
      </div>
      <div className="p-3">
        <PlainBtn
          disabled={!hasRecordUpdates}
          onClick={handleUpdate}
          className="w-100"
        >
          Update
        </PlainBtn>
      </div>
      {/* ADDRESSES */}
      {currentNav === "addr" && (
        <>
          <div className="record-container d-flex flex-column align-items-center">
            <div className="d-flex flex-wrap justify-content-center">
              {Object.values(KnownAddresses).map((knownAddr) => (
                <div
                  onClick={() => setSelectedCoin(knownAddr.coinType)}
                  className={`record-badge ${
                    isSelected(knownAddr.coinType) ? "selected" : ""
                  } ${isAddressSet(knownAddr.coinType) ? "" : "unset"}`}
                  key={knownAddr.coinType}
                >
                  <img className="address me-2" src={knownAddr.icon}></img>
                  <div>{knownAddr.name}</div>
                </div>
              ))}
            </div>
            <div className="w-100 mt-3">
              <div style={{ color: "white" }} className="mt-1 mb-2">
                {addressMetadata.name} address
              </div>
              <input
                placeholder={`Set ${addressMetadata.name} address...`}
                onChange={(e) =>
                  handleAddressChange(selectedCoin, e.target.value)
                }
                className="tech-input mt-1"
                value={addresseValues[selectedCoin] || ""}
              ></input>
              {!isValidAddress &&
                (addresseValues[selectedCoin] || "").length > 0 && (
                  <div className="error-msg mt-2">
                    {addressMetadata.name} address is not valid
                  </div>
                )}
            </div>
          </div>
        </>
      )}
      {/* ADDRESSES */}
      {/* TEXTS */}
      {currentNav === "text" && (
        <>
          <div className="record-container d-flex flex-column mt-3 align-items-center">
            <div className="d-flex flex-wrap justify-content-center">
              {Object.values(KnownTexts).map((txt) => (
                <div
                  className={`record-badge ${
                    isTextSet(txt.key) ? "" : "unset"
                  } ${selectedText === txt.key ? "selected" : ""}`}
                  key={txt.key}
                  onClick={() => setSelectedText(txt.key)}
                >
                  {txt.type === "profile" ? (
                    <CgProfile color="#1FE5B5" className="me-2" />
                  ) : (
                    <IoShareSocialSharp color="#1FE5B5" className="me-2" />
                  )}
                  <div>{txt.label}</div>
                </div>
              ))}
              {/* We are showing a custom/already existing records  */}
              {Object.keys(textValues)
                .filter((txt) => !KnownTexts[txt] && txt !== "avatar")
                .map((txt) => (
                  <div
                    className={`record-badge ${isTextSet(txt) ? "" : "unset"}`}
                    key={txt + "-custom"}
                    onClick={() => setSelectedText(txt)}
                  >
                    <CgProfile color="#1FE5B5" className="me-2" />
                    <div>{txt}</div>
                  </div>
                ))}
            </div>
            {selectedText && (
              <div className="w-100">
                <div className="mb-2 mb-2">
                  {textMetadata.label} record value
                </div>
                <input
                  value={textValues[selectedText] || ""}
                  onChange={(e) =>
                    handleTextChange(selectedText, e.target.value)
                  }
                  className="tech-input"
                  placeholder={textMetadata.placeholder}
                ></input>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
