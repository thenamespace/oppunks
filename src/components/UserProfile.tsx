'use client'

import { useEffect, useState } from "react";
import { useAccount, useDisconnect, usePublicClient } from "wagmi";

const cacheExpiration = 60 * 1000;

export const UserProfile = () => {
  const publicClient = usePublicClient({ chainId: 1 });
  const { disconnectAsync } = useDisconnect()
  const { address } = useAccount();
  const [profile, setProfile] = useState<{
    fetching: boolean;
    name?: string;
    avatar?: string;
  }>({
    fetching: true,
  });

  useEffect(() => {
    if (address && publicClient) {
      const init = async () => {
        let ensName: string;
        let ensAvatar: string;
        const name = await publicClient.getEnsName({ address });
        if (name && name.length > 0) {
          ensName = name;
          const avatar = await publicClient.getEnsAvatar({ name });
          if (avatar) {
            ensAvatar = avatar;
          }
        }
        //@ts-ignore
        setProfile({ fetching: false, name: ensName, avatar: ensAvatar });
      };
      init();
    }
  }, [address, publicClient]);

  if (!address || profile.fetching) {
    return null;
  }

  return (
    <div className="d-flex align-items-center">
         <div className="user-profile">
      <div>
        <div className="row">
        <div className="col col-lg-3">
          {profile.avatar && (
            <img className="avatar" width={30} src={profile.avatar}></img>
          )}
        </div>
        <div className="col col-lg-9 d-flex flex-column justify-content-center">
            <p className="m-0 mb-1" style={{color:"white", lineHeight: "15px"}}>{profile.name || "Anonymous"}</p>
            <p className="m-0" style={{fontSize: 12, lineHeight: "12px"}}>{shortedAddr(address)}</p>
        </div>
      </div>
      <p onClick={() => disconnectAsync()} className="dc">Disconnect</p>
      </div>
    </div>
    </div>
  );
};

const shortedAddr = (addr: string) => {
    
    if (!addr) {
        return;
    }

    return addr.substring(0, 5) + "..." + addr.substring(addr.length - 5)
}
