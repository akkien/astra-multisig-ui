import type { NextApiRequest, NextApiResponse } from "next";

import { Transaction } from "../../../../models/models";

export default async function (req: NextApiRequest, res: NextApiResponse) {
  switch (req.method) {
    case "POST":
      try {
        const transactionID = (req as any).query.transactionID.toString();
        const { txHash } = req.body;
        console.log("Function `updateTransaction` invoked", txHash);
        const saveRes = await Transaction.updateOne(
          { _id: transactionID },
          { txHash: txHash },
          { new: true },
        );

        res.status(200).send(saveRes);
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
