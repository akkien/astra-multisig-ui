import type { NextApiRequest, NextApiResponse } from "next";
import { Multisig } from "../../../../../../models/models";

export default async function (req: NextApiRequest, res: NextApiResponse) {
  switch (req.method) {
    case "GET":
      try {
        const multisigAddress = (req as any).query.multisigAddress.toString();
        const chainId = (req as any).query.chainId.toString();
        console.log("Function `getMultisig` invoked", multisigAddress, chainId);
        const getRes = await Multisig.findOne({ chainId, address: multisigAddress });
        if (!getRes) {
          res.status(404).send("Multisig not found");
          return;
        }
        console.log("success", getRes);
        res.status(200).send(getRes);
        return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        console.log(err);
        res.status(400).send(err.message);
        return;
      }
  }
  // no route matched
  res.status(405).end();
  return;
}
