import type { NextApiRequest, NextApiResponse } from "next";
import { Transaction } from "../../../../models/models";

export default async function (req: NextApiRequest, res: NextApiResponse) {
  switch (req.method) {
    case "POST":
      try {
        const transactionID = (req as any).query.transactionID.toString();
        const data = req.body;
        console.log("Function `createSignature` invoked", data);
        const saveRes = await Transaction.updateOne(
          { _id: transactionID },
          { $push: { signatures: data } },
          { new: true },
        );

        console.log("success", saveRes);
        res.status(200).send(data);
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
