import { useEffect, useMemo, useState } from "react";
import { PunkSubname } from "./Models";
import { KnownAddresses, WalletAddress } from "./records/Addresses";
import { getCoderByCoinType } from "@ensdomains/address-encoder";
import { isAddress, toHex } from "viem";
import { PlainBtn } from "./TechBtn";
import chainIcon from "../assets/chains/circle.svg";
import { KnownText, KnownTexts } from "./records/TextRecords";
import { CgProfile } from "react-icons/cg";
import { IoShareSocialSharp } from "react-icons/io5";

export const SinglePunk = ({ punk }: { punk: PunkSubname }) => {
  const [selectedCoin, setSelectedCoin] = useState(60);
  const [selectedText, setSelectedText] = useState("");
  const { addresses, texts } = punk;
  const [addresseValues, setAddressValues] = useState<Record<number, string>>(
    {}
  );
  const [textValues, setTextValues] = useState<Record<string, string>>({});
  const [currentNav, setCurrentNav] = useState<"text" | "addr">("text");

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
        _addresses[parseInt(coinType)] = toHex(
          coder.decode(punk.addresses[coinType])
        );
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
    return addresseValues[coin] && isAddress(addresseValues[coin]);
  };

  const isTextSet = (key: string) => {
    return textValues[key] && textValues[key].length > 0;
  };

  const isValidAddress = useMemo(() => {
    const currentValue = addresseValues[selectedCoin];
    if (!currentValue || currentValue.length === 0) {
      return false;
    }

    return isAddress(currentValue);
  }, [selectedCoin, addresseValues]);

  const handleAddressChange = (selectedCoin: number, value: string) => {
    const _addrs = { ...addresseValues };
    _addrs[selectedCoin] = value;
    setAddressValues(_addrs);
  };

  const handleTextChange = (selectedText: string, value: string) => {
    const _txts = { ...textValues };
    _txts[selectedText] = value;
    setTextValues(_txts);
  };

  const AddressesForm = () => {
    return (
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
          <div style={{ color: "white" }}>{addressMetadata.name} address</div>
          <input
            placeholder={`Set ${addressMetadata.name} address...`}
            onChange={(e) => handleAddressChange(selectedCoin, e.target.value)}
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
    );
  };

  const TextsForm = () => {
    return (
      <div className="record-container d-flex flex-column mt-3 align-items-center">
        <div className="d-flex flex-wrap justify-content-center">
          {Object.values(KnownTexts).map((txt) => (
            <div
              className={`record-badge ${isTextSet(txt.key) ? "" : "unset"}`}
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
            .filter((txt) => !KnownTexts[txt])
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
            <div>{textMetadata.label} record value</div>
            <input
              value={textValues[selectedText] || ""}
              onChange={(e) => handleTextChange(selectedText, e.target.value)}
              className="tech-input"
              placeholder={textMetadata.placeholder}
            ></input>
          </div>
        )}
        <div className="row w-100 mt-3">
          <PlainBtn>Add custom record</PlainBtn>
          <div className="col col-lg-6">
            <div>Text key</div>
            <input className="tech-input"></input>
          </div>
          <div className="col col-lg-6">
            <div>Text value</div>
            <input className="tech-input"></input>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="single-punk">
      <div className="d-flex align-items-center flex-column">
        <img className="avatar" src={punk.texts["avatar"]}></img>
        <p className="subtext mt-3 mb-0">{punk.name}</p>
      </div>
      <div className="d-flex justify-content-center">
        <div onClick={() => setCurrentNav("text")}>Texts</div>
        <div onClick={() => setCurrentNav("addr")}>Addresses</div>
      </div>
      {currentNav === "addr" && <AddressesForm />}
      {currentNav === "text" && <TextsForm />}
      <PlainBtn>Update</PlainBtn>
    </div>
  );
};
