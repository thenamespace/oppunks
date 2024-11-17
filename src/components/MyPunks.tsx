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
  const [selectedPunk, setSelectedPunks] = useState<PunkSubname>();
  const [searchFilter, setSearchFilter] = useState("");
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
      return;
    }

    fetchPunkNames(address).then((res) => {
      setTimeout(() => {
        setPunks({
          fetching: false,
          items: res.items,
          totalItems: res.totalItems,
        });
      }, 1000);
    });
  }, [address]);

  const refreshPunks = async () => {
    fetchPunkNames(address!!).then((res) => {
      setPunks({
        fetching: false,
        items: res.items,
        totalItems: res.totalItems,
      });
    });
  };

  let pnks: PunkSubname[] = [];
  for (let i = 0; i < 10; i++) {
    pnks = [...pnks, ...punks.items];
  }
  const filterApplied = searchFilter.length > 0;

  const allPunks = useMemo(() => {
    return punks.items.filter(i => {
      if (searchFilter.length === 0) {
        return true;
      }
      return i.name.includes(searchFilter.toLocaleLowerCase());;
    })    
  },[punks, searchFilter])


  return (
    <div className="my-punks-container d-flex flex-column justify-content-center align-items-center">
      {selectedPunk !== undefined && (
        <SideModal open={true} onClose={() => setSelectedPunks(undefined)}>
          <SinglePunk onUpdate={() => refreshPunks()} punk={selectedPunk} />
        </SideModal>
      )}

      <div className="punk-nav row w-100">
        <div
          className="col-lg-12 title text-center mb-3"
          style={{ color: "white" }}
        >
          punks_
        </div>
        <div className="col-lg-6 p-0">
          <p>Total: {punks.totalItems}</p>
        </div>
        <div className="col-lg-6 p-0 justify-content-end d-flex">
          <input
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Find your punks"
            className="tech-input"
          ></input>
        </div>
      </div>
      <div className="punks-form">
        {punks.fetching && (
          <div
            style={{ height: "100%" }}
            className="d-flex flex-column align-items-center justify-content-center"
          >
            <div style={{ width: 25 }}>
              <Spinner size="big" />
            </div>
          </div>
        )}

        {!punks.fetching && (
          <>
            {allPunks.length === 0 && (
              <>
                {!filterApplied && <div
                  style={{ height: "100%" }}
                  className="d-flex flex-column align-items-center justify-content-center"
                >
                  <h5 style={{ color: "white" }} className="mb-4">
                    You don't own any punks
                  </h5>
                  <Link href="/">
                    <PlainBtn>Register_</PlainBtn>
                  </Link>
                </div>}
                {filterApplied && <div
                  style={{ height: "100%" }}
                  className="d-flex flex-column align-items-center justify-content-center"
                >
                  <h5 style={{ color: "white" }} className="mb-4">
                    No punks with search criteria
                  </h5>
                  <PlainBtn onClick={() => setSearchFilter("")}>Clear_</PlainBtn>
                </div>}
              </>
            )}
            {allPunks.length > 0 && (
              <>
                {allPunks
                  .filter((i) => {
                    if (searchFilter.length === 0) {
                      return true;
                    }

                    return i.name.includes(searchFilter.toLocaleLowerCase());
                  })
                  .map((punk, index) => (
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
