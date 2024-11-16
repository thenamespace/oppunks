import axios, { all } from "axios";
import { useEffect, useMemo, useState } from "react";
import { useAccount } from "wagmi";
import { Spinner } from "./Spinner";
import { PlainBtn } from "./TechBtn";
import Link from "next/link";
import { SideModal } from "./SideModal";
import { SinglePunk } from "./SinglePunk";
import { PunkSubname } from "./Models";

const indexer = "https://indexer.namespace.tech/api/v1/nodes";

const fetchPunkNames = async (owner: string) => {
  const { data } = await axios.get<{
    items: PunkSubname[];
    totalItems: number;
  }>(`${indexer}`, {
    params: {
      owner,
      parentName: "oppunk.eth",
    },
  });
  return data;
};

export const MyPunks = () => {
  const { address } = useAccount();
  const [editModalOpen, setEditModal] = useState(false);
  const [selectedPunk, setSelectedPunks] = useState<PunkSubname>()
  const [punks, setPunks] = useState<{
    fetching: boolean;
    items: PunkSubname[];
    totalItems: number;
  }>({
    fetching: true,
    items: [],
    totalItems: 0,
  });

  useEffect(() => {
    if (!address) {
    }

    fetchPunkNames(address!!).then((res) => {
      setTimeout(() => {
        setPunks({
          fetching: false,
          items: res.items,
          totalItems: res.totalItems,
        });
      }, 2000);
    });
  }, [address]);

  return (
    <div className="my-punks-container d-flex justify-content-center align-items-start">
        {selectedPunk !== undefined && <SideModal open={true} onClose={() => setSelectedPunks(undefined)}>
            <SinglePunk punk={selectedPunk}/>
        </SideModal>}
      <div className="punks-form">
        {punks.fetching && (
          <div
            style={{ height: "100%" }}
            className="d-flex flex-column align-items-center justify-content-center"
          >
            <div style={{ width: 25 }}>
              <Spinner />
            </div>
          </div>
        )}

        {!punks.fetching && (
          <>
            {punks.items.length === 0 && (
              <div
                style={{ height: "100%" }}
                className="d-flex flex-column align-items-center justify-content-center"
              >
                <h5 style={{ color: "white" }} className="mb-4">
                  You don't own any punks
                </h5>
                <Link href="/">
                  <PlainBtn>Register_</PlainBtn>
                </Link>
              </div>
            )}
            {punks.items.length > 0 && (
              <>
                {punks.items.map((punk, index) => (
                  <div
                    onClick={() => setSelectedPunks(punk)}
                    key={punk.name + "-" + index}
                    className="punk-item d-flex align-items-center"
                  >
                    <img src={punk.texts["avatar"]} className="avatar"></img>
                    <p className="txt">{punk.name}</p>
                  </div>
                ))}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};
